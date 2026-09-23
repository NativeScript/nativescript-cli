import { Yok } from "../../../lib/common/yok";
import { BundlerCompilerService } from "../../../lib/services/bundler/bundler-compiler-service";
import { assert } from "chai";
import { EventEmitter } from "events";
import * as path from "path";
import { ErrorsStub } from "../../stubs";
import { IInjector } from "../../../lib/common/definitions/yok";
import {
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
});
