import { assert } from "chai";
import { DevicePlatformsConstants } from "../../../mobile/device-platforms-constants";
import { Errors } from "../../../errors";
import { FileSystem } from "../../../file-system";
import * as _ from "lodash";
import { HostInfo } from "../../../host-info";
import { LocalToDevicePathDataFactory } from "../../../mobile/local-to-device-path-data-factory";
import { MobileHelper } from "../../../mobile/mobile-helper";
import { ProjectFilesManager } from "../../../services/project-files-manager";
import { Logger } from "../../../logger/logger";
import * as path from "path";
import { Yok } from "../../../yok";
import { ProjectFilesProviderBase } from "../../../services/project-files-provider-base";

import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { LiveSyncPaths } from "../../../constants";
import { TempServiceStub } from "../../../../../test/stubs";
import { IInjector } from "../../../definitions/yok";
import { IProjectFilesManager } from "../../../declarations";

const testedApplicationIdentifier = "com.telerik.myApp";
const iOSDeviceProjectRootPath = "/Documents/AppBuilder/LiveSync/app";
const androidDeviceProjectRootPath = `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${LiveSyncPaths.SYNC_DIR_NAME}`;

const androidDeviceAppData: Mobile.IDeviceAppData = <any>{
	appIdentifier: testedApplicationIdentifier,
	platform: "Android",
	getDeviceProjectRootPath: async () => androidDeviceProjectRootPath,
};

const iOSDeviceAppData: Mobile.IDeviceAppData = <any>{
	appIdentifier: testedApplicationIdentifier,
	platform: "iOS",
	getDeviceProjectRootPath: async () => iOSDeviceProjectRootPath,
};

function createTestInjector(): IInjector {
	const testInjector = new Yok();

	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("errors", Errors);
	testInjector.register("fs", FileSystem);
	testInjector.register("hostInfo", HostInfo);
	testInjector.register(
		"localToDevicePathDataFactory",
		LocalToDevicePathDataFactory,
	);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("projectFilesProvider", ProjectFilesProviderBase);
	testInjector.register("projectFilesManager", ProjectFilesManager);
	testInjector.register("options", {});
	testInjector.register("staticConfig", {
		disableAnalytics: true,
	});
	testInjector.register("logger", Logger);
	testInjector.register("config", {});
	testInjector.register("tempService", TempServiceStub);
	return testInjector;
}

async function createFiles(
	testInjector: IInjector,
	filesToCreate: string[],
): Promise<string> {
	const directoryPath = mkdtempSync(
		path.join(tmpdir(), "Project Files Manager Tests-"),
	);

	_.each(filesToCreate, (file) =>
		createFile(testInjector, file, "", directoryPath),
	);

	return directoryPath;
}

function createFile(
	testInjector: IInjector,
	fileToCreate: string,
	fileContent: string,
	directoryPath?: string,
): string {
	const fs = testInjector.resolve("fs");
	directoryPath = !directoryPath
		? mkdtempSync(path.join(tmpdir(), "Project Files Manager Tests-"))
		: directoryPath;

	fs.writeFile(path.join(directoryPath, fileToCreate), fileContent);

	return directoryPath;
}

describe("Project Files Manager Tests", () => {
	let testInjector: IInjector, projectFilesManager: IProjectFilesManager;
	let mobileHelper: Mobile.IMobileHelper;

	beforeEach(() => {
		testInjector = createTestInjector();
		projectFilesManager = testInjector.resolve("projectFilesManager");
		mobileHelper = testInjector.resolve("mobileHelper");
	});

	it("maps non-platform specific files to device file paths for ios platform", async () => {
		const files = ["~/TestApp/app/test.js", "~/TestApp/app/myfile.js"];
		const localToDevicePaths =
			await projectFilesManager.createLocalToDevicePaths(
				iOSDeviceAppData,
				"~/TestApp/app",
				files,
				[],
			);

		_.each(localToDevicePaths, (localToDevicePathData, index) => {
			assert.equal(files[index], localToDevicePathData.getLocalPath());
			assert.equal(
				mobileHelper.buildDevicePath(
					iOSDeviceProjectRootPath,
					path.basename(files[index]),
				),
				localToDevicePathData.getDevicePath(),
			);
			assert.equal(
				path.basename(files[index]),
				localToDevicePathData.getRelativeToProjectBasePath(),
			);
		});
	});

	it("maps non-platform specific files to device file paths for android platform", async () => {
		const files = ["~/TestApp/app/test.js", "~/TestApp/app/myfile.js"];
		const localToDevicePaths =
			await projectFilesManager.createLocalToDevicePaths(
				androidDeviceAppData,
				"~/TestApp/app",
				files,
				[],
			);

		_.each(localToDevicePaths, (localToDevicePathData, index) => {
			assert.equal(files[index], localToDevicePathData.getLocalPath());
			assert.equal(
				mobileHelper.buildDevicePath(
					androidDeviceProjectRootPath,
					path.basename(files[index]),
				),
				localToDevicePathData.getDevicePath(),
			);
			assert.equal(
				path.basename(files[index]),
				localToDevicePathData.getRelativeToProjectBasePath(),
			);
		});
	});

	it("maps ios platform specific file to device file path", async () => {
		const filePath = "~/TestApp/app/test.ios.js";
		const localToDevicePathData = (
			await projectFilesManager.createLocalToDevicePaths(
				iOSDeviceAppData,
				"~/TestApp/app",
				[filePath],
				[],
			)
		)[0];

		assert.equal(filePath, localToDevicePathData.getLocalPath());
		assert.equal(
			mobileHelper.buildDevicePath(iOSDeviceProjectRootPath, "test.js"),
			localToDevicePathData.getDevicePath(),
		);
		assert.equal(
			"test.ios.js",
			localToDevicePathData.getRelativeToProjectBasePath(),
		);
	});

	it("maps android platform specific file to device file path", async () => {
		const filePath = "~/TestApp/app/test.android.js";
		const localToDevicePathData = (
			await projectFilesManager.createLocalToDevicePaths(
				androidDeviceAppData,
				"~/TestApp/app",
				[filePath],
				[],
			)
		)[0];

		assert.equal(filePath, localToDevicePathData.getLocalPath());
		assert.equal(
			mobileHelper.buildDevicePath(androidDeviceProjectRootPath, "test.js"),
			localToDevicePathData.getDevicePath(),
		);
		assert.equal(
			"test.android.js",
			localToDevicePathData.getRelativeToProjectBasePath(),
		);
	});

	it("filters android specific files", async () => {
		const files = ["test.ios.x", "test.android.x"];
		const directoryPath = await createFiles(testInjector, files);

		projectFilesManager.processPlatformSpecificFiles(
			directoryPath,
			"android",
			{},
		);

		const fs = testInjector.resolve("fs");
		assert.isFalse(fs.exists(path.join(directoryPath, "test.ios.x")));
		assert.isTrue(fs.exists(path.join(directoryPath, "test.x")));
		assert.isFalse(fs.exists(path.join(directoryPath, "test.android.x")));
	});

	it("filters ios specific files", async () => {
		const files = ["index.ios.html", "index1.android.html", "a.test"];
		const directoryPath = await createFiles(testInjector, files);

		projectFilesManager.processPlatformSpecificFiles(directoryPath, "ios", {});

		const fs = testInjector.resolve("fs");
		assert.isFalse(fs.exists(path.join(directoryPath, "index1.android.html")));
		assert.isFalse(fs.exists(path.join(directoryPath, "index1.html")));
		assert.isTrue(fs.exists(path.join(directoryPath, "index.html")));
		assert.isTrue(fs.exists(path.join(directoryPath, "a.test")));
	});

	it("filters release specific files", async () => {
		const directoryPath = createFile(testInjector, "test.debug.x", "debug");
		const releaseFileContent = "release";
		createFile(
			testInjector,
			"test.release.x",
			releaseFileContent,
			directoryPath,
		);

		projectFilesManager.processPlatformSpecificFiles(directoryPath, "android", {
			configuration: "release",
		});

		const fs = testInjector.resolve("fs");
		assert.isFalse(fs.exists(path.join(directoryPath, "test.debug.x")));
		assert.isTrue(fs.exists(path.join(directoryPath, "test.x")));
		assert.isFalse(fs.exists(path.join(directoryPath, "test.release.x")));
		assert.isTrue(
			fs.readFile(path.join(directoryPath, "test.x")).toString() ===
				releaseFileContent,
		);
	});

	it("filters debug specific files by default", async () => {
		const directoryPath = createFile(testInjector, "test.release.x", "release");
		const debugFileContent = "debug";
		createFile(testInjector, "test.debug.x", debugFileContent, directoryPath);

		projectFilesManager.processPlatformSpecificFiles(
			directoryPath,
			"android",
			{},
		);

		const fs = testInjector.resolve("fs");
		assert.isFalse(fs.exists(path.join(directoryPath, "test.debug.x")));
		assert.isTrue(fs.exists(path.join(directoryPath, "test.x")));
		assert.isFalse(fs.exists(path.join(directoryPath, "test.release.x")));
		assert.isTrue(
			fs.readFile(path.join(directoryPath, "test.x")).toString() ===
				debugFileContent,
		);
	});

	it("doesn't filter non platform specific files", async () => {
		const files = ["index1.js", "index2.js", "index3.js"];
		const directoryPath = await createFiles(testInjector, files);

		projectFilesManager.processPlatformSpecificFiles(directoryPath, "ios", {});

		const fs = testInjector.resolve("fs");
		assert.isTrue(fs.exists(path.join(directoryPath, "index1.js")));
		assert.isTrue(fs.exists(path.join(directoryPath, "index2.js")));
		assert.isTrue(fs.exists(path.join(directoryPath, "index3.js")));
	});
});
