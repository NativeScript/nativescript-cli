import { AndroidDeviceFileSystem } from "../../../mobile/android/android-device-file-system";
import { Yok } from "../../../yok";
import { Errors } from "../../../errors";
import { Logger } from "../../../logger/logger";
import { MobileHelper } from "../../../mobile/mobile-helper";
import { DevicePlatformsConstants } from "../../../mobile/device-platforms-constants";

import * as path from "path";
import { assert } from "chai";
import { LiveSyncPaths } from "../../../constants";
import { TempServiceStub } from "../../../../../test/stubs";

const myTestAppIdentifier = "org.nativescript.myApp";
let isAdbPushExecuted = false;
let isAdbPushAppDirCalled = false;
let androidDeviceFileSystem: Mobile.IAndroidDeviceFileSystem;

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
	injector.register("devicePlatformsConstants", DevicePlatformsConstants);
	injector.register("projectFilesManager", {});
	injector.register("tempService", TempServiceStub);
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
		platform: "Android",
		projectDir: ""
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
		projectRoot,
		injector
	};
}

let resolveParams: any[] = [];
const appIdentifier = "testAppIdentifier";

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

	describe("getDeviceHashService", () => {
		beforeEach(() => {
			resolveParams = [];
			const { injector } = setup();
			injector.resolve = (service: any, args: string[]) => resolveParams.push({ service, args });
		});
		it("should resolve AndroidDeviceHashService when the key is not stored in dictionary", () => {
			androidDeviceFileSystem.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);
		});
		it("should return already stored value when the method is called for second time with the same deviceIdentifier and appIdentifier", () => {
			androidDeviceFileSystem.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);

			androidDeviceFileSystem.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);
		});
		it("should return AndroidDeviceHashService when the method is called for second time with different appIdentifier and same deviceIdentifier", () => {
			androidDeviceFileSystem.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);

			androidDeviceFileSystem.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);

			const newAppIdentifier = "myNewAppIdentifier";
			androidDeviceFileSystem.getDeviceHashService(newAppIdentifier);
			assert.equal(resolveParams.length, 2);
			assert.isFunction(resolveParams[1].service);
			assert.isDefined(resolveParams[1].args.adb);
			assert.equal(resolveParams[1].args.appIdentifier, newAppIdentifier);
		});
	});
});
