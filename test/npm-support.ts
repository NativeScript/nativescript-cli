import yok = require('../lib/common/yok');
import stubs = require('./stubs');
import ErrorsLib = require("../lib/common/errors");
import NpmLib = require("../lib/node-package-manager");
import FsLib = require("../lib/common/file-system");
import OptionsLib = require("../lib/options");
import StaticConfigLib = require("../lib/config");
import HostInfoLib = require("../lib/common/host-info");
import PlatformsDataLib = require("../lib/platforms-data");
import PlatformServiceLib = require('../lib/services/platform-service');
import ProjectDataLib = require("../lib/project-data");
import ProjectHelperLib = require("../lib/common/project-helper");
import ProjectDataServiceLib = require("../lib/services/project-data-service");
import CommandsServiceLib = require("../lib/common/services/commands-service");
import NodeModulesLib = require("../lib/tools/node-modules/node-modules-builder");
import PluginsServiceLib = require("../lib/services/plugins-service");
import ChildProcessLib = require("../lib/common/child-process");
import ProjectFilesManagerLib = require("../lib/common/services/project-files-manager");
import { DeviceAppDataFactory } from "../lib/common/mobile/device-app-data/device-app-data-factory";
import { LocalToDevicePathDataFactory } from "../lib/common/mobile/local-to-device-path-data-factory";
import { MobileHelper } from "../lib/common/mobile/mobile-helper";
import { ProjectFilesProvider } from "../lib/providers/project-files-provider";
import { DeviceAppDataProvider } from "../lib/providers/device-app-data-provider";
import { MobilePlatformsCapabilities } from "../lib/mobile-platforms-capabilities";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { XmlValidator } from "../lib/xml-validator";
import { LockFile } from "../lib/lockfile";
import Future = require("fibers/future");
import ProjectChangesLib = require("../lib/services/project-changes-service");

import path = require("path");
import temp = require("temp");
temp.track();

let assert = require("chai").assert;
let nodeModulesFolderName = "node_modules";
let packageJsonName = "package.json";

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();
	testInjector.register("fs", FsLib.FileSystem);
	testInjector.register("adb", {});
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("platformsData", PlatformsDataLib.PlatformsData);
	testInjector.register("platformService", PlatformServiceLib.PlatformService);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("npmInstallationManager", {});
	testInjector.register("lockfile", LockFile);
	testInjector.register("prompter", {});
	testInjector.register("sysInfo", {});
	testInjector.register("androidProjectService", {});
	testInjector.register("iOSProjectService", {});
	testInjector.register("devicesService", {});
	testInjector.register("resources", {});
	testInjector.register("projectData", ProjectDataLib.ProjectData);
	testInjector.register("projectHelper", ProjectHelperLib.ProjectHelper);
	testInjector.register("projectDataService", ProjectDataServiceLib.ProjectDataService);
	testInjector.register("commandsService", CommandsServiceLib.CommandsService);
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("nodeModulesBuilder", NodeModulesLib.NodeModulesBuilder);
	testInjector.register("pluginsService", PluginsServiceLib.PluginsService);
	testInjector.register("npm", NpmLib.NodePackageManager);
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	testInjector.register("projectFilesManager", ProjectFilesManagerLib.ProjectFilesManager);
	testInjector.register("commandsServiceProvider", {
		registerDynamicSubCommands: () => { /* intentionally left blank */ }
	});
	testInjector.register("pluginVariablesService", {});
	testInjector.register("deviceAppDataFactory", DeviceAppDataFactory);
	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("projectFilesProvider", ProjectFilesProvider);
	testInjector.register("deviceAppDataProvider", DeviceAppDataProvider);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("xmlValidator", XmlValidator);
	testInjector.register("config", StaticConfigLib.Configuration);
	testInjector.register("projectChangesService", ProjectChangesLib.ProjectChangesService);
	testInjector.register("emulatorPlatformService", stubs.EmulatorPlatformService);
	testInjector.register("analyticsService", {
		track: () => Future.fromResult()
	});

	return testInjector;
}

function createProject(testInjector: IInjector, dependencies?: any): string {
	let tempFolder = temp.mkdirSync("npmSupportTests");
	let options = testInjector.resolve("options");
	options.path = tempFolder;

	dependencies = dependencies || {
		"lodash": "3.9.3"
	};

	let packageJsonData: any = {
		"name": "testModuleName",
		"version": "0.1.0",
		"nativescript": {
			"id": "org.nativescript.Test",
			"tns-android": {
				"version": "1.0.0"
			}
		},
		"description": "dummy",
		"license": "MIT",
		"readme": "dummy",
		"repository": "dummy"
	};
	packageJsonData["dependencies"] = dependencies;
	packageJsonData["devDependencies"] = {};

	testInjector.resolve("fs").writeJson(path.join(tempFolder, "package.json"), packageJsonData);
	return tempFolder;
}

function setupProject(dependencies?: any): IFuture<any> {
	return (() => {
		let testInjector = createTestInjector();
		let projectFolder = createProject(testInjector, dependencies);

		let fs = testInjector.resolve("fs");

		// Creates app folder
		let appFolderPath = path.join(projectFolder, "app");
		fs.createDirectory(appFolderPath);
		let appResourcesFolderPath = path.join(appFolderPath, "App_Resources");
		fs.createDirectory(appResourcesFolderPath);
		fs.createDirectory(path.join(appResourcesFolderPath, "Android"));
		fs.createDirectory(path.join(appResourcesFolderPath, "Android", "mockdir"));
		fs.createDirectory(path.join(appFolderPath, "tns_modules"));

		// Creates platforms/android folder
		let androidFolderPath = path.join(projectFolder, "platforms", "android");
		fs.ensureDirectoryExists(androidFolderPath);

		// Mock platform data
		let appDestinationFolderPath = path.join(androidFolderPath, "assets");
		let platformsData = testInjector.resolve("platformsData");

		platformsData.getPlatformData = (platform: string) => {
			return {
				appDestinationDirectoryPath: appDestinationFolderPath,
				appResourcesDestinationDirectoryPath: path.join(appDestinationFolderPath, "app", "App_Resources"),
				frameworkPackageName: "tns-android",
				normalizedPlatformName: "Android",
				projectRoot: projectFolder,
				configurationFileName: "AndroidManifest.xml",
				platformProjectService: {
					prepareProject: (): any => null,
					prepareAppResources: (): any => null,
					afterPrepareAllPlugins: () => Future.fromResult(),
					beforePrepareAllPlugins: () => Future.fromResult(),
					getAppResourcesDestinationDirectoryPath: () => path.join(androidFolderPath, "src", "main", "res"),
					processConfigurationFilesFromAppResources: () => Future.fromResult(),
					ensureConfigurationFileInAppResources: (): any => null,
					interpolateConfigurationFile: () => Future.fromResult(),
					isPlatformPrepared: (projectRoot: string) => false
				}
			};
		};

		return {
			testInjector: testInjector,
			projectFolder: projectFolder,
			appDestinationFolderPath: appDestinationFolderPath,
		};
	}).future<any>()();
}

function addDependencies(testInjector: IInjector, projectFolder: string, dependencies: any, devDependencies?: any): IFuture<void> {
	return (() => {
		let fs = testInjector.resolve("fs");
		let packageJsonPath = path.join(projectFolder, "package.json");
		let packageJsonData = fs.readJson(packageJsonPath);

		let currentDependencies = packageJsonData.dependencies;
		_.extend(currentDependencies, dependencies);

		if (devDependencies) {
			let currentDevDependencies = packageJsonData.devDependencies;
			_.extend(currentDevDependencies, devDependencies);
		}
		fs.writeJson(packageJsonPath, packageJsonData);
	}).future<void>()();
}

function preparePlatform(testInjector: IInjector): IFuture<void> {
	let platformService = testInjector.resolve("platformService");
	return platformService.preparePlatform("android");
}

describe("Npm support tests", () => {
	let testInjector: IInjector, projectFolder: string, appDestinationFolderPath: string;
	beforeEach(() => {
		let projectSetup = setupProject().wait();
		testInjector = projectSetup.testInjector;
		projectFolder = projectSetup.projectFolder;
		appDestinationFolderPath = projectSetup.appDestinationFolderPath;
	});
	it("Ensures that the installed dependencies are prepared correctly", () => {
		let fs: IFileSystem = testInjector.resolve("fs");
		// Setup
		addDependencies(testInjector, projectFolder, { "bplist": "0.0.4" }).wait();

		// Act
		preparePlatform(testInjector).wait();

		// Assert
		let tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");

		let results = fs.enumerateFilesInDirectorySync(tnsModulesFolderPath, (file, stat) => {
			return true;
		}, { enumerateDirectories: true });

		assert.isTrue(results.filter((val) => _.endsWith(val, "lodash")).length === 1);
		assert.isTrue(results.filter((val) => _.endsWith(val, path.join(tnsModulesFolderPath, "bplist"))).length === 1);
		assert.isTrue(results.filter((val) => _.endsWith(val, "bplist-creator")).length === 1);
		assert.isTrue(results.filter((val) => _.endsWith(val, "bplist-parser")).length === 1);
	});
	it("Ensures that scoped dependencies are prepared correctly", () => {
		// Setup
		let fs = testInjector.resolve("fs");
		let scopedName = "@reactivex/rxjs";
		let dependencies: any = {};
		dependencies[scopedName] = "0.0.0-prealpha.3";
		// Do not pass dependencies object as the sinopia cannot work with scoped dependencies. Instead move them manually.
		addDependencies(testInjector, projectFolder, dependencies).wait();
		// Act
		preparePlatform(testInjector).wait();
		// Assert
		let tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");
		let scopedDependencyPath = path.join(tnsModulesFolderPath, "@reactivex", "rxjs");
		assert.isTrue(fs.exists(scopedDependencyPath));
	});

	it("Ensures that scoped dependencies are prepared correctly when are not in root level", () => {
		// Setup
		let customPluginName = "plugin-with-scoped-dependency";
		let customPluginDirectory = temp.mkdirSync("custom-plugin-directory");

		let fs: IFileSystem = testInjector.resolve("fs");
		fs.unzip(path.join("resources", "test", `${customPluginName}.zip`), customPluginDirectory).wait();

		addDependencies(testInjector, projectFolder, { "plugin-with-scoped-dependency": `file:${path.join(customPluginDirectory, customPluginName)}` }).wait();
		// Act
		preparePlatform(testInjector).wait();
		// Assert
		let tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");
		let results = fs.enumerateFilesInDirectorySync(tnsModulesFolderPath, (file, stat) => {
			return true;
		}, { enumerateDirectories: true });

		let filteredResults = results.filter((val) => {
			return _.endsWith(val, path.join("@scoped-plugin", "inner-plugin"));
		});

		assert.isTrue(filteredResults.length === 1);
	});

	it("Ensures that tns_modules absent when bundling", () => {
		let fs = testInjector.resolve("fs");
		let options = testInjector.resolve("options");
		let tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");

		try {
			options.bundle = false;
			preparePlatform(testInjector).wait();
			assert.isTrue(fs.exists(tnsModulesFolderPath), "tns_modules created first");

			options.bundle = true;
			preparePlatform(testInjector).wait();
			assert.isFalse(fs.exists(tnsModulesFolderPath), "tns_modules deleted when bundling");

			options.bundle = false;
			preparePlatform(testInjector).wait();
			assert.isTrue(fs.exists(tnsModulesFolderPath), "tns_modules recreated");
		} finally {
			options.bundle = false;
		}
	});
});

describe("Flatten npm modules tests", () => {
	it("Doesn't handle the dependencies of devDependencies", () => {
		let projectSetup = setupProject({}).wait();
		let testInjector = projectSetup.testInjector;
		let projectFolder = projectSetup.projectFolder;
		let appDestinationFolderPath = projectSetup.appDestinationFolderPath;

		let devDependencies = {
			"gulp": "3.9.0",
			"gulp-jscs": "1.6.0",
			"gulp-jshint": "1.11.0"
		};

		addDependencies(testInjector, projectFolder, {}, devDependencies).wait();

		preparePlatform(testInjector).wait();

		// Assert
		let fs = testInjector.resolve("fs");
		let tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");

		let gulpFolderPath = path.join(tnsModulesFolderPath, "gulp");
		assert.isFalse(fs.exists(gulpFolderPath));

		let gulpJscsFolderPath = path.join(tnsModulesFolderPath, "gulp-jscs");
		assert.isFalse(fs.exists(gulpJscsFolderPath));

		let gulpJshint = path.join(tnsModulesFolderPath, "gulp-jshint");
		assert.isFalse(fs.exists(gulpJshint));

		// Get  all gulp dependencies
		let gulpJsonContent = fs.readJson(path.join(projectFolder, nodeModulesFolderName, "gulp", packageJsonName));
		_.each(_.keys(gulpJsonContent.dependencies), dependency => {
			assert.isFalse(fs.exists(path.join(tnsModulesFolderPath, dependency)));
		});

		// Get all gulp-jscs dependencies
		let gulpJscsJsonContent = fs.readJson(path.join(projectFolder, nodeModulesFolderName, "gulp-jscs", packageJsonName));
		_.each(_.keys(gulpJscsJsonContent.dependencies), dependency => {
			assert.isFalse(fs.exists(path.join(tnsModulesFolderPath, dependency)));
		});

		// Get all gulp-jshint dependencies
		let gulpJshintJsonContent = fs.readJson(path.join(projectFolder, nodeModulesFolderName, "gulp-jshint", packageJsonName));
		_.each(_.keys(gulpJshintJsonContent.dependencies), dependency => {
			assert.isFalse(fs.exists(path.join(tnsModulesFolderPath, dependency)));
		});
	});
});
