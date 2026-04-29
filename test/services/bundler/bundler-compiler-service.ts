import { Yok } from "../../../lib/common/yok";
import { BundlerCompilerService } from "../../../lib/services/bundler/bundler-compiler-service";
import { assert } from "chai";
import { EventEmitter } from "events";
import { ErrorsStub } from "../../stubs";
import { IInjector } from "../../../lib/common/definitions/yok";
import {
	BUNDLER_COMPILATION_COMPLETE,
	CONFIG_FILE_NAME_DISPLAY,
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

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("packageManager", {
		getPackageManagerName: async () => "npm",
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

	return testInjector;
}

describe("BundlerCompilerService", () => {
	let testInjector: IInjector = null;
	let bundlerCompilerService: BundlerCompilerService = null;

	beforeEach(() => {
		testInjector = createTestInjector();
		bundlerCompilerService = testInjector.resolve(BundlerCompilerService);
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
