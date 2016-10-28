import helpers from '../utils/helpers';
import Address from '../utils/Address';

export default class DataBridge {
    constructor(AppConstants, Alert, NetworkRequests, Wallet, $timeout, $filter) {
        'ngInject';

        // Alert service
        this._Alert = Alert;
        // _$timeout to digest responses asynchronously
        this._$timeout = $timeout;
        // Application constants
        this._AppConstants = AppConstants;
        // Wallet service
        this._Wallet = Wallet;
        // NetworkRequests service
        this._NetworkRequests = NetworkRequests;
        // Filters
        this._$filter = $filter;

        // Default DataBridge properties
        this.nisHeight = 0;
        this.connectionStatus = false;
        this.accountData = undefined;
        this.transactions = [];
        this.unconfirmed = [];
        this.mosaicDefinitionMetaDataPair = {};
        this.mosaicDefinitionMetaDataPairSize = 0;
        this.mosaicOwned = {};
        this.mosaicOwnedSize = {};
        this.namespaceOwned = {};
        this.harvestedBlocks = [];
        this.connector = undefined;
        this.delegatedData = undefined;
        this.marketInfo = undefined;
    }

    /**
     * openConnection() Open websocket connection
     *
     * @param connector: A connector object instantiated with node and user address
     */
    openConnection(connector) {

        // Store the used connector to close it from anywhere easily
        this.connector = connector;

        // Connect
        connector.connect(() => {

            // Reset at new connection
            this.reset();

            /**
             * Network requests happen on socket connection
             */
            // Get current height
            this._NetworkRequests.getHeight(helpers.getHostname(this._Wallet.node)).then((height) => {
                    this._$timeout(() => {
                        this.nisHeight = height;
                    });
                },
                (err) => {
                    this._$timeout(() => {
                        this.nisHeight = this._$filter('translate')('GENERAL_ERROR');
                    });
                });

            // Get harvested blocks
            this._NetworkRequests.getHarvestedBlocks(helpers.getHostname(this._Wallet.node), this._Wallet.currentAccount.address).then((blocks) => {
                    this._$timeout(() => {
                        this.harvestedBlocks = blocks.data;
                    });
                },
                (err) => {
                    // Alert error
                    this._$timeout(() => {
                        this.harvestedBlocks = [];
                    });
                });

            // Get delegated data
            this._NetworkRequests.getAccountData(helpers.getHostname(this._Wallet.node), Address.toAddress(this._Wallet.currentAccount.child, this._Wallet.network)).then((data) => {
                    this._$timeout(() => {
                        this.delegatedData = data;
                    });
                },
                (err) => {
                    this._$timeout(() => {
                        this.delegatedData = "";
                        this._Alert.getAccountDataError(err.data.message);
                    });
                });

            // Get market info
            this._NetworkRequests.getMarketInfo().then((data) => {
                    this._$timeout(() => {
                        this.marketInfo = data;
                    });
                },
                (err) => {
                    this._$timeout(() => {
                        this._Alert.errorGetMarketInfo();
                        this.marketInfo = undefined;
                    });
                });
            ///////////// End network requests /////////////

            // Set connection status
            this._$timeout(() => {
                this.connectionStatus = true;
            })


            // Get account data
            connector.on('account', (d) => {
                this._$timeout(() => {
                    this.accountData = d;
                    // prepare callback for multisig accounts
                    for (let i = 0; i < this.accountData.meta.cosignatoryOf.length; i++) {
                        connector.onConfirmed(confirmedCallback, this.accountData.meta.cosignatoryOf[i].address);
                        connector.onUnconfirmed(unconfirmedCallback, this.accountData.meta.cosignatoryOf[i].address);
                        connector.onNamespace(namespaceCallback, this.accountData.meta.cosignatoryOf[i].address);
                        connector.onMosaicDefinition(mosaicDefinitionCallback, this.accountData.meta.cosignatoryOf[i].address);
                        connector.onMosaic(mosaicCallback, this.accountData.meta.cosignatoryOf[i].address);

                        connector.subscribeToMultisig(this.accountData.meta.cosignatoryOf[i].address);
                        connector.requestAccountNamespaces(this.accountData.meta.cosignatoryOf[i].address);
                        connector.requestAccountMosaicDefinitions(this.accountData.meta.cosignatoryOf[i].address);
                        connector.requestAccountMosaics(this.accountData.meta.cosignatoryOf[i].address);
                    }
                }, 0);
            });

            // Get recent transactions
            connector.on('recenttransactions', (d) => {
                d.data.reverse();
                this._$timeout(() => {
                    this.transactions = d.data;
                });
                console.log("recenttransactions data: ", d);
            }, 0);

            // On confirmed we push the tx in transactions array and delete the tx in unconfirmed if present
            //*** BUG: it is triggered twice.. NIS websocket issue ? ***//
            let confirmedCallback = (d) => {
                this._$timeout(() => {
                    if (!helpers.haveTx(d.meta.hash.data, this.transactions)) { // Fix duplicate bug
                        this.transactions.push(d);
                        console.log("Confirmed data: ", d);
                        // If tx present in unconfirmed array it is removed
                        if (helpers.haveTx(d.meta.hash.data, this.unconfirmed)) {
                            // Get index
                            let txIndex = helpers.getTransactionIndex(d.meta.hash.data, this.unconfirmed);
                            // Remove from array
                            this.unconfirmed.splice(txIndex, 1);
                        }
                    }
                }, 0);
            }

            // On unconfirmed we push the tx in unconfirmed transactions array
            //*** BUG: same as confirmedCallback ***//
            let unconfirmedCallback = (d) => {
                this._$timeout(() => {
                    if (!helpers.haveTx(d.meta.hash.data, this.unconfirmed)) { //Fix duplicate bug
                        this.unconfirmed.push(d);
                        // If not sender show notification
                        if (this._$filter('fmtPubToAddress')(d.transaction.signer, this._Wallet.network) !== this._Wallet.currentAccount.address) {
                            this._Alert.incomingTransaction(d.transaction.signer, this._Wallet.network);
                        }
                        console.log("Unconfirmed data: ", d);
                    }
                }, 0);
            }

            // On error we show it in an alert
            connector.on('errors', (name, d) => {
                console.log(d);
                this._Alert.websocketError(d.error + " " + d.message);
            });

            // On new blocks, update nis height
            connector.on('newblocks', (blockHeight) => {
                this._$timeout(() => {
                    this.nisHeight = blockHeight.height;
                }, 0);
            });

            // Get mosaic definition meta data pair
            let mosaicDefinitionCallback = (d) => {
                this._$timeout(() => {
                    this.mosaicDefinitionMetaDataPair[helpers.mosaicIdToName(d.mosaicDefinition.id)] = d;
                    this.mosaicDefinitionMetaDataPairSize = Object.keys(this.mosaicDefinitionMetaDataPair).length;
                }, 0);
            }

            // Get mosaics owned
            let mosaicCallback = (d, address) => {
                this._$timeout(() => {
                    let mosaicName = helpers.mosaicIdToName(d.mosaicId);
                    if (!(address in this.mosaicOwned)) {
                        this.mosaicOwned[address] = {};
                    }
                    this.mosaicOwned[address][mosaicName] = d;
                    this.mosaicOwnedSize[address] = Object.keys(this.mosaicOwned[address]).length;
                }, 0);
            }

            // Get namespaces owned
            let namespaceCallback = (d, address) => {
                this._$timeout(() => {
                    let namespaceName = d.fqn;
                    if (!(address in this.namespaceOwned)) {
                        this.namespaceOwned[address] = {};
                    }
                    this.namespaceOwned[address][namespaceName] = d;
                }, 0);
            }


            // Set websockets callbacks
            connector.onConfirmed(confirmedCallback);
            connector.onUnconfirmed(unconfirmedCallback);
            connector.onMosaic(mosaicCallback);
            connector.onMosaicDefinition(mosaicDefinitionCallback);
            connector.onNamespace(namespaceCallback);

            // Request data
            connector.requestAccountData();
            connector.requestAccountTransactions();
            connector.requestAccountMosaicDefinitions();
            connector.requestAccountMosaics();
            connector.requestAccountNamespaces();

        });

    }

    /**
     * Reset DataBridge service properties
     */
    reset() {
        this.nisHeight = 0;
        this.connectionStatus = false;
        this.accountData = undefined;
        this.transactions = [];
        this.unconfirmed = [];
        this.mosaicDefinitionMetaDataPair = {};
        this.mosaicDefinitionMetaDataPairSize = 0;
        this.mosaicOwned = {};
        this.mosaicOwnedSize = {};
        this.namespaceOwned = {};
        this.harvestedBlocks = [];
        this.delegatedData = undefined;
        this.marketInfo = undefined;
    }

}