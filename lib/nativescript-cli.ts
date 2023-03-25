require("./bootstrap");

import * as shelljs from "shelljs";
shelljs.config.silent = true;
shelljs.config.fatal = true;
import { installUncaughtExceptionListener } from "./common/errors";
import { settlePromises } from "./common/helpers";
import { injector } from "./common/yok";
import {
	ErrorCodes,
	IErrors,
	ICommandDispatcher,
	IMessagesService,
} from "./common/declarations";
import {
	IExtensibilityService,
	IExtensionData,
} from "./common/definitions/extensibility";
import { IInitializeService } from "./definitions/initialize-service";
installUncaughtExceptionListener(
	process.exit.bind(process, ErrorCodes.UNCAUGHT)
);

const logger: ILogger = injector.resolve("logger");
const originalProcessOn = process.on;

process.on = (event: string, listener: any): any => {
	if (event === "SIGINT") {
		logger.trace(
			`Trying to handle SIGINT event. CLI overrides this behavior and does not allow handling SIGINT as this causes issues with Ctrl + C in terminal.`
		);
		const msg = "The stackTrace of the location trying to handle SIGINT is:";
		const stackTrace = new Error(msg).stack || "";
		logger.trace(stackTrace.replace(`Error: ${msg}`, msg));
	} else {
		return originalProcessOn.apply(process, [event, listener]);
	}
};

/* tslint:disable:no-floating-promises */
(async () => {
	const config: Config.IConfig = injector.resolve("$config");
	const err: IErrors = injector.resolve("$errors");
	err.printCallStack = config.DEBUG;

	const $initializeService = injector.resolve<IInitializeService>(
		"initializeService"
	);
	await $initializeService.initialize();

	const extensibilityService: IExtensibilityService = injector.resolve(
		"extensibilityService"
	);
	try {
		await settlePromises<IExtensionData>(extensibilityService.loadExtensions());
	} catch (err) {
		logger.trace("Unable to load extensions. Error is: ", err);
	}

	const commandDispatcher: ICommandDispatcher = injector.resolve(
		"commandDispatcher"
	);

	const messages: IMessagesService = injector.resolve("$messagesService");
	messages.pathsToMessageJsonFiles = [
		/* Place client-specific json message file paths here */
	];

	if (process.argv[2] === "completion") {
		await commandDispatcher.completeCommand();
	} else {
		await commandDispatcher.dispatchCommand();
	}

	injector.dispose();
})();
/* tslint:enable:no-floating-promises */
