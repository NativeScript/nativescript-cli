require("./bootstrap");

import * as shelljs from "shelljs";
shelljs.config.silent = true;
shelljs.config.fatal = true;
import { installUncaughtExceptionListener } from "./common/errors";
import { settlePromises } from "./common/helpers";
installUncaughtExceptionListener(process.exit.bind(process, ErrorCodes.UNCAUGHT));

const logger: ILogger = $injector.resolve("logger");
const originalProcessOn = process.on;

process.on = (event: string, listener: any): any => {
	if (event === "SIGINT") {
		logger.trace(new Error(`Trying to handle SIGINT event. CLI overrides this behavior and does not allow handling SIGINT as this causes issues with Ctrl + C in terminal`).stack);
	} else {
		return originalProcessOn.apply(process, [event, listener]);
	}
};

/* tslint:disable:no-floating-promises */
(async () => {
	console.time("-cli start");
	const config: Config.IConfig = $injector.resolve("$config");
	console.timeEnd("-cli start");
	console.time("-cli start 1");
	const err: IErrors = $injector.resolve("$errors");
	console.timeEnd("-cli start 1");
	console.time("-cli start 2");
	err.printCallStack = config.DEBUG;

	const $initializeService = $injector.resolve<IInitializeService>("initializeService");
	console.timeEnd("-cli start 2");
	console.time("-cli start 3");
	await $initializeService.initialize();
	console.timeEnd("-cli start 3");
	console.time("-cli start 4");

	const extensibilityService: IExtensibilityService = $injector.resolve("extensibilityService");
	console.timeEnd("-cli start 4");
	console.time("-cli start 5");
	try {
		await settlePromises<IExtensionData>(extensibilityService.loadExtensions());
		console.timeEnd("-cli start 5");
		console.time("-cli start 6");
	} catch (err) {
		logger.trace("Unable to load extensions. Error is: ", err);
	}

	const commandDispatcher: ICommandDispatcher = $injector.resolve("commandDispatcher");

	console.timeEnd("-cli start 6");
	console.time("-cli start 7");
	const messages: IMessagesService = $injector.resolve("$messagesService");
	console.timeEnd("-cli start 7");
	console.time("-cli start 8");
	messages.pathsToMessageJsonFiles = [/* Place client-specific json message file paths here */];

	if (process.argv[2] === "completion") {
		await commandDispatcher.completeCommand();
	} else {
		console.timeEnd("-cli start 8");
		console.time("-cli start 9");
		await commandDispatcher.dispatchCommand();
		console.timeEnd("-cli start 9");
	}

	$injector.dispose();
})();
/* tslint:enable:no-floating-promises */
