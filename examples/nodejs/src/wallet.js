const {
    mnemonicToEntropy,
    generateMnemonic: _generateMnemonic,
} = require('bip39');
const CSL = require('@emurgo/cardano-serialization-lib-nodejs');
const { useLogger } = require('./logger');

useLogger();

const HARDENED_THRESHOLD = 0x80000000
const SHELLEY_COIN_TYPE = 1815; //year of birth of Ada Lovelace 
const SHELLEY_COIN_TYPE_HARDENED = SHELLEY_COIN_TYPE + HARDENED_THRESHOLD;
const SHELLEY_COIN_PURPOSE = 1852; //year of death of Ada Lovelace 
const SHELLEY_COIN_PURPOSE_HARDENED = SHELLEY_COIN_PURPOSE + HARDENED_THRESHOLD;
const EXTERNAL_ROLE = 0 //Same as defined in BIP44
const INTERNAL_ROLE = 1 //Same as defined in BIP44
const STAKING_ROLE = 2 //See CIP11


const generateMnemonic = (wordCount = 15) => {
    if (wordCount % 3 !== 0) {
        throw new Error(`Invalid mnemonic word count supplied: ${wordCount}`)
    }
    return _generateMnemonic((32 * wordCount) / 3);
}
const networkIdByTag = (networkTag) => {
    const networkTags = {
        'mainnet': [CSL.NetworkInfo.mainnet().network_id()],
        'preprod': [CSL.NetworkInfo.testnet_preprod().network_id()],
        'preview': [CSL.NetworkInfo.testnet_preview().network_id()],
    };
    return networkTags[networkTag]
}
const harden = (value) => value + HARDENED_THRESHOLD;
const unharden = (value) => value - HARDENED_THRESHOLD;

const getWalletData = ({ mnemonic, networkTag, dltTag }) => {
    if (!mnemonic)
        return undefined;

    const accountIndex = 0,
        addressIndex = 0;
    const entropy = mnemonicToEntropy(mnemonic);
    const rootPrivKey = CSL.Bip32PrivateKey.from_bip39_entropy(Buffer.from(entropy, "hex"), Buffer.from(""));
    const accountKey = rootPrivKey
        .derive(SHELLEY_COIN_PURPOSE_HARDENED) // CIP1852
        .derive(SHELLEY_COIN_TYPE_HARDENED)
        .derive(harden(accountIndex));
    const privSpendKey = accountKey
        .derive(EXTERNAL_ROLE) // External
        .derive(addressIndex)
        .to_raw_key()
    const privStakeKey = accountKey
        .derive(STAKING_ROLE) // Chimeric (Staking)
        .derive(addressIndex)
        .to_raw_key()
    const pubSpendKey = accountKey
        .derive(EXTERNAL_ROLE) // External
        .derive(addressIndex)
        .to_public()
        .to_raw_key()
    const pubStakeKey = accountKey
        .derive(STAKING_ROLE) // Chimeric
        .derive(addressIndex)
        .to_public()
        .to_raw_key()
    const baseAddressObj = CSL.BaseAddress.new(
        networkIdByTag(networkTag),//parseInt(networkId),
        CSL.Credential.from_keyhash(pubSpendKey.hash()),
        CSL.Credential.from_keyhash(pubStakeKey.hash())
    );
    return {
        address: baseAddressObj.to_address().to_bech32(),
        privSpendKey: privSpendKey.to_hex(),
        privStakeKey: privStakeKey.to_hex(),
        pubSpendKey: pubSpendKey.to_hex(),
        pubStakeKey: pubStakeKey.to_hex(),
        pubSpendKeyHash: pubSpendKey.hash().to_hex(),
        pubStakeKeyHash: pubStakeKey.hash().to_hex(),
        networkTag,
        dltTag,
    };

    return undefined;
}





const signTxIfValid = async ({
    txHash,
    txHex,
    prvKeyHex,
    pubKeyHex,
    vkHash,
    signerId,
    dltTag,
    networkTag,
    validator,
}) => {
    const txObj = CSL.FixedTransaction.from_hex(txHex);
    const txHashObj = txObj.transaction_hash();
    const _txHash = txHashObj.to_hex();
    if (txHash !== _txHash)
        throw new Error(`Transaction hash mismatch`);
    const pubKeyObj = CSL.PublicKey.from_hex(pubKeyHex)
    const _vkHash = pubKeyObj.hash().to_hex();
    if (vkHash !== _vkHash) {
        throw new Error(`Key hash mismatch`);
    }
    const txJson=JSON.parse(CSL.Transaction.from_hex(txHex).to_json());    
    const validation = await validator({
        txJson,
        txHex,
        txHash,
        vkHash,
        pubKeyHex,
        signerId,
        dltTag,
        networkTag,
        CSL,
    })
    .catch(err=>{
        console.warn(`Warning: '${signerId}' ('${vkHash}')  failed to validate the transaction '${txHash}'.${err?.message||"Unknown error"}`);
    });
    let vkWitnessHex;
    if (validation?.doSign) {
        const prvKeyObj = CSL.PrivateKey.from_hex(prvKeyHex)
        const signatureObj = prvKeyObj.sign(Buffer.from(txHashObj.to_bytes()));
        const witnessObj = CSL.Vkeywitness.new(CSL.Vkey.new(prvKeyObj.to_public()), signatureObj);
        prvKeyObj.free();
        vkWitnessHex = witnessObj.to_hex();
    }
    return {
        vkWitnessHex,
        isValid: validation?.doSign,
        error: validation?.error,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        signerId,
    };
}



const getSigners=({config,validator})=>{
    const {
        mnemonic,
        networkTag,
        dltTag,
        useSpend,
        useStake,
    }=config;
    const wallet=getWalletData({mnemonic,networkTag,dltTag});
    const signers=[];
    if(useSpend)
        signers.push({
            signerId:'spend-signer',
            dltTag:wallet.dltTag,
            networkTag:wallet.networkTag,
            prvKeyHex: wallet.privSpendKey,
            pubKeyHex: wallet.pubSpendKey,
            vkHash: wallet.pubSpendKeyHash,
            validator,
        });
    if(useStake)
        signers.push({
            signerId:'stake-signer',
            dltTag:wallet.dltTag,
            networkTag:wallet.networkTag,
            prvKeyHex: wallet.privStakeKey,
            pubKeyHex: wallet.pubStakeKey,
            vkHash: wallet.pubStakeKeyHash,
            validator,
        });
    return signers;
}

module.exports = {
    getWalletData,
    getSigners,
    networkIdByTag,
    generateMnemonic,
    signTxIfValid,
}