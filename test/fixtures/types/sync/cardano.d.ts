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
/// <reference types="node" />
import { UnimatrixDataStore, UnimatrixDecryptFn, UnimatrixEncryptFn, UnimatrixUserError, UnimatrixValidatorMap } from '../unimatrix';
import { UnimatrixDB, UnimatrixDBDataNode } from '../common';
/**
 * Name of Cardano or Cardano-based chain
 */
export type DLTTag = "cardano" | "forkano" | "guild" | "shareslake";
/**
 * Name of Cardano or Cardano-based chain network
 */
export type NetworkTag = "mainnet" | "preprod" | "preview" | "legacy";
/**
 * Validator tags for **Cardano** and it's data types
 *
 */
export type CardanoValidatorTag = 'cardano.TxHashHexList' | 'cardano.vkWitnessHex' | 'cardano.txHex';
/**
 * Salt size for `encryptDataFactory`
 */
export declare const SALT_SIZE = 32;
/**
 * Nonce size for `encryptDataFactory`
 */
export declare const NONCE_SIZE = 12;
/**
 * External library type: [cardano-serialization-lib](https://github.com/Emurgo/cardano-serialization-lib)
 */
export type CardanoSerializationLib = any;
export declare function randomBytes(size: number): Buffer;
/**
 * Helper function that generates a hash string out of a list of transaction hash strings.
 *
 * Some clients like **GameChanger Wallet** uses it for establishing private channels.
 * The generated strings are used as private unique channel IDs based on built transactions
 * that are not yet signed nor submitted to the blockchain, meaning that these IDs are only known by
 * this transaction builder user and whomever this user shares them with.
 *
 * @param txHashes
 */
export declare const genUnimatrixIdFromTxHashes: (txHashes: string[]) => string;
/**
 * Function that generates an `UnimatrixEncryptFn` using **cardano-serialization-lib**'s `encrypt_with_password()` underneath
 * @param CSL
 */
export declare const encryptDataFactory: (CSL: any) => UnimatrixEncryptFn;
/**
 * Function that generates an `UnimatrixDecryptFn` using **cardano-serialization-lib**'s `decrypt_with_password()` underneath
 * @param CSL
 */
export declare const decryptDataFactory: (CSL: any) => UnimatrixDecryptFn;
/**
 * Verifies a transaction witness with hexadecimal arguments provided.
 * @param args.CSL pass cardano serialization lib
 * @param args.txHash transaction hash hex
 * @param args.vkWitnessHex witness hex
 * @param args.vkHash (optional) public key hash hex. when provided will check vkHash against pub key
 */
export declare const verifyVkWitnessHex: (args: {
    CSL?: any;
    txHash: string;
    vkHash?: string;
    vkWitnessHex: string;
}) => true | string;
/**
 * Function that generates the map of validators for **Cardano** (`UnimatrixValidatorMap`), using **cardano-serialization-lib**'s classes underneath.
 *
 * @param CSL
 */
export declare const cardanoValidatorsFactory: (CSL: any) => UnimatrixValidatorMap;
/**
 * Helper that generates the key for the GunDB key-value structure used for storing a transaction key witness
 *
 * @param args
 */
export declare const genVkWitnessHexKey: (args: {
    id: string;
    dltTag: DLTTag;
    networkTag: NetworkTag;
    txHash: string;
    vkHash: string;
}) => {
    key: string;
    path: string;
};
/**
 * Listener promise that calls the `cb` callback every time it receives a specific incoming transaction key witness (in hexadecimal encoding) on a specific channel
 *
 * @param args
 */
export declare const onVkWitnessHex: (args: {
    CSL: CardanoSerializationLib;
    db: UnimatrixDB;
    id: string;
    dltTag: DLTTag;
    networkTag: NetworkTag;
    txHash: string;
    vkHash: string;
    timeout?: number | undefined;
    cb: (args: {
        vkWitnessHex?: string;
        store?: UnimatrixDataStore;
        validationError?: string;
        userError?: string;
        timeoutError?: boolean;
        node: UnimatrixDBDataNode<string>;
        stop: () => void;
    }) => void;
}) => Promise<void>;
/**
 * Getter promise that returns a specific transaction key witness (in hexadecimal encoding) on a specific channel
 *
 * @param args
 */
export declare const getVkWitnessHex: (args: {
    CSL: CardanoSerializationLib;
    db: UnimatrixDB;
    id: string;
    dltTag: DLTTag;
    networkTag: NetworkTag;
    txHash: string;
    vkHash: string;
    timeout?: number;
}) => Promise<{
    store: UnimatrixDataStore | undefined;
    vkWitnessHex: string | undefined;
}>;
/**
 * Setter promise that shares a specific transaction key witness (in hexadecimal encoding) on a specific channel
 *
 * @param args
 */
export declare const setVkWitnessHex: (args: {
    CSL: CardanoSerializationLib;
    db: UnimatrixDB;
    id: string;
    txHash: string;
    vkHash: string;
    networkTag: NetworkTag;
    dltTag: DLTTag;
    vkWitnessHex?: string;
    error?: UnimatrixUserError;
}) => Promise<{
    store: UnimatrixDataStore | undefined;
    vkWitnessHex: string | undefined;
}>;
/**
 * Helper that generates the key for the GunDB key-value structure used for storing a transaction CBOR structure
 *
 * @param args
 */
export declare const genTxHexKey: (args: {
    id: string;
    dltTag: DLTTag;
    networkTag: NetworkTag;
    txHash: string;
}) => {
    key: string;
    path: string;
};
/**
* Listener promise that calls the `cb` callback every time it receives a specific incoming transaction CBOR structure (in hexadecimal encoding) on a specific channel
*
* @param args
*/
export declare const onTxHex: (args: {
    CSL: CardanoSerializationLib;
    db: UnimatrixDB;
    id: string;
    dltTag: DLTTag;
    networkTag: NetworkTag;
    txHash: string;
    timeout?: number | undefined;
    cb: (args: {
        txHex?: string;
        store?: UnimatrixDataStore;
        validationError?: string;
        userError?: string;
        timeoutError?: boolean;
        node: UnimatrixDBDataNode<string>;
        stop: () => void;
    }) => void;
}) => Promise<void>;
/**
* Getter promise that returns a specific transaction CBOR structure (in hexadecimal encoding) on a specific channel
*
* @param args
*/
export declare const getTxHex: (args: {
    CSL: CardanoSerializationLib;
    db: UnimatrixDB;
    id: string;
    dltTag: DLTTag;
    networkTag: NetworkTag;
    txHash: string;
    timeout?: number;
}) => Promise<{
    store: UnimatrixDataStore | undefined;
    txHex: string | undefined;
}>;
/**
* Setter promise that shares a specific transaction CBOR structure (in hexadecimal encoding) on a specific channel
*
* @param args
*/
export declare const setTxHex: (args: {
    CSL: CardanoSerializationLib;
    db: UnimatrixDB;
    id: string;
    txHash: string;
    networkTag: NetworkTag;
    dltTag: DLTTag;
    txHex?: string;
    error?: UnimatrixUserError;
}) => Promise<{
    store: UnimatrixDataStore | undefined;
    txHex: string | undefined;
}>;
/**
 * Helper that generates the key for the GunDB key-value structure used for storing a list of transaction hashes
 *
 * @param args
 */
export declare const genTxHashesKey: (args: {
    id: string;
    dltTag: DLTTag;
    networkTag: NetworkTag;
    subPath?: string[];
}) => {
    key: string;
    path: string;
};
/**
* Listener promise that calls the `cb` callback every time it receives any incoming announced list of transaction hashes on a specific channel
*
* @param args
*/
export declare const onTxHashes: (args: {
    CSL: CardanoSerializationLib;
    db: UnimatrixDB;
    id: string;
    dltTag: DLTTag;
    networkTag: NetworkTag;
    subPath?: string[] | undefined;
    timeout?: number | undefined;
    cb: (args: {
        txHashes?: string[];
        store?: UnimatrixDataStore;
        validationError?: string;
        userError?: string;
        timeoutError?: boolean;
        node: UnimatrixDBDataNode<any>;
        stop: () => void;
    }) => void;
}) => Promise<void>;
/**
* Getter promise that returns any announced list of transaction hashes on a specific channel
*
* @param args
*/
export declare const getTxHashes: (args: {
    CSL: CardanoSerializationLib;
    db: UnimatrixDB;
    id: string;
    dltTag: DLTTag;
    networkTag: NetworkTag;
    subPath?: string[];
    timeout?: number;
}) => Promise<{
    store: UnimatrixDataStore | undefined;
    txHashes: any[] | undefined;
}>;
/**
* Setter promise that shares the announcement of a list of transaction hashes on a specific channel
*
* @param args
*/
export declare const setTxHashes: (args: {
    CSL: CardanoSerializationLib;
    db: UnimatrixDB;
    id: string;
    networkTag: NetworkTag;
    dltTag: DLTTag;
    txHashes?: string[];
    subPath?: string[];
    error?: UnimatrixUserError;
}) => Promise<{
    store: UnimatrixDataStore | undefined;
    txHashes: any[] | undefined;
}>;
