import { httpClient } from '@digitalbazaar/http-client'
import * as didIo from '@digitalbazaar/did-io'
import ed25519Context from 'ed25519-signature-2020-context'
import x25519Context from 'x25519-key-agreement-2020-context'
import didContext from 'did-context'

const { VERIFICATION_RELATIONSHIPS } = didIo

const DEFAULT_KEY_MAP = {
  capabilityInvocation: 'Ed25519VerificationKey2020',
  authentication: 'Ed25519VerificationKey2020',
  assertionMethod: 'Ed25519VerificationKey2020',
  capabilityDelegation: 'Ed25519VerificationKey2020',
  keyAgreement: 'X25519KeyAgreementKey2020'
}

export function didFromUrl ({ url } = {}) {
  if (!url) {
    throw new TypeError('Cannot convert url to did, missing url.')
  }
  if (url.startsWith('http:')) {
    throw new TypeError('did:web does not support non-HTTPS URLs.')
  }

  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch (error) {
    throw new TypeError(`Invalid url: "${url}".`)
  }

  const { host, pathname } = parsedUrl

  let pathComponent = ''
  if (pathname && pathname !== '/' && pathname !== '/.well-known/did.json') {
    pathComponent = pathname.split('/').map(encodeURIComponent).join(':')
  }

  return 'did:web:' + encodeURIComponent(host) + pathComponent
}

export function urlFromDid ({ did } = {}) {
  if (!did) {
    throw new TypeError('Cannot convert did to url, missing did.')
  }
  if (!did.startsWith('did:web:')) {
    throw new TypeError(`DID Method not supported: "${did}".`)
  }

  // eslint-disable-next-line no-unused-vars
  const [_did, _web, host, ...pathFragments] = did.split(':')

  let pathname = ''
  if (pathFragments.length === 0) {
    pathname = '/.well-known/did.json'
  } else {
    pathname = '/' + pathFragments.map(decodeURIComponent).join('/')
  }

  return 'https://' + decodeURIComponent(host) + pathname
}

/**
 * Initializes the DID Document's keys/proof methods.
 *
 * @example
 * didDocument.id = 'did:ex:123';
 * const {didDocument, keyPairs} = await initKeys({
 *   didDocument,
 *   cryptoLd,
 *   keyMap: {
 *     capabilityInvocation: someExistingKey,
 *     authentication: 'Ed25519VerificationKey2020',
 *     assertionMethod: 'Ed25519VerificationKey2020',
 *     keyAgreement: 'X25519KeyAgreementKey2019'
 *   }
 * });.
 *
 * @param {object} options - Options hashmap.
 * @param {object} options.didDocument - DID Document.
 * @typedef {object} CryptoLD
 * @param {CryptoLD} [options.cryptoLd] - CryptoLD driver instance,
 *   initialized with the key types this DID Document intends to support.
 * @param {object} [options.keyMap] - Map of keys (or key types) by purpose.
 *
 * @returns {Promise<{didDocument: object, keyPairs: Map}>} Resolves with the
 *   DID Document initialized with keys, as well as the map of the corresponding
 *   key pairs (by key id).
 */
export async function initKeys ({ didDocument, cryptoLd, keyMap = {} } = {}) {
  const doc = { ...didDocument }
  if (!doc.id) {
    throw new TypeError(
      'DID Document "id" property is required to initialize keys.')
  }

  const keyPairs = new Map()

  // Set the defaults for the created keys (if needed)
  const options = { controller: doc.id }

  for (const purpose in keyMap) {
    if (!VERIFICATION_RELATIONSHIPS.has(purpose)) {
      throw new Error(`Unsupported key purpose: "${purpose}".`)
    }

    let key
    if (typeof keyMap[purpose] === 'string') {
      if (!cryptoLd) {
        throw new Error('Please provide an initialized CryptoLD instance.')
      }
      key = await cryptoLd.generate({ type: keyMap[purpose], ...options })
    } else {
      // An existing key has been provided
      key = keyMap[purpose]
    }

    doc[purpose] = [key.export({ publicKey: true })]
    keyPairs.set(key.id, key)
  }

  return { didDocument: doc, keyPairs }
}

export class DidWebResolver {
  constructor ({ cryptoLd, keyMap = DEFAULT_KEY_MAP } = {}) {
    this.method = 'web' // did:web:...
    this.cryptoLd = cryptoLd
    this.keyMap = keyMap
  }

  /**
   * Generates a new DID Document and initializes various authentication
   * and authorization proof purpose keys.
   *
   * @example
   *   const url = 'https://example.com'
   *   const { didDocument, didKeys } = await didWeb.generate({url})
   *   didDocument.id
   *   // -> 'did:web:example.com'
   *
   *
   * Either an `id` or a `url` is required:
   * @param [id] {string} - A did:web DID. If absent, will be converted from url
   * @param [url] {string}
   *
   * @param [keyMap=DEFAULT_KEY_MAP] {object} A hashmap of key types by purpose.
   *
   * @parma [cryptoLd] {object} CryptoLD instance with support for supported
   *   crypto suites installed.
   *
   * @returns {Promise<{didDocument: object, keyPairs: Map,
   *   methodFor: Function}>} Resolves with the generated DID Document, along
   *   with the corresponding key pairs used to generate it (for storage in a
   *   KMS).
   */
  async generate ({ id, url, keyMap = this.keyMap, cryptoLd = this.cryptoLd } = {}) {
    const did = id || didFromUrl({ url })

    // Compose the DID Document
    let didDocument = {
      '@context': [
        didContext.constants.DID_CONTEXT_URL,
        ed25519Context.constants.CONTEXT_URL,
        x25519Context.constants.CONTEXT_URL
      ],
      id: did
    }

    const result = await initKeys({ didDocument, cryptoLd, keyMap })
    const keyPairs = result.keyPairs
    didDocument = result.didDocument

    // Convenience function that returns the public/private key pair instance
    // for a given purpose (authentication, assertionMethod, keyAgreement, etc).
    const methodFor = ({ purpose }) => {
      const { id: methodId } = didIo.findVerificationMethod({
        doc: didDocument, purpose
      })
      return keyPairs.get(methodId)
    }

    return { didDocument, keyPairs, methodFor }
  }

  /**
   * Fetches a DID Document for a given DID.
   *
   * @example
   * // In Node.js tests, use an agent to avoid self-signed certificate errors
   * const agent = new https.agent({rejectUnauthorized: false});
   *
   * @param {string} [did]
   * @param {string} [url]
   * @param {https.Agent} [agent] Optional agent used to customize network
   *   behavior in Node.js (such as `rejectUnauthorized: false`).
   *
   * @throws {Error}
   *
   * @returns {Promise<object>} Plain parsed JSON object of the DID Document.
   */
  async get ({ did, url, agent }) {
    url = url || urlFromDid({ did })
    if (!url) {
      throw new TypeError('A DID or a URL is required.')
    }

    let result
    try {
      result = await httpClient.get(url, { agent })
    } catch (e) {
      // status is HTTP status code
      // data is JSON error from the server if available
      const { data, status } = e
      console.error(`Http ${status} error:`, data)
      throw e
    }

    return result.data
  }
}
