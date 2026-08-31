import * as path from "path";
import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { assert } from "chai";
import { PnpmPackageManager } from "../lib/pnpm-package-manager";
import { IInjector } from "../lib/common/definitions/yok";

class RecordingChildProcessStub extends stubs.ChildProcessStub {
	public execResponses: { [commandPrefix: string]: string } = {};
	public spawnedArgs: string[][] = [];

	public async exec(
		command: string,
		options?: any,
		execOptions?: any,
	): Promise<any> {
		await super.exec(command, options, execOptions);
		for (const prefix in this.execResponses) {
			if (command.startsWith(prefix)) {
				return this.execResponses[prefix];
			}
		}
		return null;
	}

	public spawnedOptions: any[] = [];

	public async spawnFromEvent(
		command: string,
		args: string[],
		event: string,
		options?: any,
		spawnFromEventOptions?: any,
	): Promise<any> {
		this.spawnedArgs.push(args);
		this.spawnedOptions.push(options);
		return super.spawnFromEvent(
			command,
			args,
			event,
			options,
			spawnFromEventOptions,
		);
	}
}

class SelectiveFileSystemStub extends stubs.FileSystemStub {
	public existingPaths: string[] = [];
	public textFiles: { [filePath: string]: string } = {};

	exists(filePath: string): boolean {
		return this.existingPaths.indexOf(filePath) !== -1;
	}

	readText(filename: string): string {
		return this.textFiles[filename];
	}
}

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("hostInfo", { isWindows: false });
	injector.register("errors", stubs.ErrorsStub);
	injector.register("logger", stubs.LoggerStub);
	injector.register("childProcess", RecordingChildProcessStub);
	injector.register("httpClient", {});
	injector.register("fs", SelectiveFileSystemStub);
	injector.register("pnpm", PnpmPackageManager);
	injector.register("pacoteService", {
		manifest: () => Promise.resolve({ name: "left-pad", version: "1.3.0" }),
	});

	return injector;
}

describe("pnpm-package-manager", () => {
	const projectDir = path.join("/tmp", "some-project");

	describe("install", () => {
		it("passes --shamefully-hoist when the project has no pnpm layout config", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");

			await pnpm.install(projectDir, projectDir, {} as any);

			assert.deepEqual(childProcess.spawnedArgs[0], [
				"i",
				"--shamefully-hoist",
			]);
		});

		it("omits --shamefully-hoist when a pnpm-workspace.yaml governs the project", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");
			const fs = testInjector.resolve<SelectiveFileSystemStub>("fs");
			fs.existingPaths = [path.join(projectDir, "pnpm-workspace.yaml")];

			await pnpm.install(projectDir, projectDir, {} as any);

			assert.deepEqual(childProcess.spawnedArgs[0], ["i"]);
		});

		it("omits --shamefully-hoist when an ancestor pnpm-workspace.yaml governs the project", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");
			const fs = testInjector.resolve<SelectiveFileSystemStub>("fs");
			fs.existingPaths = [path.join("/tmp", "pnpm-workspace.yaml")];

			await pnpm.install(projectDir, projectDir, {} as any);

			assert.deepEqual(childProcess.spawnedArgs[0], ["i"]);
		});

		it("omits --shamefully-hoist when an .npmrc sets a layout key", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");
			const fs = testInjector.resolve<SelectiveFileSystemStub>("fs");
			const npmrcPath = path.join(projectDir, ".npmrc");
			fs.existingPaths = [npmrcPath];
			fs.textFiles[npmrcPath] =
				"registry=https://example.com\nnode-linker=hoisted\n";

			await pnpm.install(projectDir, projectDir, {} as any);

			assert.deepEqual(childProcess.spawnedArgs[0], ["i"]);
		});

		it("keeps --shamefully-hoist when an .npmrc has no layout key", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");
			const fs = testInjector.resolve<SelectiveFileSystemStub>("fs");
			const npmrcPath = path.join(projectDir, ".npmrc");
			fs.existingPaths = [npmrcPath];
			fs.textFiles[npmrcPath] = "registry=https://example.com\n";

			await pnpm.install(projectDir, projectDir, {} as any);

			assert.deepEqual(childProcess.spawnedArgs[0], [
				"i",
				"--shamefully-hoist",
			]);
		});

		it("maps ignoreScripts to --ignore-scripts and drops internal options pnpm rejects", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");

			await pnpm.install(projectDir, projectDir, {
				ignoreScripts: true,
				path: "/some/path",
				frameworkPath: "/some/framework",
			} as any);

			const args = childProcess.spawnedArgs[0];
			assert.include(args, "--ignore-scripts");
			assert.notInclude(args, "--ignoreScripts");
			assert.notInclude(args, "--path");
			assert.notInclude(args, "--frameworkPath");
		});

		it("spawns non-interactive installs with stdin closed", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");

			await pnpm.install(projectDir, projectDir, {} as any);

			// pnpm never exits while its stdin is an open pipe, so anything but
			// "ignore" here hangs the CLI's wait for the child's "close" event.
			assert.deepEqual(childProcess.spawnedOptions[0].stdio, [
				"ignore",
				"pipe",
				"pipe",
			]);
		});

		it("appends the package name when installing a single package", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");

			await pnpm.install("left-pad", projectDir, { save: true } as any);

			assert.deepEqual(childProcess.spawnedArgs[0], [
				"i",
				"--shamefully-hoist",
				"left-pad",
				"--save",
			]);
		});
	});

	describe("getCachePath", () => {
		it("uses the configured cache directory when pnpm reports one", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");
			childProcess.execResponses["pnpm config get cache"] = "/custom/cache\n";

			const cachePath = await pnpm.getCachePath();

			assert.equal(cachePath, path.join("/custom/cache", "_cacache"));
		});

		it("falls back to the store's parent directory when the cache key is unset", async () => {
			const testInjector = createTestInjector();
			const pnpm = testInjector.resolve<PnpmPackageManager>("pnpm");
			const childProcess =
				testInjector.resolve<RecordingChildProcessStub>("childProcess");
			childProcess.execResponses["pnpm config get cache"] = "undefined\n";
			childProcess.execResponses["pnpm store path"] =
				"/Users/someone/Library/pnpm/store/v10\n";

			const cachePath = await pnpm.getCachePath();

			assert.equal(
				cachePath,
				path.join("/Users/someone/Library/pnpm/store", "_cacache"),
			);
		});
	});
});
