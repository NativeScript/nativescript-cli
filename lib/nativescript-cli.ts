///<reference path=".d.ts"/>

import Fiber = require("fibers");
import Future = require("fibers/future");
import path = require("path");

require("./bootstrap");
require("./options");

import errors = require("./common/errors");
errors.installUncaughtExceptionListener();

$injector.register("config", {});

var fiber = Fiber(() => {
	var commandDispatcher = $injector.resolve("commandDispatcher");
	commandDispatcher.setConfiguration({"CI_LOGGER": false});

	if (process.argv[2] === "completion") {
		commandDispatcher.completeCommand();
	} else {
		commandDispatcher.dispatchCommand({}).wait();
	}

	$injector.dispose();
	Future.assertNoFutureLeftBehind();
});
global.__main_fiber__ = fiber; // leak fiber to prevent it from being GC'd and thus corrupting V8
fiber.run();