const { beforeAll, describe, test } = require('@jest/globals')
const { prepare, checkImports, checkBrowser } = require('./helpers/package')
const { main: exchange } = require('./e2e/setup')

describe('installed package consumers', () => {
  let consumer
  beforeAll(async () => { consumer = await prepare() }, 240000)

  test('preserves packed contents, imports and API contracts under TypeScript 4.9 and 6', async () => {
    await checkImports(consumer)
  }, 60000)

  test('runs browser ESM and UMD global, AMD and CommonJS consumers', async () => {
    await checkBrowser(consumer)
  }, 90000)

  test('exchanges one transaction and a three-transaction batch with five signatures per signer', async () => {
    await exchange(consumer.consumer)
  }, 120000)
})
