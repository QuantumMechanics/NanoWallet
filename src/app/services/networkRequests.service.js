import Nodes from '../utils/nodes';

export default class NetworkRequests {
    constructor($http, AppConstants) {
        'ngInject';

        // $http service
        this._$http = $http;
        // Application constants
        this._AppConstants = AppConstants;

    }

    /**
     * getHeight() Get current height from network
     *
     * @param host: The host ip or domain
     *
     * return: current nis height
     */
    getHeight(host) {
        return this._$http({
            url: "http://" + host + ":" + this._AppConstants.defaultNisPort + "/chain/height",
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
      let obj = {'params':{'address':address}};
        return this._$http.get('http://' + host + ':' + this._AppConstants.defaultNisPort + '/account/get', obj)
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
        let obj = {'params':{'address':address}};
     return this._$http.get('http://' + host + ':' + this._AppConstants.defaultNisPort + '/account/harvests', obj)
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
      let obj = {'params':{'namespace':id}};
        return this._$http.get('http://' + host + ':' + this._AppConstants.defaultNisPort + '/namespace', obj)
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
        let obj = {'params':{'address':address, 'hash': txHash}};
     return this._$http.get('http://' + host + ':' + this._AppConstants.defaultNisPort + '/account/transfers/incoming', obj)
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
        let obj = {'params':{'address':address}};
     return this._$http.get('http://' + host + ':' + this._AppConstants.defaultNisPort + '/account/unconfirmedTransactions', obj)
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
        return this._$http.post('http://'+host+':7890/account/unlocked/info', "").then((res) => {
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
        let obj = {'value':privateKey};
        return this._$http.post('http://'+host+':7890/account/unlock', obj).then((res) => {
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
        let obj = {'value':privateKey};
        return this._$http.post('http://'+host+':7890/account/lock', obj).then((res) => {
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
        let obj = {'params':{'hash':txHash}};
     return this._$http.get('http://' + host + ':' + this._AppConstants.defaultNisPort + '/transaction/get', obj)
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
        return this._$http.get('http://' + host + ':' + this._AppConstants.defaultNisPort + '/heartbeat')
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
        let obj = {'params':{'address':account}};
        return this._$http.get('http://' + host + ':' + this._AppConstants.defaultNisPort + '//account/get/forwarded', obj)
        .then(
            (res) => {
                return res.data;
            }
        );
    }

}