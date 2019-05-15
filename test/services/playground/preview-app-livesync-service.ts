import { Yok } from "../../../lib/common/yok";
import * as _ from 'lodash';
import { LoggerStub, ErrorsStub } from "../../stubs";
import { FilePayload, Device, FilesPayload } from "nativescript-preview-sdk";
import * as chai from "chai";
import * as path from "path";
import { ProjectFilesManager } from "../../../lib/common/services/project-files-manager";
import { EventEmitter } from "events";
import { PreviewAppFilesService } from "../../../lib/services/livesync/playground/preview-app-files-service";
import { PREPARE_READY_EVENT_NAME } from "../../../lib/constants";
import { PrepareData } from "../../../lib/data/prepare-data";
import { PreviewAppController } from "../../../lib/controllers/preview-app-controller";
import { PreviewAppEmitter } from "../../../lib/preview-app-emitter";
import { PrepareDataService } from "../../../lib/services/prepare-data-service";
import { MobileHelper } from "../../../lib/common/mobile/mobile-helper";
import { DevicePlatformsConstants } from "../../../lib/common/mobile/device-platforms-constants";
import { PrepareController } from "../../../lib/controllers/prepare-controller";

interface ITestCase {
	name: string;
	appFiles?: string[];
	expectedFiles?: string[];
	actOptions?: IActOptions;
	assertOptions?: IAssertOptions;
}

interface IActOptions {
	callGetInitialFiles: boolean;
	hmr: boolean;
}

interface IAssertOptions {
	checkWarnings?: boolean;
	isComparePluginsOnDeviceCalled?: boolean;
	checkInitialFiles?: boolean;
	hmr?: boolean;
}

interface IActInput {
	previewAppController?: PreviewAppController;
	previewSdkService?: PreviewSdkServiceMock;
	prepareController?: PrepareController;
	projectFiles?: string[];
	actOptions?: IActOptions;
}

let isComparePluginsOnDeviceCalled = false;
let isHMRPassedToEnv = false;
let applyChangesParams: FilePayload[] = [];
let initialFiles: FilePayload[] = [];
let readTextParams: string[] = [];
let warnParams: string[] = [];
const nativeFilesWarning = "Unable to apply changes from App_Resources folder. You need to build your application in order to make changes in App_Resources folder.";

const projectDirPath = "/path/to/my/project";
const platformsDirPath = path.join(projectDirPath, "platforms");
const normalizedPlatformName = 'iOS';

const deviceMockData = <Device>{
	platform: normalizedPlatformName
};
const defaultProjectFiles = [
	"my/test/file1.js",
	"my/test/file2.js",
	"my/test/file3.js",
	"my/test/nested/file1.js",
	"my/test/nested/file2.js",
	"my/test/nested/file3.js"
];
const syncFilesMockData = {
	projectDir: projectDirPath,
	bundle: false,
	useHotModuleReload: false,
	env: {}
};

class PreviewSdkServiceMock extends EventEmitter implements IPreviewSdkService {
	public getInitialFiles: (device: Device) => Promise<FilesPayload>;

	public getQrCodeUrl(options: IHasUseHotModuleReloadOption) {
		return "my_cool_qr_code_url";
	}

	public initialize(projectDir: string, getInitialFiles: (device: Device) => Promise<FilesPayload>) {
		this.getInitialFiles = async (device) => {
			const filesPayload = await getInitialFiles(device);
			initialFiles.push(...filesPayload.files);

			return filesPayload;
		};
	}

	public async applyChanges(files: FilesPayload) {
		applyChangesParams.push(...files.files);
	}

	public stop() {  /* empty block */ }
}

class LoggerMock extends LoggerStub {
	warn(...args: string[]): void {
		warnParams.push(...args);
	}
}

class PrepareControllerMock extends EventEmitter {
	public preparePlatform(prepareData: PrepareData) {
		isHMRPassedToEnv = prepareData.env.hmr;
		this.emit(PREPARE_READY_EVENT_NAME, { hmrData: {}, files: [] });
	}
}

function createTestInjector(options?: {
	projectFiles?: string[]
}) {
	options = options || {};

	const injector = new Yok();
	injector.register("logger", LoggerMock);
	injector.register("hmrStatusService", {
		attachToHmrStatusEvent: () => ({})
	});
	injector.register("errors", ErrorsStub);
	injector.register("platformsDataService", {
		getPlatformData: () => ({
			appDestinationDirectoryPath: platformsDirPath,
			normalizedPlatformName
		})
	});
	injector.register("projectDataService", {
		getProjectData: () => ({
			projectDir: projectDirPath,
			getAppDirectoryPath: () => path.join(projectDirPath, "app"),
			appDirectoryPath: () => path.join(projectDirPath, "app")
		})
	});
	injector.register("previewSdkService", PreviewSdkServiceMock);
	injector.register("previewAppPluginsService", {
		comparePluginsOnDevice: async () => {
			isComparePluginsOnDeviceCalled = true;
		},
		getExternalPlugins: () => <string[]>[]
	});
	injector.register("projectFilesManager", ProjectFilesManager);
	injector.register("previewAppLiveSyncService", {
		syncFilesForPlatformSafe: () => ({})
	});
	injector.register("previewAppEmitter", PreviewAppEmitter);
	injector.register("previewAppController", PreviewAppController);
	injector.register("prepareController", PrepareControllerMock);
	injector.register("prepareDataService", PrepareDataService);
	injector.register("mobileHelper", MobileHelper);
	injector.register("devicePlatformsConstants", DevicePlatformsConstants);
	injector.register("fs", {
		readText: (filePath: string) => {
			readTextParams.push(filePath);
		},
		enumerateFilesInDirectorySync: (projectFilesPath: string) => {
			if (options.projectFiles) {
				return options.projectFiles.map(file => path.join(projectDirPath, file));
			}

			return defaultProjectFiles.map(file => path.join(platformsDirPath, "app", file));
		}
	});
	injector.register("localToDevicePathDataFactory", {});
	injector.register("projectFilesProvider", {
		getProjectFileInfo: (filePath: string, platform: string) => {
			return {
				filePath,
				onDeviceFileName: path.basename(filePath),
				shouldIncludeFile: true
			};
		},
		mapFilePath: (filePath: string) => path.join(path.join(platformsDirPath, "app"), path.relative(path.join(projectDirPath, "app"), filePath))
	});
	injector.register("previewDevicesService", {
		getConnectedDevices: () => [deviceMockData]
	});
	injector.register("previewAppFilesService", PreviewAppFilesService);
	injector.register("analyticsService", {
		trackEventActionInGoogleAnalytics: () => ({})
	});

	return injector;
}

function arrange(options?: { projectFiles?: string[] }) {
	options = options || {};

	const injector = createTestInjector({ projectFiles: options.projectFiles });
	const previewSdkService: IPreviewSdkService = injector.resolve("previewSdkService");
	const previewAppController: PreviewAppController = injector.resolve("previewAppController");
	const prepareController: PrepareController = injector.resolve("prepareController");

	return {
		previewSdkService,
		previewAppController,
		prepareController,
	};
}

async function initialSync(input?: IActInput) {
	input = input || {};

	const { previewAppController, previewSdkService, actOptions } = input;
	const syncFilesData = _.cloneDeep(syncFilesMockData);
	syncFilesData.useHotModuleReload = actOptions.hmr;
	await previewAppController.preview(syncFilesData);
	if (actOptions.callGetInitialFiles) {
		await previewSdkService.getInitialFiles(deviceMockData);
	}
}

async function syncFiles(input?: IActInput) {
	input = input || {};

	const { previewAppController, previewSdkService, prepareController, projectFiles, actOptions } = input;

	const syncFilesData = _.cloneDeep(syncFilesMockData);
	syncFilesData.useHotModuleReload = actOptions.hmr;
	await previewAppController.preview(syncFilesData);
	if (actOptions.callGetInitialFiles) {
		await previewSdkService.getInitialFiles(deviceMockData);
	}

	prepareController.emit(PREPARE_READY_EVENT_NAME, { files: projectFiles });
}

async function assert(expectedFiles: string[], options?: IAssertOptions) {
	options = options || {};
	const actualFiles = options.checkInitialFiles ? initialFiles : applyChangesParams;

	chai.assert.equal(isHMRPassedToEnv, options.hmr || false);
	chai.assert.deepEqual(actualFiles, mapFiles(expectedFiles));

	if (options.checkWarnings) {
		chai.assert.deepEqual(warnParams, [nativeFilesWarning]);
	}

	if (options.isComparePluginsOnDeviceCalled) {
		chai.assert.isTrue(isComparePluginsOnDeviceCalled);
	}
}

function reset() {
	isComparePluginsOnDeviceCalled = false;
	isHMRPassedToEnv = false;
	applyChangesParams = [];
	initialFiles = [];
	readTextParams = [];
	warnParams = [];
}

function mapFiles(files: string[]): FilePayload[] {
	if (!files) {
		return [];
	}

	return files.map(file => {
		return {
			event: "change",
			file,
			fileContents: undefined,
			binary: false
		};
	});
}

function setDefaults(testCase: ITestCase): ITestCase {
	if (!testCase.actOptions) {
		testCase.actOptions = {
			callGetInitialFiles: true,
			hmr: false
		};
	}

	return testCase;
}

function execute(options: {
	testCases: ITestCase[],
	act: (input: IActInput) => Promise<void>
}) {
	const { testCases, act } = options;

	testCases.forEach(testCase => {
		testCase = setDefaults(testCase);

		it(`${testCase.name}`, async () => {
			const projectFiles = testCase.appFiles ? testCase.appFiles.map(file => path.join(projectDirPath, "app", file)) : null;
			const { previewAppController, prepareController, previewSdkService } = arrange({ projectFiles });
			await act.apply(null, [{ previewAppController, prepareController, previewSdkService, projectFiles, actOptions: testCase.actOptions }]);
			await assert(testCase.expectedFiles, testCase.assertOptions);
		});
	});
}

describe("previewAppController", () => {
	describe("initialSync", () => {
		afterEach(() => reset());

		let testCases: ITestCase[] = [
			{
				name: "should compare local plugins and plugins from preview app when devices are emitted"
			}
		];

		testCases = testCases.map(testCase => {
			testCase.assertOptions = { isComparePluginsOnDeviceCalled: true };
			return testCase;
		});

		execute({ testCases, act: initialSync });
	});

	describe("syncFiles", () => {
		afterEach(() => reset());

		const hmrTestCases: ITestCase[] = [
			{
				name: "when set to true",
				appFiles: [],
				expectedFiles: [],
				actOptions: {
					hmr: true,
					callGetInitialFiles: true
				},
				assertOptions: {
					hmr: true
				}
			},
			{
				name: "when set to false",
				appFiles: [],
				expectedFiles: [],
				actOptions: {
					hmr: false,
					callGetInitialFiles: true
				},
				assertOptions: {
					hmr: false
				}
			}
		];

		const noAppFilesTestCases: ITestCase[] = [
			{
				name: "should transfer correctly default project files",
				expectedFiles: defaultProjectFiles,
				assertOptions: {
					checkInitialFiles: true
				}
			}
		];

		const testCategories = [
			{
				name: "should handle correctly when no files are provided",
				testCases: noAppFilesTestCases
			},
			{
				name: "should pass the hmr option to the env",
				testCases: hmrTestCases
			}
		];

		testCategories.forEach(category => {
			describe(`${category.name}`, () => {
				const testCases = category.testCases;
				execute({ testCases, act: syncFiles });
			});
		});
	});
});
