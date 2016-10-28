// Default nodes
let defaultTestnetNode = 'http://bob.nem.ninja:7778';
let defaultMainnetNode = 'http://alice6.nem.ninja:7778';
let defaultMijinNode = '';

// Block explorers
let defaultMainnetExplorer = 'http://chain.nem.ninja';
let defaultTestnetExplorer = 'http://bob.nem.ninja:8765';
let defaultMijinExplorer = '';

// Search tx by hash nodes
let testnetSearchNodes = [
	{
	    'uri': 'http://bigalice2.nem.ninja:7890',
	    'location': 'America / New_York'
	},
	{
	    'uri': 'http://192.3.61.243:7890',
	    'location': 'America / Los_Angeles'
	},
	{
	    'uri': 'http://23.228.67.85:7890',
	    'location': 'America / Los_Angeles'
	}
];

let mainnetSearchNodes = [
	{
	    'uri': 'http://62.75.171.41:7890',
	    'location': 'Germany'
	}, {
	    'uri': 'http://104.251.212.131:7890',
	    'location': 'USA'
	}, {
	    'uri': 'http://45.124.65.125:7890',
	    'location': 'Hong Kong'
	}, {
	    'uri': 'http://185.53.131.101:7890',
	    'location': 'Netherlands'
	}, {
	    'uri': 'http://sz.nemchina.com:7890',
	    'location': 'China'
	}
];

let mijinSearchNodes = [
	{
	    'uri': '',
	    'location': ''
	}
];

// Testnet nodes
let testnetNodes = [
	{
	    uri: 'http://bob.nem.ninja:7778'
	}, {
	        uri: 'http://104.128.226.60:7778'
	}, {
	        uri: 'http://23.228.67.85:7778'
	}, {
	        uri: 'http://192.3.61.243:7778'
	}, {
	        uri: 'http://50.3.87.123:7778'
	}, {
	    uri: 'http://localhost:7778'
	}
];

// Mainnet nodes
let mainnetNodes = [
    {
        uri: 'http://62.75.171.41:7778'
    }, {
        uri: 'http://san.nem.ninja:7778'
    }, {
        uri: 'http://go.nem.ninja:7778'
    }, {
        uri: 'http://hachi.nem.ninja:7778'
    }, {
        uri: 'http://jusan.nem.ninja:7778'
    }, {
        uri: 'http://nijuichi.nem.ninja:7778'
    }, {
        uri: 'http://alice2.nem.ninja:7778'
    }, {
        uri: 'http://alice3.nem.ninja:7778'
    }, {
        uri: 'http://alice4.nem.ninja:7778'
    }, {
        uri: 'http://alice5.nem.ninja:7778'
    }, {
        uri: 'http://alice6.nem.ninja:7778'
    }, {
        uri: 'http://alice7.nem.ninja:7778'
    }, {
        uri: 'http://localhost:7778'
    }
];

// Mijin nodes
let mijinNodes = [
	{
	    uri: ''
	}
];

let apostilleAuditServer = 'http://185.117.22.58:4567/verify';

module.exports = {
    defaultTestnetNode,
    defaultMainnetNode,
    defaultMijinNode,
    defaultMainnetExplorer,
    defaultTestnetExplorer,
    defaultMijinExplorer,
    testnetSearchNodes,
    mainnetSearchNodes,
    mijinSearchNodes,
    testnetNodes,
    mainnetNodes,
    mijinNodes,
    apostilleAuditServer
}