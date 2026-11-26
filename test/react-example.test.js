const { test, expect } = require('@jest/globals')
const { execFile } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

test('React dev server optimizes browser dependencies and encodes wallet URLs in Chrome', async () => {
  const root = path.resolve(__dirname, '..')
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'unimatrix-vite-'))
  // Native Node loads Vite's ESM API; Jest owns this integration test and timeout.
  const script = `
    const { createRequire } = await import('node:module');
    const { pathToFileURL } = await import('node:url');
    const path = await import('node:path');
    const fs = await import('node:fs');
    const { execFile } = await import('node:child_process');
    const example = process.argv[1], temporary = process.argv[2];
    const require = createRequire(path.join(example, 'package.json'));
    fs.symlinkSync(path.join(example,'node_modules'),path.join(temporary,'node_modules'),'dir');
    const vite = await import(pathToFileURL(path.join(path.dirname(require.resolve('vite/package.json')), 'dist/node/index.js')));
    let gc;
    const fixture = server => { server.middlewares.use('/__browser-check', (_req,res) => {
      res.setHeader('Content-Type','text/html');
      res.end('<!doctype html><pre id="result">pending</pre><script type="module">try{const {default:gc}=await import('+JSON.stringify('/@fs/'+gc.file)+');const url=await gc.encode.url({input:JSON.stringify({type:"script",run:{}}),network:"preprod"});if(typeof url!=="string"||!url.startsWith("https://"))throw Error("Invalid wallet URL");document.getElementById("result").textContent="browser-passed";}catch(error){document.getElementById("result").textContent="browser-failed: "+error.message;}</script>');
    });
    };
    const options = {root:example, cacheDir:path.join(temporary,'cache'), logLevel:'silent', plugins:[{name:'browser-regression-fixture',configureServer:fixture}], server:{host:'127.0.0.1',port:0,fs:{allow:[path.resolve(example,'../..'),temporary]}}};
    const config = await vite.resolveConfig(options, 'serve');
    const metadata = await vite.optimizeDeps(config, true, true);
    gc = metadata.optimized['@gamechanger-finance/gc/dist/browser.js'];
    if (!gc || !gc.src.endsWith('/dist/browser.js')) throw Error('GC browser entry was not optimized');
    for (const item of Object.values(metadata.optimized)) {
      const code = fs.readFileSync(item.file, 'utf8');
      if (code.includes('@napi-rs/canvas') || code.includes('easyqrcodejs-node.cjs')) throw Error('Node QR backend leaked into browser optimization');
    }
    const server = await vite.createServer(options);
    try {
      await server.listen();
      const origin = 'http://127.0.0.1:'+server.httpServer.address().port;
      const dependencyResponse = await fetch(origin+'/@fs/'+gc.file);
      if (!dependencyResponse.ok) throw Error('Optimized GC request failed: '+dependencyResponse.status);
      const dom = await new Promise((resolve,reject)=>execFile(process.env.CHROME_BIN||'google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--virtual-time-budget=5000','--user-data-dir='+path.join(temporary,'chrome'), '--dump-dom',origin+'/__browser-check'],{timeout:30000,maxBuffer:4*1024*1024},(error,stdout)=>error?reject(error):resolve(stdout)));
      if(!dom.includes('id="result">browser-passed</pre>')) throw Error('Browser wallet URL encoding failed: '+(dom.split('<pre id="result">')[1]?.split('</pre>')[0]||'missing result'));
      console.log('REACT_BROWSER_PASSED');
    } finally {await server.close();}
  `
  await new Promise((resolve, reject) => {
    execFile('pnpm', ['run', 'build'], { cwd: root, timeout: 90000 }, error => {
      if (error) reject(new Error('Library build required by React example failed'))
      else resolve()
    })
  })
  const output = await new Promise((resolve, reject) => {
    execFile(process.execPath, ['--input-type=module', '-e', script, path.join(root, 'examples/react'), temporary],
      { cwd: root, timeout: 90000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          const detail = stderr.split('\n').filter(line => !/^\s*at\s/.test(line)).join(' | ').replaceAll(root, '<project>').replaceAll(os.homedir(), '<home>')
          reject(new Error(detail))
        } else resolve(stdout)
      })
  })
  expect(output).toContain('REACT_BROWSER_PASSED')
}, 200000)
