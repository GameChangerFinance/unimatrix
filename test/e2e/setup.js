const fs = require('fs')
const path = require('path')
const http = require('http')
const { fork, spawn } = require('child_process')
const { randomUUID } = require('crypto')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const CLOCK_LEAD_MS = { relay: 1000, participant: 100 }

async function main(consumer, timeoutMs = 90000) {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 90000) throw Error('Invalid E2E timeout')
  const temporaryRoot = fs.realpathSync(require('os').tmpdir())
  if (!consumer || path.dirname(consumer) !== temporaryRoot || !path.basename(consumer).startsWith('unimatrix-consumer-') || fs.realpathSync(consumer) !== consumer) throw Error('E2E requires an isolated consumer directory')
  const children = []
  const sockets = new Set()
  let timer
  let finish, fail
  const completion = new Promise((resolve, reject) => { finish = resolve; fail = reject })
  // Attach immediately so failures during browser startup cannot become unhandled.
  completion.catch(() => {})
  const ready = new Map()
  const signed = new Set()
  const progress = new Map()
  let coordinatorStarted = false
  const config = { id: randomUUID(), role: 'signer', transactionCounts: [1, 3], signaturesPerNode: [1, 5], timeoutMs, clockLeadMs: CLOCK_LEAD_MS.participant }
  const batches = new Map([['esm-signer', new Set()], ['browser', new Set()]])
  let completedResults
  const finishWhenObserved = () => {
    if (completedResults && completedResults.every((result, index) =>
      [...batches.entries()].every(([node, observed]) =>
        observed.has(JSON.stringify(result.txHashes)) && result.txHashes.every(txHash =>
          ready.get(node).slice(0, config.signaturesPerNode[index]).every(vkHash => signed.has(`${node}:${txHash}:${vkHash}`)))))) finish()
  }
  const participant = fs.readFileSync(path.join(__dirname, 'participant.js'), 'utf8')
  // Gun can persist future-dated fields without completing their aggregate ACK.
  // Keep this relay's logical clock ahead of the deliberately skewed participants.
  fs.writeFileSync(path.join(consumer, 'relay.cjs'), `const http=require('http');const Gun=require('gun');Gun.state.drift=${CLOCK_LEAD_MS.relay};const server=http.createServer((req,res)=>res.end());Gun({web:server,peers:[],file:'relay-data',localStorage:false,multicast:false,axe:false});server.listen(0,'127.0.0.1',()=>process.send({port:server.address().port}));`)
  fs.writeFileSync(path.join(consumer, 'participant.cjs'), participant)
  fs.writeFileSync(path.join(consumer, 'signer.mjs'), `import * as api from '@gamechanger-finance/unimatrix';\nimport CSL from '@emurgo/cardano-serialization-lib-nodejs';\nimport Gun from 'gun';\nimport participant from './participant.cjs';\nprocess.on('message', config => participant.participate(api, CSL, Gun, config, value => process.send(value)).catch(error => process.send({type:'error',message:String(error?.message || error)})));`)
  fs.writeFileSync(path.join(consumer, 'coordinator.cjs'), `const api=require('@gamechanger-finance/unimatrix');const CSL=require('@emurgo/cardano-serialization-lib-nodejs');const Gun=require('gun');const {participate}=require('./participant.cjs');process.on('message', config => participate(api,CSL,Gun,config,value=>process.send(value)).catch(error=>process.send({type:'error',message:String(error?.message || error)})));`)
  fs.writeFileSync(path.join(consumer, 'signer-browser.mjs'), `import * as api from '@gamechanger-finance/unimatrix';import * as CSL from '@emurgo/cardano-serialization-lib-browser';import Gun from 'gun/gun.js';import participant from './participant.cjs';fetch('/config').then(r=>r.json()).then(config=>participant.participate(api,CSL,Gun,config,value=>fetch('/events',{method:'POST',body:JSON.stringify(value)}))).catch(error=>fetch('/events',{method:'POST',body:JSON.stringify({type:'error',message:String(error?.message || error)})}));`)
  await new Promise((resolve, reject) => webpack({ mode: 'development', devtool: false, target: 'web', entry: path.join(consumer, 'signer-browser.mjs'), output: { path: consumer, filename: 'signer-browser.js' }, experiments: { asyncWebAssembly: true }, resolve: { mainFields: ['module', 'main'] }, plugins: [new NodePolyfillPlugin()] }, (error, stats) => error || stats.hasErrors() ? reject(Error('E2E browser compilation failed: ' + String(error || stats.toString({all:false,errors:true})).replaceAll(consumer, '<consumer>').replaceAll(process.env.HOME, '<home>'))) : resolve()))
  const onEvent = (node, value) => {
    if (value.type === 'progress') progress.set(node, value.stage)
    if (value.type === 'error') return fail(Error(`${node}: ${value.message} (published witnesses=${signed.size})`))
    if (value.type === 'signed') {
      signed.add(`${node}:${value.txHash}:${value.vkHash}`)
      finishWhenObserved()
    }
    if (value.type === 'batch') {
      if (!batches.has(node) || !Array.isArray(value.txHashes)) return fail(Error('Invalid batch observation'))
      batches.get(node).add(JSON.stringify(value.txHashes))
      finishWhenObserved()
    }
    if (value.type === 'ready') {
      if (!Array.isArray(value.vkHashes) || value.vkHashes.length !== Math.max(...config.signaturesPerNode) || new Set(value.vkHashes).size !== value.vkHashes.length || !value.vkHashes.every(hash => /^[a-f0-9]{56}$/.test(hash))) return fail(Error('Invalid signer registration'))
      if (!['esm-signer', 'browser'].includes(node)) return fail(Error('Unexpected signer node'))
      ready.set(node, value.vkHashes)
      console.log(`Packed E2E: ${node} is listening`)
      if (ready.size === 2 && !coordinatorStarted) {
        coordinatorStarted = true
        launch('coordinator.cjs', 'coordinator', { ...config, role: 'coordinator', signers: [...ready.values()] })
      }
    }
    if (value.type === 'complete') {
      if (node !== 'coordinator' || !Array.isArray(value.results) || value.results.length !== config.transactionCounts.length || value.results.some((result, index) => result.txHashes.length !== config.transactionCounts[index] || result.witnessesPerTransaction !== config.signaturesPerNode[index] * 2)) return fail(Error('Missing transactions or witnesses'))
      const allHashes = value.results.flatMap(result => result.txHashes)
      if (new Set(allHashes).size !== allHashes.length) return fail(Error('Transactions reused between cases'))
      completedResults = value.results
      finishWhenObserved()
    }
  }
  const launch = (file, node, args) => {
    const child = fork(path.join(consumer, file), [], { cwd: consumer, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] })
    children.push(child)
    child.on('message', value => onEvent(node, value))
    child.on('error', fail)
    child.on('exit', (code, signal) => { if (!signal) fail(Error(`${node} exited unexpectedly (${code})`)) })
    child.send(args)
  }
  const server = http.createServer((request, response) => {
    if (request.url === '/config') return response.end(JSON.stringify(config))
    if (request.url === '/events' && request.method === 'POST') {
      let data = ''
      request.on('data', chunk => { data += chunk; if (data.length > 4096) request.destroy() })
      request.on('end', () => { try { onEvent('browser', JSON.parse(data)); response.end('ok') } catch { fail(Error('Invalid browser event')); response.end() } })
      return
    }
    if (request.url === '/') return response.end('<!doctype html><script>addEventListener("error",e=>fetch("/events",{method:"POST",body:JSON.stringify({type:"error",message:e.message||"Browser resource failed"})}));addEventListener("unhandledrejection",e=>fetch("/events",{method:"POST",body:JSON.stringify({type:"error",message:String(e.reason)})}));</script><script src="/signer-browser.js"></script>')
    const name = request.url.slice(1)
    if (!/^[a-zA-Z0-9_.-]+\.(js|wasm)$/.test(name)) { response.statusCode = 404; return response.end() }
    const file = path.join(consumer, name)
    if (!fs.existsSync(file)) { response.statusCode = 404; return response.end() }
    response.setHeader('Content-Type', name.endsWith('.wasm') ? 'application/wasm' : 'application/javascript')
    fs.createReadStream(file).pipe(response)
  })
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)) })
  const abort = () => fail(Error('Packed E2E interrupted'))
  process.once('SIGINT', abort)
  process.once('SIGTERM', abort)
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${server.address().port}`
    // The relay is isolated too, so Gun timers cannot outlive test teardown.
    const relay = fork(path.join(consumer, 'relay.cjs'), [], { cwd: consumer, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] })
    children.push(relay)
    const port = await new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(Error('Relay startup timed out')), 10000)
      relay.once('message', value => { clearTimeout(deadline); resolve(value.port) })
      relay.once('error', error => { clearTimeout(deadline); reject(error) })
      relay.once('exit', () => { clearTimeout(deadline); reject(Error('Relay exited')) })
    })
    config.relay = `http://127.0.0.1:${port}/gun`
    // The unauthenticated loopback relay carries disposable test transactions only.
    timer = setTimeout(() => fail(Error(`Three-node exchange timed out (ready=${ready.size}, signed=${signed.size}; ${[...batches.keys()].map(node => `${node}=${[...signed].filter(key => key.startsWith(node + ':')).length}, stage=${progress.get(node) || 'waiting'}`).join('; ')})`)), timeoutMs)
    launch('signer.mjs', 'esm-signer', config)
    // Headless signers must keep processing Gun timers when Chrome is backgrounded.
    const chrome = spawn(process.env.CHROME_BIN || 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', `--user-data-dir=${fs.mkdtempSync(path.join(consumer, 'e2e-chrome-'))}`, origin], { stdio: 'ignore' })
    children.push(chrome)
    chrome.on('error', fail)
    await completion
    console.log('Three-node packed E2E passed: single transaction and three transactions in one broadcast; 2 witnesses for the first case and 10 per transaction for the three-transaction broadcast (5 per signer node)')
  } finally {
    process.off('SIGINT', abort)
    process.off('SIGTERM', abort)
    clearTimeout(timer)
    await Promise.all(children.map(child => new Promise(resolve => { if (child.exitCode !== null || child.signalCode) return resolve(); child.once('exit', resolve); child.kill('SIGKILL') })))
    sockets.forEach(socket => socket.destroy())
    await new Promise(resolve => server.close(resolve))
  }
}
module.exports = { main }
