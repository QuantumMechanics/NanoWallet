import Network from '../utils/Network';
import convert from '../utils/convert';
import KeyPair from '../utils/KeyPair';
import CryptoHelpers from '../utils/CryptoHelpers';
import Serialization from '../utils/Serialization';
import helpers from '../utils/helpers';
import Address from '../utils/Address';
import TransactionTypes from '../utils/TransactionTypes';

export default class Transactions {
    constructor(Wallet, $http, DataBridge, NetworkRequests) {
        'ngInject';

        // Wallet service
        this._Wallet = Wallet
        // $http service
        this._$http = $http;
        // DataBridge service
        this._DataBridge = DataBridge;
        // NetworkRequests service
        this._NetworkRequests = NetworkRequests;
    }


    /**
     * CURRENT_NETWORK_VERSION() Set the network version
     *
     * @param val: The version number (1 or 2)
     *
     * return: the network version
     */
    CURRENT_NETWORK_VERSION(val) {
        if (this._Wallet.network === Network.data.Mainnet.id) {
            return 0x68000000 | val;
        } else if (this._Wallet.network === Network.data.Testnet.id) {
            return 0x98000000 | val;
        }
        return 0x60000000 | val;
    }

    /**
     * CREATE_DATA() Create the common part of a transaction
     *
     * @param txType: The type of the transaction
     * @param senderPublicKey: The sender public key
     * @param timeStamp: The timestamp of the transation
     * @param due: The deadline in minutes
     * @param version: The network version
     *
     * return: common transaction object
     */
    CREATE_DATA(txtype, senderPublicKey, timeStamp, due, version) {
        return {
            'type': txtype,
            'version': version || this.CURRENT_NETWORK_VERSION(1),
            'signer': senderPublicKey,
            'timeStamp': timeStamp,
            'deadline': timeStamp + due * 60
        };
    }

    /**
     * calculateMosaicsFee() Calculate fees for mosaics included in a transaction
     *
     * @param multiplier: The quantity multiplier
     * @param mosaics: The mosaicDefinitionMetaDataPair object for the account
     * @param attachedMosaics: The array of included mosaics
     *
     * return totalFee: The calculated fee for the mosaics transaction
     */
    calculateMosaicsFee(multiplier, mosaics, attachedMosaics) {
        if(this._Wallet.network === Network.data.Testnet.id && this._DataBridge.nisHeight >= 572500) {
            let totalFee = 0;
            let fee = 0;
            let supplyRelatedAdjustment = 0;
            for (let i = 0; i < attachedMosaics.length; i++) {
                let m = attachedMosaics[i];
                let mosaicName = helpers.mosaicIdToName(m.mosaicId);
                if (!(mosaicName in mosaics)) {
                    return ['unknown mosaic divisibility', data];
                }
                let mosaicDefinitionMetaDataPair = mosaics[mosaicName];
                let divisibilityProperties = $.grep(mosaicDefinitionMetaDataPair.mosaicDefinition.properties, function(w) {
                    return w.name === "divisibility";
                });
                let divisibility = divisibilityProperties.length === 1 ? ~~(divisibilityProperties[0].value) : 0;

                let supply = mosaicDefinitionMetaDataPair.supply;
                let quantity = m.quantity;
                // Small business mosaic fee
                if (supply <= 10000 && divisibility === 0) {
                    fee = 1;
                } else {
                    let maxMosaicQuantity = 9000000000000000;
                    let totalMosaicQuantity = supply * Math.pow(10, divisibility)
                    supplyRelatedAdjustment = Math.floor(0.8 * Math.log(maxMosaicQuantity / totalMosaicQuantity));
                    let numNem = helpers.calcXemEquivalent(multiplier, quantity, supply, divisibility);
                    // Using Math.ceil below because xem equivalent returned is sometimes a bit lower than it should
                    // Ex: 150'000 of nem:xem gives 149999.99999999997
                    fee = helpers.calcMinFee(Math.ceil(numNem));
                }
                totalFee += Math.max(1, fee - supplyRelatedAdjustment);
            }
            return Math.max(1, totalFee);
        } else {
            let totalFee = 0;
            for (let i = 0; i < attachedMosaics.length; i++) {
                let m = attachedMosaics[i];
                let mosaicName = helpers.mosaicIdToName(m.mosaicId);
                if (!(mosaicName in mosaics)) {
                    return ['unknown mosaic divisibility', data];
                }
                let mosaicDefinitionMetaDataPair = mosaics[mosaicName];
                let divisibilityProperties = $.grep(mosaicDefinitionMetaDataPair.mosaicDefinition.properties, function(w) {
                    return w.name === "divisibility";
                });
                let divisibility = divisibilityProperties.length === 1 ? ~~(divisibilityProperties[0].value) : 0;

                let supply = mosaicDefinitionMetaDataPair.supply;
                let quantity = m.quantity;
                let numNem = helpers.calcXemEquivalent(multiplier, quantity, supply, divisibility);
                let fee = Math.ceil(Math.max(10 - numNem, 2, Math.floor(Math.atan(numNem / 150000.0) * 3 * 33)));

                totalFee += fee;
            }
            return (totalFee * 5) / 4;
        }
    }

    /**
     * _multisigWrapper() Wrap a transaction in otherTrans
     *
     * @param senderPublicKey: The sender public key
     * @param innerEntity: The transaction entity to wrap
     * @param due: The transaction deadline
     *
     * return entity: Multisignature transaction object
     */
    _multisigWrapper(senderPublicKey, innerEntity, due) {
        let timeStamp = helpers.createNEMTimeStamp();
        let version = this.CURRENT_NETWORK_VERSION(1);
        let data = this.CREATE_DATA(TransactionTypes.MultisigTransaction, senderPublicKey, timeStamp, due, version);
        let custom = {
            'fee': 6000000,
            'otherTrans': innerEntity
        };
        let entity = $.extend(data, custom);
        return entity;
    }

    /**
     * prepareTransfer() Prepare a transfer and create the object to serialize
     *
     * @param common: The password/privateKey object
     * @param tx: The transaction data
     * @param mosaicsMetaData: A mosaicDefinitionMetaDataPair object
     *
     * return entity: Transaction object ready for serialization
     */
    prepareTransfer(common, tx, mosaicsMetaData) {
        let kp = KeyPair.create(helpers.fixPrivateKey(common.privateKey));
        let actualSender = tx.isMultisig ? tx.multisigAccount.publicKey : kp.publicKey.toString();
        let recipientCompressedKey = tx.recipient.toString();
        let amount = Math.round(tx.amount * 1000000);
        let message = helpers.prepareMessage(common, tx);
        let due = this._Wallet.network === Network.data.Testnet.id ? 60 : 24 * 60;
        let mosaics = tx.mosaics;
        let mosaicsFee = null
        if (!tx.mosaics) {
            mosaicsFee = null;
        } else {
            mosaicsFee = this.calculateMosaicsFee(amount, mosaicsMetaData, mosaics);
        }
        let entity = this._constructTransfer(actualSender, recipientCompressedKey, amount, message, due, mosaics, mosaicsFee);
        if (tx.isMultisig) {
            entity = this._multisigWrapper(kp.publicKey.toString(), entity, due);
        }

        return entity;
    }

    /**
     * _constructTransfer() Create a transaction object
     *
     * @param senderPublicKey: The sender account public key
     * @param recipientCompressedKey: The recipient account public key
     * @param amount: Amount to send
     * @param message: Message to send
     * @param due: The deadline in minutes
     * @param mosaics: The mosaic objects to send in an array
     * @param mosaicFee: The fees for mosaics included in the transaction
     *
     * return entity: Transfer transaction object
     */
    _constructTransfer(senderPublicKey, recipientCompressedKey, amount, message, due, mosaics, mosaicsFee) {
        let timeStamp = helpers.createNEMTimeStamp();
        let version = mosaics ? this.CURRENT_NETWORK_VERSION(2) : this.CURRENT_NETWORK_VERSION(1);
        let data = this.CREATE_DATA(TransactionTypes.Transfer, senderPublicKey, timeStamp, due, version);
        let msgFee = this._Wallet.network === Network.data.Testnet.id && this._DataBridge.nisHeight >= 572500 && message.payload.length ? Math.max(1, Math.floor((message.payload.length / 32) + 1)) : message.payload.length ? Math.max(1, Math.floor(message.payload.length / 2 / 16)) * 2 : 0;
        let fee = mosaics ? mosaicsFee : this._Wallet.network === Network.data.Testnet.id && this._DataBridge.nisHeight >= 572500 ? helpers.calcMinFee(amount / 1000000) : Math.ceil(Math.max(10 - (amount / 1000000), 2, Math.floor(Math.atan((amount / 1000000) / 150000.0) * 3 * 33)));
        let totalFee = (msgFee + fee) * 1000000;
        let custom = {
            'recipient': recipientCompressedKey.toUpperCase().replace(/-/g, ''),
            'amount': amount,
            'fee': totalFee,
            'message': message,
            'mosaics': mosaics
        };
        let entity = $.extend(data, custom);
        return entity;
    }

    /**
     * _constructAggregate() Create an aggregate transaction object
     *
     * @param tx: The sender account public key
     * @param signatoryArray: The modification array of cosignatories
     *
     * return entity: Aggregate transaction object
     */
    _constructAggregate(tx, signatoryArray) {
        let timeStamp = helpers.createNEMTimeStamp();
        let version = this.CURRENT_NETWORK_VERSION(2);
        let due = this._Wallet.network === Network.data.Testnet.id ? 60 : 24 * 60;
        let data = this.CREATE_DATA(TransactionTypes.MultisigModification, tx.multisigPubKey, timeStamp, due, version);
        let totalFee = (10 + 6 * signatoryArray.length + 6) * 1000000;
        let custom = {
            'fee': totalFee,
            'modifications': [],
            'minCosignatories': {
                'relativeChange': tx.minCosigs
            }
        };
        for (let i = 0; i < signatoryArray.length; i++) {
            custom.modifications.push({
                "modificationType": 1,
                "cosignatoryAccount": signatoryArray[i].pubKey
            });
        }

        // Sort modification array by addresses
        if (custom.modifications.length > 1) {
            custom.modifications.sort((a, b) => {
                if (Address.toAddress(a.cosignatoryAccount, this._Wallet.network) < Address.toAddress(b.cosignatoryAccount, this._Wallet.network)) return -1;
                if (Address.toAddress(a.cosignatoryAccount, this._Wallet.network) > Address.toAddress(b.cosignatoryAccount, this._Wallet.network)) return 1;
                return 0;
            });
        }

        let entity = $.extend(data, custom);
        return entity;
    };

    /**
     * _constructAggregateModifications() Create a multisignature aggregate modification transaction object
     *
     * @param senderPublicKey: The sender account public key
     * @param multisigPublicKey: The multisignature account public key
     * @param signatoryArray: The modification array of cosignatories
     * @param minCosigs: The minimum number of cosignatories
     * @param network: The network id
     * @param due: The deadline in minutes
     *
     * return entity: Multisignature aggregate modification transaction object
     */
    _constructAggregateModifications(senderPublicKey, tx, signatoryArray) {
        let timeStamp = helpers.createNEMTimeStamp();
        let version;
        let custom;
        let totalFee;
        let due = this._Wallet.network === Network.data.Testnet.id ? 60 : 24 * 60;
        if (tx.minCosigs === null || tx.minCosigs === 0) {
            version = this.CURRENT_NETWORK_VERSION(1);
        } else {
            version = this.CURRENT_NETWORK_VERSION(2);
        }
        let data = this.CREATE_DATA(TransactionTypes.MultisigModification, tx.multisigPubKey, timeStamp, due, version);
        if (tx.minCosigs === null || tx.minCosigs === 0) {
            totalFee = (10 + 6 * signatoryArray.length) * 1000000;
            custom = {
                'fee': totalFee,
                'modifications': []
            };
        } else {
            totalFee = (10 + 6 * signatoryArray.length + 6) * 1000000;
            custom = {
                'fee': totalFee,
                'modifications': [],
                'minCosignatories': {
                    'relativeChange': tx.minCosigs
                }
            };
        }
        for (let i = 0; i < signatoryArray.length; i++) {
            custom.modifications.push({
                "modificationType": signatoryArray[i].type,
                "cosignatoryAccount": signatoryArray[i].pubKey
            });
        }

        // Sort modification array by types then by addresses
        if (custom.modifications.length > 1) {
            custom.modifications.sort((a, b) => {
                return a.modificationType - b.modificationType || Address.toAddress(a.cosignatoryAccount, this._Wallet.network).localeCompare(Address.toAddress(b.cosignatoryAccount, this._Wallet.network));
            });
        }

        let entity = $.extend(data, custom);
        entity = this._multisigWrapper(senderPublicKey, entity, due);
        return entity;
    };

    /**
     * prepareNamespace() Prepare a namespace provision transaction and create the object to serialize
     *
     * @param common: The password/privateKey object
     * @param tx: The transaction data
     *
     * return entity:  Namespace provision transaction object ready for serialization
     */
    prepareNamespace(common, tx) {
        let kp = KeyPair.create(helpers.fixPrivateKey(common.privateKey));
        let actualSender = tx.isMultisig ? tx.multisigAccount.publicKey : kp.publicKey.toString();
        let rentalFeeSink = tx.rentalFeeSink.toString();
        let rentalFee;
        if (this._Wallet.network === Network.data.Testnet.id && this._DataBridge.nisHeight >= 572500) {
            // Set fee depending if namespace or sub
            if (tx.namespaceParent) {
                rentalFee = 200 * 1000000;
            } else {
                rentalFee = 5000 * 1000000;
            }
        } else {
            // Set fee depending if namespace or sub
            if (tx.namespaceParent) {
                rentalFee = 5000 * 1000000;
            } else {
                rentalFee = 50000 * 1000000;
            }
        }
        let namespaceParent = tx.namespaceParent ? tx.namespaceParent.fqn : null;
        let namespaceName = tx.namespaceName.toString();
        let due = this._Wallet.network === Network.data.Testnet.id ? 60 : 24 * 60;
        let entity = this._constructNamespace(actualSender, rentalFeeSink, rentalFee, namespaceParent, namespaceName, due);
        if (tx.isMultisig) {
            entity = this._multisigWrapper(kp.publicKey.toString(), entity, due);
        }
        return entity;
    };

    /**
     * _constructNamespace() Create a namespace provision transaction object
     *
     * @param senderPublicKey: The sender account public key
     * @param rentalFeeSink: The rental sink account
     * @param rentalFee: The rental fee
     * @param namespaceParent: The parent namespace
     * @param namespaceName: The namespace name
     * @param due: The deadline in minutes
     *
     * return entity: Namespace provision transaction object
     */
    _constructNamespace(senderPublicKey, rentalFeeSink, rentalFee, namespaceParent, namespaceName, due) {
        let timeStamp = helpers.createNEMTimeStamp();
        let version = this.CURRENT_NETWORK_VERSION(1);
        let data = this.CREATE_DATA(TransactionTypes.ProvisionNamespace, senderPublicKey, timeStamp, due, version);
        let fee = this._Wallet.network === Network.data.Testnet.id && this._DataBridge.nisHeight >= 572500 ? 20 * 1000000 : 2 * 3 * 18 * 1000000;
        let custom = {
            'rentalFeeSink': rentalFeeSink.toUpperCase().replace(/-/g, ''),
            'rentalFee': rentalFee,
            'parent': namespaceParent,
            'newPart': namespaceName,
            'fee': fee
        };
        let entity = $.extend(data, custom);
        return entity;
    }

    /**
     * prepareMosaicDefinition() Prepare a mosaic definition transaction and create the object to serialize
     *
     * @param common: The password/privateKey object
     * @param tx: The transaction data
     *
     * return entity:  Mosaic definition transaction object ready for serialization
     */
    prepareMosaicDefinition(common, tx) {
        let kp = KeyPair.create(helpers.fixPrivateKey(common.privateKey));
        let actualSender = tx.isMultisig ? tx.multisigAccount.publicKey : kp.publicKey.toString();
        let rentalFeeSink = tx.mosaicFeeSink.toString();
        let rentalFee;
        if(this._Wallet.network === Network.data.Testnet.id && this._DataBridge.nisHeight >= 572500) {
            rentalFee = 500 * 1000000;
        } else {
            rentalFee = 50000 * 1000000;
        }
        let namespaceParent = tx.namespaceParent.fqn;
        let mosaicName = tx.mosaicName.toString();
        let mosaicDescription = tx.mosaicDescription.toString();
        let mosaicProperties = tx.properties;
        let levy = tx.levy.mosaic ? tx.levy : null;
        let due = this._Wallet.network === Network.data.Testnet.id ? 60 : 24 * 60;
        let entity = this._constructMosaicDefinition(actualSender, rentalFeeSink, rentalFee, namespaceParent, mosaicName, mosaicDescription, mosaicProperties, levy, due);
        if (tx.isMultisig) {
            entity = this._multisigWrapper(kp.publicKey.toString(), entity, due);
        }
        return entity;
    };

    /**
     * _constructMosaicDefinition() Create a mosaic definition transaction object
     *
     * @param senderPublicKey: The sender account public key
     * @param rentalFeeSink: The rental sink account
     * @param rentalFee: The rental fee
     * @param namespaceParent: The parent namespace
     * @param mosaicName: The mosaic name
     * @param mosaicDescription: The mosaic description
     * @param mosaicProperties: The mosaic properties object
     * @param levy: The levy object
     * @param due: The deadline in minutes
     *
     * return entity: Mosaic definition transaction object
     */
    _constructMosaicDefinition(senderPublicKey, rentalFeeSink, rentalFee, namespaceParent, mosaicName, mosaicDescription, mosaicProperties, levy, due) {
        let timeStamp = helpers.createNEMTimeStamp();
        let version = this.CURRENT_NETWORK_VERSION(1);
        let data = this.CREATE_DATA(TransactionTypes.MosaicDefinition, senderPublicKey, timeStamp, due, version);

        let fee = this._Wallet.network === Network.data.Testnet.id && this._DataBridge.nisHeight >= 572500 ? 20 * 1000000 : 2 * 3 * 18 * 1000000;
        let levyData = levy ? {
            'type': levy.feeType,
            'recipient': levy.address.toUpperCase().replace(/-/g, ''),
            'mosaicId': levy.mosaic,
            'fee': levy.fee,
        } : null;
        let custom = {
            'creationFeeSink': rentalFeeSink.replace(/-/g, ''),
            'creationFee': rentalFee,
            'mosaicDefinition': {
                'creator': senderPublicKey,
                'id': {
                    'namespaceId': namespaceParent,
                    'name': mosaicName,
                },
                'description': mosaicDescription,
                'properties': $.map(mosaicProperties, function(v, k) {
                    return {
                        'name': k,
                        'value': v.toString()
                    };
                }),
                'levy': levyData
            },
            'fee': fee
        };
        var entity = $.extend(data, custom);
        return entity;
    }

    /**
     * prepareMosaicSupply() Prepare a mosaic supply change transaction and create the object to serialize
     *
     * @param common: The password/privateKey object
     * @param tx: The transaction data
     *
     * return entity:  Mosaic supply change transaction object ready for serialization
     */
    prepareMosaicSupply(common, tx) {
        let kp = KeyPair.create(helpers.fixPrivateKey(common.privateKey));
        let actualSender = tx.isMultisig ? tx.multisigAccount.publicKey : kp.publicKey.toString();
        let due = this._Wallet.network === Network.data.Testnet.id ? 60 : 24 * 60;
        let entity = this._constructMosaicSupply(actualSender, tx.mosaic, tx.supplyType, tx.delta, due);
        if (tx.isMultisig) {
            entity = this._multisigWrapper(kp.publicKey.toString(), entity, due);
        }
        return entity;
    }

    /**
     * _constructMosaicSupply() Create a mosaic supply change transaction object
     *
     * @param senderPublicKey: The sender account public key
     * @param mosaicId: The mosaic id
     * @param supplyType: The type of change
     * @param delta: The amount involved in the change
     * @param due: The deadline in minutes
     *
     * return entity: Mosaic supply change transaction object
     */
    _constructMosaicSupply(senderPublicKey, mosaicId, supplyType, delta, due) {
        let timeStamp = helpers.createNEMTimeStamp();
        let version = this.CURRENT_NETWORK_VERSION(1);
        let data = this.CREATE_DATA(TransactionTypes.MosaicSupply, senderPublicKey, timeStamp, due, version);

        let fee = this._Wallet.network === Network.data.Testnet.id && this._DataBridge.nisHeight >= 572500 ? 20 * 1000000 : 2 * 3 * 18 * 1000000;
        let custom = {
            'mosaicId': mosaicId,
            'supplyType': supplyType,
            'delta': delta,
            'fee': fee
        };
        let entity = $.extend(data, custom);
        return entity;
    };

    /**
     * prepareImportanceTransfer() Prepare an importance transfer transaction and create the object to serialize
     *
     * @param common: The password/privateKey object
     * @param tx: The transaction data
     *
     * return entity:  Importance transfer transaction object ready for serialization
     */
    prepareImportanceTransfer(common, tx) {
        let kp = KeyPair.create(helpers.fixPrivateKey(common.privateKey));
        let actualSender = tx.isMultisig ? tx.multisigAccount.publicKey : kp.publicKey.toString();
        let due = this._Wallet.network === Network.data.Testnet.id ? 60 : 24 * 60;
        let entity = this._constructImportanceTransfer(actualSender, tx.remoteAccount, tx.mode, due);
        if (tx.isMultisig) {
            entity = this._multisigWrapper(kp.publicKey.toString(), entity, due);
        }
        return entity;
    }

    /**
     * _constructImportanceTransfer() Create an importance transfer transaction object
     *
     * @param senderPublicKey: The sender account public key
     * @param recipientKey: The remote account public key
     * @param mode: The selected mode
     * @param due: The deadline in minutes
     *
     * return entity: Importance transfer transaction object
     */
    _constructImportanceTransfer(senderPublicKey, recipientKey, mode, due) {
        let timeStamp = helpers.createNEMTimeStamp();
        let version = this.CURRENT_NETWORK_VERSION(1);
        let data = this.CREATE_DATA(TransactionTypes.ImportanceTransfer, senderPublicKey, timeStamp, due, version);
        let custom = {
            'remoteAccount': recipientKey,
            'mode': mode,
            'fee': 6000000
        };
        let entity = $.extend(data, custom);
        return entity;
    }

    /**
     * prepareApostilleTransfer() Prepare an apostille transfer and create the object to serialize
     *
     * @param common: The password/privateKey object
     * @param tx: The transaction data
     *
     * return entity: Transaction object ready for serialization
     */
    prepareApostilleTransfer(common, tx) {
        let kp = KeyPair.create(helpers.fixPrivateKey(common.privateKey));
        let actualSender = tx.isMultisig ? tx.multisigAccount.publicKey : kp.publicKey.toString();
        let recipientCompressedKey = tx.recipient.toString();
        let amount = parseInt(tx.amount * 1000000, 10);
        // Set the apostille file hash as hex message
        let message = {
            'type': 1,
            'payload': tx.message.toString()
        };
        let due = this._Wallet.network === Network.data.Testnet.id ? 60 : 24 * 60;
        let mosaics = null;
        let mosaicsFee = null
        let entity = this._constructTransfer(actualSender, recipientCompressedKey, amount, message, due, mosaics, mosaicsFee);
        if (tx.isMultisig) {
            entity = this._multisigWrapper(kp.publicKey.toString(), entity, due);
        }

        return entity;
    }

    /**
     * prepareSignature() Prepare a multisig signature transaction, create the object, serialize and broadcast
     *
     * @param common: The password/privateKey object
     * @param tx: The transaction data
     *
     * return an announce transaction promise
     */
    prepareSignature(tx, common) {
        let kp = KeyPair.create(helpers.fixPrivateKey(common.privateKey));
        let actualSender = kp.publicKey.toString();
        let otherAccount = tx.multisigAccountAddress.toString();
        let otherHash = tx.hash.toString();
        let due = this._Wallet.network === Network.data.Testnet.id ? 60 : 24 * 60;
        let entity = this._constructSignature(actualSender, otherAccount, otherHash, due);
        let result = Serialization.serializeTransaction(entity);
        let signature = kp.sign(result);
        let obj = {
            'data': convert.ua2hex(result),
            'signature': signature.toString()
        };
        return this._NetworkRequests.announceTransaction(helpers.getHostname(this._Wallet.node), obj);
    };

    /**
     * _constructSignature() Create a multisig signature transaction object
     *
     * @param senderPublicKey: The sender account public key
     * @param otherAccount: The multisig account address
     * @param otherHash: The inner transaction hash
     * @param due: The deadline in minutes
     *
     * return entity: Multisig signature transaction object
     */
    _constructSignature(senderPublicKey, otherAccount, otherHash, due) {
        let timeStamp = helpers.createNEMTimeStamp();
        let version = this.CURRENT_NETWORK_VERSION(1);
        let data = this.CREATE_DATA(TransactionTypes.MultisigSignature, senderPublicKey, timeStamp, due, version);
        let totalFee = (2 * 3) * 1000000;
        let custom = {
            'otherHash': {
                'data': otherHash
            },
            'otherAccount': otherAccount,
            'fee': totalFee,
        };
        let entity = $.extend(data, custom);
        return entity;
    }

    /**
     * serializeAndAnnounceTransaction() Serialize a transaction and broadcast it to the network
     *
     * @param entity: The prepared transaction object
     * @param common: The password/privateKey object
     *
     * return an announce transaction promise
     */
    serializeAndAnnounceTransaction(entity, common) {
        let kp = KeyPair.create(helpers.fixPrivateKey(common.privateKey));
        let result = Serialization.serializeTransaction(entity);
        let signature = kp.sign(result);
        let obj = {
            'data': convert.ua2hex(result),
            'signature': signature.toString()
        };
        return this._NetworkRequests.announceTransaction(helpers.getHostname(this._Wallet.node), obj);
    }

    /**
     * serializeAndAnnounceTransactionLoop() Serialize a transaction and broadcast it to the network (from a loop)
     *
     * @param entity: The prepared transaction object
     * @param common: The password/privateKey object
     * @param data: Any object
     * @param k: The position into the loop
     *
     * return an announce transaction promise with isolated data
     */
    serializeAndAnnounceTransactionLoop(entity, common, data, k) {
        let kp = KeyPair.create(helpers.fixPrivateKey(common.privateKey));
        let result = Serialization.serializeTransaction(entity);
        let signature = kp.sign(result);
        let obj = {
            'data': convert.ua2hex(result),
            'signature': signature.toString()
        };
        return this._NetworkRequests.announceTransactionLoop(helpers.getHostname(this._Wallet.node), obj, data, k);
    }

}