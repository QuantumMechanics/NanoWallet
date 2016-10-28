import Address from '../../../utils/Address';
import helpers from '../../../utils/helpers';
import CryptoHelpers from '../../../utils/CryptoHelpers';

class CreateMultisigCtrl {
    constructor(Wallet, NetworkRequests, Alert, Transactions, $location) {
        'ngInject';

        // Wallet service
        this._Wallet = Wallet;
        // Network requests service
        this._NetworkRequests = NetworkRequests;
        // Alert service
        this._Alert = Alert;
        // Transactions service
        this._Transactions = Transactions;
        // $location to redirect
        this._location = $location;

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
            return;
        }

        /**
         * Default create multisig properties
         */
        this.haveMoreThanOneAccount = false;
        this.cosignatoryArray = [];
        this.formData = {};
        // Default cosignatory to add is the current account address
        this.formData.cosignatoryToAdd = this._Wallet.currentAccount.address;
        this.formData.accountToConvert = '';
        this.cosignatoryPubKey = '';
        this.multisigPubKey = '';
        this.formData.fee = 0;
        // Alias address empty by default
        this.aliasAddress = '';
        // Not showing alias address input by default
        this.showAlias = false;
        // No address stored by default, we will store the cleaned one after input or after getting alias from network
        this.formData.cosignatoryAddress = '';
        // Multisig account has no public key by default
        this.selectedWalletAccount = '';

        this.formData.minCosigs = 1;
        this.useCustomAccount = true;

        // Needed to prevent user to click twice on send when already processing
        this.okPressed = false;

        // Store info about the multisig account to show balance
        this.multisigInfoData = {};

        // If more than one account in wallet we show a select element in view
        if (Object.keys(this._Wallet.current.accounts).length > 1) {
            this.haveMoreThanOneAccount = true;
            this.useCustomAccount = false;
        }

        // Modifications list pagination properties
        this.currentPage = 0;
        this.pageSize = 5;
        this.numberOfPages = function() {
            return Math.ceil(this.cosignatoryArray.length / this.pageSize);
        }

        // Get data of default cosignatory account
        this.processCosignatoryToAdd();

        // Init fees
        this.updateFee();

    }

    /**
     * processCosignatoryToAdd() Set right address and get data of cosignatory to add
     */
    processCosignatoryToAdd() {
        // Check if value is an alias
        let isAlias = (this.formData.cosignatoryToAdd.lastIndexOf("@", 0) === 0);
        // Reset cosignatory data
        this.resetCosignatoryData();

        // return if no value or lenth < to min address length AND not an alias
        if (!this.formData.cosignatoryToAdd || this.formData.cosignatoryToAdd.length < 40 && !isAlias) {
            return;
        }

        // Get recipient data depending of address or alias used
        if (isAlias) {
            // Clean namespace name
            let nsForLookup = this.formData.cosignatoryToAdd.substring(1);
            // Get cosignatory account data from network using @alias
            this.getCosignatoryDataFromAlias(nsForLookup);
        } else { // Normal address used
            // Clean provided address
            let cosignatoryAddress = this.formData.cosignatoryToAdd.toUpperCase().replace(/-/g, '');
            // Check if address is from network
            if (Address.isFromNetwork(cosignatoryAddress, this._Wallet.network)) {
                // Get account data from network
                this.getCosignatoryData(cosignatoryAddress);
            } else {
                // Unexpected error, this alert will not dismiss on timeout
                this._Alert.invalidAddressForNetwork(cosignatoryAddress, this._Wallet.network);
                // Reset cosignatory data
                this.resetCosignatoryData();
                return;
            }
        }
    }

    /**
     * processAccountToConvert() Set right address and get data of account to convert
     */
    processAccountToConvert() {
        if (!this.formData.accountToConvert) {
            // Reset multisig data and properties
            this.resetMultisigData();
            return;
        }
        let address;
        // Set address depending if custom or not
        if (this.useCustomAccount) {
            address = this.formData.accountToConvert.toUpperCase().replace(/-/g, '');
        } else {
            address = this.formData.accountToConvert.address;
            this.selectedWalletAccount = this.formData.accountToConvert;
        }
        // Clean the array of modifications
        this.cosignatoryArray = [];

        this.updateFee();

        // Get data of account to convert from network
        this.getMultisigData(address);
    }

    /**
     * getMultisigData() Get data of account to convert from network
     * 
     * @param address: The account address
     */
    getMultisigData(address) {
        return this._NetworkRequests.getAccountData(helpers.getHostname(this._Wallet.node), address).then((data) => {
            if (data.meta.cosignatoryOf.length > 0) {
                // Alert
                this._Alert.cosignatoryCannotBeMultisig();
                // Reset multisig data and properties
                this.resetMultisigData();
                return;
            } else if (data.meta.cosignatories.length > 0) {
                // Alert
                this._Alert.alreadyMultisig();
                // Reset multisig data and properties
                this.resetMultisigData();
                return;
            }
            // Store data
            this.multisigInfoData = data;
            // Store multisig public key
            this.formData.multisigPubKey = data.account.publicKey;
            // It is needed to get the account public key
            // If empty we prevent user to send and show an alert
            if (!this.formData.multisigPubKey) {
                // Alert
                this._Alert.multisighasNoPubKey();
                // Reset multisig data and properties
                this.resetMultisigData();
            }
        },
        (err) => {
            this._Alert.getAccountDataError(err.data.message);
            // Reset recipient data
            this.resetMultisigData();
            return;
        });
    }

    /**
     * getCosignatoryData() Get cosignatory data from network
     * 
     * @param address: The account address
     */
    getCosignatoryData(address) {
        return this._NetworkRequests.getAccountData(helpers.getHostname(this._Wallet.node), address).then((data) => {
            if (data.meta.cosignatories.length > 0) {
                // Alert
                this._Alert.multisigCannotBeCosignatory();
                // Reset cosignatory data
                this.resetCosignatoryData();
                return;
            }
            // Store cosignatory public key
            this.formData.cosignatoryPubKey = data.account.publicKey;
            // Store cosignatory address
            this.formData.cosignatoryAddress = address;
            // It is needed to get the account public key
            // If empty we prevent user from adding to the array and show an alert
            if (!this.formData.cosignatoryPubKey) {
                // Alert
                this._Alert.cosignatoryhasNoPubKey();
                // Reset cosignatory data
                this.resetCosignatoryData();
            }
        },
        (err) => {
            this._Alert.getAccountDataError(err.data.message);
            // Reset recipient data
            this.resetCosignatoryData();
            return;
        });
    }

    /**
     * getCosignatoryDataFromAlias() Get cosignatory account data from network using @alias
     * 
     * @param alias: The recipient alias (namespace)
     */
    getCosignatoryDataFromAlias(alias) {
        return this._NetworkRequests.getNamespacesById(helpers.getHostname(this._Wallet.node), alias).then((data) => {
            // Set the alias address
            this.aliasAddress = data.owner;
            // Show the read-only input containing alias address
            this.showAlias = true;
            // Check if address is from network
            if (Address.isFromNetwork(this.aliasAddress, this._Wallet.network)) {
                // Get recipient account data from network
                this.getCosignatoryData(this.aliasAddress);
            } else {
                // Unexpected error, this alert will not dismiss on timeout
                this._Alert.invalidAddressForNetwork(this.aliasAddress, this._Wallet.network);
                // Reset recipient data
                this.resetCosignatoryData();
                return;
            }
        },
        (err) => {
            this._Alert.getNamespacesByIdError(err.data.message);
            // Reset recipient data
            this.resetCosignatoryData();
            return;
        });
    }

    /**
     * updateFee() Update transaction fee
     */
    updateFee() {
        let entity = this._Transactions._constructAggregate(this.formData, this.cosignatoryArray);
        this.formData.fee = entity.fee;
    }

    /**
     * resetCosignatoryData() Reset data stored and properties for cosignatory
     */
    resetCosignatoryData() {
        // Reset public key data
        this.formData.cosignatoryPubKey = '';
        // Hide alias address input field
        this.showAlias = false;
        // Reset the address stored
        this.formData.cosignatoryAddress = '';
    }

    /**
     * resetMultisigData() Reset data stored and properties for multisig account
     */
    resetMultisigData() {
        // Reset public key data
        this.formData.multisigPubKey = '';
        // Reset multisig data stored
        this.multisigInfoData = {};
    }

    /**
     * removeCosignFromList() Remove a cosignatory from the modifications list
     */
    removeCosignFromList(array, elem) {
        // If the deleted element is the elem 0 and length of array mod 5 gives 0 (means it is the last object of the page), 
        // we return a page behind unless it is page 1.
        if (array.indexOf(elem) === 0 && this.currentPage + 1 > 1 && (array.length - 1) % 5 === 0) {
            this.currentPage = this.currentPage - 1;
        }
        array.splice(array.indexOf(elem), 1);
        // Update the fee
        this.updateFee();
    }

    /**
     * addCosig() Add cosignatory to array
     */
    addCosig() {
        if (helpers.haveCosig(this.formData.cosignatoryAddress, this.formData.cosignatoryPubKey, this.cosignatoryArray)) {
            // Alert
            this._Alert.cosignatoryAlreadyPresentInList();
        } else {
            this.cosignatoryArray.push({
                address: this.formData.cosignatoryAddress,
                pubKey: this.formData.cosignatoryPubKey
            });
            this.updateFee();
        }
    }

    /**
     * send() Build and broadcast the transaction to the network
     */
    send() {
        // Disable send button;
        this.okPressed = true;

        // If user use a custom account, private key is already in common no need to decrypt 
        if (!this.useCustomAccount) {
            // Decrypt/generate private key and check it. Returned private key is contained into this.common
            if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this.selectedWalletAccount, this._Wallet.algo, true)) {
                this._Alert.invalidPassword();
                // Enable send button
                this.okPressed = false;
                return;
            } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this.selectedWalletAccount.address)) {
                this._Alert.invalidPassword();
                // Enable send button
                this.okPressed = false;
                return;
            }
        }

        // Build the entity to serialize
        let entity = this._Transactions._constructAggregate(this.formData, this.cosignatoryArray);
        // Construct transaction byte array, sign and broadcast it to the network
        return this._Transactions.serializeAndAnnounceTransaction(entity, this.common).then((res) => {
                // Check status
                if (res.status === 200) {
                    // If code >= 2, it's an error
                    if (res.data.code >= 2) {
                        this._Alert.transactionError(res.data.message);
                    } else {
                        this._Alert.transactionSuccess();
                    }
                }
                // Enable send button
                this.okPressed = false;
                // Delete private key in common
                this.common.privateKey = '';
            },
            (err) => {
                // Delete private key in common
                this.common.privateKey = '';
                // Enable send button
                this.okPressed = false;
                this._Alert.transactionError('Failed ' + err.data.error + " " + err.data.message);
            });
    }

}

export default CreateMultisigCtrl;