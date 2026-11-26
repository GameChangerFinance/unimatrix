/**
 * Decentralized, encrypted, privacy preserving, self-integrity aware protocol
 * using GunDb as shared key-value cache.
 * @module unimatrix
 *
 * @remarks
 *
 * There are 2 types of data that can be stored in JSON objects: **Items** or (Item) **Announcements**
 *
 * The key-value store design consists on:
 *  - a key that is a hash of a concatenated list of private and/or public strings. The order of the list builds a 'path'
 *  - a value that is a store of private encrypted and public serialized data.
 *  - encryption (and hash) usually reuse the secret in the path among the public strings and the validation method name.
 *  - data validation on read and write events links and checks data against the path and the validation method used.
 *  - to read or write a value you must know its full path, and it must comply the validation method used.
 *  - the strings, or secrets used for the path are considered a private channel.
 *
 * Security:
 * - usually every stored data on key-value store is encrypted with a secret id
 * - usually if you know the id you can read/write encrypted data
 * - every key of the key-value store is a hash of the secret id, the (type) validator involved and the unique path of the item
 * - encryption and data lookup depends on knowing the secret id, the validator and the path of the item.
 * - non valid data types, invalid data structures, data with hash mismatch, or miss-encrypted data is automatically discarded by a reading peer
 * - id behaves like a session token, and it should be renewed after usage, for ex: after a finalized multisig operation
 * - new private channels cannot be expected for when you don't know channel parameters, good for avoiding DDoS attacks
 * - at scale all key-value pairs populate under a common root, making listening for all pairs difficult
 * - fake value injection attacks are filtered by encryption and validators
 * - **Items**:
 *      - Items are checked against type validity tests and hash-matching tests against provided path,
 *      - therefore provide the strongest security,
 *      - knowing the right id for reading/writing encrypted data means nothing if data does not match required path.
 * - **Announcements**:
 *      - are only checked against type validity,
 *      - therefore provide the weakest security,
 *      - anyone with the right id can read/write the encrypted data.
 *      - but this is acceptable because of data validation
 *      - for example, announcing a sign request of injected transactions can be easily discarded by signer validators checking against transaction body validity
 *      - usually users should announce signing requests and validators in dapps should check transaction body
 *
 *
 * Basic operations:
 * - `setData`: encrypts and writes data at a path
 * - `getData`: reads and decrypt first valid data from a path with a timeout
 * - `onData`: reads all incoming data at a path and tries to validate and decrypt it
 *
 */
import { UnimatrixDB } from "./common";
import { IGunChain } from 'gun';
/**
 * root node name on GunDB
 */
export declare const ROOT_NODE_KEY = "root";
/**
 * default timeout in milliseconds for getters like `getData`
 */
export declare const GET_TIMEOUT_MS: number;
/**
* Validator name or tag
*
* @remarks
*
* Validators naming convention:
*
* - those starting in uppercase are for (Item) **Announcements**, where path is not used to verify data integrity
* - those starting in lowercase are for **Items**, where standardized path is used to verify data integrity
*
*/
export type UnimatrixValidatorTag = string;
/**
 * Custom user errors reported by Unimatrix nodes
 */
export type UnimatrixUserError = string;
/**
 * Unimatrix data structure. Usually or data or error is stored.
 */
export type UnimatrixData = {
    data: any | undefined;
    error: undefined;
} | {
    data: undefined;
    error: UnimatrixUserError;
};
/**
 * An un-encrypted and decoded representation of a `UnimatrixData` file and some metadata.
 */
export type UnimatrixDataStore = {
    file: UnimatrixData;
    updatedAt: number;
};
/**
 * An encrypted and encoded representation of a `UnimatrixDataStore`. Some parts like metadata can be public, some parts like `UnimatrixData` file are encrypted.
 */
export type UnimatrixEncryptedDataStore = string;
/**
 * Arguments for a `UnimatrixValidatorFn`, basically channel parameters and the `UnimatrixDataStore` data to validate.
 */
export type UnimatrixValidatorFnArgs = {
    id: string;
    validator: UnimatrixValidatorTag;
    path: string[];
    store: UnimatrixDataStore;
};
/**
 * Unimatrix data validator function. It validates `UnimatrixDataStore` data based on channel parameters.
 */
export type UnimatrixValidatorFn = (args: UnimatrixValidatorFnArgs) => true | string;
/**
 * Modules built on top of Unimatrix can define validator maps, well known key-value structures with `UnimatrixValidatorTag` keys  and `UnimatrixValidatorFn` as values.
 */
export type UnimatrixValidatorMap = {
    [validatorTag: string]: UnimatrixValidatorFn;
};
/**
 * Functions that encrypt and encode private and public data from a `UnimatrixDataStore` using channel parameters and returns a `UnimatrixEncryptedDataStore`
 */
export type UnimatrixEncryptFn = (args: {
    id: string;
    validator: UnimatrixValidatorTag;
    path: string[];
    store: UnimatrixDataStore;
}) => UnimatrixEncryptedDataStore;
/**
 * Functions that decode and decrypt private and public data from a `UnimatrixEncryptedDataStore` using channel parameters and returns a `UnimatrixDataStore`
 */
export type UnimatrixDecryptFn = (args: {
    id: string;
    validator: UnimatrixValidatorTag;
    path: string[];
    store: UnimatrixEncryptedDataStore;
}) => UnimatrixDataStore;
/**
 * Function that generates a Unimatrix hash string based on channel parameters that will be used as key for storing a `UnimatrixEncryptedDataStore` on a GunDb node key-value structure
 * @param args
 */
export declare const genDataKey: (args: {
    id: string;
    validator: UnimatrixValidatorTag;
    path: string[];
}) => {
    key: string;
    path: string;
};
/**
 * Listener function that triggers the `on()` callback every time an **Item** or an **Announcement** (`UnimatrixDataStore`) is received on a specific channel.
 * @param args
 */
export declare const onData: (args: {
    db: UnimatrixDB;
    id: string;
    validator: UnimatrixValidatorTag;
    validators: UnimatrixValidatorMap;
    path: string[];
    change?: boolean | undefined;
    timeout?: number | undefined;
    encryptData: UnimatrixEncryptFn;
    decryptData: UnimatrixDecryptFn;
    on: (args: {
        store?: UnimatrixDataStore | undefined;
        validationError?: string | undefined;
        userError?: string | undefined;
        timeoutError?: boolean | undefined;
        node: IGunChain<string>;
        stop: () => void;
    }) => void;
}) => void;
/**
 * Getter promise that gets a specific **Item** or **Announcement** (`UnimatrixDataStore`) from a specific channel.
 * @param args
 */
export declare const getData: (args: {
    db: UnimatrixDB;
    id: string;
    validator: UnimatrixValidatorTag;
    validators: UnimatrixValidatorMap;
    path: string[];
    throwValidationErrors?: boolean;
    throwUserErrors?: boolean;
    throwTimeoutErrors?: boolean;
    timeout?: number;
    encryptData: UnimatrixEncryptFn;
    decryptData: UnimatrixDecryptFn;
}) => Promise<UnimatrixDataStore | undefined>;
/**
 * Setter promise that puts an **Item** or **Announcement** (`UnimatrixDataStore`) on a specific channel.
 * @param args
 */
export declare const setData: (args: {
    db: UnimatrixDB;
    id: string;
    validator: UnimatrixValidatorTag;
    validators: UnimatrixValidatorMap;
    path: string[];
    store: UnimatrixDataStore;
    checkByFetching?: boolean;
    encryptData: UnimatrixEncryptFn;
    decryptData: UnimatrixDecryptFn;
}) => Promise<UnimatrixDataStore | undefined>;
