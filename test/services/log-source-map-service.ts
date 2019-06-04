import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import * as path from "path";
import { LogSourceMapService } from "../../lib/services/log-source-map-service";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { FileSystem } from "../../lib/common/file-system";
import { stringReplaceAll } from "../../lib/common/helpers";

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
		}
	});
	testInjector.register("platformsDataService", {
		getPlatformData: (platform: string) => {
			return {
				appDestinationDirectoryPath: path.join(__dirname, ".." , "files", "sourceMapBundle", platform.toLowerCase())
			};
		}
	});
	testInjector.register("fs", FileSystem);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("logSourceMapService", LogSourceMapService);

	return testInjector;
}

function toPlatformSep(filePath: string) {
	return stringReplaceAll(filePath, "/", path.sep);
}

const testCases: IDictionary<Array<{caseName: string, message: string, expected: string}>> = {
	"android": [{
			caseName: "trace massage",
			message: "JS: at module.exports.push../main-view-model.ts.HelloWorldModel.onTap (file:///data/data/org.nativescript.sourceMap/files/app/bundle.js:303:17)",
			expected: `JS: at module.exports.push../main-view-model.ts.HelloWorldModel.onTap file:///${toPlatformSep("src/main-view-model.ts")}:30:16\n`
		}, {
			caseName: "error massage",
			message: "System.err: 	Frame: function:'module.exports.push../main-view-model.ts.HelloWorldModel.onTap', file:'file:///data/data/org.nativescript.sourceMap/files/app/bundle.js', line: 304, column: 15",
			expected: `System.err: 	Frame: function:'module.exports.push../main-view-model.ts.HelloWorldModel.onTap', file:' file:///${toPlatformSep("src/main-view-model.ts")}:31:14\n`
		}],
	"ios": [{
			caseName: "console massage",
			message: "CONSOLE LOG file:///app/bundle.js:294:20: Test.",
			expected: `CONSOLE LOG Test. file:///${toPlatformSep("src/main-view-model.ts")}:29:20\n`
		}, {
			caseName: "trace massage",
			message: "CONSOLE TRACE file:///app/bundle.js:295:22: Test",
			expected: `CONSOLE TRACE Test file:///${toPlatformSep("src/main-view-model.ts")}:30:22\n`
		}, {
			caseName: "error massage",
			message: "file:///app/bundle.js:296:32: JS ERROR Error: Test",
			expected: `JS ERROR Error Test file:///${toPlatformSep("src/main-view-model.ts")}:31:31\n`
		}]
};

describe("log-source-map-service", () => {
	describe("replaceWithOriginalFileLocations", () => {
		let logSourceMapService: Mobile.ILogSourceMapService;
		before(() => {
			const testInjector = createTestInjector();
			logSourceMapService = testInjector.resolve("logSourceMapService");
		});

		_.forEach(testCases, ( cases, platform ) => {
			describe(platform, () => {
				_.forEach(cases, testCase => {
					it(testCase.caseName, () => {
						const result = logSourceMapService.replaceWithOriginalFileLocations(platform.toLowerCase(), testCase.message, {logLevel:"info", projectDir: "test"});

						assert.equal(result, testCase.expected);
					});
				});
			});
		});
	});
});
