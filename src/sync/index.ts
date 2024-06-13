/**
 * A set of helpers to standardize a basic data exchange protocol 
 * to share **Cardano** transactions and signatures using **Unimatrix**
 * @module unimatrix-sync-cardano
 * 
 * @remarks
 * 
 * A module for **Cardano** built on top of the **Unimatrix** library, with custom validators, encryption functions and data types fully compatible with [cardano-serialization-lib](https://github.com/Emurgo/cardano-serialization-lib).
 * 
 * Main use case are multi-signature or deferred-signature scenarios involving wallets, dapps and services on the **Cardano Blockchain**
 * 
 * **Validators and their matching data types**:
 *  - **Items**
 *      - `cardano.vkWitnessHex` : transaction key witness (signature) in hexadecimal encoding
 *      - `cardano.txHex`: transaction CBOR structure in hexadecimal encoding
 *  - **Announcements**
 *      - `cardano.TxHashHexList` : list of transaction hash strings
 */

import {
    DLTTag,
    NetworkTag,
    CardanoValidatorTag,

    encryptDataFactory,
    decryptDataFactory,    
    cardanoValidatorsFactory,

    genUnimatrixIdFromTxHashes,

    genTxHashesKey,
    genTxHexKey,
    genVkWitnessHexKey,

    getTxHashes, 
    getTxHex, 
    getVkWitnessHex,

    onTxHashes, 
    onTxHex, 
    onVkWitnessHex, 

    setTxHashes, 
    setTxHex,
    setVkWitnessHex,
} from './cardano';


export {
    DLTTag,
    NetworkTag,
    CardanoValidatorTag,
    
    encryptDataFactory,
    decryptDataFactory,    
    cardanoValidatorsFactory,

    genUnimatrixIdFromTxHashes,

    genTxHashesKey,
    genTxHexKey,
    genVkWitnessHexKey,

    getTxHashes, 
    getTxHex, 
    getVkWitnessHex,

    onTxHashes, 
    onTxHex, 
    onVkWitnessHex, 
    
    setTxHashes, 
    setTxHex,
    setVkWitnessHex,
};