const AppConstants = {
    //Application name
    appName: 'Nano Wallet',

    version: 'BETA 1.1.12',

    //Network
    defaultNetwork: 104,

    // Ports
    defaultNisPort: 7890,
    defaultMijinPort: 7895,
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

};

export default AppConstants;