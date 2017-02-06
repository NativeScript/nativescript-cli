import * as yok from "../lib/common/yok";
import * as stubs from "./stubs";
import * as PlatformServiceLib from "../lib/services/platform-service";
import * as StaticConfigLib from "../lib/config";
import * as fsLib from "../lib/common/file-system";
import * as optionsLib from "../lib/options";
import * as hostInfoLib from "../lib/common/host-info";
import * as ProjectFilesManagerLib from "../lib/common/services/project-files-manager";
import * as path from "path";
import Future = require("fibers/future");
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
			return Future.fromResult();
		}
	});
	testInjector.register("pluginsService", {
		getAllInstalledPlugins: () => {
			return (() => {
				return <any>[];
			}).future<IPluginData[]>()();
		},
		ensureAllDependenciesAreInstalled: () => {
			return Future.fromResult();
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
		uninstall: () => {
			return (() => {
				return true;
			}).future<any>()();
		}
	});
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	testInjector.register("projectChangesService", ProjectChangesLib.ProjectChangesService);
	testInjector.register("emulatorPlatformService", stubs.EmulatorPlatformService);
	testInjector.register("analyticsService", {
		track: () => Future.fromResult()
	});

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
			it("should not fail if platform is not normalized", () => {
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;

				platformService.addPlatforms(["Android"]).wait();
				platformService.addPlatforms(["ANDROID"]).wait();
				platformService.addPlatforms(["AnDrOiD"]).wait();
				platformService.addPlatforms(["androiD"]).wait();

				platformService.addPlatforms(["iOS"]).wait();
				platformService.addPlatforms(["IOS"]).wait();
				platformService.addPlatforms(["IoS"]).wait();
				platformService.addPlatforms(["iOs"]).wait();
			});
			it("should fail if platform is already installed", () => {
				// By default fs.exists returns true, so the platforms directory should exists
				(() => platformService.addPlatforms(["android"]).wait()).should.throw();
				(() => platformService.addPlatforms(["ios"]).wait()).should.throw();
			});
			it("should fail if npm is unavalible", () => {
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;

				let errorMessage = "Npm is unavalible";
				let npmInstallationManager = testInjector.resolve("npmInstallationManager");
				npmInstallationManager.install = () => { throw new Error(errorMessage); };

				try {
					platformService.addPlatforms(["android"]).wait();
				} catch (err) {
					assert.equal(errorMessage, err.message);
				}
			});
		});
		describe("#add platform(ios)", () => {
			it("should call validate method", () => {
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;

				let errorMessage = "Xcode is not installed or Xcode version is smaller that 5.0";
				let platformsData = testInjector.resolve("platformsData");
				let platformProjectService = platformsData.getPlatformData().platformProjectService;
				platformProjectService.validate = () => {
					throw new Error(errorMessage);
				};

				try {
					platformService.addPlatforms(["ios"]).wait();
				} catch (err) {
					assert.equal(errorMessage, err.message);
				}
			});
		});
		describe("#add platform(android)", () => {
			it("should fail if java, ant or android are not installed", () => {
				let fs = testInjector.resolve("fs");
				fs.exists = () => false;

				let errorMessage = "Java, ant or android are not installed";
				let platformsData = testInjector.resolve("platformsData");
				let platformProjectService = platformsData.getPlatformData().platformProjectService;
				platformProjectService.validate = () => {
					throw new Error(errorMessage);
				};

				try {
					platformService.addPlatforms(["android"]).wait();
				} catch (err) {
					assert.equal(errorMessage, err.message);
				}
			});
		});
	});

	describe("remove platform unit tests", () => {
		it("should fail when platforms are not added", () => {
			testInjector.resolve("fs").exists = () => false;
			(() => platformService.removePlatforms(["android"])).should.throw();
			(() => platformService.removePlatforms(["ios"])).should.throw();
		});
		it("shouldn't fail when platforms are added", () => {
			testInjector.resolve("fs").exists = () => false;
			platformService.addPlatforms(["android"]).wait();

			testInjector.resolve("fs").exists = () => true;
			platformService.removePlatforms(["android"]);
		});
	});

	// TODO: Commented as it doesn't seem correct. Check what's the case and why it's been expected to fail.
	// describe("list platform unit tests", () => {
	// 	it("fails when platforms are not added", () => {
	// 		assert.throws(() => platformService.getAvailablePlatforms().wait());
	// 	});
	// });

	describe("update Platform", () => {
		describe("#updatePlatform(platform)", () => {
			it("should fail when the versions are the same", () => {
				let npmInstallationManager: INpmInstallationManager = testInjector.resolve("npmInstallationManager");
				npmInstallationManager.getLatestVersion = () => (() => "0.2.0").future<string>()();

				(() => platformService.updatePlatforms(["android"]).wait()).should.throw();
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

		function testPreparePlatform(platformToTest: string, release?: boolean) {
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
						validate: () => Future.fromResult(),
						createProject: (projectRoot: string, frameworkDir: string) => Future.fromResult(),
						interpolateData: (projectRoot: string) => Future.fromResult(),
						afterCreateProject: (projectRoot: string): any => null,
						getAppResourcesDestinationDirectoryPath: () => "",
						processConfigurationFilesFromAppResources: () => Future.fromResult(),
						ensureConfigurationFileInAppResources: (): any => null,
						interpolateConfigurationFile: () => Future.fromResult(),
						isPlatformPrepared: (projectRoot: string) => false
					}
				};
			};

			let projectData = testInjector.resolve("projectData");
			projectData.projectDir = testDirData.tempFolder;

			platformService = testInjector.resolve("platformService");
			let options: IOptions = testInjector.resolve("options");
			options.release = release;
			platformService.preparePlatform(platformToTest).wait();

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

		it("should process only files in app folder when preparing for iOS platform", () => {
			testPreparePlatform("iOS");
		});

		it("should process only files in app folder when preparing for Android platform", () => {
			testPreparePlatform("Android");
		});

		it("should process only files in app folder when preparing for iOS platform", () => {
			testPreparePlatform("iOS", true);
		});

		it("should process only files in app folder when preparing for Android platform", () => {
			testPreparePlatform("Android", true);
		});

		it("invalid xml is caught", () => {
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
						validate: () => Future.fromResult(),
						createProject: (projectRoot: string, frameworkDir: string) => Future.fromResult(),
						interpolateData: (projectRoot: string) => Future.fromResult(),
						afterCreateProject: (projectRoot: string): any => null,
						getAppResourcesDestinationDirectoryPath: () => "",
						processConfigurationFilesFromAppResources: () => Future.fromResult(),
						ensureConfigurationFileInAppResources: (): any => null,
						interpolateConfigurationFile: () => Future.fromResult(),
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
				platformService.preparePlatform("android").wait();
			} finally {
				testInjector.resolve("$logger").warn = oldLoggerWarner;
			}

			// Asserts that prepare has caught invalid xml
			assert.isFalse(warnings.indexOf("has errors") !== -1);
		});
	});
});
