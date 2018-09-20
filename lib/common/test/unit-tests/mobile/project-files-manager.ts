import { assert } from "chai";
import { DeviceAppDataFactory } from "../../../mobile/device-app-data/device-app-data-factory";
import { DevicePlatformsConstants } from "../../../mobile/device-platforms-constants";
import { Errors } from "../../../errors";
import { FileSystem } from "../../../file-system";

import { HostInfo } from "../../../host-info";
import { LocalToDevicePathDataFactory } from "../../../mobile/local-to-device-path-data-factory";
import { MobileHelper } from "../../../mobile/mobile-helper";
import { ProjectFilesManager } from "../../../services/project-files-manager";
import { Logger } from "../../../logger";
import * as path from "path";
import { Yok } from "../../../yok";
import { ProjectFilesProviderBase } from "../../../services/project-files-provider-base";

import temp = require("temp");
import { LiveSyncPaths } from "../../../constants";
temp.track();

const testedApplicationIdentifier = "com.telerik.myApp";
const iOSDeviceProjectRootPath = "/Documents/AppBuilder/LiveSync/app";
const iOSDeviceSyncZipPath = "/Documents/AppBuilder/LiveSync/sync.zip";
const androidDeviceProjectRootPath = `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${LiveSyncPaths.SYNC_DIR_NAME}`;

class IOSAppIdentifierMock implements Mobile.IDeviceAppData {
	public platform = "iOS";
	public appIdentifier = testedApplicationIdentifier;
	public device: Mobile.IDevice = null;
	public getDeviceProjectRootPath = async () => iOSDeviceProjectRootPath;
	public deviceSyncZipPath = iOSDeviceSyncZipPath;

	public async isLiveSyncSupported(): Promise<boolean> {
		return true;
	}
}

class AndroidAppIdentifierMock implements Mobile.IDeviceAppData {
	public platform = "Android";
	public appIdentifier = testedApplicationIdentifier;
	public device: Mobile.IDevice = null;
	public getDeviceProjectRootPath = async () => androidDeviceProjectRootPath;

	public async isLiveSyncSupported(): Promise<boolean> {
		return true;
	}
}

class DeviceAppDataProvider {
	public createFactoryRules(): IDictionary<Mobile.IDeviceAppDataFactoryRule> {
		return {
			iOS: {
				vanilla: IOSAppIdentifierMock
			},
			Android: {
				vanilla: AndroidAppIdentifierMock
			}
		};
	}
}

class MobilePlatformsCapabilitiesMock implements Mobile.IPlatformsCapabilities {
	public getPlatformNames(): string[] {
		return _.keys(this.getAllCapabilities());
	}

	public getAllCapabilities(): IDictionary<Mobile.IPlatformCapabilities> {
		return {
			iOS: {
				wirelessDeploy: false,
				cableDeploy: true,
				companion: false,
				hostPlatformsForDeploy: ["darwin"]
			},
			Android: {
				wirelessDeploy: false,
				cableDeploy: true,
				companion: false,
				hostPlatformsForDeploy: ["win32", "darwin", "linux"]
			}
		};
	}
}

function createTestInjector(): IInjector {
	const testInjector = new Yok();

	testInjector.register("deviceAppDataFactory", DeviceAppDataFactory);
	testInjector.register("deviceAppDataProvider", DeviceAppDataProvider);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("errors", Errors);
	testInjector.register("fs", FileSystem);
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilitiesMock);
	testInjector.register("projectFilesProvider", ProjectFilesProviderBase);
	testInjector.register("projectFilesManager", ProjectFilesManager);
	testInjector.register("options", {});
	testInjector.register("staticConfig", {
		disableAnalytics: true
	});
	testInjector.register("logger", Logger);
	testInjector.register("config", {});
	return testInjector;
}

async function createFiles(testInjector: IInjector, filesToCreate: string[]): Promise<string> {
	const directoryPath = temp.mkdirSync("Project Files Manager Tests");

	_.each(filesToCreate, file => createFile(testInjector, file, "", directoryPath));

	return directoryPath;
}

function createFile(testInjector: IInjector, fileToCreate: string, fileContent: string, directoryPath?: string): string {
	const fs = testInjector.resolve("fs");
	directoryPath = !directoryPath ? temp.mkdirSync("Project Files Manager Tests") : directoryPath;

	fs.writeFile(path.join(directoryPath, fileToCreate), fileContent);

	return directoryPath;
}

describe("Project Files Manager Tests", () => {
	let testInjector: IInjector, projectFilesManager: IProjectFilesManager, deviceAppDataFactory: Mobile.IDeviceAppDataFactory;
	let mobileHelper: Mobile.IMobileHelper;

	beforeEach(() => {
		testInjector = createTestInjector();
		projectFilesManager = testInjector.resolve("projectFilesManager");
		deviceAppDataFactory = testInjector.resolve("deviceAppDataFactory");
		mobileHelper = testInjector.resolve("mobileHelper");
	});

	it("maps non-platform specific files to device file paths for ios platform", async () => {
		const deviceAppData = deviceAppDataFactory.create(testedApplicationIdentifier, "iOS", null);
		const files = ["~/TestApp/app/test.js", "~/TestApp/app/myfile.js"];
		const localToDevicePaths = await projectFilesManager.createLocalToDevicePaths(deviceAppData, "~/TestApp/app", files, []);

		_.each(localToDevicePaths, (localToDevicePathData, index) => {
			assert.equal(files[index], localToDevicePathData.getLocalPath());
			assert.equal(mobileHelper.buildDevicePath(iOSDeviceProjectRootPath, path.basename(files[index])), localToDevicePathData.getDevicePath());
			assert.equal(path.basename(files[index]), localToDevicePathData.getRelativeToProjectBasePath());
		});
	});

	it("maps non-platform specific files to device file paths for android platform", async () => {
		const deviceAppData = deviceAppDataFactory.create(testedApplicationIdentifier, "Android", null);
		const files = ["~/TestApp/app/test.js", "~/TestApp/app/myfile.js"];
		const localToDevicePaths = await projectFilesManager.createLocalToDevicePaths(deviceAppData, "~/TestApp/app", files, []);

		_.each(localToDevicePaths, (localToDevicePathData, index) => {
			assert.equal(files[index], localToDevicePathData.getLocalPath());
			assert.equal(mobileHelper.buildDevicePath(androidDeviceProjectRootPath, path.basename(files[index])), localToDevicePathData.getDevicePath());
			assert.equal(path.basename(files[index]), localToDevicePathData.getRelativeToProjectBasePath());
		});
	});

	it("maps ios platform specific file to device file path", async () => {
		const deviceAppData = deviceAppDataFactory.create(testedApplicationIdentifier, "iOS", null);
		const filePath = "~/TestApp/app/test.ios.js";
		const localToDevicePathData = (await projectFilesManager.createLocalToDevicePaths(deviceAppData, "~/TestApp/app", [filePath], []))[0];

		assert.equal(filePath, localToDevicePathData.getLocalPath());
		assert.equal(mobileHelper.buildDevicePath(iOSDeviceProjectRootPath, "test.js"), localToDevicePathData.getDevicePath());
		assert.equal("test.ios.js", localToDevicePathData.getRelativeToProjectBasePath());
	});

	it("maps android platform specific file to device file path", async () => {
		const deviceAppData = deviceAppDataFactory.create(testedApplicationIdentifier, "Android", null);
		const filePath = "~/TestApp/app/test.android.js";
		const localToDevicePathData = (await projectFilesManager.createLocalToDevicePaths(deviceAppData, "~/TestApp/app", [filePath], []))[0];

		assert.equal(filePath, localToDevicePathData.getLocalPath());
		assert.equal(mobileHelper.buildDevicePath(androidDeviceProjectRootPath, "test.js"), localToDevicePathData.getDevicePath());
		assert.equal("test.android.js", localToDevicePathData.getRelativeToProjectBasePath());
	});

	it("filters android specific files", async () => {
		const files = ["test.ios.x", "test.android.x"];
		const directoryPath = await createFiles(testInjector, files);

		projectFilesManager.processPlatformSpecificFiles(directoryPath, "android", {});

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
		createFile(testInjector, "test.release.x", releaseFileContent, directoryPath);

		projectFilesManager.processPlatformSpecificFiles(directoryPath, "android", { configuration: "release" });

		const fs = testInjector.resolve("fs");
		assert.isFalse(fs.exists(path.join(directoryPath, "test.debug.x")));
		assert.isTrue(fs.exists(path.join(directoryPath, "test.x")));
		assert.isFalse(fs.exists(path.join(directoryPath, "test.release.x")));
		assert.isTrue(fs.readFile(path.join(directoryPath, "test.x")).toString() === releaseFileContent);
	});

	it("filters debug specific files by default", async () => {
		const directoryPath = createFile(testInjector, "test.release.x", "release");
		const debugFileContent = "debug";
		createFile(testInjector, "test.debug.x", debugFileContent, directoryPath);

		projectFilesManager.processPlatformSpecificFiles(directoryPath, "android", {});

		const fs = testInjector.resolve("fs");
		assert.isFalse(fs.exists(path.join(directoryPath, "test.debug.x")));
		assert.isTrue(fs.exists(path.join(directoryPath, "test.x")));
		assert.isFalse(fs.exists(path.join(directoryPath, "test.release.x")));
		assert.isTrue(fs.readFile(path.join(directoryPath, "test.x")).toString() === debugFileContent);
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
