let createNotaryData = function(filename, tags, fileHash, txHash, txMultisigHash, owner, fromMultisig, dedicatedAccount, dedicatedPrivateKey) {
        let d = new Date();
        return { 
            "data": [{
                "filename": filename,
                "tags": tags,
                "fileHash": fileHash,
                "owner": owner,
                "fromMultisig": fromMultisig,
                "dedicatedAccount": dedicatedAccount,
                "dedicatedPrivateKey": dedicatedPrivateKey,
                "txHash": txHash,
                "txMultisigHash": txMultisigHash,
                "timeStamp": d.toUTCString()
            }]
        };
}

let updateNotaryData = function(ntyData, newNtyData) {
        ntyData.data.push(newNtyData.data[0]);
        return ntyData;
}

module.exports = {
    createNotaryData,
    updateNotaryData
}