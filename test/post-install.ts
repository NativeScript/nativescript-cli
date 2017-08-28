import { assert } from "chai";

// Use require instead of import in order to replace the `spawn` method of child_process
const childProcess = require("child_process");

import { SpawnOptions, ChildProcess } from "child_process";
import * as path from "path";
import { POST_INSTALL_COMMAND_NAME } from "../lib/constants";

describe("postinstall.js", () => {
	it("calls post-install-cli command of CLI", () => {
		const originalSpawn = childProcess.spawn;
		let isSpawnCalled = false;
		let argsPassedToSpawn: string[] = [];
		childProcess.spawn = (command: string, args?: string[], options?: SpawnOptions): ChildProcess => {
			isSpawnCalled = true;
			argsPassedToSpawn = args;

			return null;
		};

		require(path.join(__dirname, "..", "postinstall"));

		childProcess.spawn = originalSpawn;

		assert.isTrue(isSpawnCalled, "child_process.spawn must be called from postinstall.js");

		const expectedPathToCliExecutable = path.join(__dirname, "..", "bin", "tns");

		assert.isTrue(argsPassedToSpawn.indexOf(expectedPathToCliExecutable) !== -1, `The spawned args must contain path to TNS.
				Expected path is: ${expectedPathToCliExecutable}, current args are: ${argsPassedToSpawn}.`);
		assert.isTrue(argsPassedToSpawn.indexOf(POST_INSTALL_COMMAND_NAME) !== -1, `The spawned args must contain the name of the post-install command.
				Expected path is: ${expectedPathToCliExecutable}, current args are: ${argsPassedToSpawn}.`);
	});
});
