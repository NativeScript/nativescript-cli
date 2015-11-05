///<reference path=".d.ts"/>
"use strict";

// this call must be first to avoid requiring c++ dependencies
require("./common/verify-node-version").verifyNodeVersion(require("../package.json").engines.node);

require("./bootstrap");
import * as fiber from "fibers";
import Future = require("fibers/future");
import {installUncaughtExceptionListener} from "./common/errors";
installUncaughtExceptionListener(process.exit);

fiber(() => {
	let config: Config.IConfig = $injector.resolve("$config");
	let err: IErrors = $injector.resolve("$errors");
	err.printCallStack = config.DEBUG;

	let commandDispatcher: ICommandDispatcher = $injector.resolve("commandDispatcher");

	if (process.argv[2] === "completion") {
		commandDispatcher.completeCommand().wait();
	} else {
		commandDispatcher.dispatchCommand().wait();
	}

	$injector.dispose();
	Future.assertNoFutureLeftBehind();
}).run();
