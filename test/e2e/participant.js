// Runs unchanged in independent Node.js processes and the real browser bundle.
async function participate(api, CSL, Gun, config, report) {
  const db = Gun({ peers: [config.relay], radisk: false, localStorage: false, multicast: false, axe: false })
  const params = { CSL, db, id: config.id, dltTag: 'cardano', networkTag: 'preprod', subPath: ['packed-e2e'], timeout: 30000 }
  if (config.role === 'signer') {
    const keys = Array.from({ length: Math.max(...config.signaturesPerNode) }, () => CSL.PrivateKey.generate_ed25519())
    const vkHashes = keys.map(key => key.to_public().hash().to_hex())
    const seen = new Set()
    await api.cardano.onTxHashes({ ...params, cb: async ({ txHashes }) => {
      if (!txHashes?.length) return
      report({ type: 'batch', txHashes })
      const caseIndex = config.transactionCounts.indexOf(txHashes?.length)
      if (caseIndex < 0) return report({ type: 'error', message: 'Unexpected transaction batch' })
      const signaturesPerNode = config.signaturesPerNode[caseIndex]
      for (const txHash of txHashes || []) {
        if (seen.has(txHash)) continue
        seen.add(txHash)
        try {
          const { txHex } = await api.cardano.getTxHex({ ...params, txHash })
          if (!txHex) throw Error('Signer did not receive the transaction')
          const tx = CSL.FixedTransaction.from_hex(txHex)
          const required = tx.body().required_signers()
          const expectedKeys = vkHashes.slice(0, signaturesPerNode)
          if (!required || required.len() !== signaturesPerNode * 2 || !expectedKeys.every(hash => Array.from({ length: required.len() }, (_, i) => required.get(i).to_hex()).includes(hash))) throw Error('Unexpected required signers')
          for (const key of keys.slice(0, signaturesPerNode)) {
            const vkHash = key.to_public().hash().to_hex()
            const witness = CSL.make_vkey_witness(CSL.TransactionHash.from_hex(txHash), key)
            const result = await api.cardano.setVkWitnessHex({ ...params, txHash, vkHash, vkWitnessHex: witness.to_hex() })
            if (result.vkWitnessHex !== witness.to_hex()) throw Error('Witness write failed')
            report({ type: 'signed', vkHash, txHash })
          }
        } catch (error) { report({ type: 'error', message: String(error?.message || error) }) }
      }
    } })
    report({ type: 'ready', vkHashes })
    return
  }
  const results = []
  let inputIndex = 0
  for (const [caseIndex, transactionCount] of config.transactionCounts.entries()) {
    const signers = config.signers.flatMap(nodeKeys => nodeKeys.slice(0, config.signaturesPerNode[caseIndex]))
    if (new Set(signers).size !== signers.length) throw Error('Duplicate signer keys')
    const hashes = CSL.Ed25519KeyHashes.new()
    signers.forEach(hash => hashes.add(CSL.Ed25519KeyHash.from_hex(hash)))
    const transactions = []
    for (let index = 0; index < transactionCount; index++) {
      const inputs = CSL.TransactionInputs.new()
      inputs.add(CSL.TransactionInput.new(CSL.TransactionHash.from_hex('00'.repeat(32)), inputIndex++))
      const outputs = CSL.TransactionOutputs.new()
      const address = CSL.EnterpriseAddress.new(0, CSL.Credential.from_keyhash(hashes.get(0))).to_address()
      outputs.add(CSL.TransactionOutput.new(address, CSL.Value.new(CSL.BigNum.from_str('2000000'))))
      const body = CSL.TransactionBody.new(inputs, outputs, CSL.BigNum.from_str('170000'))
      body.set_required_signers(hashes)
      const unsigned = CSL.Transaction.new(body, CSL.TransactionWitnessSet.new())
      const txHex = unsigned.to_hex()
      const txHash = CSL.FixedTransaction.from_hex(txHex).transaction_hash().to_hex()
      const uploaded = await api.cardano.setTxHex({ ...params, txHash, txHex })
      if (uploaded.txHex !== txHex) throw Error('Transaction upload failed')
      transactions.push({ body, txHash })
    }
    const txHashes = transactions.map(tx => tx.txHash)
    if (new Set(txHashes).size !== transactionCount) throw Error('Batch contains duplicate transactions')
    // All transaction bodies must be available before one shared announcement.
    // Register witness collectors before signers can publish their responses.
    const collected = Promise.all(transactions.map(async ({ body, txHash }) => {
      const witnesses = await Promise.all(signers.map(async vkHash => {
        const { vkWitnessHex } = await api.cardano.getVkWitnessHex({ ...params, txHash, vkHash })
        if (!vkWitnessHex) throw Error('Coordinator did not receive every witness')
        const witness = CSL.Vkeywitness.from_hex(vkWitnessHex)
        if (witness.vkey().public_key().hash().to_hex() !== vkHash || !witness.vkey().public_key().verify(CSL.TransactionHash.from_hex(txHash).to_bytes(), witness.signature())) throw Error('Invalid signature or signer identity')
        return witness
      }))
        if (new Set(witnesses.map(w => w.vkey().public_key().hash().to_hex())).size !== signers.length) throw Error('Duplicate signers')
        const vkeys = CSL.Vkeywitnesses.new()
        witnesses.forEach(w => vkeys.add(w))
        const set = CSL.TransactionWitnessSet.new()
        set.set_vkeys(vkeys)
        const signed = CSL.Transaction.new(body, set)
        const decoded = CSL.FixedTransaction.from_hex(signed.to_hex())
        if (decoded.transaction_hash().to_hex() !== txHash || decoded.witness_set().vkeys().len() !== signers.length) throw Error('Aggregated transaction is invalid')
    }))
    collected.catch(() => {})
    await api.cardano.setTxHashes({ ...params, txHashes })
    await collected
    results.push({ txHashes, witnessesPerTransaction: signers.length })
  }
  report({ type: 'complete', results })
}
if (typeof module !== 'undefined') module.exports = { participate }
