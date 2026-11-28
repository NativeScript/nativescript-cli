import { assert } from "chai";
import { BasePackageManager } from "../lib/base-package-manager";
import { BunPackageManager } from "../lib/bun-package-manager";
import { IInjector } from "../lib/common/definitions/yok";
import { Yok } from "../lib/common/yok";
import { NodePackageManager } from "../lib/node-package-manager";
import { YarnPackageManager } from "../lib/yarn-package-manager";
import * as stubs from "./stubs";

class TestPackageManager extends (<any>BasePackageManager) {
	constructor() {
		super({}, {}, {}, {}, "npm");
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

	[
		{ name: "npm", packageManager: NodePackageManager },
		{ name: "yarn", packageManager: YarnPackageManager },
		{ name: "bun", packageManager: BunPackageManager },
	].forEach(({ name, packageManager }) => {
		it(`maps ignoreScripts to --ignore-scripts when installing with ${name}`, async () => {
			const injector: IInjector = new Yok();
			injector.register("hostInfo", { isWindows: false });
			injector.register("errors", stubs.ErrorsStub);
			injector.register("logger", stubs.LoggerStub);
			injector.register("childProcess", stubs.ChildProcessStub);
			injector.register("httpClient", {});
			injector.register("fs", stubs.FileSystemStub);
			injector.register("pacoteService", {});
			injector.register(name, packageManager);
			const projectDir = "/some-project";

			await injector
				.resolve<BasePackageManager>(name)
				.install(projectDir, projectDir, <any>{
					ignoreScripts: true,
					path: "apps/app",
					frameworkPath: "runtime.tgz",
				});

			const args =
				injector.resolve<stubs.ChildProcessStub>(
					"childProcess",
				).lastCommandArgs;
			assert.include(args, "--ignore-scripts");
			assert.notInclude(args, "--ignoreScripts");
			assert.notInclude(args, "--path");
			assert.notInclude(args, "--frameworkPath");
		});
	});
});
