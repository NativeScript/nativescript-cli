import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import * as path from "path";
import { LogSourceMapService } from "../../lib/services/log-source-map-service";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { FileSystem } from "../../lib/common/file-system";
import { stringReplaceAll } from "../../lib/common/helpers";
import { LoggerStub } from "../stubs";

let runtimeVersion = "6.0.0";
function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("projectDataService", {
		getProjectData: () => {
			return {
				getAppDirectoryRelativePath: () => {
					return "src";
				},
				projectIdentifiers: {
					android: "org.nativescript.sourceMap",
					ios: "org.nativescript.sourceMap"
				}
			};
		},
		getNSValue: (projectDir: string, propertyName: string): any => {
			return {
				version: runtimeVersion
			};
		}
	});
	testInjector.register("platformsDataService", {
		getPlatformData: (platform: string) => {
			return {
				appDestinationDirectoryPath: path.join(__dirname, "..", "files", "sourceMapBundle", platform.toLowerCase())
			};
		}
	});
	testInjector.register("fs", FileSystem);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("logger", LoggerStub);
	testInjector.register("logSourceMapService", LogSourceMapService);

	return testInjector;
}

function toPlatformSep(filePath: string) {
	return stringReplaceAll(filePath, "/", path.sep);
}

const testCases: IDictionary<Array<{ caseName: string, message: string, expected: string, runtimeVersion?: string }>> = {
	"android": [
		{
			caseName: "trace message",
			message: "JS: at module.exports.push../main-view-model.ts.HelloWorldModel.onTap (file:///data/data/org.nativescript.sourceMap/files/app/bundle.js:303:17)",
			expected: `JS: at module.exports.push../main-view-model.ts.HelloWorldModel.onTap file:///${toPlatformSep("src/main-view-model.ts")}:30:16\n`
		},
		{
			caseName: "error message",
			message: "System.err: 	Frame: function:'module.exports.push../main-view-model.ts.HelloWorldModel.onTap', file:'file:///data/data/org.nativescript.sourceMap/files/app/bundle.js', line: 304, column: 15",
			expected: `System.err: 	Frame: function:'module.exports.push../main-view-model.ts.HelloWorldModel.onTap', file:'file:///${toPlatformSep("src/main-view-model.ts")}:31:14\n`
		},
		{
			caseName: "error message no match",
			message: "System.err: 	Frame: function:'module.exports.push../main-view-model.ts.HelloWorldModel.onTap', file:'file:///data/data/org.nativescript.sourceMap/files/app/bundle.js', line: 400, column: 15",
			expected: "System.err: 	Frame: function:'module.exports.push../main-view-model.ts.HelloWorldModel.onTap', file:'file:///data/data/org.nativescript.sourceMap/files/app/bundle.js', line: 400, column: 15\n"
		},
		{
			caseName: "no file match",
			message: "System.err: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1203)",
			expected: "System.err: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1203)\n"
		}
	],
	"ios": [
		{
			caseName: "console message",
			message: "CONSOLE LOG file:///app/bundle.js:294:20: Test.",
			expected: `CONSOLE LOG file:///${toPlatformSep("src/main-view-model.ts")}:29:20 Test.\n`
		},
		{
			caseName: "trace message",
			message: "CONSOLE TRACE file:///app/bundle.js:295:22: Test",
			expected: `CONSOLE TRACE file:///${toPlatformSep("src/main-view-model.ts")}:30:22 Test\n`
		},
		{
			caseName: "error message",
			message: "file:///app/bundle.js:296:32: JS ERROR Error: Test",
			expected: `file:///${toPlatformSep("src/main-view-model.ts")}:31:31 JS ERROR Error: Test\n`
		},
		{
			caseName: "error stack tracew",
			message: "onTap@file:///app/bundle.js:296:32",
			expected: `onTap@file:///${toPlatformSep("src/main-view-model.ts")}:31:31\n`
		},
		{
			caseName: "error message no match",
			message: "file:///app/bundle.js:400:32: JS ERROR Error: Test",
			expected: "file:///app/bundle.js:400:32: JS ERROR Error: Test\n"
		},
		{
			caseName: "error stack trace (new runtime)",
			runtimeVersion: "6.1.0",
			message: "onTap(file:///app/bundle.js:296:22)",
			expected: `onTap(file:///${toPlatformSep("src/main-view-model.ts")}:31:18)\n`
		},
	]
};

describe("log-source-map-service", () => {
	describe("replaceWithOriginalFileLocations", () => {
		let logSourceMapService: Mobile.ILogSourceMapService;
		let testInjector: IInjector;
		beforeEach(async () => {
			runtimeVersion = "6.0.0";
			testInjector = createTestInjector();
			logSourceMapService = testInjector.resolve("logSourceMapService");
			const originalFilesLocation = path.join(__dirname, "..", "files", "sourceMapBundle");
			const fs = testInjector.resolve<IFileSystem>("fs");
			const files = fs.enumerateFilesInDirectorySync(originalFilesLocation);
			for (const file of files) {
				await logSourceMapService.setSourceMapConsumerForFile(file);
			}
		});

		_.forEach(testCases, (cases, platform) => {
			describe(platform, () => {
				_.forEach(cases, testCase => {
					it(testCase.caseName, () => {
						if (testCase.runtimeVersion) {
							runtimeVersion = testCase.runtimeVersion;
						}

						const result = logSourceMapService.replaceWithOriginalFileLocations(platform.toLowerCase(), testCase.message, { logLevel: "info", projectDir: "test" });
						assert.equal(result, testCase.expected);
					});
				});
			});
		});
	});
});
