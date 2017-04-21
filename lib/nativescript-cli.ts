require("./bootstrap");
import * as shelljs from "shelljs";
shelljs.config.silent = true;
shelljs.config.fatal = true;
import { installUncaughtExceptionListener } from "./common/errors";
installUncaughtExceptionListener(process.exit);

import { settlePromises } from "./common/helpers";

(async () => {
	const config: Config.IConfig = $injector.resolve("$config");
	const err: IErrors = $injector.resolve("$errors");
	err.printCallStack = config.DEBUG;

	const logger: ILogger = $injector.resolve("logger");

	const extensibilityService: IExtensibilityService = $injector.resolve("extensibilityService");
	try {
		await settlePromises<IExtensionData>(extensibilityService.loadExtensions());
	} catch (err) {
		logger.trace("Unable to load extensions. Error is: ", err);
	}

	const commandDispatcher: ICommandDispatcher = $injector.resolve("commandDispatcher");

	const messages: IMessagesService = $injector.resolve("$messagesService");
	messages.pathsToMessageJsonFiles = [/* Place client-specific json message file paths here */];

	if (process.argv[2] === "completion") {
		await commandDispatcher.completeCommand();
	} else {
		await commandDispatcher.dispatchCommand();
	}

	$injector.dispose();
})();
