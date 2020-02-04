import { Yok } from "../../../lib/common/yok";
import { AndroidDeviceLiveSyncServiceBase } from "../../../lib/services/livesync/android-device-livesync-service-base";
import { LiveSyncPaths } from "../../../lib/common/constants";
import { assert } from "chai";
import * as path from "path";
import { AndroidDeviceHashService } from "../../../lib/common/mobile/android/android-device-hash-service";
import { DeviceConnectionType } from "../../../lib/constants";

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
	deviceHashService: Mobile.IAndroidDeviceHashService;
}

const transferFilesOnDeviceParams: any[] = [];
let transferDirectoryOnDeviceParams: any[] = [];
const deleteFileParams: any[] = [];
const writeJsonParams: any[] = [];
const pushFileParams: any[] = [];
const appIdentifier = "testAppIdentifier";

class AndroidDeviceLiveSyncServiceBaseMock extends AndroidDeviceLiveSyncServiceBase {
	constructor($injector: IInjector,
		$platformsDataService: any,
		$filesHashService: any,
		$logger: ILogger,
		device: Mobile.IAndroidDevice) {
		super($injector, $platformsDataService, $filesHashService, $logger, device);
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

function mockDevice(deviceHashService: Mobile.IAndroidDeviceHashService): Mobile.IAndroidDevice {
	const device: Mobile.IAndroidDevice = {
		deviceInfo: mockDeviceInfo(),
		adb: mockAdb(),
		applicationManager: mockDeviceApplicationManager(),
		fileSystem: mockDeviceFileSystem(deviceHashService),
		isEmulator: true,
		isOnlyWiFiConnected: false,
		openDeviceLogStream: () => Promise.resolve(),
		init: () => Promise.resolve()
	};

	return device;
}

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
		connectionTypes: [DeviceConnectionType.USB],
		platform: "Android"
	};
}

function createDeviceAppData(deviceHashService: Mobile.IAndroidDeviceHashService): Mobile.IDeviceAppData {
	return {
		getDeviceProjectRootPath: async () => `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${LiveSyncPaths.SYNC_DIR_NAME}`,
		appIdentifier,
		device: mockDevice(deviceHashService),
		platform: "Android",
		projectDir: ""
	};
}

function mockAdb(): Mobile.IDeviceAndroidDebugBridge {
	return <Mobile.IDeviceAndroidDebugBridge>{
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

function mockDeviceFileSystem(deviceHashService: Mobile.IAndroidDeviceHashService): Mobile.IAndroidDeviceFileSystem {
	return <any>{
		deleteFile: async (deviceFilePath: string, appId: string) => {
			deleteFileParams.push({ deviceFilePath, appId });
		},
		getDeviceHashService: () => deviceHashService,
		updateHashesOnDevice: () => ({})
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
	const fs = injector.resolve("fs");
	const deviceHashService = new AndroidDeviceHashService(mockAdb(), appIdentifier, fs, injector.resolve("mobileHelper"), <any> { mkdirSync: async () => "" });
	const localToDevicePaths = _.keys(filesToShasums).map(file => injector.resolve(LocalToDevicePathDataMock, { filePath: file }));
	const deviceAppData = createDeviceAppData(deviceHashService);
	const androidDeviceLiveSyncServiceBase = new AndroidDeviceLiveSyncServiceBaseMock(injector, mockPlatformsData(), mockFilesHashService(), mockLogger(), mockDevice(deviceHashService));

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
		unchangedFileLocalPath,
		deviceHashService
	};
}

async function transferFiles(testSetup: ITestSetupOutput, options: { force: boolean, isFullSync: boolean }): Promise<Mobile.ILocalToDevicePathData[]> {
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
