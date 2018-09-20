import { AndroidDeviceFileSystem } from "../../../mobile/android/android-device-file-system";
import { Yok } from "../../../yok";
import { Errors } from "../../../errors";
import { Logger } from "../../../logger";
import { MobileHelper } from "../../../mobile/mobile-helper";
import { DevicePlatformsConstants } from "../../../mobile/device-platforms-constants";

import * as path from "path";
import { assert } from "chai";
import { LiveSyncPaths } from "../../../constants";

const myTestAppIdentifier = "org.nativescript.myApp";
let isAdbPushExecuted = false;
let isAdbPushAppDirCalled = false;
let androidDeviceFileSystem: Mobile.IDeviceFileSystem;

class AndroidDebugBridgeMock {
	public executeCommand(args: string[]) {
		if (args[0] === "push") {
			isAdbPushExecuted = true;
			if (args.length >= 3 && args[2] === "/data/local/tmp/sync") {
				isAdbPushAppDirCalled = true;
			}
		}

		return Promise.resolve();
	}

	public executeShellCommand() {
		return Promise.resolve();
	}

	public async pushFile(localFilePath: string, deviceFilePath: string): Promise<void> {
		await this.executeCommand(['push', localFilePath, deviceFilePath]);
	}
}

class LocalToDevicePathDataMock {
	constructor(private filePath: string) { }

	public getLocalPath(): string {
		return this.filePath;
	}

	public getDevicePath(): string {
		return  `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${path.basename(this.filePath)}`;
	}
}

class MobilePlatformsCapabilitiesMock implements Mobile.IPlatformsCapabilities {
	public getPlatformNames(): string[] {
		return _.keys(this.getAllCapabilities());
	}

	public getAllCapabilities(): IDictionary<Mobile.IPlatformCapabilities> {
		return {
			iOS: {
				"wirelessDeploy": false,
				"cableDeploy": true,
				"companion": false,
				"hostPlatformsForDeploy": ["darwin"]
			},
			Android: {
				"wirelessDeploy": false,
				"cableDeploy": true,
				"companion": false,
				"hostPlatformsForDeploy": ["win32", "darwin", "linux"]
			}
		};
	}
}

function mockFsStats(options: { isDirectory: boolean, isFile: boolean }): (filePath: string) => { isDirectory: () => boolean, isFile: () => boolean } {
	return (filePath: string) => ({
		isDirectory: (): boolean => options.isDirectory,
		isFile: (): boolean => options.isFile
	});
}

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("fs", {});
	injector.register("logger", Logger);
	injector.register("mobileHelper", MobileHelper);
	injector.register("config", {});
	injector.register("options", {});
	injector.register("errors", Errors);
	injector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilitiesMock);
	injector.register("devicePlatformsConstants", DevicePlatformsConstants);
	injector.register("projectFilesManager", {});

	return injector;
}

function createAndroidDeviceFileSystem(injector: IInjector) {
	const adb = new AndroidDebugBridgeMock();
	const androidDeviceFS = injector.resolve(AndroidDeviceFileSystem, { "adb": adb, "identifier": myTestAppIdentifier });
	androidDeviceFS.createFileOnDevice = () => Promise.resolve();
	return androidDeviceFS;
}

function createDeviceAppData(androidVersion?: string): Mobile.IDeviceAppData {
	return {
		getDeviceProjectRootPath: async () => `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${LiveSyncPaths.SYNC_DIR_NAME}`,
		appIdentifier: myTestAppIdentifier,
		device: <Mobile.IDevice>{
			deviceInfo: {
				version: androidVersion || "8.1.2"
			}
		},
		isLiveSyncSupported: async () => true,
		platform: "Android"
	};
}

function setup(options?: {
	deviceAndroidVersion?: string,
}) {
	options = options || {};
	const injector = createTestInjector();

	const projectRoot = "~/TestApp/app";
	const modifiedFileName = "test.js";
	const unmodifiedFileName = "notChangedFile.js";
	const files = [`${projectRoot}/${modifiedFileName}`, `${projectRoot}/${unmodifiedFileName}`];
	const localToDevicePaths = _.map(files, file => injector.resolve(LocalToDevicePathDataMock, { filePath: file }));

	const deviceAppData = createDeviceAppData(options.deviceAndroidVersion);

	const fs = injector.resolve("fs");
	fs.getFsStats = mockFsStats({ isDirectory: false, isFile: true });

	androidDeviceFileSystem = createAndroidDeviceFileSystem(injector);

	isAdbPushExecuted = false;
	isAdbPushAppDirCalled = false;

	return {
		localToDevicePaths,
		deviceAppData,
		projectRoot
	};
}

describe("AndroidDeviceFileSystem", () => {
	describe("transferDirectory", () => {
		it("pushes the whole directory when hash file doesn't exist on device", async () => {
			const testSetup = setup();

			await androidDeviceFileSystem.transferDirectory(testSetup.deviceAppData, testSetup.localToDevicePaths, testSetup.projectRoot);

			assert.isTrue(isAdbPushExecuted);
			assert.isTrue(isAdbPushAppDirCalled);
		});

		it("pushes the whole directory file by file on Android P when hash file doesn't exist on device", async () => {
			const testSetup = setup({
				deviceAndroidVersion: "9"
			});

			await androidDeviceFileSystem.transferDirectory(testSetup.deviceAppData, testSetup.localToDevicePaths, testSetup.projectRoot);

			assert.isTrue(isAdbPushExecuted);
			assert.isFalse(isAdbPushAppDirCalled);
		});

		it("pushes the whole directory file by file on any future Android version when hash file doesn't exist on device", async () => {
			const testSetup = setup({
				deviceAndroidVersion: "999"
			});

			await androidDeviceFileSystem.transferDirectory(testSetup.deviceAppData, testSetup.localToDevicePaths, testSetup.projectRoot);

			assert.isTrue(isAdbPushExecuted);
			assert.isFalse(isAdbPushAppDirCalled);
		});

		it("pushes the whole directory file by file on Android P", async () => {
			const testSetup = setup({
				deviceAndroidVersion: "9"
			});

			await androidDeviceFileSystem.transferDirectory(testSetup.deviceAppData, testSetup.localToDevicePaths, testSetup.projectRoot);

			assert.isTrue(isAdbPushExecuted);
			assert.isFalse(isAdbPushAppDirCalled);
		});
	});
});
