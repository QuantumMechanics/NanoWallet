const AppConstants = {
    //Application name
    appName: 'Nano Wallet',

    version: 'BETA 1.1.11',

    //Network
    defaultNetwork: 104,

    // Ports
    defaultNisPort: 7890,
    defaultWebsocketPort: 7778,

    // Activate/Deactivate mainnet
    mainnetDisabled: false,

    // Activate/Deactivate mijin
    mijinDisabled: true,

    // Available languages
    languages: [{
        name: "English",
        key: "en"
    }, {
        name: "Chinese",
        key: "cn"
    }/*, {
        name: "Français",
        key: "fr"
    }*/],

    // Transaction types
    TransactionType: {
        Transfer: 0x101, // 257
        ImportanceTransfer: 0x801, // 2049
        MultisigModification: 0x1001, // 4097
        MultisigSignature: 0x1002, // 4098
        MultisigTransaction: 0x1004, // 4100
        ProvisionNamespace: 0x2001, // 8193
        MosaicDefinition: 0x4001, // 16385
        MosaicSupply: 0x4002, // 16386
    }

};

export default AppConstants;