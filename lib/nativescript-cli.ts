///<reference path=".d.ts"/>
"use strict";
import path = require("path");
require("./bootstrap");

import fiber = require("fibers");
import Future = require("fibers/future");
import errors = require("./common/errors");
errors.installUncaughtExceptionListener();

fiber(() => {
	var config = <Config.IConfig>$injector.resolve("$config");
	var err = <IErrors>$injector.resolve("$errors");
	err.printCallStack = config.DEBUG;

	var commandDispatcher: ICommandDispatcher = $injector.resolve("commandDispatcher");

	if (process.argv[2] === "completion") {
		commandDispatcher.completeCommand().wait();
	} else {
		commandDispatcher.dispatchCommand().wait();
	}

	$injector.dispose();
	Future.assertNoFutureLeftBehind();
}).run();
