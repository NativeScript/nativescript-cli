import { Yok } from "../../../src/common/yok";
import { PreviewAppFilesService } from "../../../src/services/livesync/playground/preview-app-files-service";
import { FileSystemStub, LoggerStub } from "../../stubs";
import * as path from "path";
import { assert } from "chai";
import { FilesPayload } from "nativescript-preview-sdk";
import { IInjector } from "../../../src/common/definitions/yok";
import * as _ from "lodash";

const projectDir = "path/to/my/test/project";
const appDirectoryPath = path.join(projectDir, "src");

class ProjectDataServiceMock {
	public getProjectData() {
		return {
			getAppDirectoryPath: () => appDirectoryPath,
			appDirectoryPath: () => appDirectoryPath
		};
	}
}

class NativeProjectDataServiceMock {
	public getPlatformData(platform: string) {
		const appDestinationDirectoryPath = path.join(projectDir, "platforms", platform, "app");
		return {
			appDestinationDirectoryPath
		};
	}
}

function createTestInjector(data?: { files: string[] }) {
	const injector = new Yok();
	injector.register("previewAppFilesService", PreviewAppFilesService);
	injector.register("fs", FileSystemStub);
	injector.register("logger", LoggerStub);
	injector.register("platformsDataService", NativeProjectDataServiceMock);
	injector.register("projectDataService", ProjectDataServiceMock);
	injector.register("projectFilesManager", {
		getProjectFiles: () => data ? data.files : []
	});
	injector.register("projectFilesProvider", {
		getProjectFileInfo: (filePath: string, platform: string) => {
			return {
				filePath,
				shouldIncludeFile: true
			};
		}
	});
	return injector;
}

function getExpectedResult(data: IPreviewAppLiveSyncData, injector: IInjector, expectedFiles: string[], platform: string): FilesPayload {
	const platformData = injector.resolve("platformsDataService").getPlatformData(platform);
	const files = _.map(expectedFiles, expectedFile => {
		return {
			event: 'change',
			file: path.relative(path.join(platformData.appDestinationDirectoryPath, "app"), expectedFile),
			binary: false,
			fileContents: undefined
		};
	});

	return {
		files,
		platform,
		hmrMode: data.useHotModuleReload ? 1 : 0,
		deviceId: undefined
	};
}

describe("PreviewAppFilesService", () => {
	const testCases = [
		{
			name: ".ts files",
			files: ["dir1/file.js", "file.ts"],
			expectedFiles: [`dir1/file.js`]
		},
		{
			name: ".sass files",
			files: ["myDir1/mySubDir/myfile.css", "myDir1/mySubDir/myfile.sass"],
			expectedFiles: [`myDir1/mySubDir/myfile.css`]
		},
		{
			name: ".scss files",
			files: ["myDir1/mySubDir/myfile1.css", "myDir1/mySubDir/myfile.scss", "my/file.js"],
			expectedFiles: [`myDir1/mySubDir/myfile1.css`, `my/file.js`]
		},
		{
			name: ".less files",
			files: ["myDir1/mySubDir/myfile1.css", "myDir1/mySubDir/myfile.less", "my/file.js"],
			expectedFiles: [`myDir1/mySubDir/myfile1.css`, `my/file.js`]
		},
		{
			name: ".DS_Store file",
			files: ["my/test/file.js", ".DS_Store"],
			expectedFiles: [`my/test/file.js`]
		}
	];

	describe("getInitialFilesPayload", () => {
		_.each(testCases, testCase => {
			_.each(["ios", "android"], platform => {
				_.each([true, false], bundle => {
					_.each([true, false], useHotModuleReload => {
						it(`should exclude ${testCase.name} when  { platform: ${platform}, bundle: ${bundle}, useHotModuleReload: ${useHotModuleReload} }`, () => {
							const injector = createTestInjector({ files: testCase.files });
							const previewAppFilesService = injector.resolve("previewAppFilesService");
							const data = { projectDir, bundle, useHotModuleReload, env: {} };
							const result = previewAppFilesService.getInitialFilesPayload(data, platform);
							const expectedResult = getExpectedResult(data, injector, testCase.expectedFiles, platform);
							assert.deepEqual(result, expectedResult);
						});
					});
				});
			});
		});
	});

	describe("getFilesPayload", () => {
		_.each(testCases, testCase => {
			_.each(["ios", "android"], platform => {
				_.each([true, false], bundle => {
					_.each([true, false], useHotModuleReload => {
						it(`should exclude ${testCase.name} when  { platform: ${platform}, bundle: ${bundle}, useHotModuleReload: ${useHotModuleReload} }`, () => {
							const injector = createTestInjector();
							const previewAppFilesService: IPreviewAppFilesService = injector.resolve("previewAppFilesService");
							const data = { projectDir, bundle, useHotModuleReload, env: {} };
							const result = previewAppFilesService.getFilesPayload(data, { filesToSync: testCase.files }, platform);
							const expectedResult = getExpectedResult(data, injector, testCase.expectedFiles, platform);
							assert.deepEqual(result, expectedResult);
						});
					});
				});
			});
		});
	});
});
