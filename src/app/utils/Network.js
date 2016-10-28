const data = {
    "Mainnet": {
        "id": 104,
        "prefix": "68",
        "char": "N"
    },
    "Testnet": {
        "id": -104,
        "prefix": "98",
        "char": "T"
    },
    "Mijin": {
        "id": 96,
        "prefix": "60",
        "char": "M"
    }

}

let id2Prefix = function(id) {
    if (id === 104) {
        return "68";
    } else if (id === -104) {
        return "98";
    } else {
        return "60";
    }
}

let id2Char = function(id) {
    if (id === 104) {
        return "N";
    } else if (id === -104) {
        return "T";
    } else {
        return "M";
    }
}

let char2Id = function(startChar) {
    if (startChar === "N") {
        return 104;
    } else if (startChar === "T") {
        return -104;
    } else {
        return 96;
    }
}

module.exports = {
    data,
    id2Prefix,
    id2Char,
    char2Id
}