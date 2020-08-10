#!/usr/bin/env node

// NOTE: This file is used to call JS functions when cleaning resources used by CLI, after the CLI is killed.
// The instances here are not shared with the ones in main CLI process.
import * as fs from "fs";
import * as uuid from "uuid";
import { FileLogService } from "./file-log-service";
import { $injector } from "../common/definitions/yok";

const pathToBootstrap = process.argv[2];
if (!pathToBootstrap || !fs.existsSync(pathToBootstrap)) {
	throw new Error("Invalid path to bootstrap.");
}

// After requiring the bootstrap we can use $injector
require(pathToBootstrap);

const logFile = process.argv[3];
const jsFilePath = process.argv[4];

const fileLogService = $injector.resolve<IFileLogService>(FileLogService, { logFile });
const uniqueId = uuid.v4();
fileLogService.logData({ message: `Initializing Cleanup process for path: ${jsFilePath} Unique id: ${uniqueId}` });

if (!fs.existsSync(jsFilePath)) {
	throw new Error(`Unable to find file ${jsFilePath}. Ensure it exists.`);
}

let data: any;
try {
	data = process.argv[5] && JSON.parse(process.argv[5]);
} catch (err) {
	throw new Error(`Unable to parse data from argv ${process.argv[5]}.`);
}

const logMessage = (msg: string, type?: FileLogMessageType): void => {
	fileLogService.logData({ message: `[${uniqueId}] ${msg}`, type });
};

/* tslint:disable:no-floating-promises */
(async () => {
	try {
		logMessage(`Requiring file ${jsFilePath}`);

		const func = require(jsFilePath);
		if (func && typeof func === "function") {
			try {
				logMessage(`Passing data: ${JSON.stringify(data)} to the default function exported by currently required file ${jsFilePath}`);
				await func(data);
				logMessage(`Finished execution with data: ${JSON.stringify(data)} to the default function exported by currently required file ${jsFilePath}`);
			} catch (err) {
				logMessage(`Unable to execute action of file ${jsFilePath} when passed data is ${JSON.stringify(data)}. Error is: ${err}.`, FileLogMessageType.Error);
			}
		}
	} catch (err) {
		logMessage(`Unable to require file: ${jsFilePath}. Error is: ${err}.`, FileLogMessageType.Error);
	}
})();
/* tslint:enable:no-floating-promises */
