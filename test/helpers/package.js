const { expect } = require('@jest/globals')
const fs = require('fs')
const os = require('os')
const path = require('path')
const vm = require('vm')
const crypto = require('crypto')
const ts = require('typescript')
const { spawnSync } = require('child_process')
const redact = text => text.replaceAll(root, '<project>').replaceAll(process.env.HOME || '/nonexistent-home', '<home>')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const root = path.resolve(__dirname, '../..')
const baseline = require('../fixtures/package-api.json')
const shape = value => Object.fromEntries(Object.keys(value).sort().map(key => [key,
  typeof value[key] === 'function' ? { type: 'function', arity: value[key].length } : { type: typeof value[key] }]))

function declarationExports(file) {
  const parsed = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest)
  const names = []
  for (const statement of parsed.statements) {
    if (ts.isExportDeclaration(statement)) {
      expect(statement.exportClause && ts.isNamedExports(statement.exportClause)).toBeTruthy()
      names.push(...statement.exportClause.elements.map(element => element.name.text))
    } else if (statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isVariableStatement(statement)) names.push(...statement.declarationList.declarations.map(declaration => declaration.name.getText(parsed)))
      else if (statement.name) names.push(statement.name.text)
    }
  }
  return names.sort()
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 180000 })
  if (result.error || result.status !== 0) {
    // Preserve evidence in the disposable consumer without printing private paths.
    fs.writeFileSync(path.join(cwd, 'failure.log'), redact((result.stdout || '') + (result.stderr || '')))
    throw new Error(`${path.basename(command)} failed (${result.status}); inspect the disposable consumer failure.log`)
  }
  return result.stdout
}

function check(api) {
  expect(shape(api)).toStrictEqual(baseline.exports)
  expect(shape(api.cardano)).toStrictEqual(baseline.cardano)
  const args = { id: 'consumer-fixture', validator: 'test', path: ['a', 'b'] }
  const expected = require('../../dist/cjs').genDataKey(args)
  expect(JSON.stringify(api.genDataKey(args))).toBe(JSON.stringify(expected))
}

async function prepare() {
  run('pnpm', ['run', 'build'], root)
  const consumer = fs.mkdtempSync(path.join(os.tmpdir(), 'unimatrix-consumer-'))
  // Leave the small fixture on failure for inspection; never recursively remove host paths.
  const manifest = require('../../package.json')
  run('pnpm', ['pack', '--pack-destination', consumer], root)
  const tarball = fs.readdirSync(consumer).find(name => name.endsWith('.tgz'))
  expect(tarball).toBeTruthy()
  const contents = run('tar', ['-tzf', path.join(consumer, tarball)], consumer).trim().split('\n')
  expect(contents.every(file => /^package\/(dist\/|package.json$|README.md$|CHANGELOG.md$|LICENSE$)/.test(file))).toBeTruthy()
  fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ private: true, dependencies: { [manifest.name]: `file:./${tarball}`, gun: manifest.dependencies.gun, '@emurgo/cardano-serialization-lib-nodejs': '13.2.1', '@emurgo/cardano-serialization-lib-browser': '13.2.1' } }))
  fs.copyFileSync(path.join(root, 'pnpm-workspace.yaml'), path.join(consumer, 'pnpm-workspace.yaml'))
  run('pnpm', ['install', '--ignore-scripts'], consumer)
  const installed = path.join(consumer, 'node_modules', manifest.name)
  const packed = JSON.parse(fs.readFileSync(path.join(installed, 'package.json'), 'utf8'))
  return { consumer, manifest, installed, packed }
}

async function checkImports({ consumer, manifest, installed, packed }) {
  for (const field of ['main', 'module', 'umd:main', 'types']) expect(fs.existsSync(path.join(installed, packed[field]))).toBeTruthy()
  expect(!packed.scripts?.postinstall).toBeTruthy()
  check(require(installed))
  const gunRoot = path.dirname(require.resolve('gun/package.json', { paths: [fs.realpathSync(installed)] }))
  for (const [file, hash] of Object.entries(require('../fixtures/gun-types.json'))) {
    expect(crypto.createHash('sha256').update(fs.readFileSync(path.join(gunRoot, file))).digest('hex')).toBe(hash)
  }
  const baselineDirectory = path.join(installed, 'dist/api-baseline')
  fs.mkdirSync(baselineDirectory)
  let contract = ''
  for (const [index, [file, hash]] of Object.entries(Object.entries(baseline.declarations))) {
    const fixture = path.join(root, 'test/fixtures/types', file)
    expect(crypto.createHash('sha256').update(fs.readFileSync(fixture)).digest('hex')).toBe(hash)
    expect(declarationExports(path.join(installed, 'dist/types', file))).toStrictEqual(declarationExports(fixture))
    const destination = path.join(baselineDirectory, file)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(fixture, destination)
    const modulePath = file.replace(/\.d\.ts$/, '')
    if (!declarationExports(fixture).length) continue
    contract += `import * as before${index} from '${manifest.name}/dist/api-baseline/${modulePath}';\nimport * as after${index} from '${manifest.name}/dist/types/${modulePath}';\ndeclare let old${index}: typeof before${index};\ndeclare let next${index}: typeof after${index};\nold${index} = next${index}; next${index} = old${index};\n`
    const parsed = ts.createSourceFile(file, fs.readFileSync(fixture, 'utf8'), ts.ScriptTarget.Latest)
    for (const statement of parsed.statements) {
      if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
        const name = statement.name.text
        expect(!statement.typeParameters?.length).toBeTruthy()
        contract += `declare let old${index}_${name}: before${index}.${name};\ndeclare let next${index}_${name}: after${index}.${name};\nold${index}_${name} = next${index}_${name}; next${index}_${name} = old${index}_${name};\n`
      }
    }
  }
  fs.writeFileSync(path.join(consumer, 'contract.ts'), contract)
  fs.writeFileSync(path.join(consumer, 'esm.mjs'), `import { genDataKey, cardano } from '${manifest.name}'; if(typeof genDataKey !== 'function' || typeof cardano.getTxHex !== 'function') throw Error('ESM import failed');`)
  run(process.execPath, ['esm.mjs'], consumer)
  fs.writeFileSync(path.join(consumer, 'consumer.ts'), `import { genDataKey, getData, onData, setData, cardano } from '${manifest.name}';\nimport type { UnimatrixData } from '${manifest.name}/dist/types/unimatrix';\nconst key: { key: string; path: string } = genDataKey({id:'fixture', validator:'test', path:['a']});\nconst value: UnimatrixData = {data:'test', error:undefined};\nvoid [key, value, getData, onData, setData, cardano.genTxHexKey];\n`)
  for (const compiler of ['typescript', 'typescript-compat']) {
    const options = ['--strict', '--noEmit', '--module', 'commonjs', '--moduleResolution', 'node', '--target', 'es2015', '--esModuleInterop', '--exactOptionalPropertyTypes', 'consumer.ts', 'contract.ts']
    if (compiler === 'typescript') options.unshift('--ignoreDeprecations', '6.0')
    run(process.execPath, [require.resolve(`${compiler}/bin/tsc`), ...options], consumer)
  }
}

async function checkBrowser({ consumer, manifest, installed, packed }) {
  const umd = fs.readFileSync(path.join(installed, packed['umd:main']), 'utf8')
  const browser = { console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, TextEncoder, TextDecoder, crypto: crypto.webcrypto }
  const globalContext = vm.createContext({ ...browser })
  vm.runInContext(umd, globalContext, { timeout: 10000 })
  check(globalContext.exampleTypescriptPackage)
  let amd
  const define = (dependencies, factory) => { expect(dependencies.length).toBe(0); amd = factory() }
  define.amd = {}
  vm.runInNewContext(umd, { ...browser, define }, { timeout: 10000 })
  check(amd)
  check(require(path.join(installed, packed['umd:main'])))
  fs.writeFileSync(path.join(consumer, 'browser.mjs'), `import * as api from '${manifest.name}'; globalThis.consumerAPI = api;`)
  await new Promise((resolve, reject) => webpack({
    mode: 'production', target: 'web', entry: path.join(consumer, 'browser.mjs'),
    output: { path: consumer, filename: 'browser.js' },
    resolve: { mainFields: ['module', 'main'] },
    plugins: [new NodePolyfillPlugin()],
  }, (error, stats) => {
    if (error || stats.hasErrors()) {
      fs.writeFileSync(path.join(consumer, 'webpack-errors.log'), redact(String(error || stats.toString({ all: false, errors: true }))))
      reject(new Error('Browser ESM bundling failed; inspect disposable consumer webpack-errors.log'))
    } else resolve()
  }))
  const browserContext = vm.createContext({ ...browser })
  vm.runInContext(fs.readFileSync(path.join(consumer, 'browser.js'), 'utf8'), browserContext, { timeout: 10000 })
  check(browserContext.consumerAPI)
  fs.copyFileSync(path.join(installed, packed['umd:main']), path.join(consumer, 'umd.js'))
  const args = { id: 'consumer-fixture', validator: 'test', path: ['a', 'b'] }
  const expected = JSON.stringify(require('../../dist/cjs').genDataKey(args))
  fs.writeFileSync(path.join(consumer, 'browser.html'), `<!doctype html><pre id="result">pending</pre>
    <script src="umd.js"></script><script src="browser.js"></script><script>
    try {
      for (const api of [globalThis.exampleTypescriptPackage, globalThis.consumerAPI]) {
        if (Object.keys(api).sort().join(',') !== ${JSON.stringify(Object.keys(baseline.exports).sort().join(','))}) throw Error('exports');
        if (JSON.stringify(api.genDataKey(${JSON.stringify(args)})) !== ${JSON.stringify(expected)}) throw Error('hash');
      }
      document.getElementById('result').textContent = 'browser-passed';
    } catch (error) { document.getElementById('result').textContent = 'browser-failed: ' + error.message; }
    </script>`)
  const dom = run(process.env.CHROME_BIN || 'google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking',
    `--user-data-dir=${path.join(consumer, 'chrome-profile')}`, '--dump-dom',
    `file://${path.join(consumer, 'browser.html')}`,
  ], consumer)
  expect(dom.includes('id="result">browser-passed</pre>')).toBeTruthy()
}

module.exports = { prepare, checkImports, checkBrowser }
