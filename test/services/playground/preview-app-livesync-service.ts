import { Yok } from "../../../lib/common/yok";
import { LoggerStub } from "../../stubs";
import { FilePayload, Device } from "nativescript-preview-sdk";
import { EventEmitter } from "events";
import { PreviewAppLiveSyncService } from "../../../lib/services/livesync/playground/preview-app-livesync-service";
import * as chai from "chai";
import * as path from "path";
import { ProjectFilesManager } from "../../../lib/common/services/project-files-manager";

interface ITestCase {
	name: string;
	appFiles?: string[];
	expectedFiles?: string[];
	actOptions?: IActOptions;
	assertOptions?: IAssertOptions;
}

interface IActOptions {
	emitDeviceConnected: boolean;
}

interface IAssertOptions {
	checkWarnings?: boolean;
	isComparePluginsOnDeviceCalled?: boolean;
}

interface IActInput {
	previewAppLiveSyncService?: IPreviewAppLiveSyncService;
	previewSdkService?: IPreviewSdkService;
	projectFiles?: string[];
	actOptions?: IActOptions;
}

let isComparePluginsOnDeviceCalled = false;
let applyChangesParams: FilePayload[] = [];
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
	appFilesUpdaterOptions: {
		release: false,
		bundle: false
	},
	env: { }
};

class PreviewSdkServiceMock extends EventEmitter implements IPreviewSdkService {
	public get qrCodeUrl() {
		return "my_cool_qr_code_url";
	}

	public connectedDevices: Device[] = [deviceMockData];
	public initialize() { /* empty block */ }

	public async applyChanges(files: FilePayload[]) {
		applyChangesParams.push(...files);
	}

	public stop() {  /* empty block */ }
}

class LoggerMock extends LoggerStub {
	warn(...args: string[]): void {
		warnParams.push(...args);
	}
}

function createTestInjector(options?: {
	projectFiles?: string[]
}) {
	options = options || {};

	const injector = new Yok();
	injector.register("logger", LoggerMock);
	injector.register("platformService", {
		preparePlatform: async () => ({})
	});
	injector.register("platformsData", {
		getPlatformData: () => ({
			appDestinationDirectoryPath: platformsDirPath,
			normalizedPlatformName
		})
	});
	injector.register("projectDataService", {
		getProjectData: () => ({
			projectDir: projectDirPath
		})
	});
	injector.register("previewSdkService", PreviewSdkServiceMock);
	injector.register("previewAppPluginsService", {
		comparePluginsOnDevice: async () => {
			isComparePluginsOnDeviceCalled = true;
		}
	});
	injector.register("projectFilesManager", ProjectFilesManager);
	injector.register("previewAppLiveSyncService", PreviewAppLiveSyncService);
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
		}
	});
	injector.register("hooksService", {
		executeBeforeHooks: () => ({})
	});

	return injector;
}

function arrange(options?: { projectFiles ?: string[] }) {
	options = options || {};

	const injector = createTestInjector({ projectFiles: options.projectFiles });
	const previewAppLiveSyncService: IPreviewAppLiveSyncService = injector.resolve("previewAppLiveSyncService");
	const previewSdkService: IPreviewSdkService = injector.resolve("previewSdkService");

	return {
		previewAppLiveSyncService,
		previewSdkService
	};
}

async function initialSync(input?: IActInput) {
	input = input || {};

	const { previewAppLiveSyncService, previewSdkService, actOptions } = input;

	await previewAppLiveSyncService.initialSync(syncFilesMockData);
	if (actOptions.emitDeviceConnected) {
		previewSdkService.emit("onDeviceConnected", deviceMockData);
	}
}

async function syncFiles(input?: IActInput) {
	input = input || { };

	const { previewAppLiveSyncService, previewSdkService, projectFiles, actOptions } = input;

	if (actOptions.emitDeviceConnected) {
		previewSdkService.emit("onDeviceConnected", deviceMockData);
	}

	await previewAppLiveSyncService.syncFiles(syncFilesMockData, projectFiles);
}

async function assert(expectedFiles: string[], options?: IAssertOptions) {
	options = options || {};

	chai.assert.deepEqual(applyChangesParams, mapFiles(expectedFiles));

	if (options.checkWarnings) {
		chai.assert.deepEqual(warnParams, [nativeFilesWarning]);
	}

	if (options.isComparePluginsOnDeviceCalled) {
		chai.assert.isTrue(isComparePluginsOnDeviceCalled);
	}
}

function reset() {
	isComparePluginsOnDeviceCalled = false;
	applyChangesParams = [];
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
			file: path.relative(path.join(platformsDirPath, "app"), path.join(platformsDirPath, "app", file)),
			fileContents: undefined,
			binary: false
		};
	});
}

function setDefaults(testCase: ITestCase): ITestCase {
	if (!testCase.actOptions) {
		testCase.actOptions = {
			emitDeviceConnected: true
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
			const { previewAppLiveSyncService, previewSdkService } = arrange({ projectFiles });
			await act.apply(null, [{ previewAppLiveSyncService, previewSdkService, projectFiles, actOptions: testCase.actOptions }]);
			await assert(testCase.expectedFiles, testCase.assertOptions);
		});
	});
}

describe("previewAppLiveSyncService", () => {
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

		const excludeFilesTestCases: ITestCase[] = [
			{
				name: ".ts files",
				appFiles: ["dir1/file.js", "file.ts"],
				expectedFiles: [`dir1/file.js`]
			},
			{
				name: ".sass files",
				appFiles: ["myDir1/mySubDir/myfile.css", "myDir1/mySubDir/myfile.sass"],
				expectedFiles: [`myDir1/mySubDir/myfile.css`]
			},
			{
				name: ".scss files",
				appFiles: ["myDir1/mySubDir/myfile1.css", "myDir1/mySubDir/myfile.scss", "my/file.js"],
				expectedFiles: [`myDir1/mySubDir/myfile1.css`, `my/file.js`]
			},
			{
				name: ".less files",
				appFiles: ["myDir1/mySubDir/myfile1.css", "myDir1/mySubDir/myfile.less", "my/file.js"],
				expectedFiles: [`myDir1/mySubDir/myfile1.css`, `my/file.js`]
			},
			{
				name: ".DS_Store file",
				appFiles: ["my/test/file.js", ".DS_Store"],
				expectedFiles: [`my/test/file.js`]
			}
		];

		const nativeFilesTestCases: ITestCase[] = [
			{
				name: "Android manifest is changed",
				appFiles: ["App_Resources/Android/src/main/AndroidManifest.xml"],
				expectedFiles: []
			},
			{
				name: "Android app.gradle is changed",
				appFiles: ["App_Resources/Android/app.gradle"],
				expectedFiles: []
			},
			{
				name: "iOS Info.plist is changed",
				appFiles: ["App_Resources/iOS/Info.plist"],
				expectedFiles: []
			},
			{
				name: "iOS build.xcconfig is changed",
				appFiles: ["App_Resources/iOS/build.xcconfig"],
				expectedFiles: []
			}
		];

		const noAppFilesTestCases: ITestCase[] = [
			{
				name: "should transfer correctly default project files",
				expectedFiles: defaultProjectFiles
			}
		];

		const testCategories = [
			{
				name: "should exclude",
				testCases: excludeFilesTestCases
			},
			{
				name: "should show warning and not transfer native files when",
				testCases: nativeFilesTestCases.map(testCase => {
					testCase.assertOptions = { checkWarnings:  true };
					return testCase;
				})
			},
			{
				name: "should handle correctly when no files are provided",
				testCases: noAppFilesTestCases
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
