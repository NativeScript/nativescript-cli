import { Yok } from "../../../lib/common/yok";
import { WebpackCompilerService } from "../../../lib/services/webpack/webpack-compiler-service";
import { assert } from "chai";

const chunkFiles = ["bundle.js", "runtime.js", "vendor.js"];

function getAllEmittedFiles(hash: string) {
	return ["bundle.js", "runtime.js", `bundle.${hash}.hot-update.js`, `${hash}.hot-update.json`];
}

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("webpackCompilerService", WebpackCompilerService);
	testInjector.register("childProcess", {});
	testInjector.register("hooksService", {});
	testInjector.register("hostInfo", {});
	testInjector.register("logger", {});
	testInjector.register("mobileHelper", {});
	testInjector.register("cleanupService", {});

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
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, null);
			const expectedEmittedFiles = ['bundle.hash1.hot-update.js', 'hash1.hot-update.json'];

			assert.deepEqual(result.emittedFiles, expectedEmittedFiles);
		});
		// 2 successful webpack compilations
		it("should return only hot updates when nextHash is provided", async () => {
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, "hash2");
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash2"), chunkFiles, "hash3");

			assert.deepEqual(result.emittedFiles, ['bundle.hash2.hot-update.js', 'hash2.hot-update.json']);
		});
		// 1 successful webpack compilation, n compilations with no emitted files
		it("should return all files when there is a webpack compilation with no emitted files", () => {
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, "hash2");
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash4"), chunkFiles, "hash5");

			assert.deepEqual(result.emittedFiles, ['bundle.js', 'runtime.js', 'bundle.hash4.hot-update.js', 'hash4.hot-update.json']);
		});
		// 1 successful webpack compilation, n compilations with no emitted files, 1 successful webpack compilation
		it("should return only hot updates after fixing the compilation error", () => {
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, "hash2");
			webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash5"), chunkFiles, "hash6");
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash6"), chunkFiles, "hash7");

			assert.deepEqual(result.emittedFiles, ['bundle.hash6.hot-update.js', 'hash6.hot-update.json']);
		});
		// 1 webpack compilation with no emitted files
		it("should return all files when first compilation on livesync change is not successful", () => {
			(<any>webpackCompilerService).expectedHash = "hash1";
			const result = webpackCompilerService.getUpdatedEmittedFiles(getAllEmittedFiles("hash1"), chunkFiles, "hash2");

			assert.deepEqual(result.emittedFiles, ["bundle.hash1.hot-update.js", "hash1.hot-update.json"]);
		});
	});
});
