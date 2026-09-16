import * as path from "path";
import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { assert } from "chai";
import { NpmPackageManager } from "../lib/package-managers/npm";
import { YarnPackageManager } from "../lib/package-managers/yarn";
import { Yarn2PackageManager } from "../lib/package-managers/yarn2";
import { PnpmPackageManager } from "../lib/package-managers/pnpm";
import { BunPackageManager } from "../lib/package-managers/bun";
import {
	INodePackageManager,
	IPackageInstallOptions,
} from "../lib/declarations";
import { IInjector } from "../lib/common/definitions/yok";

class RecordingChildProcessStub extends stubs.ChildProcessStub {
	public spawnedArgs: string[][] = [];
	public execCommands: string[] = [];

	public async exec(
		command: string,
		options?: any,
		execOptions?: any,
	): Promise<any> {
		this.execCommands.push(command);
		return super.exec(command, options, execOptions);
	}

	public async spawnFromEvent(
		command: string,
		args: string[],
		event: string,
		options?: any,
		spawnFromEventOptions?: any,
	): Promise<any> {
		this.spawnedArgs.push(args);
		return super.spawnFromEvent(
			command,
			args,
			event,
			options,
			spawnFromEventOptions,
		);
	}
}

class NoFilesFileSystemStub extends stubs.FileSystemStub {
	exists(filePath: string): boolean {
		return false;
	}
}

const managers: { name: string; ctor: any }[] = [
	{ name: "npm", ctor: NpmPackageManager },
	{ name: "yarn", ctor: YarnPackageManager },
	{ name: "yarn2", ctor: Yarn2PackageManager },
	{ name: "pnpm", ctor: PnpmPackageManager },
	{ name: "bun", ctor: BunPackageManager },
];

function createTestInjector(name: string, ctor: any): IInjector {
	const injector = new Yok();
	injector.register("hostInfo", { isWindows: false });
	injector.register("errors", stubs.ErrorsStub);
	injector.register("logger", stubs.LoggerStub);
	injector.register("childProcess", RecordingChildProcessStub);
	injector.register("httpClient", {});
	injector.register("fs", NoFilesFileSystemStub);
	injector.register(name, ctor);
	injector.register("pacoteService", {
		manifest: () => Promise.resolve({ name: "left-pad", version: "1.3.0" }),
	});

	return injector;
}

async function installArgs(
	name: string,
	ctor: any,
	options: IPackageInstallOptions,
): Promise<string[]> {
	const injector = createTestInjector(name, ctor);
	const manager = injector.resolve<INodePackageManager>(name);
	const childProcess =
		injector.resolve<RecordingChildProcessStub>("childProcess");
	await manager.install("left-pad", projectDir, options);
	return childProcess.spawnedArgs[0];
}

async function uninstallCommand(
	name: string,
	ctor: any,
	save: boolean,
): Promise<string> {
	const injector = createTestInjector(name, ctor);
	const manager = injector.resolve<INodePackageManager>(name);
	const childProcess =
		injector.resolve<RecordingChildProcessStub>("childProcess");
	await manager.uninstall("left-pad", { save }, projectDir);
	return childProcess.execCommands[0].trim();
}

const projectDir = path.join("/tmp", "some-project");

const allOptions: IPackageInstallOptions = {
	save: true,
	dev: true,
	optional: true,
	exact: true,
	silent: true,
	ignoreScripts: true,
};

describe("package manager flag mapping", () => {
	const expectedInstallArgs: { [name: string]: string[] } = {
		npm: [
			"install",
			"left-pad",
			"--save",
			"--save-dev",
			"--save-optional",
			"--save-exact",
			"--silent",
			"--ignore-scripts",
		],
		yarn: [
			"add",
			"left-pad",
			"--dev",
			"--optional",
			"--exact",
			"--silent",
			"--ignore-scripts",
		],
		yarn2: [
			"add",
			"left-pad",
			"--dev",
			"--optional",
			"--exact",
			"--silent",
			"--mode=skip-build",
		],
		pnpm: [
			"i",
			"--shamefully-hoist",
			"left-pad",
			"--save-dev",
			"--save-optional",
			"--save-exact",
			"--silent",
			"--ignore-scripts",
		],
		bun: [
			"install",
			"left-pad",
			"--save",
			"--dev",
			"--optional",
			"--exact",
			"--silent",
			"--ignore-scripts",
		],
	};

	for (const { name, ctor } of managers) {
		describe(name, () => {
			it("maps every install option to its own flag", async () => {
				const args = await installArgs(name, ctor, allOptions);
				assert.deepEqual(args, expectedInstallArgs[name]);
			});

			it("passes no option flags when no options are set", async () => {
				const args = await installArgs(name, ctor, {});
				const expected = expectedInstallArgs[name].filter(
					(arg) => !arg.startsWith("--") || arg === "--shamefully-hoist",
				);
				assert.deepEqual(args, expected);
			});

			it("never passes CLI-internal options to the command line", async () => {
				const args = await installArgs(name, ctor, {
					path: "/some/path",
					frameworkPath: "/some/framework",
				});
				for (const arg of args) {
					assert.notMatch(arg, /path|framework/i);
				}
			});

			it("skips the install when disableNpmInstall is set", async () => {
				const injector = createTestInjector(name, ctor);
				const manager = injector.resolve<INodePackageManager>(name);
				const childProcess =
					injector.resolve<RecordingChildProcessStub>("childProcess");
				await manager.install("left-pad", projectDir, {
					disableNpmInstall: true,
				});
				assert.lengthOf(childProcess.spawnedArgs, 0);
			});
		});
	}

	describe("save: false", () => {
		it("maps to --no-save where the package manager supports it", async () => {
			assert.include(
				await installArgs("npm", NpmPackageManager, { save: false }),
				"--no-save",
			);
			assert.include(
				await installArgs("bun", BunPackageManager, { save: false }),
				"--no-save",
			);
		});

		it("is dropped where the package manager has no such flag", async () => {
			for (const { name, ctor } of managers.filter(
				(m) => m.name !== "npm" && m.name !== "bun",
			)) {
				const args = await installArgs(name, ctor, { save: false });
				assert.notInclude(args, "--no-save", name);
			}
		});
	});

	describe("getInstalledPackagePath", () => {
		const repoRoot = path.join(__dirname, "..", "..");

		for (const { name, ctor } of managers) {
			it(`${name} resolves an installed package from the given directory`, async () => {
				const manager = createTestInjector(
					name,
					ctor,
				).resolve<INodePackageManager>(name);
				const resolved = await manager.getInstalledPackagePath(
					"lodash",
					repoRoot,
				);
				assert.equal(resolved, path.join(repoRoot, "node_modules", "lodash"));
			});

			it(`${name} returns null for a package that is not installed`, async () => {
				const manager = createTestInjector(
					name,
					ctor,
				).resolve<INodePackageManager>(name);
				assert.isNull(
					await manager.getInstalledPackagePath(
						"definitely-not-installed-package",
						repoRoot,
					),
				);
			});
		}
	});

	describe("uninstall", () => {
		const expected: { [name: string]: string } = {
			npm: "npm uninstall left-pad --save",
			yarn: "yarn remove left-pad",
			yarn2: "yarn remove left-pad",
			pnpm: "pnpm remove left-pad",
			bun: "bun remove left-pad --save",
		};

		for (const { name, ctor } of managers) {
			it(`${name} maps save onto its own remove command`, async () => {
				assert.equal(await uninstallCommand(name, ctor, true), expected[name]);
			});
		}
	});
});
