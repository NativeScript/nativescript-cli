import * as yok from "../lib/common/yok";
import * as stubs from "./stubs";
import * as PlatformServiceLib from "../lib/services/platform-service";
import * as StaticConfigLib from "../lib/config";
import { VERSION_STRING } from "../lib/constants";
import * as fsLib from "../lib/common/file-system";
import * as optionsLib from "../lib/options";
import * as hostInfoLib from "../lib/common/host-info";
import * as ProjectFilesManagerLib from "../lib/common/services/project-files-manager";
import * as path from "path";
import { assert } from "chai";
import { DeviceAppDataFactory } from "../lib/common/mobile/device-app-data/device-app-data-factory";
import { LocalToDevicePathDataFactory } from "../lib/common/mobile/local-to-device-path-data-factory";
import { MobileHelper } from "../lib/common/mobile/mobile-helper";
import { ProjectFilesProvider } from "../lib/providers/project-files-provider";
import { DeviceAppDataProvider } from "../lib/providers/device-app-data-provider";
import { MobilePlatformsCapabilities } from "../lib/mobile-platforms-capabilities";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { XmlValidator } from "../lib/xml-validator";
import * as ChildProcessLib from "../lib/common/child-process";
import ProjectChangesLib = require("../lib/services/project-changes-service");
import { Messages } from "../lib/common/messages/messages";

require("should");
let temp = require("temp");
temp.track();

function createTestInjector() {
	let testInjector = new yok.Yok();

	testInjector.register('platformService', PlatformServiceLib.PlatformService);
	testInjector.register('errors', stubs.ErrorsStub);
	testInjector.register('logger', stubs.LoggerStub);
	testInjector.register('npmInstallationManager', stubs.NpmInstallationManagerStub);
	testInjector.register('projectData', stubs.ProjectDataStub);
	testInjector.register('platformsData', stubs.PlatformsDataStub);
	testInjector.register('devicesService', {});
	testInjector.register('androidEmulatorServices', {});
	testInjector.register('projectDataService', stubs.ProjectDataService);
	testInjector.register('prompter', {});
	testInjector.register('sysInfo', {});
	testInjector.register('lockfile', stubs.LockFile);
	testInjector.register("commandsService", {
		tryExecuteCommand: () => { /* intentionally left blank */ }
	});
	testInjector.register("options", optionsLib.Options);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("nodeModulesBuilder", {
		prepareNodeModules: () => {
			return Promise.resolve();
		}
	});
	testInjector.register("pluginsService", {
		getAllInstalledPlugins: () => {
			return <any>[];
		},
		ensureAllDependenciesAreInstalled: () => {
			return Promise.resolve();
		},
		validate: async (platformData: IPlatformData, projectData: IProjectData) => {
			return Promise.resolve();
		}
	});
	testInjector.register("projectFilesManager", ProjectFilesManagerLib.ProjectFilesManager);
	testInjector.register("hooksService", stubs.HooksServiceStub);

	testInjector.register("deviceAppDataFactory", DeviceAppDataFactory);
	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("projectFilesProvider", ProjectFilesProvider);
	testInjector.register("deviceAppDataProvider", DeviceAppDataProvider);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("xmlValidator", XmlValidator);
	testInjector.register("npm", {
		uninstall: async () => {
			return true;
		}
	});
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	testInjector.register("projectChangesService", ProjectChangesLib.ProjectChangesService);
	testInjector.register("emulatorPlatformService", stubs.EmulatorPlatformService);
	testInjector.register("analyticsService", {
		track: async () => undefined
	});
	testInjector.register("messages", Messages);

	return testInjector;
}

describe('Platform Service Tests', () => {
	let platformService: IPlatformService, testInjector: IInjector;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", stubs.FileSystemStub);
		platformService = testInjector.resolve("platformService");
	});

	describe("add platform unit tests", () => {
		describe("#add platform()", () => {
			it("should not fail if platform is not normalized", async () => {
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;
				let projectData: IProjectData = testInjector.resolve("projectData");

				await platformService.addPlatforms(["Android"], "", projectData, null);
				await platformService.addPlatforms(["ANDROID"], "", projectData, null);
				await platformService.addPlatforms(["AnDrOiD"], "", projectData, null);
				await platformService.addPlatforms(["androiD"], "", projectData, null);

				await platformService.addPlatforms(["iOS"], "", projectData, null);
				await platformService.addPlatforms(["IOS"], "", projectData, null);
				await platformService.addPlatforms(["IoS"], "", projectData, null);
				await platformService.addPlatforms(["iOs"], "", projectData, null);
			});
			it("should fail if platform is already installed", async () => {
				let projectData: IProjectData = testInjector.resolve("projectData");
				// By default fs.exists returns true, so the platforms directory should exists
				await assert.isRejected(platformService.addPlatforms(["android"], "", projectData, null));
				await assert.isRejected(platformService.addPlatforms(["ios"], "", projectData, null));
			});
			it("should fail if npm is unavalible", async () => {
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;

				let errorMessage = "Npm is unavalible";
				let npmInstallationManager = testInjector.resolve("npmInstallationManager");
				npmInstallationManager.install = () => { throw new Error(errorMessage); };
				let projectData: IProjectData = testInjector.resolve("projectData");

				try {
					await platformService.addPlatforms(["android"], "", projectData, null);
				} catch (err) {
					assert.equal(errorMessage, err.message);
				}
			});
			it("should respect platform version in package.json's nativescript key", async () => {
				const versionString = "2.5.0";
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;

				let nsValueObject: any = {};
				nsValueObject[VERSION_STRING] = versionString;
				let projectDataService = testInjector.resolve("projectDataService");
				projectDataService.getNSValue = () => nsValueObject;

				let npmInstallationManager = testInjector.resolve("npmInstallationManager");
				npmInstallationManager.install = (packageName: string, packageDir: string, options: INpmInstallOptions) => {
					assert.deepEqual(options.version, versionString);
					return "";
				};

				let projectData: IProjectData = testInjector.resolve("projectData");

				await platformService.addPlatforms(["android"], "", projectData, null);
				await platformService.addPlatforms(["ios"], "", projectData, null);
			});
			it("should install latest platform if no information found in package.json's nativescript key", async () => {
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;

				let projectDataService = testInjector.resolve("projectDataService");
				projectDataService.getNSValue = (): any => null;

				let npmInstallationManager = testInjector.resolve("npmInstallationManager");
				npmInstallationManager.install = (packageName: string, packageDir: string, options: INpmInstallOptions) => {
					assert.deepEqual(options.version, undefined);
					return "";
				};

				let projectData: IProjectData = testInjector.resolve("projectData");

				await platformService.addPlatforms(["android"], "", projectData, null);
				await platformService.addPlatforms(["ios"], "", projectData, null);
			});
		});
		describe("#add platform(ios)", () => {
			it("should call validate method", async () => {
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;

				let errorMessage = "Xcode is not installed or Xcode version is smaller that 5.0";
				let platformsData = testInjector.resolve("platformsData");
				let platformProjectService = platformsData.getPlatformData().platformProjectService;
				let projectData: IProjectData = testInjector.resolve("projectData");
				platformProjectService.validate = () => {
					throw new Error(errorMessage);
				};

				try {
					await platformService.addPlatforms(["ios"], "", projectData, null);
				} catch (err) {
					assert.equal(errorMessage, err.message);
				}
			});
		});
		describe("#add platform(android)", () => {
			it("should fail if java, ant or android are not installed", async () => {
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;

				let errorMessage = "Java, ant or android are not installed";
				let platformsData = testInjector.resolve("platformsData");
				let platformProjectService = platformsData.getPlatformData().platformProjectService;
				platformProjectService.validate = () => {
					throw new Error(errorMessage);
				};
				let projectData: IProjectData = testInjector.resolve("projectData");

				try {
					await platformService.addPlatforms(["android"], "", projectData, null);
				} catch (err) {
					assert.equal(errorMessage, err.message);
				}
			});
		});
	});

	describe("remove platform unit tests", () => {
		it("should fail when platforms are not added", async () => {
			const ExpectedErrorsCaught = 2;
			let errorsCaught = 0;
			let projectData: IProjectData = testInjector.resolve("projectData");
			testInjector.resolve("fs").exists = () => false;

			try {
				await platformService.removePlatforms(["android"], projectData);
			} catch (e) {
				errorsCaught++;
			}

			try {
				await platformService.removePlatforms(["ios"], projectData);
			} catch (e) {
				errorsCaught++;
			}

			assert.isTrue(errorsCaught === ExpectedErrorsCaught);
		});
		it("shouldn't fail when platforms are added", async () => {
			let projectData: IProjectData = testInjector.resolve("projectData");
			testInjector.resolve("fs").exists = () => false;
			await platformService.addPlatforms(["android"], "", projectData, null);

			testInjector.resolve("fs").exists = () => true;
			await platformService.removePlatforms(["android"], projectData);
		});
	});

	describe("clean platform unit tests", () => {
		it("should preserve the specified in the project nativescript version", async () => {
			const versionString = "2.4.1";
			let fs = testInjector.resolve("fs");
			fs.exists = () => false;

			let nsValueObject: any = {};
			nsValueObject[VERSION_STRING] = versionString;
			let projectDataService = testInjector.resolve("projectDataService");
			projectDataService.getNSValue = () => nsValueObject;

			let npmInstallationManager = testInjector.resolve("npmInstallationManager");
			npmInstallationManager.install = (packageName: string, packageDir: string, options: INpmInstallOptions) => {
				assert.deepEqual(options.version, versionString);
				return "";
			};

			let projectData: IProjectData = testInjector.resolve("projectData");
			platformService.removePlatforms = (platforms: string[], prjctData: IProjectData): Promise<void> => {
				nsValueObject[VERSION_STRING] = undefined;
				return Promise.resolve();
			};

			await platformService.cleanPlatforms(["android"], "", projectData, null);

			nsValueObject[VERSION_STRING] = versionString;
			await platformService.cleanPlatforms(["ios"], "", projectData, null);
		});
	});

	// TODO: Commented as it doesn't seem correct. Check what's the case and why it's been expected to fail.
	// describe("list platform unit tests", () => {
	// 	it("fails when platforms are not added", () => {
	// 		assert.throws(async () => await  platformService.getAvailablePlatforms());
	// 	});
	// });

	describe("update Platform", () => {
		describe("#updatePlatform(platform)", () => {
			it("should fail when the versions are the same", async () => {
				let npmInstallationManager: INpmInstallationManager = testInjector.resolve("npmInstallationManager");
				npmInstallationManager.getLatestVersion = async () => "0.2.0";
				let projectData: IProjectData = testInjector.resolve("projectData");

				await assert.isRejected(platformService.updatePlatforms(["android"], "", projectData, null));
			});
		});
	});

	describe("prepare platform unit tests", () => {
		let fs: IFileSystem;

		beforeEach(() => {
			testInjector = createTestInjector();
			testInjector.register("fs", fsLib.FileSystem);
			fs = testInjector.resolve("fs");
		});

		function prepareDirStructure() {
			let tempFolder = temp.mkdirSync("prepare platform");

			let appFolderPath = path.join(tempFolder, "app");
			fs.createDirectory(appFolderPath);

			let testsFolderPath = path.join(appFolderPath, "tests");
			fs.createDirectory(testsFolderPath);

			let app1FolderPath = path.join(tempFolder, "app1");
			fs.createDirectory(app1FolderPath);

			let appDestFolderPath = path.join(tempFolder, "appDest");
			let appResourcesFolderPath = path.join(appDestFolderPath, "App_Resources");

			return { tempFolder, appFolderPath, app1FolderPath, appDestFolderPath, appResourcesFolderPath };
		}

		async function testPreparePlatform(platformToTest: string, release?: boolean) {
			let testDirData = prepareDirStructure();

			// Add platform specific files to app and app1 folders
			let platformSpecificFiles = [
				"test1.ios.js", "test1-ios-js", "test2.android.js", "test2-android-js"
			];

			let destinationDirectories = [testDirData.appFolderPath, testDirData.app1FolderPath];

			_.each(destinationDirectories, directoryPath => {
				_.each(platformSpecificFiles, filePath => {
					let fileFullPath = path.join(directoryPath, filePath);
					fs.writeFile(fileFullPath, "testData");
				});
			});

			let platformsData = testInjector.resolve("platformsData");
			platformsData.platformsNames = ["ios", "android"];
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: testDirData.appDestFolderPath,
					appResourcesDestinationDirectoryPath: testDirData.appResourcesFolderPath,
					normalizedPlatformName: platformToTest,
					projectRoot: testDirData.tempFolder,
					platformProjectService: {
						prepareProject: (): any => null,
						validate: () => Promise.resolve(),
						createProject: (projectRoot: string, frameworkDir: string) => Promise.resolve(),
						interpolateData: (projectRoot: string) => Promise.resolve(),
						afterCreateProject: (projectRoot: string): any => null,
						getAppResourcesDestinationDirectoryPath: () => "",
						processConfigurationFilesFromAppResources: () => Promise.resolve(),
						ensureConfigurationFileInAppResources: (): any => null,
						interpolateConfigurationFile: (): void => undefined,
						isPlatformPrepared: (projectRoot: string) => false
					}
				};
			};

			let projectData = testInjector.resolve("projectData");
			projectData.projectDir = testDirData.tempFolder;

			platformService = testInjector.resolve("platformService");
			const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: false, release: release };
			await platformService.preparePlatform(platformToTest, appFilesUpdaterOptions, "", projectData, undefined);

			let test1FileName = platformToTest.toLowerCase() === "ios" ? "test1.js" : "test2.js";
			let test2FileName = platformToTest.toLowerCase() === "ios" ? "test2.js" : "test1.js";

			// Asserts that the files in app folder are process as platform specific
			assert.isTrue(fs.exists(path.join(testDirData.appDestFolderPath, "app", test1FileName)));
			assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "app", "test1-js")));

			assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "app", test2FileName)));
			assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "app", "test2-js")));

			// Asserts that the files in app1 folder aren't process as platform specific
			assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "app1")), "Asserts that the files in app1 folder aren't process as platform specific");

			if (release) {
				// Asserts that the files in tests folder aren't copied
				assert.isFalse(fs.exists(path.join(testDirData.appDestFolderPath, "tests")), "Asserts that the files in tests folder aren't copied");
			}
		}

		it("should process only files in app folder when preparing for iOS platform", async () => {
			await testPreparePlatform("iOS");
		});

		it("should process only files in app folder when preparing for Android platform", async () => {
			await testPreparePlatform("Android");
		});

		it("should process only files in app folder when preparing for iOS platform", async () => {
			await testPreparePlatform("iOS", true);
		});

		it("should process only files in app folder when preparing for Android platform", async () => {
			await testPreparePlatform("Android", true);
		});

		it("invalid xml is caught", async () => {
			require("colors");
			let testDirData = prepareDirStructure();

			// generate invalid xml
			let fileFullPath = path.join(testDirData.appFolderPath, "file.xml");
			fs.writeFile(fileFullPath, "<xml><unclosedTag></xml>");

			let platformsData = testInjector.resolve("platformsData");
			platformsData.platformsNames = ["android"];
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: testDirData.appDestFolderPath,
					appResourcesDestinationDirectoryPath: testDirData.appResourcesFolderPath,
					normalizedPlatformName: "Android",
					projectRoot: testDirData.tempFolder,
					platformProjectService: {
						prepareProject: (): any => null,
						validate: () => Promise.resolve(),
						createProject: (projectRoot: string, frameworkDir: string) => Promise.resolve(),
						interpolateData: (projectRoot: string) => Promise.resolve(),
						afterCreateProject: (projectRoot: string): any => null,
						getAppResourcesDestinationDirectoryPath: () => "",
						processConfigurationFilesFromAppResources: () => Promise.resolve(),
						ensureConfigurationFileInAppResources: (): any => null,
						interpolateConfigurationFile: (): void => undefined,
						isPlatformPrepared: (projectRoot: string) => false
					}
				};
			};

			let projectData = testInjector.resolve("projectData");
			projectData.projectDir = testDirData.tempFolder;

			platformService = testInjector.resolve("platformService");
			let oldLoggerWarner = testInjector.resolve("$logger").warn;
			let warnings: string = "";
			try {
				testInjector.resolve("$logger").warn = (text: string) => warnings += text;
				const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: false, release: false };
				await platformService.preparePlatform("android", appFilesUpdaterOptions, "", projectData, undefined);
			} finally {
				testInjector.resolve("$logger").warn = oldLoggerWarner;
			}

			// Asserts that prepare has caught invalid xml
			assert.isFalse(warnings.indexOf("has errors") !== -1);
		});
	});
});
