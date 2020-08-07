import { assert } from "chai";

// Use require instead of import in order to replace the `spawn` method of child_process
const childProcess = require("child_process");
const helpers = require("../src/common/helpers");

import { SpawnOptions, ChildProcess } from "child_process";
import * as path from "path";
import { POST_INSTALL_COMMAND_NAME } from "../src/constants";

describe("postinstall.js", () => {
	let isSpawnCalled = false;
	let argsPassedToSpawn: string[] = [];
	const originalSpawn = childProcess.spawn;
	const originalIsInstallingNativeScriptGlobally = helpers.isInstallingNativeScriptGlobally;

	beforeEach(() => {
		isSpawnCalled = false;
		argsPassedToSpawn = [];
		childProcess.spawn = (command: string, args?: string[], options?: SpawnOptions): ChildProcess => {
			isSpawnCalled = true;
			argsPassedToSpawn = args;

			return null;
		};
	});

	afterEach(() => {
		childProcess.spawn = originalSpawn;
		helpers.isInstallingNativeScriptGlobally = originalIsInstallingNativeScriptGlobally;
	});

	it("calls post-install-cli command of CLI when it is global installation", () => {
		helpers.isInstallingNativeScriptGlobally = () => true;

		require(path.join(__dirname, "..", "postinstall"));

		assert.isTrue(isSpawnCalled, "child_process.spawn must be called from postinstall.js");

		const expectedPathToCliExecutable = path.join(__dirname, "..", "bin", "tns");

		assert.isTrue(argsPassedToSpawn.indexOf(expectedPathToCliExecutable) !== -1, `The spawned args must contain path to TNS.
				Expected path is: ${expectedPathToCliExecutable}, current args are: ${argsPassedToSpawn}.`);
		assert.isTrue(argsPassedToSpawn.indexOf(POST_INSTALL_COMMAND_NAME) !== -1, `The spawned args must contain the name of the post-install command.
				Expected path is: ${expectedPathToCliExecutable}, current args are: ${argsPassedToSpawn}.`);
	});

	it("does not call post-install-cli command of CLI when it is not global install", () => {
		helpers.isInstallingNativeScriptGlobally = () => false;
		require(path.join(__dirname, "..", "postinstall"));
		assert.isFalse(isSpawnCalled, "child_process.spawn must NOT be called from postinstall.js when CLI is not installed globally");
	});
});
