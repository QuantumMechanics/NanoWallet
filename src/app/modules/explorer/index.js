import angular from 'angular';

// Create the module where our functionality can attach to
let explorerHomeModule = angular.module('app.explorerHome', []);

// Include our UI-Router config settings
import ExplorerHomeConfig from './home/explorerHome.config';
explorerHomeModule.config(ExplorerHomeConfig);

// Controllers
import ExplorerHomeCtrl from './home/explorerHome.controller';
explorerHomeModule.controller('ExplorerHomeCtrl', ExplorerHomeCtrl);

// Create the module where our functionality can attach to
let explorerApostillesModule = angular.module('app.explorerApostilles', []);

// Include our UI-Router config settings
import ExplorerApostillesConfig from './apostilles/explorerApostilles.config';
explorerApostillesModule.config(ExplorerApostillesConfig);

// Controllers
import ExplorerApostillesCtrl from './apostilles/explorerApostilles.controller';
explorerApostillesModule.controller('ExplorerApostillesCtrl', ExplorerApostillesCtrl);

export default explorerHomeModule;
