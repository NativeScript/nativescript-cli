///<reference path=".d.ts"/>
"use strict";

import path = require("path");

require("./common/extensions");
require("./bootstrap");
require("./options");

import errors = require("./common/errors");
errors.installUncaughtExceptionListener();

$injector.register("config", {"CI_LOGGER": false, PROJECT_FILE_NAME: ".tnsproject", "DEBUG": process.env.NATIVESCRIPT_DEBUG});

var dispatcher = $injector.resolve("dispatcher");
dispatcher.runMainFiber();