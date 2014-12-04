///<reference path=".d.ts"/>
"use strict";
import path = require("path");

require("./bootstrap");
require("./options");

import errors = require("./common/errors");
errors.installUncaughtExceptionListener();

$injector.register("config", {
	CI_LOGGER: false,
	DEBUG: process.env.NATIVESCRIPT_DEBUG,
	TYPESCRIPT_COMPILER_OPTIONS: { }
});

var dispatcher = $injector.resolve("dispatcher");
dispatcher.runMainFiber();

