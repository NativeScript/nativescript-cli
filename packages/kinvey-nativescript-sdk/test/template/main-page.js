var { tests, logServerPort } = require('./testConfig');
var runner = require('./testRunner.bundle');
externalConfig = require('./config.js');
utilities = require('./tests/utilities.js');
Constants = require('./tests/constants.js');
Kinvey = require('kinvey-nativescript-sdk').Kinvey;
runner.initialize(tests, { logServerPort });
runner.runAllTests();
