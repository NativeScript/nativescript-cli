const { tests, logServerPort } = require('./testConfig');
const runner = require('./testRunner.bundle');
externalConfig = require('./config.js');
utilities = require('./tests/utilities.js');
Constants = require('./tests/constants.js');
const { Kinvey } = require('kinvey-nativescript-sdk');
global.Kinvey = Kinvey;
runner.initialize(tests, { logServerPort });
runner.runAllTests();
