const { test, expect } = require('@jest/globals')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { spawnSync } = require('child_process')

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'unimatrix-cleanup-'))
  fs.mkdirSync(path.join(root, 'tools'))
  fs.mkdirSync(path.join(root, 'dist', 'cjs'), { recursive: true })
  fs.writeFileSync(path.join(root, 'dist', 'cjs', 'sentinel'), 'keep')
  fs.copyFileSync(path.join(__dirname, '../tools/cleanup.js'), path.join(root, 'tools', 'cleanup.js'))
  return { root, run: (...args) => spawnSync(process.execPath, [path.join(root, 'tools', 'cleanup.js'), ...args], { encoding: 'utf8' }) }
}

test('rejects invalid targets in disposable fixtures', () => {
  const { root, run } = fixture()
  for (const args of [[''], ['..'], ['../..'], ['/'], ['types', 'cjs']]) {
    expect(run(...args).status).toBe(1)
    expect(fs.existsSync(path.join(root, 'dist/cjs/sentinel'))).toBeTruthy()
  }
})

test('rejects linked output, descendants and dangling links before deleting', () => {
  for (const kind of ['dist', 'types', 'child', 'dangling']) {
    const { root, run } = fixture()
    const external = fs.mkdtempSync(path.join(os.tmpdir(), 'unimatrix-external-'))
    fs.writeFileSync(path.join(external, 'sentinel'), 'keep')
    if (kind === 'dist') {
      fs.renameSync(path.join(root, 'dist'), path.join(root, 'saved-dist'))
      fs.symlinkSync(external, path.join(root, 'dist'))
    } else {
      const link = kind === 'child' ? 'cjs/link' : 'types'
      fs.symlinkSync(kind === 'dangling' ? path.join(external, 'missing') : external, path.join(root, 'dist', link))
    }
    expect(run().status).toBe(1)
    expect(fs.existsSync(path.join(external, 'sentinel'))).toBeTruthy()
    if (kind !== 'dist') expect(fs.existsSync(path.join(root, 'dist/cjs/sentinel'))).toBeTruthy()
  }
})

test('deletes only allowlisted output and can run again', () => {
  const { root, run } = fixture()
  fs.writeFileSync(path.join(root, 'dist', 'keep'), 'keep')
  expect(run('cjs').status).toBe(0)
  expect(!fs.existsSync(path.join(root, 'dist/cjs'))).toBeTruthy()
  expect(run().status).toBe(0)
  expect(fs.existsSync(path.join(root, 'dist/keep'))).toBeTruthy()
})
