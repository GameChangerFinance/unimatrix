[**@gamechanger-finance/unimatrix**](README.md) • **Docs**

***

[Home](README.md) / unimatrix

# unimatrix

Decentralized, encrypted, privacy preserving, self-integrity aware protocol 
using GunDb as shared key-value cache.

## Remarks

There are 2 types of data that can be stored in JSON objects: **Items** or (Item) **Announcements**

The key-value store design consists on:
 - a key that is a hash of a concatenated list of private and/or public strings. The order of the list builds a 'path'
 - a value that is a store of private encrypted and public serialized data. 
 - encryption (and hash) usually reuse the secret in the path among the public strings and the validation method name.   
 - data validation on read and write events links and checks data against the path and the validation method used.
 - to read or write a value you must know its full path, and it must comply the validation method used.
 - the strings, or secrets used for the path are considered a private channel.

Security: 
- usually every stored data on key-value store is encrypted with a secret id
- usually if you know the id you can read/write encrypted data
- every key of the key-value store is a hash of the secret id, the (type) validator involved and the unique path of the item
- encryption and data lookup depends on knowing the secret id, the validator and the path of the item.
- non valid data types, invalid data structures, data with hash mismatch, or miss-encrypted data is automatically discarded by a reading peer
- id behaves like a session token, and it should be renewed after usage, for ex: after a finalized multisig operation 
- new private channels cannot be expected for when you don't know channel parameters, good for avoiding DDoS attacks
- at scale all key-value pairs populate under a common root, making listening for all pairs difficult
- fake value injection attacks are filtered by encryption and validators
- **Items**:
     - Items are checked against type validity tests and hash-matching tests against provided path, 
     - therefore provide the strongest security, 
     - knowing the right id for reading/writing encrypted data means nothing if data does not match required path.
- **Announcements**: 
     - are only checked against type validity, 
     - therefore provide the weakest security, 
     - anyone with the right id can read/write the encrypted data. 
     - but this is acceptable because of data validation
     - for example, announcing a sign request of injected transactions can be easily discarded by signer validators checking against transaction body validity
     - usually users should announce signing requests and validators in dapps should check transaction body

Basic operations:
- `setData`: encrypts and writes data at a path
- `getData`: reads and decrypt first valid data from a path with a timeout
- `onData`: reads all incoming data at a path and tries to validate and decrypt it

## Type Aliases

### UnimatrixData

```ts
type UnimatrixData: {
  data: any | undefined;
  error: undefined;
 } | {
  data: undefined;
  error: UnimatrixUserError;
};
```

Unimatrix data structure. Usually or data or error is stored.

#### Source

[unimatrix.ts:88](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L88)

***

### UnimatrixDataStore

```ts
type UnimatrixDataStore: {
  file: UnimatrixData;
  updatedAt: number;
};
```

An un-encrypted and decoded representation of a `UnimatrixData` file and some metadata.

#### Type declaration

| Member | Type |
| :------ | :------ |
| `file` | [`UnimatrixData`](unimatrix.md#unimatrixdata) |
| `updatedAt` | `number` |

#### Source

[unimatrix.ts:98](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L98)

***

### UnimatrixDecryptFn()

```ts
type UnimatrixDecryptFn: (args) => UnimatrixDataStore;
```

Functions that decode and decrypt private and public data from a `UnimatrixEncryptedDataStore` using channel parameters and returns a `UnimatrixDataStore`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `args` | `object` |
| `args.id` | `string` |
| `args.path` | `string`[] |
| `args.store` | [`UnimatrixEncryptedDataStore`](unimatrix.md#unimatrixencrypteddatastore) |
| `args.validator` | [`UnimatrixValidatorTag`](unimatrix.md#unimatrixvalidatortag) |

#### Returns

[`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore)

#### Source

[unimatrix.ts:135](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L135)

***

### UnimatrixEncryptFn()

```ts
type UnimatrixEncryptFn: (args) => UnimatrixEncryptedDataStore;
```

Functions that encrypt and encode private and public data from a `UnimatrixDataStore` using channel parameters and returns a `UnimatrixEncryptedDataStore`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `args` | `object` |
| `args.id` | `string` |
| `args.path` | `string`[] |
| `args.store` | [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore) |
| `args.validator` | [`UnimatrixValidatorTag`](unimatrix.md#unimatrixvalidatortag) |

#### Returns

[`UnimatrixEncryptedDataStore`](unimatrix.md#unimatrixencrypteddatastore)

#### Source

[unimatrix.ts:126](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L126)

***

### UnimatrixEncryptedDataStore

```ts
type UnimatrixEncryptedDataStore: string;
```

An encrypted and encoded representation of a `UnimatrixDataStore`. Some parts like metadata can be public, some parts like `UnimatrixData` file are encrypted.

#### Source

[unimatrix.ts:105](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L105)

***

### UnimatrixUserError

```ts
type UnimatrixUserError: string;
```

Custom user errors reported by Unimatrix nodes

#### Source

[unimatrix.ts:84](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L84)

***

### UnimatrixValidatorFn()

```ts
type UnimatrixValidatorFn: (args) => true | string;
```

Unimatrix data validator function. It validates `UnimatrixDataStore` data based on channel parameters.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `args` | [`UnimatrixValidatorFnArgs`](unimatrix.md#unimatrixvalidatorfnargs) |

#### Returns

`true` \| `string`

#### Source

[unimatrix.ts:118](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L118)

***

### UnimatrixValidatorFnArgs

```ts
type UnimatrixValidatorFnArgs: {
  id: string;
  path: string[];
  store: UnimatrixDataStore;
  validator: UnimatrixValidatorTag;
};
```

Arguments for a `UnimatrixValidatorFn`, basically channel parameters and the `UnimatrixDataStore` data to validate.

#### Type declaration

| Member | Type |
| :------ | :------ |
| `id` | `string` |
| `path` | `string`[] |
| `store` | [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore) |
| `validator` | [`UnimatrixValidatorTag`](unimatrix.md#unimatrixvalidatortag) |

#### Source

[unimatrix.ts:109](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L109)

***

### UnimatrixValidatorMap

```ts
type UnimatrixValidatorMap: {};
```

Modules built on top of Unimatrix can define validator maps, well known key-value structures with `UnimatrixValidatorTag` keys  and `UnimatrixValidatorFn` as values.

#### Index signature

 \[`validatorTag`: `string`\]: [`UnimatrixValidatorFn`](unimatrix.md#unimatrixvalidatorfn)

#### Source

[unimatrix.ts:122](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L122)

***

### UnimatrixValidatorTag

```ts
type UnimatrixValidatorTag: string;
```

Validator name or tag

#### Remarks

Validators naming convention:

- those starting in uppercase are for (Item) **Announcements**, where path is not used to verify data integrity
- those starting in lowercase are for **Items**, where standardized path is used to verify data integrity

#### Source

[unimatrix.ts:80](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L80)

## Variables

### GET\_TIMEOUT\_MS

```ts
const GET_TIMEOUT_MS: number;
```

default timeout in milliseconds for getters like `getData`

#### Source

[unimatrix.ts:65](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L65)

***

### ROOT\_NODE\_KEY

```ts
const ROOT_NODE_KEY: "root" = "root";
```

root node name on GunDB

#### Source

[unimatrix.ts:60](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L60)

## Functions

### genDataKey()

```ts
function genDataKey(args): {
  key: string;
  path: string;
}
```

Function that generates a Unimatrix hash string based on channel parameters that will be used as key for storing a `UnimatrixEncryptedDataStore` on a GunDb node key-value structure

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.id` | `string` | - |
| `args.path` | `string`[] | - |
| `args.validator` | `string` | - |

#### Returns

```ts
{
  key: string;
  path: string;
}
```

| Member | Type |
| :------ | :------ |
| `key` | `string` |
| `path` | `string` |

#### Source

[unimatrix.ts:147](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L147)

***

### getData()

```ts
function getData(args): Promise<undefined | UnimatrixDataStore>
```

Getter promise that gets a specific **Item** or **Announcement** (`UnimatrixDataStore`) from a specific channel.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.decryptData` | [`UnimatrixDecryptFn`](unimatrix.md#unimatrixdecryptfn) | - |
| `args.encryptData` | [`UnimatrixEncryptFn`](unimatrix.md#unimatrixencryptfn) | - |
| `args.id` | `string` | - |
| `args.path` | `string`[] | - |
| `args.throwTimeoutErrors`? | `boolean` | - |
| `args.throwUserErrors`? | `boolean` | - |
| `args.throwValidationErrors`? | `boolean` | - |
| `args.timeout`? | `number` | - |
| `args.validator` | `string` | - |
| `args.validators` | [`UnimatrixValidatorMap`](unimatrix.md#unimatrixvalidatormap) | - |

#### Returns

`Promise`\<`undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore)\>

#### Source

[unimatrix.ts:290](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L290)

***

### onData()

```ts
function onData(args): void
```

Listener function that triggers the `on()` callback every time an **Item** or an **Announcement** (`UnimatrixDataStore`) is received on a specific channel.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.change`? | `boolean` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.decryptData` | [`UnimatrixDecryptFn`](unimatrix.md#unimatrixdecryptfn) | - |
| `args.encryptData` | [`UnimatrixEncryptFn`](unimatrix.md#unimatrixencryptfn) | - |
| `args.id` | `string` | - |
| `args.on` | (`args`) => `void` | - |
| `args.path` | `string`[] | - |
| `args.timeout`? | `number` | - |
| `args.validator` | `string` | - |
| `args.validators` | [`UnimatrixValidatorMap`](unimatrix.md#unimatrixvalidatormap) | - |

#### Returns

`void`

#### Source

[unimatrix.ts:167](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L167)

***

### setData()

```ts
function setData(args): Promise<undefined | UnimatrixDataStore>
```

Setter promise that puts an **Item** or **Announcement** (`UnimatrixDataStore`) on a specific channel.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.checkByFetching`? | `boolean` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.decryptData` | [`UnimatrixDecryptFn`](unimatrix.md#unimatrixdecryptfn) | - |
| `args.encryptData` | [`UnimatrixEncryptFn`](unimatrix.md#unimatrixencryptfn) | - |
| `args.id` | `string` | - |
| `args.path` | `string`[] | - |
| `args.store` | [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore) | - |
| `args.validator` | `string` | - |
| `args.validators` | [`UnimatrixValidatorMap`](unimatrix.md#unimatrixvalidatormap) | - |

#### Returns

`Promise`\<`undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore)\>

#### Source

[unimatrix.ts:362](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/unimatrix.ts#L362)
