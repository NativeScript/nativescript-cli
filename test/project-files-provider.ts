import { Yok } from "../lib/common/yok";
import { ProjectFilesProvider } from "../lib/providers/project-files-provider";
import { assert } from "chai";
import * as path from "path";

let projectDir = "projectDir",
	appDestinationDirectoryPath = "appDestinationDirectoryPath",
	appResourcesDestinationDirectoryPath = "appResourcesDestinationDirectoryPath",
	appSourceDir = path.join(projectDir, "app");

function createTestInjector(): IInjector {
	let testInjector = new Yok();
	testInjector.register("mobileHelper", {
		platformNames: ["Android", "iOS"]
	});

	testInjector.register("platformsData", {
		getPlatformData: (platform: string) => {
			return {
				appDestinationDirectoryPath: appDestinationDirectoryPath,
				normalizedPlatformName: platform.toLowerCase(),
				platformProjectService: {
					getAppResourcesDestinationDirectoryPath: () => appResourcesDestinationDirectoryPath
				}
			};
		},
	});

	testInjector.register("projectData", {
		projectDir: projectDir
	});

	testInjector.register("options", { release: false });

	return testInjector;
}

describe("project-files-provider", () => {
	let testInjector: IInjector,
		projectFilesProvider: IProjectFilesProvider;

	beforeEach(() => {
		testInjector = createTestInjector();
		projectFilesProvider = testInjector.resolve(ProjectFilesProvider);
	});

	describe("isFileExcluded", () => {
		it("returns true for .ts files", () => {
			assert.isTrue(projectFilesProvider.isFileExcluded("test.ts"));
		});

		it("returns false for .js files", () => {
			assert.isFalse(projectFilesProvider.isFileExcluded("test.js"));
		});
	});

	describe("mapFilePath", () => {
		it("returns file path from prepared project when path from app dir is passed", () => {
			let mappedFilePath = projectFilesProvider.mapFilePath(path.join(appSourceDir, "test.js"), "android");
			assert.deepEqual(mappedFilePath, path.join(appDestinationDirectoryPath, "app", "test.js"));
		});

		it("returns file path from prepared project when path from app/App_Resources/platform dir is passed", () => {
			let mappedFilePath = projectFilesProvider.mapFilePath(path.join(appSourceDir, "App_Resources", "android", "test.js"), "android");
			assert.deepEqual(mappedFilePath, path.join(appResourcesDestinationDirectoryPath, "test.js"));
		});

		it("returns null when path from app/App_Resources/android dir is passed and iOS platform is specified", () => {
			let mappedFilePath = projectFilesProvider.mapFilePath(path.join(appSourceDir, "App_Resources", "android", "test.js"), "iOS");
			assert.deepEqual(mappedFilePath, null);
		});

		it("returns null when path from app/App_Resources/ dir (not platform specific) is passed", () => {
			let mappedFilePath = projectFilesProvider.mapFilePath(path.join(appSourceDir, "App_Resources", "test.js"), "android");
			assert.deepEqual(mappedFilePath, null);
		});

		it("returns file path from prepared project when path from app dir is passed and it contains platform in its name", () => {
			let mappedFilePath = projectFilesProvider.mapFilePath(path.join(appSourceDir, "test.android.js"), "android");
			assert.deepEqual(mappedFilePath, path.join(appDestinationDirectoryPath, "app", "test.js"));
		});

		it("returns file path from prepared project when path from app dir is passed and it contains configuration in its name", () => {
			let mappedFilePath = projectFilesProvider.mapFilePath(path.join(appSourceDir, "test.debug.js"), "android");
			assert.deepEqual(mappedFilePath, path.join(appDestinationDirectoryPath, "app", "test.js"));
		});
	});
});
