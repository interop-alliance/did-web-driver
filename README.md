# `did:web` Resolver Driver _(did-web-driver)_

[![Build Status](https://travis-ci.org/interop-alliance/did-web-driver.svg?branch=master&style=flat-square)](https://travis-ci.org/interop-alliance/did-web-driver)
[![NPM Version](https://img.shields.io/npm/v/did-web-driver.svg?style=flat-square)](https://npm.im/did-web-driver)

> A did:web method Decentralized Identifier (DID) resolver for the did-io library.

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Usage](#usage)
- [Install](#install)
- [Contribute](#contribute)
- [License](#license)

## Security

TBD

## Background

A `did:web` method driver for use with in-browser and server-side on Node.js
with the [`did-io`](https://github.com/digitalbazaar/did-io) resolver library. 

Draft spec (W3C CCG Work Item):

[`did:web` Decentralized Identifier Method Specification](https://w3c-ccg.github.io/did-method-web/)

Other implementations:

* https://github.com/decentralized-identity/web-did-resolver

## Usage

### Initializing

```js
import { Ed25519VerificationKey2020 }
  from '@digitalbazaar/ed25519-verification-key-2020'
import { X25519KeyAgreementKey2020 }
  from '@digitalbazaar/x25519-key-agreement-key-2020'
import { CryptoLD } from 'crypto-ld'

import * as didWeb from '@interop/did-web-resolver'

const cryptoLd = new CryptoLD()
cryptoLd.use(Ed25519VerificationKey2020)
cryptoLd.use(X25519KeyAgreementKey2020)

const didWebDriver = didWeb.driver({ cryptoLd })

// Optionally use it with the CachedResolver from did-io
import {CachedResolver} from '@digitalbazaar/did-io';
const resolver = new CachedResolver()
resolver.use(didWebDriver)
```

### Generating a new DID

```js
const { didDocument, keyPairs, methodFor } = await didWebDriver.generate()

{
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://w3id.org/security/suites/x25519-2020/v1'
  ],
  id: 'did:web:example.com',
  capabilityInvocation: [{
    id: 'did:web:example.com#z6MkqUiWi2o5V5oDEVzqszpkDhzeJ2o9Z4zVyTWeASqgrgti',
    type: 'Ed25519VerificationKey2020',
    controller: 'did:web:example.com',
    publicKeyMultibase: 'zC2TU7nYe9YJk81A9CRruNcSeUTXJ9Bk9HSbiLAsfwU7L'
  }],
  authentication: [{
    id: 'did:web:example.com#z6MksjNYAxjiTrhPFx9Ljk3SVowEtFXhFqLdsMKJHV4KrcDT',
    type: 'Ed25519VerificationKey2020',
    controller: 'did:web:example.com',
    publicKeyMultibase: 'zEH7VaiVH8KCv9TJe4B5beiPF4gFqqx6HBLQNTD6JwPS5'
  }],
  assertionMethod: [{
    id: 'did:web:example.com#z6MkiyYa5mG4moiHrmXQea8bNvdEWRWi3KuouHqoiknGf7xV',
    type: 'Ed25519VerificationKey2020',
    controller: 'did:web:example.com',
    publicKeyMultibase: 'z5XHXVX1dSGDpkGghy1AkXq5EgrErdSfTDGvstUpFjuB7'
  }],
  capabilityDelegation: [{
    id: 'did:web:example.com#z6MknmeMZEXLhS6g2p6YPHkQG4PkNsJev652CqnsArPm3dZa',
    type: 'Ed25519VerificationKey2020',
    controller: 'did:web:example.com',
    publicKeyMultibase: 'z9KPJxzGuMtcCvKFqhinZQxqkZJ2oWCpfWpswLaRk8QnC'
  }],
  keyAgreement: [{
    id: 'did:web:example.com#z6LSg3dWQzpQgRpaVzNXkcosnheyhXJUQkNQQgXyDapFSCFZ',
    type: 'X25519KeyAgreementKey2020',
    controller: 'did:web:example.com',
    publicKeyMultibase: 'z5NTLth1Yay6qQbzmDyHvU7SVrNmMi9CFXhpHj8AiipUo'
  }]
}
```

## Install

```bash
git clone https://github.com/interop-alliance/did-web-driver.git
cd did-web-driver
npm install
```

## Contribute

* Coding Style: [Standard.js](https://standardjs.com/)
* Docs: JSDoc
* Readme: [standard-readme](https://github.com/RichardLitt/standard-readme)

PRs accepted.

## License

[The MIT License](LICENSE.md) ©2020-2021 Interop Alliance and Dmitri Zagidulin
