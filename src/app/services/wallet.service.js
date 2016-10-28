import Network from '../utils/Network';
import helpers from '../utils/helpers';
import Nodes from '../utils/nodes';

export default class Wallet {
    constructor(AppConstants, $localStorage, Alert) {
        'ngInject';

        // Application constants
        this._AppConstants = AppConstants;
        // Local storage
        this._storage = $localStorage;
        // Alert service
        this._Alert = Alert;

        //Default Wallet properties
        this.current = undefined;
        this.currentAccount = undefined;
        this.algo = undefined
        this.network = AppConstants.defaultNetwork;
        this.node = undefined;
        this.searchNode = undefined;
        this.chainLink = undefined;
        this.ntyData = undefined;
    }

    /**
     * setWallet() Set a wallet as current
     *
     * @param wallet: The wallet object
     */
    setWallet(wallet) {
        if (!wallet) {
            this._Alert.noWalletToSet();
            return;
        }
        this.network = wallet.accounts[0].network;
        // Set needed nodes
        this.setDefaultNode();
        this.setUtilNodes();
        // Account used
        this.currentAccount = wallet.accounts[0];
        // Algo of the wallet
        this.algo = wallet.accounts[0].algo;
        this.current = wallet;
        return;
    }

    /**
     * setWalletAccount() Set another account of the wallet
     *
     * @param wallet: The wallet object
     * @param index: The index of account in wallet
     */
    setWalletAccount(wallet, index) {
        if (!wallet) {
            this._Alert.noWalletToSet();
            return;
        }
        if (index > Object.keys(wallet.accounts).length - 1) {
            this._Alert.invalidWalletIndex();
            return;
        }
        if (this.current === undefined) {
            this._Alert.noCurrentWallet();
            return;
        }
        this.network = wallet.accounts[0].network;
        // Set other needed nodes
        this.setUtilNodes();
        // Account used
        this.currentAccount = wallet.accounts[index];
        this.algo = wallet.accounts[0].algo;
        return;
    }

    /**
     * setUtilNodes() Set util nodes according to network
     */
    setUtilNodes() {
        if (this.network === Network.data.Testnet.id) {
            this.searchNode = Nodes.testnetSearchNodes[0];
            this.chainLink = Nodes.defaultTestnetExplorer;
        } else if (this.network === Network.data.Mainnet.id) {
            this.searchNode = Nodes.mainnetSearchNodes[0];
            this.chainLink = Nodes.defaultMainnetExplorer;
        } else {
            this.searchNode = Nodes.mijinSearchNodes[0];
            this.chainLink = Nodes.defaultMijinExplorer;
        }
    }

    /**
     * setDefaultnode() Check if nodes present in local storage or set default according to network
     */
    setDefaultNode() {
        if (this.network == Network.data.Mainnet.id) {
            if (this._storage.selectedMainnetNode) {
                this.node = this._storage.selectedMainnetNode;
            } else {
                this.node = Nodes.defaultMainnetNode;
            }
        } else if (this.network == Network.data.Testnet.id) {
            if (this._storage.selectedTestnetNode) {
                this.node = this._storage.selectedTestnetNode;
            } else {
                this.node = Nodes.defaultTestnetNode;
            }
        } else {
            if (this._storage.selectedMijinNode) {
                this.node = this._storage.selectedMijinNode;
            } else {
                this.node = Nodes.defaultMijinNode;
            }
        }
    }

    /**
     * setNtyData() Set nty data in service if exists in local storage
     */
    setNtyData() {
        if (this._storage.nty) {
            this.ntyData = this._storage.nty;
        }
    }

    /**
     * setNtyDataInLocalStorage() Set nty data into local storage and update in service
     *
     * @param data: The nty data
     */
    setNtyDataInLocalStorage(data) {
        this._storage.nty = data;
        this.ntyData = data;
    }

    /**
     * Reset Wallet service properties
     */
    reset() {
        this.current = undefined;
        this.currentAccount = undefined;
        this.algo = undefined
        this.network = this._AppConstants.defaultNetwork;
        this.node = undefined;
        this.searchNode = undefined;
        this.chainLink = undefined;
        this.ntyData = undefined;
    }

}