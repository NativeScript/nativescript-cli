let node = require("../package.json").engines.node;
// this call must be first to avoid requiring c++ dependencies
require("./common/verify-node-version").verifyNodeVersion(node, "NativeScript", "2.2.0");

require("./bootstrap");
import * as fiber from "fibers";
import Future = require("fibers/future");
import * as shelljs from "shelljs";
shelljs.config.silent = true;
import {installUncaughtExceptionListener} from "./common/errors";
installUncaughtExceptionListener(process.exit);

fiber(() => {
	let config: Config.IConfig = $injector.resolve("$config");
	let err: IErrors = $injector.resolve("$errors");
	err.printCallStack = config.DEBUG;

	let commandDispatcher: ICommandDispatcher = $injector.resolve("commandDispatcher");

	let messages: IMessagesService = $injector.resolve("$messagesService");
	messages.pathsToMessageJsonFiles = [/* Place client-specific json message file paths here */];

	if (process.argv[2] === "completion") {
		commandDispatcher.completeCommand().wait();
	} else {
		commandDispatcher.dispatchCommand().wait();
	}

	$injector.dispose();
	Future.assertNoFutureLeftBehind();
}).run();
