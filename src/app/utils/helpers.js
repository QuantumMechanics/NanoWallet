import convert from './convert';
import CryptoHelpers from './CryptoHelpers';
import TransactionTypes from './TransactionTypes';

/**
 * haveWallet() Check if wallet already present in localstorage
 *
 * @param walletName: The wallet name
 * @param array: The wallets array from local storage
 *
 * @return boolean: True if present, false otherwise
 */
let haveWallet = function(walletName, array) {
    let i = null;
    for (i = 0; array.length > i; i++) {
        if (array[i].name === walletName) {
            return true;
        }
    }
    return false;
}

/**
 * needsSignature() Check if a multisig transaction needs signature
 *
 * @param multisigTransaction: The multisig transaction object
 * @param data: The account data
 *
 * @return boolean: True if it needs signature, false otherwise
 */
let needsSignature = function(multisigTransaction, data) {
    if (multisigTransaction.transaction.signer === data.account.publicKey) {
        return false;
    }
    if (multisigTransaction.transaction.otherTrans.signer === data.account.publicKey) {
        return false;
    }
    // Check if we're already on list of signatures
    for (let i = 0; i < multisigTransaction.transaction.signatures.length; i++) {
        if (multisigTransaction.transaction.signatures[i].signer === data.account.publicKey) {
            return false;
        }
    }

    if (!data.meta.cosignatoryOf.length) {
        return false;
    } else {
        for (let k = 0; k < data.meta.cosignatoryOf.length; k++) {
            if (data.meta.cosignatoryOf[k].publicKey === multisigTransaction.transaction.otherTrans.signer) {
                return true;
            } else if (k === data.meta.cosignatoryOf.length - 1) {
                return false;
            }
        }
    }
    return true;
}

/**
 * txTypeToName() Return the name of a transaction type id
 *
 * @param id: The transaction type id
 *
 * @return string: The transaction type name
 */
let txTypeToName = function(id) {
    switch (id) {
        case TransactionTypes.Transfer:
            return 'Transfer';
        case TransactionTypes.ImportanceTransfer:
            return 'ImportanceTransfer';
        case TransactionTypes.MultisigModification:
            return 'MultisigModification';
        case TransactionTypes.ProvisionNamespace:
            return 'ProvisionNamespace';
        case TransactionTypes.MosaicDefinition:
            return 'MosaicDefinition';
        case TransactionTypes.MosaicSupply:
            return 'MosaicSupply';
        default:
            return 'Unknown_' + id;
    }
}

/**
 * haveTx() Check if a transaction is already present in an array of transactions
 *
 * @param hash: The transaction hash
 * @param array: The array of transactions
 *
 * @return boolean: True if present, false otherwise
 */
let haveTx = function(hash, array) {
    let i = null;
    for (i = 0; array.length > i; i++) {
        if (array[i].meta.hash.data === hash) {
            return true;
        }
    }
    return false;
};

/**
 * getTransactionIndex() Get the index of a transaction in an array of transactions
 *
 * @note: Used only if the transaction is present in the array
 *
 * @param hash: The transaction hash
 * @param array: The array of transactions
 *
 * @return i: The index of the transaction
 */
let getTransactionIndex = function(hash, array) {
    let i = null;
    for (i = 0; array.length > i; i++) {
        if (array[i].meta.hash.data === hash) {
            return i;
        }
    }
    return 0;
};

/**
 * mosaicIdToName() Return mosaic name from mosaicId object
 *
 * @param hash: The mosaicId object
 *
 * @return the mosaic name
 */
let mosaicIdToName = function(mosaicId) {
    if (!mosaicId) return mosaicId;
    return mosaicId.namespaceId + ":" + mosaicId.name;
}

/**
 * getHostname() Parse uri to get the hostname
 *
 * @param uri: An uri string
 *
 * @return the uri hostname
 */
let getHostname = function(uri) {
    let _uriParser = document.createElement('a');
    _uriParser.href = uri;
    return _uriParser.hostname;
}

/**
 * haveCosig() Check if a cosignatory is already present in modifications array
 *
 * @param address: The cosignatory address
 * @param pubKey: The cosignatory public key
 * @param array: The modifications array
 *
 * @return boolean: True if present, false otherwise
 */
let haveCosig = function(address, pubKey, array) {
    let i = null;
    for (i = 0; array.length > i; i++) {
        if (array[i].address === address || array[i].pubKey === pubKey) {
            return true;
        }
    }
    return false;
};

/**
 * getFileName() Remove extension of a filename
 *
 * @param filename: The file name with extension
 *
 * @return the file name without extension
 */
let getFileName = function(filename) {
    return filename.replace(/\.[^/.]+$/, "");
};

/**
 * getExtension() Get extension from filename
 *
 * @param filename: The file name with extension
 *
 * @return the file name extension
 */
let getExtension = function(filename) {
    return filename.split('.').pop();
}

// NEM epoch time
let NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);

/**
 * createNEMTimeStamp() Create a time stamp for a NEM transaction
 *
 * @return NEM transaction timestamp
 */
let createNEMTimeStamp = function() {
    return Math.floor((Date.now() / 1000) - (NEM_EPOCH / 1000));
}

/**
 * fixPrivateKey() Fix the private key
 *
 * @param privatekey: The hex private key
 *
 * @return the fixed hex private key
 */
let fixPrivateKey = function(privatekey) {
    return ("0000000000000000000000000000000000000000000000000000000000000000" + privatekey.replace(/^00/, '')).slice(-64);
}

/**
 * calcMinFee() Calculate minimum fees from an amount of XEM
 *
 * @param numNem: The amount of XEM
 *
 * @return the minimum fee
 */
let calcMinFee = function(numNem) {
    let fee = Math.floor(Math.max(1, numNem / 10000));
    return fee > 25 ? 25 : fee;
}

/**
 * calcXemEquivalent() Calculate mosaic quantity equivalent in XEM
 *
 * @param multiplier: The mosaic multiplier
 * @param q: The mosaic quantity
 * @param sup: The mosaic supply
 * @param divisibility: The mosaic divisibility
 *
 * @return the XEM equivalent of a mosaic quantity
 */
let calcXemEquivalent = function(multiplier, q, sup, divisibility) {
    if (sup === 0) {
        return 0;
    }
    // TODO: can this go out of JS (2^54) bounds? (possible BUG)
    return 8999999999 * q * multiplier / sup / Math.pow(10, divisibility + 6);
}

/**
 * prepareMessage() Build the message object
 *
 * @param common: The object containing wallet private key
 * @param tx: The transaction object containing the message
 *
 * @return a message object
 */
let prepareMessage = function(common, tx) {
    if (tx.encryptMessage && common.privateKey) {
        return {
            'type': 2,
            'payload': CryptoHelpers.encode(common.privateKey, tx.recipientPubKey, tx.message.toString())
        };
    } else {
        return {
            'type': 1,
            'payload': convert.utf8ToHex(tx.message.toString())
        };
    }
}

/**
 * checkAndFormatUrl() Check and format an url
 *
 * @param node: A custom node from user input
 * @param defaultWebsocketPort: The default websocket port
 *
 * @return the formatted node as string or 1
 */
let checkAndFormatUrl = function (node, defaultWebsocketPort) {
    // Detect if custom node doesn't begin with "http://"
        var pattern = /^((http):\/\/)/;
        if (!pattern.test(node)) {
            node = "http://" + node;
            let _uriParser = document.createElement('a');
            _uriParser.href = node;
            // If no port we add it
            if (!_uriParser.port) {
                node = node + ":" + defaultWebsocketPort;
            } else if (_uriParser.port !== defaultWebsocketPort) {
                // Port is not default websocket port
                return 1;
            }
        } else {
            // Start with "http://""
            let _uriParser = document.createElement('a');
            _uriParser.href = node;
            // If no port we add it
            if (!_uriParser.port) {
                node = node + ":" + defaultWebsocketPort;
            } else if (_uriParser.port !== defaultWebsocketPort) {
                // Port is not default websocket port
                return 1;
            }
        }
        return node;
}
 
/**
 * createTimeStamp() Create a timestamp
 *
 * @return a date object
 */
let createTimeStamp = function() {
    return new Date();
}

/**
 * getTimestampShort() Short format for a timestamp
 *
 * @param date: A date object
 *
 * @return a short date
 */
let getTimestampShort = function(date) {
    let dd = date.getDate();
    let mm = date.getMonth() + 1; //January is 0!
    let yyyy = date.getFullYear();

    if (dd < 10) {
        dd = '0' + dd
    }

    if (mm < 10) {
        mm = '0' + mm
    }

    return yyyy + '-' + mm + '-' + dd;
};

/**
 * convertDateToString() Date object to date string
 *
 * @param date: A date object
 *
 * @return a date string
 */
let convertDateToString = function(date) {
    return date.toDateString();
};

module.exports = {
    haveWallet,
    needsSignature,
    txTypeToName,
    haveTx,
    getTransactionIndex,
    mosaicIdToName,
    getHostname,
    haveCosig,
    getFileName,
    getExtension,
    createNEMTimeStamp,
    fixPrivateKey,
    calcMinFee,
    calcXemEquivalent,
    prepareMessage,
    checkAndFormatUrl,
    createTimeStamp,
    getTimestampShort,
    convertDateToString
}