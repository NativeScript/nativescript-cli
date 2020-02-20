import { Yok } from "../../../lib/common/yok";
import { WebpackCompilerService } from "../../../lib/services/webpack/webpack-compiler-service";
import { assert } from "chai";
import { ErrorsStub } from "../../stubs";

const iOSPlatformName = "ios";
const androidPlatformName = "android";
const chunkFiles = ["bundle.js", "runtime.js", "vendor.js"];

function getAllEmittedFiles(hash: string) {
	return ["bundle.js", "runtime.js", `bundle.${hash}.hot-update.js`, `${hash}.hot-update.json`];
}

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("packageManager", {
		getPackageManagerName: async () => "npm"
	});
	testInjector.register("webpackCompilerService", WebpackCompilerService);
	testInjector.register("childProcess", {});
	testInjector.register("hooksService", {});
	testInjector.register("hostInfo", {});
	testInjector.register("logger", {});
	testInjector.register("errors", ErrorsStub);
	testInjector.register("packageInstallationManager", {});
	testInjector.register("mobileHelper", {});
	testInjector.register("cleanupService", {});
	testInjector.register("fs", {
		exists: (filePath: string) => true
	});

	return testInjector;
}

describe("WebpackCompilerService", () => {
	let testInjector: IInjector = null;
	let webpackCompilerService: WebpackCompilerService = null;

	beforeEach(() => {
		testInjector = createTestInjector();
		webpackCompilerService = testInjector.resolve(WebpackCompilerService);
	});

	describe("getUpdatedEmittedFiles", () => {
		// backwards compatibility with old versions of nativescript-dev-webpack
		it("should return only hot updates when nextHash is not provided", async () => {
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, null, iOSPlatformName);
			const expectedEmittedFiles = ['bundle.hash1.hot-update.js', 'hash1.hot-update.json'];

			assert.deepEqual(result.emittedFiles, expectedEmittedFiles);
		});
		// 2 successful webpack compilations
		it("should return only hot updates when nextHash is provided", async () => {
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, "hash2", iOSPlatformName);
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash2"), chunkFiles, "hash3", iOSPlatformName);

			assert.deepEqual(result.emittedFiles, ['bundle.hash2.hot-update.js', 'hash2.hot-update.json']);
		});
		// 1 successful webpack compilation, n compilations with no emitted files
		it("should return all files when there is a webpack compilation with no emitted files", () => {
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, "hash2", iOSPlatformName);
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash4"), chunkFiles, "hash5", iOSPlatformName);

			assert.deepEqual(result.emittedFiles, ['bundle.js', 'runtime.js', 'bundle.hash4.hot-update.js', 'hash4.hot-update.json']);
		});
		// 1 successful webpack compilation, n compilations with no emitted files, 1 successful webpack compilation
		it("should return only hot updates after fixing the compilation error", () => {
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, "hash2", iOSPlatformName);
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash5"), chunkFiles, "hash6", iOSPlatformName);
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash6"), chunkFiles, "hash7", iOSPlatformName);

			assert.deepEqual(result.emittedFiles, ['bundle.hash6.hot-update.js', 'hash6.hot-update.json']);
		});
		// 1 webpack compilation with no emitted files
		it("should return all files when first compilation on livesync change is not successful", () => {
			(<any>webpackCompilerService).expectedHashes = {
				"ios": "hash1"
			};
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, "hash2", iOSPlatformName);

			assert.deepEqual(result.emittedFiles, ["bundle.hash1.hot-update.js", "hash1.hot-update.json"]);
		});
		it("should return correct hashes when there are more than one platform", () => {
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, "hash2", iOSPlatformName);
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash3"), chunkFiles, "hash4", androidPlatformName);

			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash2"), chunkFiles, "hash5", iOSPlatformName);
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash4"), chunkFiles, "hash6", androidPlatformName);

			const iOSResult = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash5"), chunkFiles, "hash7", iOSPlatformName);
			assert.deepEqual(iOSResult.emittedFiles, ["bundle.hash5.hot-update.js", "hash5.hot-update.json"]);

			const androidResult = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash6"), chunkFiles, "hash8", androidPlatformName);
			assert.deepEqual(androidResult.emittedFiles, ["bundle.hash6.hot-update.js", "hash6.hot-update.json"]);
		});
	});

	describe("compileWithWatch", () => {
		it("fails when the value set for webpackConfigPath is not existant file", async () => {
			const webpackConfigPath = "some path.js";
			testInjector.resolve("fs").exists = (filePath: string) => filePath !== webpackConfigPath;
			await assert.isRejected(webpackCompilerService.compileWithWatch(<any>{ platformNameLowerCase: "android" }, <any>{ webpackConfigPath }, <any>{}),
				`The webpack configuration file ${webpackConfigPath} does not exist. Ensure you have such file or set correct path in nsconfig.json`);
		});
	});

	describe("compileWithoutWatch", () => {
		it("fails when the value set for webpackConfigPath is not existant file", async () => {
			const webpackConfigPath = "some path.js";
			testInjector.resolve("fs").exists = (filePath: string) => filePath !== webpackConfigPath;
			await assert.isRejected(webpackCompilerService.compileWithoutWatch(<any>{ platformNameLowerCase: "android" }, <any>{ webpackConfigPath }, <any>{}),
				`The webpack configuration file ${webpackConfigPath} does not exist. Ensure you have such file or set correct path in nsconfig.json`);
		});
	});
});
