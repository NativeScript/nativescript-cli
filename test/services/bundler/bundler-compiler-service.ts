import { Yok } from "../../../lib/common/yok";
import { BundlerCompilerService } from "../../../lib/services/bundler/bundler-compiler-service";
import { assert } from "chai";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ErrorsStub } from "../../stubs";
import { IInjector } from "../../../lib/common/definitions/yok";
import { IOSDeviceTunnelService } from "../../../lib/contracts/ios-device-tunnel-service";
import {
	BUNDLER_APP_RESTART_REQUESTED,
	BUNDLER_COMPILATION_COMPLETE,
	CONFIG_FILE_NAME_DISPLAY,
	PackageManagers,
} from "../../../lib/constants";

const iOSPlatformName = "ios";
const androidPlatformName = "android";
const chunkFiles = ["bundle.js", "runtime.js", "vendor.js"];

function getAllEmittedFiles(hash: string) {
	return [
		"bundle.js",
		"runtime.js",
		`bundle.${hash}.hot-update.js`,
		`${hash}.hot-update.json`,
	];
}

type FakeChildProcess = EventEmitter & {
	stdout: EventEmitter;
	stderr: EventEmitter;
	pid: number;
	exitCode: number | null;
	signalCode: string | null;
	killSignals: string[];
	kill(signal?: string): boolean;
};

function fakeChildProcess(pid: number): FakeChildProcess {
	const childProcess = new EventEmitter() as FakeChildProcess;
	childProcess.stdout = new EventEmitter();
	childProcess.stderr = new EventEmitter();
	childProcess.pid = pid;
	childProcess.exitCode = null;
	childProcess.signalCode = null;
	childProcess.killSignals = [];
	childProcess.kill = (signal?: string) => {
		childProcess.killSignals.push(signal);
		return true;
	};

	return childProcess;
}

const flush = async (): Promise<void> => {
	for (let i = 0; i < 5; i++) {
		await new Promise((resolve) => setImmediate(resolve));
	}
};

function createTestInjector(
	packageManager: PackageManagers = PackageManagers.npm,
): IInjector {
	const testInjector = new Yok();
	testInjector.register("packageManager", {
		getPackageManagerName: async () => packageManager,
	});
	testInjector.register("bundlerCompilerService", BundlerCompilerService);
	testInjector.register("childProcess", {});
	testInjector.register("hooksService", {});
	testInjector.register("hostInfo", {});
	testInjector.register("options", {});
	testInjector.register("logger", {
		info: () => ({}),
		trace: () => ({}),
		warn: () => ({}),
	});
	testInjector.register("errors", ErrorsStub);
	testInjector.register("packageInstallationManager", {});
	testInjector.register("mobileHelper", {});
	testInjector.register("cleanupService", {
		addKillProcess: async () => ({}),
		removeKillProcess: async () => ({}),
	});
	testInjector.register("projectConfigService", {
		getValue: (key: string, defaultValue?: string) => defaultValue,
	});
	testInjector.register("fs", {
		exists: (filePath: string) => true,
	});
	testInjector.register("viteHmrPortService", {
		getPort: async () => 5173,
	});
	testInjector.register({
		provide: IOSDeviceTunnelService,
		useValue: { getHostAddress: (): string => undefined },
	});

	return testInjector;
}

describe("BundlerCompilerService", () => {
	let testInjector: IInjector = null;
	let bundlerCompilerService: BundlerCompilerService = null;

	beforeEach(() => {
		testInjector = createTestInjector();
		bundlerCompilerService = testInjector.resolve(BundlerCompilerService);
	});

	describe("shouldUsePreserveSymlinksOption", () => {
		it("should preserve symlinks for npm", async () => {
			const result = await (<any>(
				bundlerCompilerService
			)).shouldUsePreserveSymlinksOption();

			assert.isTrue(result);
		});

		for (const packageManager of [PackageManagers.pnpm, PackageManagers.bun]) {
			it(`should not preserve symlinks for ${packageManager}`, async () => {
				testInjector = createTestInjector(packageManager);
				bundlerCompilerService = testInjector.resolve(BundlerCompilerService);

				const result = await (<any>(
					bundlerCompilerService
				)).shouldUsePreserveSymlinksOption();

				assert.isFalse(result);
			});
		}
	});

	describe("getUpdatedEmittedFiles", () => {
		// backwards compatibility with old versions of nativescript-dev-webpack
		it("should return only hot updates when nextHash is not provided", async () => {
			const result = bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash1"),
				chunkFiles,
				null,
				iOSPlatformName,
			);
			const expectedEmittedFiles = [
				"bundle.hash1.hot-update.js",
				"hash1.hot-update.json",
			];

			assert.deepStrictEqual(result.emittedFiles, expectedEmittedFiles);
		});
		// 2 successful bundler compilations
		it("should return only hot updates when nextHash is provided", async () => {
			bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash1"),
				chunkFiles,
				"hash2",
				iOSPlatformName,
			);
			const result = bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash2"),
				chunkFiles,
				"hash3",
				iOSPlatformName,
			);

			assert.deepStrictEqual(result.emittedFiles, [
				"bundle.hash2.hot-update.js",
				"hash2.hot-update.json",
			]);
		});
		// 1 successful bundler compilation, n compilations with no emitted files
		it("should return all files when there is a bundler compilation with no emitted files", () => {
			bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash1"),
				chunkFiles,
				"hash2",
				iOSPlatformName,
			);
			const result = bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash4"),
				chunkFiles,
				"hash5",
				iOSPlatformName,
			);

			assert.deepStrictEqual(result.emittedFiles, [
				"bundle.js",
				"runtime.js",
				"bundle.hash4.hot-update.js",
				"hash4.hot-update.json",
			]);
		});
		// 1 successful bundler compilation, n compilations with no emitted files, 1 successful bundler compilation
		it("should return only hot updates after fixing the compilation error", () => {
			bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash1"),
				chunkFiles,
				"hash2",
				iOSPlatformName,
			);
			bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash5"),
				chunkFiles,
				"hash6",
				iOSPlatformName,
			);
			const result = bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash6"),
				chunkFiles,
				"hash7",
				iOSPlatformName,
			);

			assert.deepStrictEqual(result.emittedFiles, [
				"bundle.hash6.hot-update.js",
				"hash6.hot-update.json",
			]);
		});
		// 1 bundler compilation with no emitted files
		it("should return all files when first compilation on livesync change is not successful", () => {
			(<any>bundlerCompilerService).expectedHashes = {
				ios: "hash1",
			};
			const result = bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash1"),
				chunkFiles,
				"hash2",
				iOSPlatformName,
			);

			assert.deepStrictEqual(result.emittedFiles, [
				"bundle.hash1.hot-update.js",
				"hash1.hot-update.json",
			]);
		});
		it("should return correct hashes when there are more than one platform", () => {
			bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash1"),
				chunkFiles,
				"hash2",
				iOSPlatformName,
			);
			bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash3"),
				chunkFiles,
				"hash4",
				androidPlatformName,
			);

			bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash2"),
				chunkFiles,
				"hash5",
				iOSPlatformName,
			);
			bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash4"),
				chunkFiles,
				"hash6",
				androidPlatformName,
			);

			const iOSResult = bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash5"),
				chunkFiles,
				"hash7",
				iOSPlatformName,
			);
			assert.deepStrictEqual(iOSResult.emittedFiles, [
				"bundle.hash5.hot-update.js",
				"hash5.hot-update.json",
			]);

			const androidResult = bundlerCompilerService.getUpdatedEmittedFiles(
				getAllEmittedFiles("hash6"),
				chunkFiles,
				"hash8",
				androidPlatformName,
			);
			assert.deepStrictEqual(androidResult.emittedFiles, [
				"bundle.hash6.hot-update.js",
				"hash6.hot-update.json",
			]);
		});
	});

	describe("getViteDistOutputPath", () => {
		it("stages each platform in its own directory when NS_VITE_DIST_DIR is unset", () => {
			const previous = process.env.NS_VITE_DIST_DIR;
			try {
				delete process.env.NS_VITE_DIST_DIR;
				assert.strictEqual(
					(<any>bundlerCompilerService).getViteDistOutputPath(
						"/project",
						"ios",
					),
					path.join("/project", ".ns-vite-build", "ios"),
				);
				assert.strictEqual(
					(<any>bundlerCompilerService).getViteDistOutputPath(
						"/project",
						"android",
					),
					path.join("/project", ".ns-vite-build", "android"),
				);
			} finally {
				if (previous === undefined) {
					delete process.env.NS_VITE_DIST_DIR;
				} else {
					process.env.NS_VITE_DIST_DIR = previous;
				}
			}
		});

		it("uses NS_VITE_DIST_DIR verbatim when set", () => {
			const previous = process.env.NS_VITE_DIST_DIR;
			try {
				process.env.NS_VITE_DIST_DIR = "custom-dist";
				assert.strictEqual(
					(<any>bundlerCompilerService).getViteDistOutputPath(
						"/project",
						"ios",
					),
					path.join("/project", "custom-dist"),
				);
			} finally {
				if (previous === undefined) {
					delete process.env.NS_VITE_DIST_DIR;
				} else {
					process.env.NS_VITE_DIST_DIR = previous;
				}
			}
		});
	});

	describe("getViteChildEnv", () => {
		let previous: string;
		beforeEach(() => {
			previous = process.env.NS_VITE_DIST_DIR;
			delete process.env.NS_VITE_DIST_DIR;
			(<any>bundlerCompilerService).getBundler = () => "vite";
			testInjector.resolve("viteHmrPortService").getPort = async (
				platform: string,
			) => (platform === "ios" ? 5173 : 5174);
		});
		afterEach(() => {
			if (previous === undefined) {
				delete process.env.NS_VITE_DIST_DIR;
			} else {
				process.env.NS_VITE_DIST_DIR = previous;
			}
		});

		it("hands HMR sessions the platform's staging dir and resolved port", async () => {
			assert.deepEqual(
				await (<any>bundlerCompilerService).getViteChildEnv("android", {
					watch: true,
					hmr: true,
				}),
				{ NS_VITE_DIST_DIR: ".ns-vite-build/android", NS_HMR_PORT: "5174" },
			);
		});

		it("does not resolve a port for builds that run no dev server", async () => {
			assert.deepEqual(
				await (<any>bundlerCompilerService).getViteChildEnv("ios", {
					watch: true,
					hmr: false,
				}),
				{ NS_VITE_DIST_DIR: ".ns-vite-build/ios" },
			);
			assert.deepEqual(
				await (<any>bundlerCompilerService).getViteChildEnv("ios", {
					watch: true,
					hmr: true,
					release: true,
				}),
				{ NS_VITE_DIST_DIR: ".ns-vite-build/ios" },
			);
		});

		describe("with a USB tunnel open", () => {
			let previousHost: string;
			beforeEach(() => {
				previousHost = process.env.NS_HMR_HOST;
				delete process.env.NS_HMR_HOST;
				testInjector.get(IOSDeviceTunnelService).getHostAddress = (
					platform: string,
				) => (platform === "ios" ? "fd6f:72e:8d34::2" : undefined);
			});
			afterEach(() => {
				if (previousHost === undefined) {
					delete process.env.NS_HMR_HOST;
				} else {
					process.env.NS_HMR_HOST = previousHost;
				}
			});

			it("hands the tunnel's Mac address to that platform only", async () => {
				assert.deepEqual(
					await (<any>bundlerCompilerService).getViteChildEnv("ios", {
						watch: true,
						hmr: true,
					}),
					{
						NS_VITE_DIST_DIR: ".ns-vite-build/ios",
						NS_HMR_PORT: "5173",
						NS_HMR_HOST: "fd6f:72e:8d34::2",
					},
				);
				assert.notProperty(
					await (<any>bundlerCompilerService).getViteChildEnv("android", {
						watch: true,
						hmr: true,
					}),
					"NS_HMR_HOST",
				);
			});

			it("leaves a user-set NS_HMR_HOST alone", async () => {
				process.env.NS_HMR_HOST = "192.168.1.10";
				assert.notProperty(
					await (<any>bundlerCompilerService).getViteChildEnv("ios", {
						watch: true,
						hmr: true,
					}),
					"NS_HMR_HOST",
				);
			});
		});
	});

	describe("compileWithWatch", () => {
		it("fails when the value set for bundlerConfigPath is not existant file", async () => {
			const bundlerConfigPath = "some path.js";
			testInjector.resolve("fs").exists = (filePath: string) =>
				filePath !== bundlerConfigPath;
			await assert.isRejected(
				bundlerCompilerService.compileWithWatch(
					<any>{ platformNameLowerCase: "android" },
					<any>{ bundlerConfigPath: bundlerConfigPath },
					<any>{},
				),
				`The bundler configuration file ${bundlerConfigPath} does not exist. Ensure the file exists, or update the path in ${CONFIG_FILE_NAME_DISPLAY}`,
			);
		});

		it("does not emit a live sync event for the initial Vite watch build", async () => {
			const platformData = <any>{
				platformNameLowerCase: "ios",
				appDestinationDirectoryPath: "/platform/app",
			};
			const projectData = <any>{
				projectDir: "/project",
				bundler: "vite",
				bundlerConfigPath: "/project/vite.config.ts",
			};
			const prepareData = <any>{ hmr: false };
			const childProcess = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
			};

			childProcess.stdout = new EventEmitter();
			childProcess.stderr = new EventEmitter();
			childProcess.pid = 123;

			testInjector.resolve("options").hostProjectModuleName = "app";
			(<any>bundlerCompilerService).getBundler = () => "vite";
			(<any>bundlerCompilerService).startBundleProcess = async () =>
				childProcess;
			(<any>bundlerCompilerService).copyViteBundleToNative = () => ({});

			const emittedEvents: any[] = [];
			bundlerCompilerService.on(BUNDLER_COMPILATION_COMPLETE, (data) => {
				emittedEvents.push(data);
			});

			const compilePromise = bundlerCompilerService.compileWithWatch(
				platformData,
				projectData,
				prepareData,
			);
			await new Promise((resolve) => setImmediate(resolve));

			childProcess.emit("message", {
				emittedFiles: ["bundle.mjs"],
				buildType: "initial",
				hash: "hash-1",
				isHMR: false,
			});

			await compilePromise;
			assert.lengthOf(emittedEvents, 0);

			childProcess.emit("message", {
				emittedFiles: ["bundle.mjs"],
				buildType: "incremental",
				hash: "hash-2",
				isHMR: false,
			});

			assert.lengthOf(emittedEvents, 1);
			assert.deepStrictEqual(emittedEvents[0], {
				files: ["/platform/app/app/bundle.mjs"],
				hasOnlyHotUpdateFiles: false,
				hmrData: {
					hash: "hash-2",
					fallbackFiles: [],
				},
				platform: "ios",
			});
		});
	});

	describe("compileWithoutWatch", () => {
		it("copies a successful Vite build to the native app", async () => {
			const previous = process.env.NS_VITE_DIST_DIR;
			delete process.env.NS_VITE_DIST_DIR;
			try {
				const childProcess = Object.assign(new EventEmitter(), { pid: 1234 });
				const copies: Array<{
					distOutput: string;
					destDir: string;
					failOnError: boolean;
				}> = [];
				testInjector.resolve("options").hostProjectModuleName = "app";
				(<any>bundlerCompilerService).getBundler = () => "vite";
				(<any>bundlerCompilerService).startBundleProcess = async () =>
					childProcess;
				(<any>bundlerCompilerService).copyViteBundleToNative = (
					distOutput: string,
					destDir: string,
					_specificFiles: string[],
					failOnError: boolean,
				) => {
					copies.push({ distOutput, destDir, failOnError });
				};

				const compilation = bundlerCompilerService.compileWithoutWatch(
					<any>{
						platformNameLowerCase: "android",
						appDestinationDirectoryPath: "/project/platforms/android",
					},
					<any>{ projectDir: "/project" },
					<any>{},
				);
				setImmediate(() => childProcess.emit("close", 0));
				await compilation;

				assert.deepEqual(copies, [
					{
						distOutput: path.join("/project", ".ns-vite-build", "android"),
						destDir: path.join("/project/platforms/android", "app"),
						failOnError: true,
					},
				]);
			} finally {
				if (previous === undefined) {
					delete process.env.NS_VITE_DIST_DIR;
				} else {
					process.env.NS_VITE_DIST_DIR = previous;
				}
			}
		});

		it("fails when a successful Vite build cannot be copied", async () => {
			const childProcess = Object.assign(new EventEmitter(), { pid: 1234 });
			testInjector.resolve("options").hostProjectModuleName = "app";
			(<any>bundlerCompilerService).getBundler = () => "vite";
			(<any>bundlerCompilerService).startBundleProcess = async () =>
				childProcess;
			(<any>bundlerCompilerService).copyViteBundleToNative = () => {
				throw new Error("copy failed");
			};

			const compilation = bundlerCompilerService.compileWithoutWatch(
				<any>{
					platformNameLowerCase: "ios",
					appDestinationDirectoryPath: "/project/platforms/ios",
				},
				<any>{ projectDir: "/project" },
				<any>{},
			);
			setImmediate(() => childProcess.emit("close", 0));

			await assert.isRejected(compilation, "copy failed");
		});

		it("fails when the value set for bundlerConfigPath is not existant file", async () => {
			const bundlerConfigPath = "some path.js";
			testInjector.resolve("fs").exists = (filePath: string) =>
				filePath !== bundlerConfigPath;
			await assert.isRejected(
				bundlerCompilerService.compileWithoutWatch(
					<any>{ platformNameLowerCase: "android" },
					<any>{ bundlerConfigPath: bundlerConfigPath },
					<any>{},
				),
				`The bundler configuration file ${bundlerConfigPath} does not exist. Ensure the file exists, or update the path in ${CONFIG_FILE_NAME_DISPLAY}`,
			);
		});
	});

	describe("vite dev server", () => {
		const platformData = <any>{
			platformNameLowerCase: "ios",
			appDestinationDirectoryPath: "/platform/app",
		};
		const projectData = <any>{
			projectDir: "/project",
			bundler: "vite",
			bundlerConfigPath: "/project/vite.config.ts",
		};
		const prepareData = <any>{ watch: true, hmr: true };

		let serveProcess: FakeChildProcess = null;
		let spawnOptions: any = null;
		let restartRequests: IBundlerAppRestartRequest[] = null;

		const waitForDebounce = () =>
			new Promise((resolve) => setTimeout(resolve, 20));

		beforeEach(async () => {
			serveProcess = fakeChildProcess(456);
			spawnOptions = null;
			restartRequests = [];

			const service = <any>bundlerCompilerService;
			service.getBundler = () => "vite";
			service.getBundlerExecutablePath = () => "/project/vite.js";
			service.buildEnvData = () => ({});
			service.buildEnvCommandLineParams = async (): Promise<string[]> => [];
			service.waitForPort = async () => true;
			service.appRestartDebounceMs = 5;
			testInjector.resolve("childProcess").spawn = (
				_command: string,
				_args: string[],
				options: any,
			) => {
				spawnOptions = options;
				return serveProcess;
			};
			bundlerCompilerService.on(BUNDLER_APP_RESTART_REQUESTED, (request) =>
				restartRequests.push(request),
			);

			await service.startViteDevServer(platformData, projectData, prepareData);
		});

		it("opens an IPC channel and keeps the output inherited", () => {
			assert.deepStrictEqual(spawnOptions.stdio, [
				"inherit",
				"inherit",
				"inherit",
				"ipc",
			]);
		});

		it("asks for an app restart when the dev server requests one", async () => {
			serveProcess.emit("message", {
				type: "nativescript:restart",
				reason: "vite.config.ts changed",
			});
			await waitForDebounce();

			assert.deepStrictEqual(restartRequests, [
				{
					projectDir: "/project",
					platform: "ios",
					reason: "vite.config.ts changed",
				},
			]);
		});

		it("collapses requests that arrive close together into one", async () => {
			serveProcess.emit("message", {
				type: "nativescript:restart",
				reason: "a.ts changed",
			});
			serveProcess.emit("message", {
				type: "nativescript:restart",
				reason: "b.ts changed",
			});
			serveProcess.emit("message", {
				type: "nativescript:restart",
				reason: "a.ts changed",
			});
			await waitForDebounce();

			assert.deepStrictEqual(restartRequests, [
				{
					projectDir: "/project",
					platform: "ios",
					reason: "a.ts changed; b.ts changed",
				},
			]);
		});

		it("ignores messages it does not know", async () => {
			serveProcess.emit("message", "nativescript:restart");
			serveProcess.emit("message", null);
			serveProcess.emit("message", { type: "nativescript:something-else" });
			serveProcess.emit("message", {
				emittedFiles: ["bundle.mjs"],
				hash: "hash-1",
				isHMR: false,
				buildType: "incremental",
			});
			await waitForDebounce();

			assert.lengthOf(restartRequests, 0);
		});

		it("drops a pending request when the dev server is stopped", async () => {
			serveProcess.emit("message", {
				type: "nativescript:restart",
				reason: "a.ts changed",
			});
			serveProcess.exitCode = 0;
			await bundlerCompilerService.stopBundlerCompiler("ios");
			await waitForDebounce();

			assert.lengthOf(restartRequests, 0);
		});
	});

	describe("vite single-process dev server", () => {
		const platformData = <any>{
			platformNameLowerCase: "ios",
			appDestinationDirectoryPath: "/platform/app",
		};
		const projectData = <any>{
			projectDir: "/project",
			bundler: "vite",
			bundlerConfigPath: "/project/vite.config.ts",
		};

		let serveProcess: FakeChildProcess = null;
		let spawnOptions: any = null;
		let copies: any[][] = null;
		let removals: any[][] = null;
		let syncEvents: any[] = null;
		let buildProcessStarted = false;

		beforeEach(() => {
			serveProcess = fakeChildProcess(789);
			spawnOptions = null;
			copies = [];
			removals = [];
			syncEvents = [];
			buildProcessStarted = false;

			testInjector.resolve("options").hostProjectModuleName = "app";
			const service = <any>bundlerCompilerService;
			service.getBundler = () => "vite";
			service.getBundlerExecutablePath = () => "/project/vite.js";
			service.buildEnvData = () => ({});
			service.buildEnvCommandLineParams = async (): Promise<string[]> => [];
			service.supportsViteSingleProcess = () => true;
			service.startBundleProcess = async () => {
				buildProcessStarted = true;
				return fakeChildProcess(1);
			};
			service.copyViteBundleToNative = (...args: any[]) => copies.push(args);
			service.removeViteFilesFromNative = (...args: any[]) =>
				removals.push(args);
			testInjector.resolve("childProcess").spawn = (
				_command: string,
				_args: string[],
				options: any,
			) => {
				spawnOptions = options;
				return serveProcess;
			};
			bundlerCompilerService.on(BUNDLER_COMPILATION_COMPLETE, (data) =>
				syncEvents.push(data),
			);
		});

		const compile = (prepareData: any = { hmr: true }) =>
			bundlerCompilerService.compileWithWatch(
				platformData,
				projectData,
				prepareData,
			);

		it("runs vite serve alone and starts the app on its first build message", async () => {
			const compiling = compile();
			await flush();

			assert.isFalse(buildProcessStarted);
			assert.strictEqual(spawnOptions.env.NS_VITE_SINGLE_PROCESS, "1");
			assert.strictEqual(
				(<any>bundlerCompilerService).bundlerProcesses.ios,
				serveProcess,
			);

			serveProcess.emit("message", {
				emittedFiles: ["bundle.mjs", "package.json", "assets/logo.png"],
				chunkFiles: [],
				hash: "1",
				isHMR: false,
				buildType: "initial",
			});

			assert.strictEqual(await compiling, serveProcess);
			assert.deepStrictEqual(copies, [
				["/project/.ns-vite-build/ios", "/platform/app/app"],
			]);
			assert.lengthOf(syncEvents, 0);
		});

		it("syncs the files of later messages and only removes a removed file", async () => {
			const compiling = compile();
			await flush();
			serveProcess.emit("message", {
				emittedFiles: ["bundle.mjs"],
				buildType: "initial",
			});
			await compiling;
			copies = [];
			removals = [];

			serveProcess.emit("message", {
				emittedFiles: ["assets/logo.png"],
				hash: "2",
				isHMR: false,
				buildType: "incremental",
			});
			serveProcess.emit("message", {
				emittedFiles: [],
				removedFiles: ["assets/old.png"],
				hash: "3",
				isHMR: false,
				buildType: "incremental",
			});

			assert.deepStrictEqual(copies, [
				[
					"/project/.ns-vite-build/ios",
					"/platform/app/app",
					["assets/logo.png"],
				],
				["/project/.ns-vite-build/ios", "/platform/app/app", []],
			]);
			assert.deepStrictEqual(removals, [
				["/platform/app/app", []],
				["/platform/app/app", ["assets/old.png"]],
			]);
			assert.deepStrictEqual(syncEvents, [
				{
					files: ["/platform/app/app/assets/logo.png"],
					hasOnlyHotUpdateFiles: false,
					hmrData: { hash: "2", fallbackFiles: [] },
					platform: "ios",
				},
			]);
		});

		it("fails the run when the dev server exits before its first build message", async () => {
			const compiling = compile();
			await flush();
			serveProcess.emit("exit", 1);

			await assert.isRejected(compiling, "exited with code 1");
			assert.isUndefined((<any>bundlerCompilerService).bundlerProcesses.ios);
		});

		it("stops the dev server once", async () => {
			const compiling = compile();
			await flush();
			serveProcess.emit("message", {
				emittedFiles: ["bundle.mjs"],
				buildType: "initial",
			});
			await compiling;

			const stopping = bundlerCompilerService.stopBundlerCompiler("ios");
			await flush();
			serveProcess.emit("exit", 0);
			serveProcess.emit("close", 0);
			await stopping;

			assert.deepStrictEqual(serveProcess.killSignals, ["SIGINT"]);
			assert.isUndefined((<any>bundlerCompilerService).bundlerProcesses.ios);
			assert.isUndefined((<any>bundlerCompilerService).viteServeProcesses.ios);
		});

		it("keeps the build process when the package does not support it", async () => {
			(<any>bundlerCompilerService).supportsViteSingleProcess = () => false;
			(<any>bundlerCompilerService).waitForPort = async () => true;
			void compile();
			await flush();

			assert.isTrue(buildProcessStarted);
			assert.isUndefined(spawnOptions.env.NS_VITE_SINGLE_PROCESS);
		});
	});

	describe("supportsViteSingleProcess", () => {
		let projectDir: string;
		const originalEnv = process.env.NS_VITE_SINGLE_PROCESS;

		const writeVitePackage = (pkg: object) => {
			const dir = path.join(
				projectDir,
				"node_modules",
				"@nativescript",
				"vite",
			);
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg));
		};
		const supports = (platform: string) =>
			(<any>bundlerCompilerService).supportsViteSingleProcess(platform, {
				projectDir,
			});

		beforeEach(() => {
			projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-vite-sp-"));
			(<any>bundlerCompilerService).getBundler = () => "vite";
			testInjector.resolve("fs").readJson = (file: string) =>
				JSON.parse(fs.readFileSync(file, "utf8"));
			delete process.env.NS_VITE_SINGLE_PROCESS;
		});

		afterEach(() => {
			fs.rmSync(projectDir, { recursive: true, force: true });
			if (originalEnv === undefined) {
				delete process.env.NS_VITE_SINGLE_PROCESS;
			} else {
				process.env.NS_VITE_SINGLE_PROCESS = originalEnv;
			}
		});

		it("reads the platforms the installed @nativescript/vite declares", () => {
			writeVitePackage({
				name: "@nativescript/vite",
				nativescriptCli: { singleProcessDev: ["ios", "visionos"] },
			});

			assert.isTrue(supports("ios"));
			assert.isTrue(supports("visionos"));
			assert.isFalse(supports("android"));
		});

		it("is off for a package that declares nothing, or when the user opts out", () => {
			writeVitePackage({ name: "@nativescript/vite" });
			assert.isFalse(supports("ios"));

			writeVitePackage({
				name: "@nativescript/vite",
				nativescriptCli: { singleProcessDev: ["ios"] },
			});
			process.env.NS_VITE_SINGLE_PROCESS = "0";
			assert.isFalse(supports("ios"));
		});

		it("marks the packages that accept an IPv6 dev host, opted out or not", () => {
			const accepts = (platform: string) =>
				bundlerCompilerService.acceptsIPv6DevHost(platform, <any>{
					projectDir,
				});
			writeVitePackage({ name: "@nativescript/vite" });
			assert.isFalse(accepts("iOS"));

			writeVitePackage({
				name: "@nativescript/vite",
				nativescriptCli: { singleProcessDev: ["ios"] },
			});
			process.env.NS_VITE_SINGLE_PROCESS = "0";
			assert.isTrue(accepts("iOS"));
			assert.isFalse(accepts("visionOS"));
		});
	});

	describe("stopBundlerCompiler", () => {
		const platformData = <any>{
			platformNameLowerCase: "ios",
			appDestinationDirectoryPath: "/platform/app",
		};
		const projectData = <any>{
			projectDir: "/project",
			bundler: "vite",
			bundlerConfigPath: "/project/vite.config.ts",
		};

		function registerOnStart(childProcess: FakeChildProcess): void {
			(<any>bundlerCompilerService).startBundleProcess = async () => {
				(<any>bundlerCompilerService).bundlerProcesses[
					platformData.platformNameLowerCase
				] = childProcess;
				return childProcess;
			};
		}

		it("does not resolve until the bundler child has exited", async () => {
			const childProcess = fakeChildProcess(111);
			(<any>bundlerCompilerService).bundlerProcesses.ios = childProcess;

			let stopped = false;
			const stopping = bundlerCompilerService
				.stopBundlerCompiler("ios")
				.then(() => (stopped = true));

			await flush();
			assert.deepStrictEqual(childProcess.killSignals, ["SIGINT"]);
			assert.isFalse(stopped);

			childProcess.emit("close", 0);
			await stopping;

			assert.isTrue(stopped);
			assert.isUndefined((<any>bundlerCompilerService).bundlerProcesses.ios);
		});

		it("kills a child that ignores SIGINT", async () => {
			const childProcess = fakeChildProcess(222);

			await (<any>bundlerCompilerService).terminate(childProcess, 1);

			assert.deepStrictEqual(childProcess.killSignals, ["SIGINT", "SIGKILL"]);
		});

		it("does not wait for an exit that already happened", async () => {
			const childProcess = fakeChildProcess(223);
			childProcess.exitCode = 1;

			await (<any>bundlerCompilerService).terminate(childProcess, 60_000);

			assert.deepStrictEqual(childProcess.killSignals, ["SIGINT"]);
		});

		it("does nothing when no bundler is running for the platform", async () => {
			await bundlerCompilerService.stopBundlerCompiler("ios");

			assert.isUndefined((<any>bundlerCompilerService).bundlerProcesses.ios);
		});

		it("keeps a replacement watcher when the stopped child exits late", async () => {
			const first = fakeChildProcess(11);
			const replacement = fakeChildProcess(12);
			(<any>bundlerCompilerService).bundlerProcesses.ios = first;

			const stopping = bundlerCompilerService.stopBundlerCompiler("ios");
			await flush();
			(<any>bundlerCompilerService).bundlerProcesses.ios = replacement;

			first.emit("close", 0);
			await stopping;

			assert.strictEqual(
				(<any>bundlerCompilerService).bundlerProcesses.ios,
				replacement,
			);
		});

		it("keeps a replacement watcher when a closing child runs its own handler", async () => {
			const first = fakeChildProcess(21);
			const replacement = fakeChildProcess(22);

			testInjector.resolve("options").hostProjectModuleName = "app";
			(<any>bundlerCompilerService).getBundler = () => "vite";
			(<any>bundlerCompilerService).copyViteBundleToNative = () => ({});
			registerOnStart(first);

			const compilation = bundlerCompilerService.compileWithWatch(
				platformData,
				projectData,
				<any>{ hmr: false },
			);
			await flush();
			first.emit("message", { emittedFiles: ["bundle.mjs"], hash: "hash-1" });
			await compilation;

			(<any>bundlerCompilerService).bundlerProcesses.ios = replacement;
			first.emit("close", 1);
			await flush();

			assert.strictEqual(
				(<any>bundlerCompilerService).bundlerProcesses.ios,
				replacement,
			);
		});

		it("drops compilations produced by a child it has stopped", async () => {
			const childProcess = fakeChildProcess(33);

			testInjector.resolve("options").hostProjectModuleName = "app";
			(<any>bundlerCompilerService).getBundler = () => "vite";
			(<any>bundlerCompilerService).copyViteBundleToNative = () => ({});
			registerOnStart(childProcess);

			const emittedEvents: any[] = [];
			bundlerCompilerService.on(BUNDLER_COMPILATION_COMPLETE, (data) =>
				emittedEvents.push(data),
			);

			const compilation = bundlerCompilerService.compileWithWatch(
				platformData,
				projectData,
				<any>{ hmr: false },
			);
			await flush();
			childProcess.emit("message", {
				emittedFiles: ["bundle.mjs"],
				hash: "hash-1",
			});
			await compilation;

			const stopping = bundlerCompilerService.stopBundlerCompiler("ios");
			await flush();
			childProcess.emit("close", 0);
			await stopping;

			childProcess.emit("message", {
				emittedFiles: ["bundle.mjs"],
				hash: "hash-2",
			});

			assert.lengthOf(emittedEvents, 0);
		});
	});
});
