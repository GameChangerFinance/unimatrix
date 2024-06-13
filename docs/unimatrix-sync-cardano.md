[**@gamechanger-finance/unimatrix**](README.md) • **Docs**

***

[Home](README.md) / unimatrix-sync-cardano

# unimatrix-sync-cardano

A set of helpers to standardize a basic data exchange protocol 
to share **Cardano** transactions and signatures using **Unimatrix**

## Remarks

A module for **Cardano** built on top of the **Unimatrix** library, with custom validators, encryption functions and data types fully compatible with [cardano-serialization-lib](https://github.com/Emurgo/cardano-serialization-lib).

Main use case are multi-signature or deferred-signature scenarios involving wallets, dapps and services on the **Cardano Blockchain**

**Validators and their matching data types**:
 - **Items**
     - `cardano.vkWitnessHex` : transaction key witness (signature) in hexadecimal encoding
     - `cardano.txHex`: transaction CBOR structure in hexadecimal encoding
 - **Announcements**
     - `cardano.TxHashHexList` : list of transaction hash strings

## Type Aliases

### CardanoValidatorTag

```ts
type CardanoValidatorTag: "cardano.TxHashHexList" | "cardano.vkWitnessHex" | "cardano.txHex";
```

Validator tags for **Cardano** and it's data types

#### Source

[sync/cardano.ts:37](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L37)

***

### DLTTag

```ts
type DLTTag: "cardano" | "forkano" | "guild" | "shareslake";
```

Name of Cardano or Cardano-based chain

#### Source

[sync/cardano.ts:28](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L28)

***

### NetworkTag

```ts
type NetworkTag: "mainnet" | "preprod" | "preview" | "legacy";
```

Name of Cardano or Cardano-based chain network

#### Source

[sync/cardano.ts:32](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L32)

## Functions

### cardanoValidatorsFactory()

```ts
function cardanoValidatorsFactory(CSL): UnimatrixValidatorMap
```

Function that generates the map of validators for **Cardano** (`UnimatrixValidatorMap`), using **cardano-serialization-lib**'s classes underneath.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `CSL` | `any` |  |

#### Returns

[`UnimatrixValidatorMap`](unimatrix.md#unimatrixvalidatormap)

#### Source

[sync/cardano.ts:200](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L200)

***

### decryptDataFactory()

```ts
function decryptDataFactory(CSL): UnimatrixDecryptFn
```

Function that generates an `UnimatrixDecryptFn` using **cardano-serialization-lib**'s `decrypt_with_password()` underneath

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `CSL` | `any` |  |

#### Returns

[`UnimatrixDecryptFn`](unimatrix.md#unimatrixdecryptfn)

#### Source

[sync/cardano.ts:118](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L118)

***

### encryptDataFactory()

```ts
function encryptDataFactory(CSL): UnimatrixEncryptFn
```

Function that generates an `UnimatrixEncryptFn` using **cardano-serialization-lib**'s `encrypt_with_password()` underneath

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `CSL` | `any` |  |

#### Returns

[`UnimatrixEncryptFn`](unimatrix.md#unimatrixencryptfn)

#### Source

[sync/cardano.ts:85](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L85)

***

### genTxHashesKey()

```ts
function genTxHashesKey(args): {
  key: string;
  path: string;
}
```

Helper that generates the key for the GunDB key-value structure used for storing a list of transaction hashes

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.subPath`? | `string`[] | - |

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

[sync/cardano.ts:565](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L565)

***

### genTxHexKey()

```ts
function genTxHexKey(args): {
  key: string;
  path: string;
}
```

Helper that generates the key for the GunDB key-value structure used for storing a transaction CBOR structure

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.txHash` | `string` | - |

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

[sync/cardano.ts:418](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L418)

***

### genUnimatrixIdFromTxHashes()

```ts
function genUnimatrixIdFromTxHashes(txHashes): string
```

Helper function that generates a hash string out of a list of transaction hash strings. 

Some clients like **GameChanger Wallet** uses it for establishing private channels.
The generated strings are used as private unique channel IDs based on built transactions 
that are not yet signed nor submitted to the blockchain, meaning that these IDs are only known by 
this transaction builder user and whomever this user shares them with.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `txHashes` | `string`[] |  |

#### Returns

`string`

#### Source

[sync/cardano.ts:74](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L74)

***

### genVkWitnessHexKey()

```ts
function genVkWitnessHexKey(args): {
  key: string;
  path: string;
}
```

Helper that generates the key for the GunDB key-value structure used for storing a transaction key witness

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.txHash` | `string` | - |
| `args.vkHash` | `string` | - |

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

[sync/cardano.ts:263](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L263)

***

### getTxHashes()

```ts
function getTxHashes(args): Promise<{
  store: undefined | UnimatrixDataStore;
  txHashes: undefined | any[];
}>
```

Getter promise that returns any announced list of transaction hashes on a specific channel

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.CSL` | `any` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.subPath`? | `string`[] | - |
| `args.timeout`? | `number` | - |

#### Returns

`Promise`\<\{
  `store`: `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore);
  `txHashes`: `undefined` \| `any`[];
 \}\>

| Member | Type |
| :------ | :------ |
| `store` | `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore) |
| `txHashes` | `undefined` \| `any`[] |

#### Source

[sync/cardano.ts:625](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L625)

***

### getTxHex()

```ts
function getTxHex(args): Promise<{
  store: undefined | UnimatrixDataStore;
  txHex: undefined | string;
}>
```

Getter promise that returns a specific transaction CBOR structure (in hexadecimal encoding) on a specific channel

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.CSL` | `any` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.timeout`? | `number` | - |
| `args.txHash` | `string` | - |

#### Returns

`Promise`\<\{
  `store`: `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore);
  `txHex`: `undefined` \| `string`;
 \}\>

| Member | Type |
| :------ | :------ |
| `store` | `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore) |
| `txHex` | `undefined` \| `string` |

#### Source

[sync/cardano.ts:476](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L476)

***

### getVkWitnessHex()

```ts
function getVkWitnessHex(args): Promise<{
  store: undefined | UnimatrixDataStore;
  vkWitnessHex: undefined | string;
}>
```

Getter promise that returns a specific transaction key witness (in hexadecimal encoding) on a specific channel

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.CSL` | `any` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.timeout`? | `number` | - |
| `args.txHash` | `string` | - |
| `args.vkHash` | `string` | - |

#### Returns

`Promise`\<\{
  `store`: `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore);
  `vkWitnessHex`: `undefined` \| `string`;
 \}\>

| Member | Type |
| :------ | :------ |
| `store` | `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore) |
| `vkWitnessHex` | `undefined` \| `string` |

#### Source

[sync/cardano.ts:323](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L323)

***

### onTxHashes()

```ts
function onTxHashes(args): Promise<void>
```

Listener promise that calls the `cb` callback every time it receives any incoming announced list of transaction hashes on a specific channel

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.CSL` | `any` | - |
| `args.cb` | (`args`) => `void` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.subPath`? | `string`[] | - |
| `args.timeout`? | `number` | - |

#### Returns

`Promise`\<`void`\>

#### Source

[sync/cardano.ts:582](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L582)

***

### onTxHex()

```ts
function onTxHex(args): Promise<void>
```

Listener promise that calls the `cb` callback every time it receives a specific incoming transaction CBOR structure (in hexadecimal encoding) on a specific channel

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.CSL` | `any` | - |
| `args.cb` | (`args`) => `void` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.timeout`? | `number` | - |
| `args.txHash` | `string` | - |

#### Returns

`Promise`\<`void`\>

#### Source

[sync/cardano.ts:434](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L434)

***

### onVkWitnessHex()

```ts
function onVkWitnessHex(args): Promise<void>
```

Listener promise that calls the `cb` callback every time it receives a specific incoming transaction key witness (in hexadecimal encoding) on a specific channel

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.CSL` | `any` | - |
| `args.cb` | (`args`) => `void` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.timeout`? | `number` | - |
| `args.txHash` | `string` | - |
| `args.vkHash` | `string` | - |

#### Returns

`Promise`\<`void`\>

#### Source

[sync/cardano.ts:280](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L280)

***

### setTxHashes()

```ts
function setTxHashes(args): Promise<{
  store: undefined | UnimatrixDataStore;
  txHashes: undefined | any[];
}>
```

Setter promise that shares the announcement of a list of transaction hashes on a specific channel

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.CSL` | `any` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.error`? | `string` | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.subPath`? | `string`[] | - |
| `args.txHashes`? | `string`[] | - |

#### Returns

`Promise`\<\{
  `store`: `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore);
  `txHashes`: `undefined` \| `any`[];
 \}\>

| Member | Type |
| :------ | :------ |
| `store` | `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore) |
| `txHashes` | `undefined` \| `any`[] |

#### Source

[sync/cardano.ts:666](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L666)

***

### setTxHex()

```ts
function setTxHex(args): Promise<{
  store: undefined | UnimatrixDataStore;
  txHex: undefined | string;
}>
```

Setter promise that shares a specific transaction CBOR structure (in hexadecimal encoding) on a specific channel

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.CSL` | `any` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.error`? | `string` | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.txHash` | `string` | - |
| `args.txHex`? | `string` | - |

#### Returns

`Promise`\<\{
  `store`: `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore);
  `txHex`: `undefined` \| `string`;
 \}\>

| Member | Type |
| :------ | :------ |
| `store` | `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore) |
| `txHex` | `undefined` \| `string` |

#### Source

[sync/cardano.ts:513](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L513)

***

### setVkWitnessHex()

```ts
function setVkWitnessHex(args): Promise<{
  store: undefined | UnimatrixDataStore;
  vkWitnessHex: undefined | string;
}>
```

Setter promise that shares a specific transaction key witness (in hexadecimal encoding) on a specific channel

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `args` | `object` |  |
| `args.CSL` | `any` | - |
| `args.db` | `IGunInstance`\<`any`\> | - |
| `args.dltTag` | [`DLTTag`](unimatrix-sync-cardano.md#dlttag) | - |
| `args.error`? | `string` | - |
| `args.id` | `string` | - |
| `args.networkTag` | [`NetworkTag`](unimatrix-sync-cardano.md#networktag) | - |
| `args.txHash` | `string` | - |
| `args.vkHash` | `string` | - |
| `args.vkWitnessHex`? | `string` | - |

#### Returns

`Promise`\<\{
  `store`: `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore);
  `vkWitnessHex`: `undefined` \| `string`;
 \}\>

| Member | Type |
| :------ | :------ |
| `store` | `undefined` \| [`UnimatrixDataStore`](unimatrix.md#unimatrixdatastore) |
| `vkWitnessHex` | `undefined` \| `string` |

#### Source

[sync/cardano.ts:363](https://github.com/GameChangerFinance/unimatrix/blob/6329f03f0b42cdbe58f503a4b079b737ec1db75d/src/sync/cardano.ts#L363)
