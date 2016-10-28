import nacl from '../utils/nacl-fast';
import KeyPair from '../utils/KeyPair';
import convert from '../utils/convert';
import Address from '../utils/Address';
import CryptoHelpers from '../utils/CryptoHelpers';

export default class WalletBuilder {
    constructor(Alert, $timeout) {
        'ngInject';

        // Alert service
        this._Alert = Alert;
        // $timeout for async digest
        this._$timeout = $timeout;
    }

    /**
     * createWallet() Create a PRNG wallet object
     *
     * @param walletName: The wallet name
     * @param walletPassword: The wallet password
     * @param network: The network id
     *
     * @return promise: PRNG wallet object or promise error
     */
    createWallet(walletName, walletPassword, network) {
        return new Promise((resolve, reject) => {
            if (!walletName || !walletPassword || !network) {
                return reject("Missing parameter");
            }
            // Create private key from random bytes
            let r = convert.ua2hex(nacl.randomBytes(32));
            // Create KeyPair from above key
            let k = KeyPair.create(r);
            // Create address from public key
            let addr = Address.toAddress(k.publicKey.toString(), network);
            // Encrypt private key using password
            let encrypted = CryptoHelpers.encodePrivKey(r, walletPassword);
            // Create bip32 remote amount using generated private key
            return resolve(CryptoHelpers.generateBIP32Data(r, walletPassword, 0, network).then((data) => {
                    // Construct the wallet object
                    let wallet = buildWallet(walletName, addr, true, "pass:bip32", encrypted, network, data.publicKey);
                    return wallet;
                },
                (err) => {
                    this._$timeout(() => {
                        this._Alert.createWalletFailed(err);
                        return 0;
                    }, 0)
                }));
        });
    }

    /**
     * createBrainWallet() Create a brain wallet object
     *
     * @param  walletName: The wallet name
     * @param walletPassword: The wallet password
     * @param network: The network id
     *
     * @return promise: Brain wallet object or promise error
     */
    createBrainWallet(walletName, walletPassword, network) {
        return new Promise((resolve, reject) => {
            if (!walletName || !walletPassword || !network) {
                return reject("Missing parameter");
            }
            // Derive private key from password
            let r = CryptoHelpers.derivePassSha(walletPassword, 6000);
            // Create KeyPair from above key
            let k = KeyPair.create(r.priv);
            // Create address from public key
            let addr = Address.toAddress(k.publicKey.toString(), network);
            // Create bip32 remote account using derived private key
            return resolve(CryptoHelpers.generateBIP32Data(r.priv, walletPassword, 0, network).then((data) => {
                    // Construct the wallet object
                    let wallet = buildWallet(walletName, addr, true, "pass:6k", "", network, data.publicKey);
                    return wallet;
                },
                (err) => {
                    this._$timeout(() => {
                        this._Alert.createWalletFailed(err);
                        return 0;
                    }, 0)
                }));
        });
    }

    /**
     * createPrivateKeyWallet() Create a private key wallet object
     *
     * @param walletName: The wallet name
     * @param walletPassword: The wallet password
     * @param network: The network id
     *
     * @return promise: Private key wallet object or promise error
     */
    createPrivateKeyWallet(walletName, walletPassword, address, privateKey, network) {
        return new Promise((resolve, reject) => {
            if (!walletName || !walletPassword || !address || !privateKey || !network) {
                return reject("Missing parameter");
            }
            // Encrypt private key using password
            let encrypted = CryptoHelpers.encodePrivKey(privateKey, walletPassword);
            // Clean address
            let cleanAddr = address.toUpperCase().replace(/-/g, '');
            // Create bip32 remote account using provided private key
            return resolve(CryptoHelpers.generateBIP32Data(privateKey, walletPassword, 0, network).then((data) => {
                    // Construct the wallet object
                    let wallet = buildWallet(walletName, cleanAddr, false, "pass:enc", encrypted, network, data.publicKey);
                    return wallet;
                },
                (err) => {
                    this._$timeout(() => {
                        this._Alert.createWalletFailed(err);
                        return 0;
                    }, 0)
                }));
        });
    }

}

/**
 * buildWallet() Create a wallet object
 *
 * @param walletName: The wallet name
 * @param addr: The main account address
 * @param brain: Is brain or not
 * @param algo: The wallet algo
 * @param encrypted: The encrypted private key object
 * @param network: The network id
 * @param child: Account derived of seed at index 0
 *
 * @return wallet: The wallet object
 */
function buildWallet(walletName, addr, brain, algo, encrypted, network, child) {
    let wallet = {
        "privateKey": "",
        "name": walletName,
        "accounts": {
            "0": {
                "brain": brain,
                "algo": algo,
                "encrypted": encrypted.ciphertext || "",
                "iv": encrypted.iv || "",
                "address": addr.toUpperCase().replace(/-/g, ''),
                "label": 'Primary',
                "network": network,
                "child": child
            }
        }
    };
    return wallet;
}