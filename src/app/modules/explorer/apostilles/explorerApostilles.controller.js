import Network from '../../../utils/Network';
import Sinks from '../../../utils/sinks';
import helpers from '../../../utils/helpers';

class ExplorerApostillesCtrl {
    constructor(Wallet, $scope, NetworkRequests, Alert, $location, DataBridge) {
        'ngInject';

        // Wallet service
        this._Wallet = Wallet;
        // Network requests service
        this._NetworkRequests = NetworkRequests;
        // Alert service
        this._Alert = Alert;
        // DataBridge service
        this._DataBridge = DataBridge;
        // $location to redirect
        this._location = $location;

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
            return;
        }

        // Load nty Data if any
        this._Wallet.setNtyData();

        // Array to get sink data
        this.sinkData = [];
        // Get sink depending of ntwork
        this.sink = Sinks.sinks.apostille[this._Wallet.network].toUpperCase().replace(/-/g, '');

        // Get incoming transactions of the sink account
        this.getSinkTransactions();

        // User's apostilles pagination properties
        this.currentPage = 0;
        this.pageSize = 5;
        this.numberOfPages = function() {
            return Math.ceil(this._Wallet.ntyData !== undefined ? this._Wallet.ntyData.data.length / this.pageSize : 1 / this.pageSize);
        }

        // Public sink's apostilles pagination properties
        this.currentPageSink = 0;
        this.pageSizeSink = 5;
        this.numberOfPagesSink = function() {
            return Math.ceil(this.sinkData.length / this.pageSizeSink);
        }

    }

    /**
     * uploadNty() Trigger file uploading for nty
     */
    uploadNty() {
        document.getElementById("uploadNty").click();
    }

    /**
     * loadNty() Save nty in Wallet service and local storage
     */
    loadNty($fileContent) {
        this._Wallet.setNtyDataInLocalStorage(JSON.parse($fileContent));
        if (this._Wallet.ntyData !== undefined) {
            this._Alert.ntyFileSuccess();
        }
    }

    /**
     * getSinkTransactions() Get incoming transaction of the sink account
     */
    getSinkTransactions() {
        return this._NetworkRequests.getIncomingTxes(helpers.getHostname(this._Wallet.node), this.sink, "").then((data) => {
            this.sinkData = data.data;
            console.log(this.sinkData)
        }, 
        (err) => {
            this._Alert.errorFetchingIncomingTxes();
        });
    }

}

export default ExplorerApostillesCtrl;