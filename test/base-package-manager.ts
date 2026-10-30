import { assert } from "chai";
import { BasePackageManager } from "../lib/base-package-manager";

class TestPackageManager extends (<any>BasePackageManager) {
	constructor() {
		super({}, {}, {}, {}, {}, "npm");
	}
}

describe("BasePackageManager", () => {
	const flags = (config: object): string[] =>
		(<any>new TestPackageManager()).getFlagsString(config, true);

	it("doesn't pass the CLI's own options to the package manager", () => {
		assert.deepEqual(
			flags({
				path: "apps/app",
				frameworkPath: "runtime.tgz",
				disableNpmInstall: true,
				ignoreScripts: true,
			}),
			[],
		);
	});

	it("passes the package manager's options on", () => {
		assert.deepEqual(flags({ "ignore-scripts": true, "save-dev": true }), [
			"--ignore-scripts",
			"--save-dev",
		]);
	});
});
