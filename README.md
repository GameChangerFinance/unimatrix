# Unimatrix Sync

A decentralized, privacy preserving, transaction witness sharing and pairing library for multisignatures or deferred signatures. It was originally created for GameChanger Wallet to improve it's multisignature user experience and boost the multisig dapp and service ecosystem

On Unimatrix, each node reads and shares encrypted data over [GunDB](https://gun.eco/), a decentralized key-value store. Unimatrix creates channels using obfuscated (hashed) keys and encrypted data values, only allowing the bearers of certain channel parameters and right data to locate and decrypt the information. 

## IMPORTANT

This repository is under deep development, and all it's components are not ready yet to be used on projects. Module bundling is missing, as well as Cardano specific helpers.

Coming soon!

## Development

### Set up tools and environment

### Install dependencies

Install dependencies with npm:

```bash
npm i
```

### Test

Test your code with Jest framework:

```bash
npm run test
```

### Build

Build production (distribution) files in your **dist** folder:

```bash
npm run build
```


### Try it locally

Run:

```bash
npm link
```

[npm link](https://docs.npmjs.com/cli/v6/commands/npm-link) will create a symlink in the global folder, which may be **{prefix}/lib/node_modules/@gamechanger-finance/unimatrix** or **C:\Users\<username>\AppData\Roaming\npm\node_modules\@gamechanger-finance/unimatrix**.

Create an empty folder elsewhere, you don't even need to `npm init` (to generate **package.json**). Open the folder with VS Code, open a terminal and just run:

```bash
npm link @gamechanger-finance/unimatrix
```

This will create a symbolic link from globally-installed @gamechanger-finance/unimatrix to **node_modules/** of the current folder.

You can then create a, for example, **example.ts** file with the content:

```ts

import { ... } from '@gamechanger-finance/unimatrix'
...

```

If you don't see any linting errors in VS Code, if you can use library functions in your code, then it's all good.

Whenever you want to uninstall the globally-installed @gamechanger-finance/unimatrix and remove the symlink in the global folder, run:

```bash
npm uninstall @gamechanger-finance/unimatrix -g
```
