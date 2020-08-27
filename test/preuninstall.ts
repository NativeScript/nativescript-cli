import { assert } from "chai";

// Use require instead of import in order to replace the `spawn` method of child_process
const childProcess = require("child_process");

import { SpawnOptions, ChildProcess } from "child_process";
import * as path from "path";
import { EventEmitter } from "events";
import { readFileSync } from "fs";

describe("preuninstall.js", () => {
	let isSpawnCalled = false;
	let argsPassedToSpawn: string[] = [];
	let optionsPassedToSpawn: any[];
	let dataPassedToConsoleError: string[] = [];
	const originalSpawn = childProcess.spawn;
	const originalConsoleError = console.error;
	let eventEmitter = new EventEmitter();

	beforeEach(() => {
		isSpawnCalled = false;
		argsPassedToSpawn = [];
		dataPassedToConsoleError = [];
		optionsPassedToSpawn = [];
		eventEmitter = new EventEmitter();
		childProcess.spawn = (command: string, args?: string[], options?: SpawnOptions): ChildProcess => {
			isSpawnCalled = true;
			argsPassedToSpawn = args;
			optionsPassedToSpawn.push(options);
			return <any>eventEmitter;
		};

		console.error = (data: string) => {
			dataPassedToConsoleError.push(data);
		};
	});

	afterEach(() => {
		childProcess.spawn = originalSpawn;
		console.error = originalConsoleError;
	});

	it("calls dev-preuninstall command of CLI and prints with console.error the error in case childProcess emits error event", () => {
		require(path.join(__dirname, "..", "preuninstall"));

		assert.isTrue(isSpawnCalled, "child_process.spawn must be called from preuninstall.js");

		const expectedPathToCliExecutable = path.join(__dirname, "..", "bin", "tns");

		assert.deepStrictEqual(argsPassedToSpawn, [expectedPathToCliExecutable, "dev-preuninstall"]);
		assert.deepStrictEqual(optionsPassedToSpawn, [{ stdio: "inherit" }], "The stdio must be inherit as this way CLI's command can determine correctly if terminal is in interactive mode.");
		assert.deepStrictEqual(dataPassedToConsoleError, []);

		const errMsg = "this is error message";
		eventEmitter.emit("error", new Error(errMsg));
		assert.deepStrictEqual(dataPassedToConsoleError, [`Failed to complete all pre-uninstall steps. Error is ${errMsg}`]);
	});

	it("passes --analyticsLogFile option when NS_CLI_PREUNINSTALL_ANALYTICS_LOG_FILE is set", () => {
		const content = readFileSync(path.join(__dirname, "..", "preuninstall.js")).toString();
		const originalEnvValue = process.env.NS_CLI_PREUNINSTALL_ANALYTICS_LOG_FILE;
		process.env.NS_CLI_PREUNINSTALL_ANALYTICS_LOG_FILE = "value from env analyticsLog.txt";
		/* tslint:disable:no-eval */
		eval(content);
		/* tslint:enable:no-eval */
		process.env.NS_CLI_PREUNINSTALL_ANALYTICS_LOG_FILE = originalEnvValue;
		assert.isTrue(isSpawnCalled, "child_process.spawn must be called from preuninstall.js");

		// NOTE: As the script is eval'd, the `__dirname` in it is resolved to current file's location,
		// so the expectedPathToCliExecutable should be set as it is located in current dir.
		const expectedPathToCliExecutable = path.join(__dirname, "bin", "tns");

		assert.deepStrictEqual(argsPassedToSpawn, [expectedPathToCliExecutable, "dev-preuninstall", "--analyticsLogFile", "value from env analyticsLog.txt"]);
		assert.deepStrictEqual(optionsPassedToSpawn, [{ stdio: "inherit" }], "The stdio must be inherit as this way CLI's command can determine correctly if terminal is in interactive mode.");
		assert.deepStrictEqual(dataPassedToConsoleError, []);
	});

	it("ensure package.json has correct preuninstall script", () => {
		const packageJsonData = require("../package.json");
		assert.equal(packageJsonData.scripts.preuninstall, "node preuninstall.js");
	});
});
