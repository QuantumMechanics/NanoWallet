import Nodes from '../utils/nodes';
import Network from '../utils/Network';

export default class NetworkRequests {
    constructor($http, AppConstants, Wallet) {
        'ngInject';

        // $http service
        this._$http = $http;
        // Application constants
        this._AppConstants = AppConstants;
        // Wallet service
        this._Wallet = Wallet;
    }

    /**
     * getPort() Get port from network
     */
    getPort() {
        return this._Wallet.network === Network.data.Mijin.id ? this._AppConstants.defaultMijinPort : this._AppConstants.defaultNisPort;
    }

    /**
     * getHeight() Get current height from network
     *
     * @param host: The host ip or domain
     *
     * return: current nis height
     */
    getHeight(host) {
        let port = this.getPort();
        return this._$http({
            url: "http://" + host + ":" + port + "/chain/height",
            method: 'GET'
        }).then(
            (res) => {
                return res.data.height;
            }
        );
    }

    /**
     * getAccountData() Get account info object from network
     *
     * @param host: The host ip or domain
     * @param address: The address
     *
     * return: AccountMetaDataPair
     */
    getAccountData(host, address) {
    let port = this.getPort();
      let obj = {'params':{'address':address}};
        return this._$http.get('http://' + host + ':' + port + '/account/get', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * getHarvestedBlocks() Get harvested block for account
     *
     * @param host: The host ip or domain
     * @param address: The address
     *
     * return:  array of harvest info objects
     */
    getHarvestedBlocks(host, address){
        let port = this.getPort();
        let obj = {'params':{'address':address}};
     return this._$http.get('http://' + host + ':' + port + '/account/harvests', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * getNamespacesById() Get namespace info by it's id
     *
     * @param host: The host ip or domain
     * @param id: The namespace id
     *
     * return: namespace info object
     */
    getNamespacesById(host, id) {
        let port = this.getPort();
        let obj = {'params':{'namespace':id}};
        return this._$http.get('http://' + host + ':' + port + '/namespace', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * getIncomingTxes() Get incoming txes for an account
     *
     * @param host: The host ip or domain
     * @param address: The account address
     * @param txHash: The starting hash for search (optional)
     *
     * return:  array of incoming txes
     */
    getIncomingTxes(host, address, txHash){
        let port = this.getPort();
        let obj = {'params':{'address':address, 'hash': txHash}};
     return this._$http.get('http://' + host + ':' + port + '/account/transfers/incoming', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

     /**
     * getUncomingTxes() Get unconfirmed txes for an account
     *
     * @param host: The host ip or domain
     * @param address: The address
     *
     * return:  array of unconfirmed txes
     */
    getUnconfirmedTxes(host, address){
        let port = this.getPort();
        let obj = {'params':{'address':address}};
     return this._$http.get('http://' + host + ':' + port + '/account/unconfirmedTransactions', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * auditApostille() Audit an apostille file
     *
     * @param publicKey: The signer public key
     * @param data: The file data of audited file
     * @param signedData: The signed data into the apostille tx message
     *
     * return boolean: true if valid, false otherwise
     */
    auditApostille(publicKey, data, signedData) {

            let obj = {
                'publicKey': publicKey,
                'data': data,
                'signedData': signedData
            };

            let req = {
             method: 'POST',
             url: Nodes.apostilleAuditServer,
             headers: {
               'Content-Type': 'application/x-www-form-urlencoded;'
             },
             params: obj
            }

            return this._$http(req)
            .then((res)  => {
               return res.data;
            });
        }

    /**
     * getUnlockedInfo() Get information about the maximum number of allowed harvesters and how many harvesters are already using the node
     *
     * @param host: The host ip or domain
     *
     * return object with num-unlocked and max-unlocked
     */
    getUnlockedInfo(host) {
        let port = this.getPort();
        return this._$http.post('http://'+host+':' + port + '/account/unlocked/info', "").then((res) => {
            return res.data;
        });
    };

    /**
     * unlockAccount() Start delegated harvesting on chosen node
     *
     * @param host: The host ip or domain
     * @param privateKey: The delegated account private key
     *
     * return $http response
     */
    unlockAccount(host, privateKey){
        let port = this.getPort();
        let obj = {'value':privateKey};
        return this._$http.post('http://'+host+':' + port + '/account/unlock', obj).then((res) => {
            return res;
        });
    };

     /**
     * lockAccount() Stop delegated harvesting on chosen node
     *
     * @param host: The host ip or domain
     * @param privateKey: The delegated account private key
     *
     * return $http response
     */
    lockAccount(host, privateKey){
        let port = this.getPort();
        let obj = {'value':privateKey};
        return this._$http.post('http://'+host+':' + port + '/account/lock', obj).then((res) => {
            return res;
        });
    };

    /**
     * getSupernodes() Get nodes of the node reward program
     *
     * return array of nodes
     */
    getSupernodes(){
        return this._$http.get('http://supernodes.nem.io/nodes').then((res) => {
            return res;
        });
    };

    /**
     * getMarketInfo() Get market information from CoinMarketCap api
     *
     * return market info array
     */
    getMarketInfo(){
        return this._$http.get('https://api.coinmarketcap.com/v1/ticker/nem/').then((res) => {
            return res.data[0];
        });
    };

    /**
     * getTxByHash() Get a transaction from the chain by it's hash
     *
     * @param host: The host ip or domain
     * @param txHash: The transaction hash
     *
     * return:  array of harvest info objects
     */
    getTxByHash(host, txHash){
        let port = this.getPort();
        let obj = {'params':{'hash':txHash}};
     return this._$http.get('http://' + host + ':' + port + '/transaction/get', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * heartbeat() Get heartbeat of a node
     *
     * @param host: The host ip or domain
     *
     * return:  heartbeat response object
     */
    heartbeat(host) {
        let port = this.getPort();
        return this._$http.get('http://' + host + ':' + port + '/heartbeat')
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * getForwarded() Gets the AccountMetaDataPair for the account for which the given account is the delegate account
     *
     * @param host: The host ip or domain
     * @param account: The account address
     *
     * return:  AccountMetaDataPair
     */
    getForwarded(host, account) {
        let port = this.getPort();
        let obj = {'params':{'address':account}};
        return this._$http.get('http://' + host + ':' + port + '/account/get/forwarded', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

    /**
     * announceTransaction() Broadcast a transaction to the NEM network
     *
     * @param host: The host ip or domain
     * @param obj: A RequestAnnounce object
     *
     * return: NemAnnounceResult object
     */
    announceTransaction(host, obj) {
        let port = this.getPort();
        return this._$http.post('http://' + host + ':' + port + '/transaction/announce', obj)
        .then(
            (res) => {
                return res;
            }
        );
    }

    /**
     * announceTransactionLoop() Broadcast a transaction to the NEM network and return isolated data
     *
     * @param host: The host ip or domain
     * @param obj: A RequestAnnounce object
     * @param data: Any object
     * @param k: The position into the loop
     *
     * return: NemAnnounceResult object with loop data and k to isolate them into the callback.
     */
    announceTransactionLoop(host, obj, data, k) {
        let port = this.getPort();
        return this._$http.post('http://' + host + ':' + port + '/transaction/announce', obj)
        .then(
            (res) => {
                return {
                    'res': res,
                    'tx': data,
                    'k': k
                };
            }
        );
    }

}