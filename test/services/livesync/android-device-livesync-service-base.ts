import { Yok } from "../../../lib/common/yok";
import { AndroidDeviceLiveSyncServiceBase } from "../../../lib/services/livesync/android-device-livesync-service-base";
import { LiveSyncPaths } from "../../../lib/common/constants";
import { assert } from "chai";
import * as path from "path";

interface ITestSetupInput {
	existsHashesFile?: boolean;
	addChangedFile?: boolean;
	addUnchangedFile?: boolean;
	changedFileLocalName?: string;
	unchangedFileLocalName?: string;
}

interface ITestSetupOutput {
	deviceAppData: Mobile.IDeviceAppData;
	localToDevicePaths: Mobile.ILocalToDevicePathData[];
	androidDeviceLiveSyncServiceBase: any;
	projectRoot: string;
	changedFileLocalPath: string;
	unchangedFileLocalPath: string;
}

const transferFilesOnDeviceParams: any[] = [];
let transferDirectoryOnDeviceParams: any[] = [];
let resolveParams: any[] = [];
const deleteFileParams: any[] = [];
const writeJsonParams: any[] = [];
const pushFileParams: any[] = [];

class AndroidDeviceLiveSyncServiceBaseMock extends AndroidDeviceLiveSyncServiceBase {
	constructor($injector: IInjector,
		$platformsData: any,
		$filesHashService: any,
		$logger: ILogger,
		device: Mobile.IAndroidDevice) {
		super($injector, $platformsData, $filesHashService, $logger, device);
	}

	public async transferFilesOnDevice(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		transferFilesOnDeviceParams.push({ deviceAppData, localToDevicePaths });
	}

	public async transferDirectoryOnDevice(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string): Promise<void> {
		transferDirectoryOnDeviceParams.push({ deviceAppData, localToDevicePaths, projectFilesPath });
	}
}

class LocalToDevicePathDataMock {
	constructor(private filePath: string) { }

	public getLocalPath(): string {
		return this.filePath;
	}

	public getDevicePath(): string {
		return `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${path.basename(this.filePath)}`;
	}
}

function mockPlatformsData() {
	return {
		getPlatformData: () => {
			return {
				deviceBuildOutputPath: "testDeviceBuildOutputPath"
			};
		}
	};
}

function createTestInjector() {
	const injector = new Yok();
	injector.register("fs", {});
	injector.register("mobileHelper", {
		buildDevicePath: (filePath: string) => filePath
	});
	return injector;
}

const device: Mobile.IAndroidDevice = {
	deviceInfo: mockDeviceInfo(),
	adb: mockAdb(),
	applicationManager: mockDeviceApplicationManager(),
	fileSystem: mockDeviceFileSystem(),
	isEmulator: true,
	openDeviceLogStream: () => Promise.resolve(),
	getApplicationInfo: () => Promise.resolve(null),
	init: () => Promise.resolve()
};

function mockDeviceInfo(): Mobile.IDeviceInfo {
	return {
		identifier: "testIdentifier",
		displayName: "testDisplayName",
		model: "testModel",
		version: "8.0.0",
		vendor: "Google",
		status: "",
		errorHelp: null,
		isTablet: true,
		type: "Device",
		platform: "Android"
	};
}

function createDeviceAppData(androidVersion?: string): Mobile.IDeviceAppData {
	return {
		getDeviceProjectRootPath: async () => `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${LiveSyncPaths.SYNC_DIR_NAME}`,
		appIdentifier,
		device: <Mobile.IDevice>{
			deviceInfo: {
				version: androidVersion || "8.1.2"
			}
		},
		isLiveSyncSupported: async () => true,
		platform: "Android"
	};
}

function mockAdb(): Mobile.IDeviceAndroidDebugBridge {
	return <Mobile.IDeviceAndroidDebugBridge> {
		pushFile: async (filePath: string) => {
			pushFileParams.push({ filePath });
		},
		sendBroadcastToDevice: async (action: string, extras?: IStringDictionary) => 1,
		executeCommand: () => Promise.resolve(),
		executeShellCommand: () => Promise.resolve(),
		removeFile: () => Promise.resolve(),
		getPropertyValue: async () => "testProperty",
		getDevicesSafe: async () => [],
		getDevices: async () => []
	};
}

function mockDeviceApplicationManager(): Mobile.IDeviceApplicationManager {
	return <Mobile.IDeviceApplicationManager>{};
}

function mockDeviceFileSystem(): Mobile.IDeviceFileSystem {
	return <Mobile.IDeviceFileSystem> {
		deleteFile: async (deviceFilePath, appIdentifier) => {
			deleteFileParams.push({ deviceFilePath, appIdentifier });
		}
	};
}

function mockFsStats(options: { isDirectory: boolean, isFile: boolean }): (filePath: string) => { isDirectory: () => boolean, isFile: () => boolean } {
	return (filePath: string) => ({
		isDirectory: (): boolean => options.isDirectory,
		isFile: (): boolean => options.isFile
	});
}

function mockFilesHashService() {
	return {
		saveHashes: () => ({})
	};
}

function mockLogger(): any {
	return {
		trace: () => ({})
	};
}

function createAndroidDeviceLiveSyncServiceBase() {
	const injector = new Yok();
	injector.resolve = (service, args) => resolveParams.push({ service, args });
	const androidDeviceLiveSyncServiceBase = new AndroidDeviceLiveSyncServiceBaseMock(injector, mockPlatformsData(), mockFilesHashService(), mockLogger(), device);
	return androidDeviceLiveSyncServiceBase;
}

function setup(options?: ITestSetupInput): ITestSetupOutput {
	options = options || {};
	const projectRoot = "~/TestApp/app";
	const changedFileName = "test.js";
	const unchangedFileName = "notChangedFile.js";
	const changedFileLocalPath = `${projectRoot}/${options.changedFileLocalName || changedFileName}`;
	const unchangedFileLocalPath = `${projectRoot}/${options.unchangedFileLocalName || unchangedFileName}`;
	const filesToShasums: IStringDictionary = {};
	if (options.addChangedFile) {
		filesToShasums[changedFileLocalPath] = "1";
	}
	if (options.addUnchangedFile) {
		filesToShasums[unchangedFileLocalPath] = "2";
	}

	const injector = createTestInjector();
	const localToDevicePaths = _.keys(filesToShasums).map(file => injector.resolve(LocalToDevicePathDataMock, { filePath: file }));
	const deviceAppData = createDeviceAppData();
	const androidDeviceLiveSyncServiceBase = new AndroidDeviceLiveSyncServiceBaseMock(injector, mockPlatformsData(), mockFilesHashService(), mockLogger(), device);

	const fs = injector.resolve("fs");
	fs.exists = () => options.existsHashesFile;
	fs.getFsStats = mockFsStats({ isDirectory: false, isFile: true });
	fs.getFileShasum = async (filePath: string) => filesToShasums[filePath];
	fs.writeJson = (filename: string, data: any) => writeJsonParams.push({ filename, data });
	fs.readJson = (filePath: string) => {
		const deviceHashesFileContent: IStringDictionary = {};
		deviceHashesFileContent[`${projectRoot}/${changedFileName}`] = "11";
		if (options.addUnchangedFile) {
			deviceHashesFileContent[`${projectRoot}/${unchangedFileName}`] = "2";
		}

		return deviceHashesFileContent;
	};

	return {
		localToDevicePaths,
		deviceAppData,
		androidDeviceLiveSyncServiceBase,
		projectRoot,
		changedFileLocalPath,
		unchangedFileLocalPath
	};
}

const appIdentifier = "testAppIdentifier";

async function transferFiles(testSetup: ITestSetupOutput, options: { force: boolean, isFullSync: boolean}): Promise<Mobile.ILocalToDevicePathData[]> {
	const androidDeviceLiveSyncServiceBase = testSetup.androidDeviceLiveSyncServiceBase;
	const transferredFiles = await androidDeviceLiveSyncServiceBase.transferFiles(
		testSetup.deviceAppData,
		testSetup.localToDevicePaths,
		testSetup.projectRoot,
		{},
		{},
		options
	);
	return transferredFiles;
}

describe("AndroidDeviceLiveSyncServiceBase", () => {
	describe("getDeviceHashService", () => {
		beforeEach(() => {
			resolveParams = [];
		});
		it("should resolve AndroidDeviceHashService when the key is not stored in dictionary", () => {
			const androidDeviceLiveSyncServiceBase = createAndroidDeviceLiveSyncServiceBase();
			androidDeviceLiveSyncServiceBase.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);
		});
		it("should return already stored value when the method is called for second time with the same deviceIdentifier and appIdentifier", () => {
			const androidDeviceLiveSyncServiceBase = createAndroidDeviceLiveSyncServiceBase();
			androidDeviceLiveSyncServiceBase.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);

			androidDeviceLiveSyncServiceBase.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);
		});
		it("should return AndroidDeviceHashService when the method is called for second time with different appIdentifier and same deviceIdentifier", () => {
			const androidDeviceLiveSyncServiceBase = createAndroidDeviceLiveSyncServiceBase();
			androidDeviceLiveSyncServiceBase.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);

			androidDeviceLiveSyncServiceBase.getDeviceHashService(appIdentifier);
			assert.equal(resolveParams.length, 1);
			assert.isFunction(resolveParams[0].service);
			assert.isDefined(resolveParams[0].args.adb);
			assert.equal(resolveParams[0].args.appIdentifier, appIdentifier);

			const newAppIdentifier = "myNewAppIdentifier";
			androidDeviceLiveSyncServiceBase.getDeviceHashService(newAppIdentifier);
			assert.equal(resolveParams.length, 2);
			assert.isFunction(resolveParams[1].service);
			assert.isDefined(resolveParams[1].args.adb);
			assert.equal(resolveParams[1].args.appIdentifier, newAppIdentifier);
		});
	});

	describe("transferFiles", () => {
		beforeEach(() => {
			transferDirectoryOnDeviceParams = [];
		});

		describe("when is full sync", () => {
			it("transfers the whole directory when force option is specified", async () => {
				const testSetup = setup({
					addChangedFile: true
				});
				const transferredFiles = await transferFiles(testSetup, { force: true, isFullSync: true });
				assert.equal(transferredFiles.length, 1);
				assert.equal(transferredFiles[0].getLocalPath(), testSetup.changedFileLocalPath);
				assert.equal(transferDirectoryOnDeviceParams.length, 1);
				assert.equal(transferDirectoryOnDeviceParams[0].localToDevicePaths.length, 1);
			});
			it("transfers only changed files when there are file changes", async () => {
				const testSetup = setup({
					existsHashesFile: true,
					addChangedFile: true,
				});
				const transferredFiles = await transferFiles(testSetup, { force: false, isFullSync: true });
				assert.equal(transferredFiles.length, 1);
				assert.equal(transferredFiles[0].getLocalPath(), testSetup.changedFileLocalPath);
			});
			it("transfers only changed files when there are both changed and not changed files", async () => {
				const testSetup = setup({
					existsHashesFile: true,
					addChangedFile: true,
					addUnchangedFile: true
				});
				const transferredFiles = await transferFiles(testSetup, { force: false, isFullSync: true });
				assert.equal(transferredFiles.length, 1);
				assert.equal(transferredFiles[0].getLocalPath(), testSetup.changedFileLocalPath);
			});
			it("does not transfer files when no file changes", async () => {
				const testSetup = setup({
					existsHashesFile: true,
					addChangedFile: false
				});
				const transferredFiles = await transferFiles(testSetup, { force: false, isFullSync: true });
				assert.equal(transferredFiles.length, 0);
			});
			it("transfers files which has different location and there are changed files", async () => {
				const testSetup = setup({
					existsHashesFile: true,
					addChangedFile: true,
					addUnchangedFile: true,
					unchangedFileLocalName: "newLocation/notChangedFile.js"
				});
				const transferredFiles = await transferFiles(testSetup, { force: false, isFullSync: true });
				assert.equal(transferredFiles.length, 2);
				assert.deepEqual(transferredFiles[0].getLocalPath(), testSetup.changedFileLocalPath);
				assert.deepEqual(transferredFiles[1].getLocalPath(), testSetup.unchangedFileLocalPath);
			});
			it("transfers files which has different location and no changed files", async () => {
				const testSetup = setup({
					existsHashesFile: true,
					addChangedFile: false,
					addUnchangedFile: true,
					unchangedFileLocalName: "newLocation/notChangedFile.js"
				});
				const transferredFiles = await transferFiles(testSetup, { force: false, isFullSync: true });
				assert.equal(transferredFiles.length, 1);
				assert.deepEqual(transferredFiles[0].getLocalPath(), testSetup.unchangedFileLocalPath);
			});
			it("transfers changed files with different location", async () => {
				const testSetup = setup({
					existsHashesFile: true,
					addChangedFile: true,
					changedFileLocalName: "newLocation/test.js"
				});
				const transferredFiles = await transferFiles(testSetup, { force: false, isFullSync: true });
				assert.equal(transferredFiles.length, 1);
				assert.equal(transferredFiles[0].getLocalPath(), testSetup.changedFileLocalPath);
			});
		});

		describe("when is not full sync", () => {
			it("does not transfer the whole directory when force option is specified", async () => {
				const testSetup = setup({
					addChangedFile: true
				});
				const transferredFiles = await transferFiles(testSetup, { force: true, isFullSync: false });
				assert.equal(transferredFiles.length, 1);
				assert.equal(transferredFiles[0].getLocalPath(), testSetup.changedFileLocalPath);
				assert.equal(transferDirectoryOnDeviceParams.length, 0);
			});
			it("transfers all provided files", async () => {
				const testSetup = setup({
					addChangedFile: true
				});
				const transferredFiles = await transferFiles(testSetup, { force: false, isFullSync: false });
				assert.equal(transferredFiles.length, 1);
				assert.equal(transferredFiles[0].getLocalPath(), testSetup.changedFileLocalPath);
			});
		});
	});
});
