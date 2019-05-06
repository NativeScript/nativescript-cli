// import * as yok from "../lib/common/yok";
// import * as stubs from "./stubs";
// import * as PlatformServiceLib from "../lib/services/platform-service";
// import { VERSION_STRING, PACKAGE_JSON_FILE_NAME, AddPlaformErrors } from "../lib/constants";
// import * as fsLib from "../lib/common/file-system";
// import * as optionsLib from "../lib/options";
// import * as hostInfoLib from "../lib/common/host-info";
// import * as ProjectFilesManagerLib from "../lib/common/services/project-files-manager";
// import * as path from "path";
// import { format } from "util";
// import { assert } from "chai";
// import { LocalToDevicePathDataFactory } from "../lib/common/mobile/local-to-device-path-data-factory";
// import { MobileHelper } from "../lib/common/mobile/mobile-helper";
// import { ProjectFilesProvider } from "../lib/providers/project-files-provider";
// import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
// import { XmlValidator } from "../lib/xml-validator";
// import { PlatformJSService } from "../lib/services/prepare-platform-js-service";
// import * as ChildProcessLib from "../lib/common/child-process";
// import ProjectChangesLib = require("../lib/services/project-changes-service");
// import { Messages } from "../lib/common/messages/messages";
// import { SettingsService } from "../lib/common/test/unit-tests/stubs";
// import { mkdir } from "shelljs";
// import * as constants from "../lib/constants";
// import { PlatformCommandsService } from "../lib/services/platform/platform-commands-service";
// import { StaticConfig } from "../lib/config";
// import { PlatformNativeService } from "../lib/services/prepare-platform-native-service";

// require("should");
// const temp = require("temp");
// temp.track();

// function createTestInjector() {
// 	const testInjector = new yok.Yok();

// 	testInjector.register('platformService', PlatformServiceLib.PlatformService);
// 	testInjector.register("platformCommandsService", PlatformCommandsService);
// 	testInjector.register('errors', stubs.ErrorsStub);
// 	testInjector.register('logger', stubs.LoggerStub);
// 	testInjector.register("nodeModulesDependenciesBuilder", {});
// 	testInjector.register('packageInstallationManager', stubs.PackageInstallationManagerStub);
// 	// TODO: Remove the projectData - it shouldn't be required in the service itself.
// 	testInjector.register('projectData', stubs.ProjectDataStub);
// 	testInjector.register('platformsData', stubs.PlatformsDataStub);
// 	testInjector.register('devicesService', {});
// 	testInjector.register('androidEmulatorServices', {});
// 	testInjector.register('projectDataService', stubs.ProjectDataService);
// 	testInjector.register('prompter', {});
// 	testInjector.register('sysInfo', {});
// 	testInjector.register("commandsService", {
// 		tryExecuteCommand: () => { /* intentionally left blank */ }
// 	});
// 	testInjector.register("options", optionsLib.Options);
// 	testInjector.register("hostInfo", hostInfoLib.HostInfo);
// 	testInjector.register("staticConfig", StaticConfig);
// 	testInjector.register("nodeModulesBuilder", {
// 		prepareNodeModules: () => {
// 			return Promise.resolve();
// 		},
// 		prepareJSNodeModules: () => {
// 			return Promise.resolve();
// 		}
// 	});
// 	testInjector.register("pluginsService", {
// 		getAllInstalledPlugins: () => {
// 			return <any>[];
// 		},
// 		ensureAllDependenciesAreInstalled: () => {
// 			return Promise.resolve();
// 		},
// 		validate: (platformData: IPlatformData, projectData: IProjectData) => {
// 			return Promise.resolve();
// 		}
// 	});
// 	testInjector.register("projectFilesManager", ProjectFilesManagerLib.ProjectFilesManager);
// 	testInjector.register("hooksService", stubs.HooksServiceStub);
// 	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
// 	testInjector.register("mobileHelper", MobileHelper);
// 	testInjector.register("projectFilesProvider", ProjectFilesProvider);
// 	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
// 	testInjector.register("xmlValidator", XmlValidator);
// 	testInjector.register("preparePlatformService", PlatformNativeService);
// 	testInjector.register("platformJSService", PlatformJSService);
// 	testInjector.register("packageManager", {
// 		uninstall: async () => {
// 			return true;
// 		}
// 	});
// 	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
// 	testInjector.register("projectChangesService", ProjectChangesLib.ProjectChangesService);
// 	testInjector.register("analyticsService", {
// 		track: async (): Promise<any[]> => undefined,
// 		trackEventActionInGoogleAnalytics: () => Promise.resolve()
// 	});
// 	testInjector.register("messages", Messages);
// 	testInjector.register("devicePathProvider", {});
// 	testInjector.register("helpService", {
// 		showCommandLineHelp: async (): Promise<void> => (undefined)
// 	});
// 	testInjector.register("settingsService", SettingsService);
// 	testInjector.register("terminalSpinnerService", {
// 		createSpinner: (msg: string) => ({
// 			start: (): void => undefined,
// 			stop: (): void => undefined,
// 			message: (): void => undefined
// 		})
// 	});
// 	testInjector.register("androidResourcesMigrationService", stubs.AndroidResourcesMigrationServiceStub);
// 	testInjector.register("filesHashService", {
// 		generateHashes: () => Promise.resolve(),
// 		getChanges: () => Promise.resolve({ test: "testHash" })
// 	});
// 	testInjector.register("pacoteService", {
// 		extractPackage: async (packageName: string, destinationDirectory: string, options?: IPacoteExtractOptions): Promise<void> => {
// 			mkdir(path.join(destinationDirectory, "framework"));
// 			(new fsLib.FileSystem(testInjector)).writeFile(path.join(destinationDirectory, PACKAGE_JSON_FILE_NAME), JSON.stringify({
// 				name: "package-name",
// 				version: "1.0.0"
// 			}));
// 		}
// 	});
// 	testInjector.register("usbLiveSyncService", () => ({}));
// 	testInjector.register("doctorService", {
// 		checkForDeprecatedShortImportsInAppDir: (projectDir: string): void => undefined
// 	});
// 	testInjector.register("cleanupService", {
// 		setShouldDispose: (shouldDispose: boolean): void => undefined
// 	});

// 	return testInjector;
// }

// describe('Platform Service Tests', () => {
// 	let platformCommandsService: IPlatformCommandsService, testInjector: IInjector;
// 	let platformService: IPlatformService;

// 	beforeEach(() => {
// 		testInjector = createTestInjector();
// 		testInjector.register("fs", stubs.FileSystemStub);
// 		testInjector.resolve("projectData").initializeProjectData();
// 		platformCommandsService = testInjector.resolve("platformCommandsService");
// 		platformService = testInjector.resolve("platformService");
// 		console.log("============ PLATFORM SERVICE ========== ", platformService);
// 	});

// 	// TODO: check this tests with QAs
// 	// describe("prepare platform unit tests", () => {
// 	// 	let fs: IFileSystem;

// 	// 	beforeEach(() => {
// 	// 		testInjector = createTestInjector();
// 	// 		testInjector.register("fs", fsLib.FileSystem);
// 	// 		fs = testInjector.resolve("fs");
// 	// 		testInjector.resolve("projectData").initializeProjectData();
// 	// 	});

// 	// 	function prepareDirStructure() {
// 	// 		const tempFolder = temp.mkdirSync("prepare_platform");

// 	// 		const appFolderPath = path.join(tempFolder, "app");
// 	// 		fs.createDirectory(appFolderPath);

// 	// 		const nodeModulesPath = path.join(tempFolder, "node_modules");
// 	// 		fs.createDirectory(nodeModulesPath);

// 	// 		const testsFolderPath = path.join(appFolderPath, "tests");
// 	// 		fs.createDirectory(testsFolderPath);

// 	// 		const app1FolderPath = path.join(tempFolder, "app1");
// 	// 		fs.createDirectory(app1FolderPath);

// 	// 		const appDestFolderPath = path.join(tempFolder, "appDest");
// 	// 		const appResourcesFolderPath = path.join(appDestFolderPath, "App_Resources");
// 	// 		const appResourcesPath = path.join(appFolderPath, "App_Resources/Android");
// 	// 		fs.createDirectory(appResourcesPath);
// 	// 		fs.writeFile(path.join(appResourcesPath, "test.txt"), "test");
// 	// 		fs.writeJson(path.join(tempFolder, "package.json"), {
// 	// 			name: "testname",
// 	// 			nativescript: {
// 	// 				id: "org.nativescript.testname"
// 	// 			}
// 	// 		});

// 	// 		return { tempFolder, appFolderPath, app1FolderPath, appDestFolderPath, appResourcesFolderPath };
// 	// 	}

// 	// 	async function execPreparePlatform(platformToTest: string, testDirData: any,
// 	// 		release?: boolean) {
// 	// 		const platformsData = testInjector.resolve("platformsData");
// 	// 		platformsData.platformsNames = ["ios", "android"];
// 	// 		platformsData.getPlatformData = (platform: string) => {
// 	// 			return {
// 	// 				appDestinationDirectoryPath: testDirData.appDestFolderPath,
// 	// 				appResourcesDestinationDirectoryPath: testDirData.appResourcesFolderPath,
// 	// 				normalizedPlatformName: platformToTest,
// 	// 				configurationFileName: platformToTest === "ios" ? INFO_PLIST_FILE_NAME : MANIFEST_FILE_NAME,
// 	// 				projectRoot: testDirData.tempFolder,
// 	// 				platformProjectService: {
// 	// 					prepareProject: (): any => null,
// 	// 					validate: () => Promise.resolve(),
// 	// 					createProject: (projectRoot: string, frameworkDir: string) => Promise.resolve(),
// 	// 					interpolateData: (projectRoot: string) => Promise.resolve(),
// 	// 					afterCreateProject: (projectRoot: string): any => null,
// 	// 					getAppResourcesDestinationDirectoryPath: (pData: IProjectData, frameworkVersion?: string): string => {
// 	// 						if (platform.toLowerCase() === "ios") {
// 	// 							const dirPath = path.join(testDirData.appDestFolderPath, "Resources");
// 	// 							fs.ensureDirectoryExists(dirPath);
// 	// 							return dirPath;
// 	// 						} else {
// 	// 							const dirPath = path.join(testDirData.appDestFolderPath, "src", "main", "res");
// 	// 							fs.ensureDirectoryExists(dirPath);
// 	// 							return dirPath;
// 	// 						}
// 	// 					},
// 	// 					processConfigurationFilesFromAppResources: () => Promise.resolve(),
// 	// 					handleNativeDependenciesChange: () => Promise.resolve(),
// 	// 					ensureConfigurationFileInAppResources: (): any => null,
// 	// 					interpolateConfigurationFile: (): void => undefined,
// 	// 					isPlatformPrepared: (projectRoot: string) => false,
// 	// 					prepareAppResources: (appResourcesDirectoryPath: string, pData: IProjectData): void => undefined,
// 	// 					checkForChanges: () => { /* */ }
// 	// 				}
// 	// 			};
// 	// 		};

// 	// 		const projectData = testInjector.resolve("projectData");
// 	// 		projectData.projectDir = testDirData.tempFolder;
// 	// 		projectData.projectName = "app";
// 	// 		projectData.appDirectoryPath = testDirData.appFolderPath;
// 	// 		projectData.appResourcesDirectoryPath = path.join(testDirData.appFolderPath, "App_Resources");

// 	// 		platformService = testInjector.resolve("platformService");
// 	// 		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: false, release: release, useHotModuleReload: false };
// 	// 		await platformService.preparePlatform({
// 	// 			platform: platformToTest,
// 	// 			appFilesUpdaterOptions,
// 	// 			platformTemplate: "",
// 	// 			projectData,
// 	// 			"": { provision: null, teamId: null, sdk: null, frameworkPath: null, ignoreScripts: false },
// 	// 			env: {}
// 	// 		});
// 	// 	}

// 	// 	async function testPreparePlatform(platformToTest: string, release?: boolean): Promise<CreatedTestData> {
// 	// 		const testDirData = prepareDirStructure();
// 	// 		const created: CreatedTestData = new CreatedTestData();
// 	// 		created.testDirData = testDirData;

// 	// 		// Add platform specific files to app and app1 folders
// 	// 		const platformSpecificFiles = [
// 	// 			"test1.ios.js", "test1-ios-js", "test2.android.js", "test2-android-js",
// 	// 			"main.js"
// 	// 		];

// 	// 		const destinationDirectories = [testDirData.appFolderPath, testDirData.app1FolderPath];

// 	// 		_.each(destinationDirectories, directoryPath => {
// 	// 			_.each(platformSpecificFiles, filePath => {
// 	// 				const fileFullPath = path.join(directoryPath, filePath);
// 	// 				fs.writeFile(fileFullPath, "testData");

// 	// 				created.files.push(fileFullPath);
// 	// 			});
// 	// 		});

// 	// 		// Add App_Resources file to app and app1 folders
// 	// 		_.each(destinationDirectories, directoryPath => {
// 	// 			const iosIconFullPath = path.join(directoryPath, "App_Resources/iOS/icon.png");
// 	// 			fs.writeFile(iosIconFullPath, "test-image");
// 	// 			created.resources.ios.push(iosIconFullPath);

// 	// 			const androidFullPath = path.join(directoryPath, "App_Resources/Android/icon.png");
// 	// 			fs.writeFile(androidFullPath, "test-image");
// 	// 			created.resources.android.push(androidFullPath);
// 	// 		});

// 	// 		await execPreparePlatform(platformToTest, testDirData, release);

// 	// 		const test1FileName = platformToTest.toLowerCase() === "ios" ? "test1.js" : "test2.js";
// 	// 		const test2FileName = platformToTest.toLowerCase() === "ios" ? "test2.js" : "test1.js";

// 	// 		// Asserts that the files in app folder are process as platform specific
// 	// 		assert.isTrue(fs.exists(path.join(testDirData.appDestFolderPath, "app", test1FileName)));
// 	// 		assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "app", "test1-js")));

// 	// 		assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "app", test2FileName)));
// 	// 		assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "app", "test2-js")));

// 	// 		// Asserts that the files in app1 folder aren't process as platform specific
// 	// 		assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "app1")), "Asserts that the files in app1 folder aren't process as platform specific");

// 	// 		if (release) {
// 	// 			// Asserts that the files in tests folder aren't copied
// 	// 			assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "tests")), "Asserts that the files in tests folder aren't copied");
// 	// 		}

// 	// 		return created;
// 	// 	}

// 	// 	function updateFile(files: string[], fileName: string, content: string) {
// 	// 		const fileToUpdate = _.find(files, (f) => f.indexOf(fileName) !== -1);
// 	// 		fs.writeFile(fileToUpdate, content);
// 	// 	}

// 	// 	function getDefaultFolderVerificationData(platform: string, appDestFolderPath: string) {
// 	// 		const data: any = {};
// 	// 		if (platform.toLowerCase() === "ios") {
// 	// 			data[path.join(appDestFolderPath, "app")] = {
// 	// 				missingFiles: ["test1.ios.js", "test2.android.js", "test2.js"],
// 	// 				presentFiles: ["test1.js", "test2-android-js", "test1-ios-js", "main.js"]
// 	// 			};

// 	// 			data[appDestFolderPath] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "Resources/icon.png",
// 	// 						content: "test-image"
// 	// 					}
// 	// 				]
// 	// 			};
// 	// 		} else {
// 	// 			data[path.join(appDestFolderPath, "app")] = {
// 	// 				missingFiles: ["test1.android.js", "test2.ios.js", "test1.js"],
// 	// 				presentFiles: ["test2.js", "test2-android-js", "test1-ios-js"]
// 	// 			};

// 	// 			data[appDestFolderPath] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "src/main/res/icon.png",
// 	// 						content: "test-image"
// 	// 					}
// 	// 				]
// 	// 			};
// 	// 		}

// 	// 		return data;
// 	// 	}

// 	// 	function mergeModifications(def: any, mod: any) {
// 	// 		// custom merge to reflect changes
// 	// 		const merged: any = _.cloneDeep(def);
// 	// 		_.forOwn(mod, (modFolder, folderRoot) => {
// 	// 			// whole folder not present in Default
// 	// 			if (!def.hasOwnProperty(folderRoot)) {
// 	// 				merged[folderRoot] = _.cloneDeep(modFolder[folderRoot]);
// 	// 			} else {
// 	// 				const defFolder = def[folderRoot];
// 	// 				merged[folderRoot].filesWithContent = _.merge(defFolder.filesWithContent || [], modFolder.filesWithContent || []);
// 	// 				merged[folderRoot].missingFiles = (defFolder.missingFiles || []).concat(modFolder.missingFiles || []);
// 	// 				merged[folderRoot].presentFiles = (defFolder.presentFiles || []).concat(modFolder.presentFiles || []);

// 	// 				// remove the missingFiles from the presentFiles if they were initially there
// 	// 				if (modFolder.missingFiles) {
// 	// 					merged[folderRoot].presentFiles = _.difference(defFolder.presentFiles, modFolder.missingFiles);
// 	// 				}

// 	// 				// remove the presentFiles from the missingFiles if they were initially there.
// 	// 				if (modFolder.presentFiles) {
// 	// 					merged[folderRoot].missingFiles = _.difference(defFolder.presentFiles, modFolder.presentFiles);
// 	// 				}
// 	// 			}
// 	// 		});

// 	// 		return merged;
// 	// 	}

// 	// 	// Executes a changes test case:
// 	// 	// 1. Executes Prepare Platform for the Platform
// 	// 	// 2. Applies some changes to the App. Persists the expected Modifications
// 	// 	// 3. Executes again Prepare Platform for the Platform
// 	// 	// 4. Gets the Default Destination App Structure and merges it with the Modifications
// 	// 	// 5. Asserts the Destination App matches our expectations
// 	// 	async function testChangesApplied(platform: string, applyChangesFn: (createdTestData: CreatedTestData) => any) {
// 	// 		const createdTestData = await testPreparePlatform(platform);

// 	// 		const modifications = applyChangesFn(createdTestData);

// 	// 		await execPreparePlatform(platform, createdTestData.testDirData);

// 	// 		const defaultStructure = getDefaultFolderVerificationData(platform, createdTestData.testDirData.appDestFolderPath);

// 	// 		const merged = mergeModifications(defaultStructure, modifications);

// 	// 		DestinationFolderVerifier.verify(merged, fs);
// 	// 	}

// 	// 	it("should sync only changed files, without special folders (iOS)", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "updated-content-ios";
// 	// 			updateFile(createdTestData.files, "test1.ios.js", expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[path.join(createdTestData.testDirData.appDestFolderPath, "app")] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "test1.js",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};
// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("iOS", applyChangesFn);
// 	// 	});

// 	// 	it("should sync only changed files, without special folders (Android) #2697", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "updated-content-android";
// 	// 			updateFile(createdTestData.files, "test2.android.js", expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[path.join(createdTestData.testDirData.appDestFolderPath, "app")] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "test2.js",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};
// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("Android", applyChangesFn);
// 	// 	});

// 	// 	it("Ensure App_Resources get reloaded after change in the app folder (iOS) #2560", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "updated-icon-content";
// 	// 			const iconPngPath = path.join(createdTestData.testDirData.appFolderPath, "App_Resources/iOS/icon.png");
// 	// 			fs.writeFile(iconPngPath, expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[createdTestData.testDirData.appDestFolderPath] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "Resources/icon.png",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};

// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("iOS", applyChangesFn);
// 	// 	});

// 	// 	it("Ensure App_Resources get reloaded after change in the app folder (Android) #2560", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "updated-icon-content";
// 	// 			const iconPngPath = path.join(createdTestData.testDirData.appFolderPath, "App_Resources/Android/icon.png");
// 	// 			fs.writeFile(iconPngPath, expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[createdTestData.testDirData.appDestFolderPath] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "src/main/res/icon.png",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};

// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("Android", applyChangesFn);
// 	// 	});

// 	// 	it("Ensure App_Resources get reloaded after a new file appears in the app folder (iOS) #2560", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "new-file-content";
// 	// 			const iconPngPath = path.join(createdTestData.testDirData.appFolderPath, "App_Resources/iOS/new-file.png");
// 	// 			fs.writeFile(iconPngPath, expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[createdTestData.testDirData.appDestFolderPath] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "Resources/new-file.png",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};

// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("iOS", applyChangesFn);
// 	// 	});

// 	// 	it("Ensure App_Resources get reloaded after a new file appears in the app folder (Android) #2560", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "new-file-content";
// 	// 			const iconPngPath = path.join(createdTestData.testDirData.appFolderPath, "App_Resources/Android/new-file.png");
// 	// 			fs.writeFile(iconPngPath, expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[createdTestData.testDirData.appDestFolderPath] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "src/main/res/new-file.png",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};

// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("Android", applyChangesFn);
// 	// 	});

// 	// 	it("should sync new platform specific files (iOS)", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "new-content-ios";
// 	// 			fs.writeFile(path.join(createdTestData.testDirData.appFolderPath, "test3.ios.js"), expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[path.join(createdTestData.testDirData.appDestFolderPath, "app")] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "test3.js",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};

// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("iOS", applyChangesFn);
// 	// 	});

// 	// 	it("should sync new platform specific files (Android)", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "new-content-android";
// 	// 			fs.writeFile(path.join(createdTestData.testDirData.appFolderPath, "test3.android.js"), expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[path.join(createdTestData.testDirData.appDestFolderPath, "app")] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "test3.js",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};

// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("Android", applyChangesFn);
// 	// 	});

// 	// 	it("should sync new common files (iOS)", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "new-content-ios";
// 	// 			fs.writeFile(path.join(createdTestData.testDirData.appFolderPath, "test3.js"), expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[path.join(createdTestData.testDirData.appDestFolderPath, "app")] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "test3.js",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};

// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("iOS", applyChangesFn);
// 	// 	});

// 	// 	it("should sync new common file (Android)", async () => {
// 	// 		const applyChangesFn = (createdTestData: CreatedTestData) => {
// 	// 			// apply changes
// 	// 			const expectedFileContent = "new-content-android";
// 	// 			fs.writeFile(path.join(createdTestData.testDirData.appFolderPath, "test3.js"), expectedFileContent);

// 	// 			// construct the folder modifications data
// 	// 			const modifications: any = {};
// 	// 			modifications[path.join(createdTestData.testDirData.appDestFolderPath, "app")] = {
// 	// 				filesWithContent: [
// 	// 					{
// 	// 						name: "test3.js",
// 	// 						content: expectedFileContent
// 	// 					}
// 	// 				]
// 	// 			};

// 	// 			return modifications;
// 	// 		};
// 	// 		await testChangesApplied("Android", applyChangesFn);
// 	// 	});

// 	// 	it("invalid xml is caught", async () => {
// 	// 		require("colors");
// 	// 		const testDirData = prepareDirStructure();

// 	// 		// generate invalid xml
// 	// 		const fileFullPath = path.join(testDirData.appFolderPath, "file.xml");
// 	// 		fs.writeFile(fileFullPath, "<xml><unclosedTag></xml>");

// 	// 		const platformsData = testInjector.resolve("platformsData");
// 	// 		platformsData.platformsNames = ["android"];
// 	// 		platformsData.getPlatformData = (platform: string) => {
// 	// 			return {
// 	// 				appDestinationDirectoryPath: testDirData.appDestFolderPath,
// 	// 				appResourcesDestinationDirectoryPath: testDirData.appResourcesFolderPath,
// 	// 				normalizedPlatformName: "Android",
// 	// 				projectRoot: testDirData.tempFolder,
// 	// 				configurationFileName: "configFileName",
// 	// 				platformProjectService: {
// 	// 					prepareProject: (): any => null,
// 	// 					prepareAppResources: (): any => null,
// 	// 					validate: () => Promise.resolve(),
// 	// 					createProject: (projectRoot: string, frameworkDir: string) => Promise.resolve(),
// 	// 					interpolateData: (projectRoot: string) => Promise.resolve(),
// 	// 					afterCreateProject: (projectRoot: string): any => null,
// 	// 					getAppResourcesDestinationDirectoryPath: () => testDirData.appResourcesFolderPath,
// 	// 					processConfigurationFilesFromAppResources: () => Promise.resolve(),
// 	// 					handleNativeDependenciesChange: () => Promise.resolve(),
// 	// 					ensureConfigurationFileInAppResources: (): any => null,
// 	// 					interpolateConfigurationFile: (): void => undefined,
// 	// 					isPlatformPrepared: (projectRoot: string) => false,
// 	// 					checkForChanges: () => { /* */ }
// 	// 				},
// 	// 				frameworkPackageName: "tns-ios"
// 	// 			};
// 	// 		};

// 	// 		const projectData = testInjector.resolve("projectData");
// 	// 		projectData.projectDir = testDirData.tempFolder;
// 	// 		projectData.appDirectoryPath = projectData.getAppDirectoryPath();
// 	// 		projectData.appResourcesDirectoryPath = projectData.getAppResourcesDirectoryPath();

// 	// 		platformService = testInjector.resolve("platformService");
// 	// 		const oldLoggerWarner = testInjector.resolve("$logger").warn;
// 	// 		let warnings: string = "";
// 	// 		try {
// 	// 			testInjector.resolve("$logger").warn = (text: string) => warnings += text;
// 	// 			const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: false, release: false, useHotModuleReload: false };
// 	// 			await platformService.preparePlatform({
// 	// 				platform: "android",
// 	// 				appFilesUpdaterOptions,
// 	// 				platformTemplate: "",
// 	// 				projectData,
// 	// 				"": { provision: null, teamId: null, sdk: null, frameworkPath: null, ignoreScripts: false },
// 	// 				env: {}
// 	// 			});
// 	// 		} finally {
// 	// 			testInjector.resolve("$logger").warn = oldLoggerWarner;
// 	// 		}

// 	// 		// Asserts that prepare has caught invalid xml
// 	// 		assert.isFalse(warnings.indexOf("has errors") !== -1);
// 	// 	});
// 	// });

// 	// describe("build", () => {
// 	// 	function mockData(buildOutput: string[], projectName: string): void {
// 	// 		mockPlatformsData(projectName);
// 	// 		mockFileSystem(buildOutput);
// 	// 		platformService.saveBuildInfoFile = () => undefined;
// 	// 	}

// 	// 	function mockPlatformsData(projectName: string): void {
// 	// 		const platformsData = testInjector.resolve("platformsData");
// 	// 		platformsData.getPlatformData = (platform: string) => {
// 	// 			return {
// 	// 				deviceBuildOutputPath: "",
// 	// 				normalizedPlatformName: "",
// 	// 				getBuildOutputPath: () => "",
// 	// 				platformProjectService: {
// 	// 					buildProject: () => Promise.resolve(),
// 	// 					on: () => ({}),
// 	// 					removeListener: () => ({})
// 	// 				},
// 	// 				getValidBuildOutputData: () => ({
// 	// 					packageNames: ["app-debug.apk", "app-release.apk", `${projectName}-debug.apk`, `${projectName}-release.apk`],
// 	// 					regexes: [/app-.*-(debug|release).apk/, new RegExp(`${projectName}-.*-(debug|release).apk`)]
// 	// 				})
// 	// 			};
// 	// 		};
// 	// 	}

// 	// 	function mockFileSystem(enumeratedFiles: string[]): void {
// 	// 		const fs = testInjector.resolve<IFileSystem>("fs");
// 	// 		fs.enumerateFilesInDirectorySync = () => enumeratedFiles;
// 	// 		fs.readDirectory = () => [];
// 	// 		fs.getFsStats = () => (<any>({ mtime: new Date() }));
// 	// 	}

// 	// 	describe("android platform", () => {
// 	// 		function getTestCases(configuration: string, apkName: string) {
// 	// 			return [{
// 	// 				name: "no additional options are specified in .gradle file",
// 	// 				buildOutput: [`/my/path/${configuration}/${apkName}-${configuration}.apk`],
// 	// 				expectedResult: `/my/path/${configuration}/${apkName}-${configuration}.apk`
// 	// 			}, {
// 	// 				name: "productFlavors are specified in .gradle file",
// 	// 				buildOutput: [`/my/path/arm64Demo/${configuration}/${apkName}-arm64-demo-${configuration}.apk`,
// 	// 				`/my/path/arm64Full/${configuration}/${apkName}-arm64-full-${configuration}.apk`,
// 	// 				`/my/path/armDemo/${configuration}/${apkName}-arm-demo-${configuration}.apk`,
// 	// 				`/my/path/armFull/${configuration}/${apkName}-arm-full-${configuration}.apk`,
// 	// 				`/my/path/x86Demo/${configuration}/${apkName}-x86-demo-${configuration}.apk`,
// 	// 				`/my/path/x86Full/${configuration}/${apkName}-x86-full-${configuration}.apk`],
// 	// 				expectedResult: `/my/path/x86Full/${configuration}/${apkName}-x86-full-${configuration}.apk`
// 	// 			}, {
// 	// 				name: "split options are specified in .gradle file",
// 	// 				buildOutput: [`/my/path/${configuration}/${apkName}-arm64-v8a-${configuration}.apk`,
// 	// 				`/my/path/${configuration}/${apkName}-armeabi-v7a-${configuration}.apk`,
// 	// 				`/my/path/${configuration}/${apkName}-universal-${configuration}.apk`,
// 	// 				`/my/path/${configuration}/${apkName}-x86-${configuration}.apk`],
// 	// 				expectedResult: `/my/path/${configuration}/${apkName}-x86-${configuration}.apk`
// 	// 			}, {
// 	// 				name: "android-runtime has version < 4.0.0",
// 	// 				buildOutput: [`/my/path/apk/${apkName}-${configuration}.apk`],
// 	// 				expectedResult: `/my/path/apk/${apkName}-${configuration}.apk`
// 	// 			}];
// 	// 		}

// 	// 		const platform = "Android";
// 	// 		const buildConfigs = [{ buildForDevice: false }, { buildForDevice: true }];
// 	// 		const apkNames = ["app", "testProj"];
// 	// 		const configurations = ["debug", "release"];

// 	// 		_.each(apkNames, apkName => {
// 	// 			_.each(buildConfigs, buildConfig => {
// 	// 				_.each(configurations, configuration => {
// 	// 					_.each(getTestCases(configuration, apkName), testCase => {
// 	// 						it(`should find correct ${configuration} ${apkName}.apk when ${testCase.name} and buildConfig is ${JSON.stringify(buildConfig)}`, async () => {
// 	// 							mockData(testCase.buildOutput, apkName);
// 	// 							const actualResult = await platformService.buildPlatform(platform, <IBuildConfig>buildConfig, <IProjectData>{ projectName: "" });
// 	// 							assert.deepEqual(actualResult, testCase.expectedResult);
// 	// 						});
// 	// 					});
// 	// 				});
// 	// 			});
// 	// 		});
// 	// 	});
// 	// });
// });
