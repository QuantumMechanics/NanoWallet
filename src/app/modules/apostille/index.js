import angular from 'angular';

// Create the module where our functionality can attach to
let createApostilleModule = angular.module('app.createApostille', []);

// Include our UI-Router config settings
import CreateApostilleConfig from './create/createApostille.config';
createApostilleModule.config(CreateApostilleConfig);

// Controllers
import CreateApostilleCtrl from './create/createApostille.controller';
createApostilleModule.controller('CreateApostilleCtrl', CreateApostilleCtrl);

// Create the module where our functionality can attach to
let auditApostilleModule = angular.module('app.auditApostille', []);

// Include our UI-Router config settings
import AuditApostilleConfig from './audit/auditApostille.config';
auditApostilleModule.config(AuditApostilleConfig);

// Controllers
import AuditApostilleCtrl from './audit/auditApostille.controller';
auditApostilleModule.controller('AuditApostilleCtrl', AuditApostilleCtrl);

export default createApostilleModule;
