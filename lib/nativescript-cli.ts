require("./bootstrap");

import * as shelljs from "shelljs";
shelljs.config.silent = true;
shelljs.config.fatal = true;

if (process.platform === "win32") {
	// Later versions of shelljs do not process globs with \ path delimiters correctly, for windows change to /
	const realcp = shelljs.cp;
	(shelljs as any).cp = (...args: unknown[]) => {
		if (args.length === 3) {
			args[1] = replaceDashes(args[1] as string | string[]);
		} else {
			args[0] = replaceDashes(args[0] as string | string[]);
		}

		if (args.length == 2) {
			realcp(args[0] as string[], args[1] as string);
		} else {
			realcp(args[0] as string, args[1] as string[], args[2] as string);
		}
	};
	function replaceDashes(values: string | string[]): string | string[] {
		if (Array.isArray(values)) {
			for (let i = 0; i < values.length; ++i) {
				values[i] = replaceDashes(values[i]) as string;
			}
			return values;
		} else {
			return values.replace(/\\/g, "/");
		}
	}
}

import { installUncaughtExceptionListener } from "./common/errors";
import { settlePromises } from "./common/helpers";
import { injector } from "./common/yok";
import { ErrorCodes, IErrors, ICommandDispatcher } from "./common/declarations";
import {
	IExtensibilityService,
	IExtensionData,
} from "./common/definitions/extensibility";
import { IInitializeService } from "./definitions/initialize-service";
import { color } from "./color";
installUncaughtExceptionListener(
	process.exit.bind(process, ErrorCodes.UNCAUGHT),
);

const logger: ILogger = injector.resolve("logger");
export const originalProcessOn = process.on.bind(process);

process.on = (event: string, listener: any): any => {
	if (event === "SIGINT") {
		logger.trace(
			`Trying to handle SIGINT event. CLI overrides this behavior and does not allow handling SIGINT as this causes issues with Ctrl + C in terminal.`,
		);
		const msg = "The stackTrace of the location trying to handle SIGINT is";
		const stackTrace = new Error(msg).stack || "";
		logger.trace(
			stackTrace.replace(
				`Error: ${msg}`,
				`${msg} (${color.yellow(
					"note:",
				)} this is not an error, just a stack-trace for debugging purposes):`,
			),
		);
	} else {
		return originalProcessOn(event, listener);
	}
};

/* tslint:disable:no-floating-promises */
(async () => {
	if (process.argv.includes("--get-yargs-completions")) {
		// This is a special case when we want to get the yargs completions as fast as possible...
		injector.resolve("$options");
		return;
	}

	const config: Config.IConfig = injector.resolve("$config");
	const err: IErrors = injector.resolve("$errors");
	err.printCallStack = config.DEBUG;

	const $initializeService =
		injector.resolve<IInitializeService>("initializeService");
	await $initializeService.initialize();

	const extensibilityService: IExtensibilityService = injector.resolve(
		"extensibilityService",
	);
	try {
		await settlePromises<IExtensionData>(extensibilityService.loadExtensions());
	} catch (err) {
		logger.trace("Unable to load extensions. Error is: ", err);
	}

	const commandDispatcher: ICommandDispatcher =
		injector.resolve("commandDispatcher");

	// unused...
	// const messages: IMessagesService = injector.resolve("$messagesService");
	// messages.pathsToMessageJsonFiles = [
	// 	/* Place client-specific json message file paths here */
	// ];

	await commandDispatcher.dispatchCommand();
	injector.dispose();
})();
/* tslint:enable:no-floating-promises */
