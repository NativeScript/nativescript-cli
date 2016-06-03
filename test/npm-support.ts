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
import BroccoliBuilderLib = require("../lib/tools/broccoli/builder");
import NodeModulesTreeLib = require("../lib/tools/broccoli/trees/node-modules-tree");
import PluginsServiceLib = require("../lib/services/plugins-service");
import ChildProcessLib = require("../lib/common/child-process");
import ProjectFilesManagerLib = require("../lib/common/services/project-files-manager");
import {DeviceAppDataFactory} from "../lib/common/mobile/device-app-data/device-app-data-factory";
import {LocalToDevicePathDataFactory} from "../lib/common/mobile/local-to-device-path-data-factory";
import {MobileHelper} from "../lib/common/mobile/mobile-helper";
import {ProjectFilesProvider} from "../lib/providers/project-files-provider";
import {DeviceAppDataProvider} from "../lib/providers/device-app-data-provider";
import {MobilePlatformsCapabilities} from "../lib/mobile-platforms-capabilities";
import {DevicePlatformsConstants} from "../lib/common/mobile/device-platforms-constants";
import { XmlValidator } from "../lib/xml-validator";
import { LockFile } from "../lib/lockfile";
import Future = require("fibers/future");

import path = require("path");
import temp = require("temp");
import shelljs = require("shelljs");
temp.track();

let assert = require("chai").assert;
let nodeModulesFolderName = "node_modules";

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
	testInjector.register("broccoliBuilder", BroccoliBuilderLib.Builder);
	testInjector.register("nodeModulesTree", NodeModulesTreeLib.NodeModulesTree);
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

	testInjector.resolve("fs").writeJson(path.join(tempFolder, "package.json"), packageJsonData).wait();
	return tempFolder;
}

function setupProject(): IFuture<any> {
	return (() => {
		let testInjector = createTestInjector();
		let projectFolder = createProject(testInjector);

		let fs = testInjector.resolve("fs");

		// Creates app folder
		let appFolderPath = path.join(projectFolder, "app");
		fs.createDirectory(appFolderPath).wait();
		let appResourcesFolderPath = path.join(appFolderPath, "App_Resources");
		fs.createDirectory(appResourcesFolderPath).wait();
		fs.createDirectory(path.join(appResourcesFolderPath, "Android")).wait();
		fs.createDirectory(path.join(appFolderPath, "tns_modules")).wait();

		// Creates platforms/android folder
		let androidFolderPath = path.join(projectFolder, "platforms", "android");
		fs.ensureDirectoryExists(androidFolderPath).wait();

		// Mock platform data
		let appDestinationFolderPath = path.join(androidFolderPath, "assets");
		let platformsData = testInjector.resolve("platformsData");
		platformsData.getPlatformData = (platform: string) => {
			return {
				appDestinationDirectoryPath: appDestinationFolderPath,
				appResourcesDestinationDirectoryPath: path.join(appDestinationFolderPath, "app", "App_Resources"),
				frameworkPackageName: "tns-android",
				normalizedPlatformName: "Android",
				platformProjectService: {
					prepareProject: () => Future.fromResult(),
					prepareAppResources: () => Future.fromResult(),
					afterPrepareAllPlugins: () => Future.fromResult(),
					getAppResourcesDestinationDirectoryPath: () => Future.fromResult(""),
					processConfigurationFilesFromAppResources: () => Future.fromResult(),
					ensureConfigurationFileInAppResources: () => Future.fromResult(),
					interpolateConfigurationFile: () => Future.fromResult()
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
		let packageJsonData = fs.readJson(packageJsonPath).wait();

		let currentDependencies = packageJsonData.dependencies;
		_.extend(currentDependencies, dependencies);

		if (devDependencies) {
			let currentDevDependencies = packageJsonData.devDependencies;
			_.extend(currentDevDependencies, devDependencies);
		}
		fs.writeJson(packageJsonPath, packageJsonData).wait();
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
		// Setup
		addDependencies(testInjector, projectFolder, { "bplist": "0.0.4" }).wait();

		// Act
		preparePlatform(testInjector).wait();

		// Assert
		let tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");
		let lodashFolderPath = path.join(tnsModulesFolderPath, "lodash");
		let bplistFolderPath = path.join(tnsModulesFolderPath, "bplist");
		let bplistCreatorFolderPath = path.join(tnsModulesFolderPath, "bplist-creator");
		let bplistParserFolderPath = path.join(tnsModulesFolderPath, "bplist-parser");

		let fs = testInjector.resolve("fs");
		assert.isTrue(fs.exists(lodashFolderPath).wait());
		assert.isTrue(fs.exists(bplistFolderPath).wait());
		assert.isTrue(fs.exists(bplistCreatorFolderPath).wait());
		assert.isTrue(fs.exists(bplistParserFolderPath).wait());
	});
	it("Ensures that scoped dependencies are prepared correctly", () => {
		// Setup
		let fs = testInjector.resolve("fs");
		let scopedName = "@reactivex/rxjs";
		let scopedModule = path.join(projectFolder, nodeModulesFolderName, "@reactivex/rxjs");
		let scopedPackageJson = path.join(scopedModule, "package.json");
		let dependencies: any = {};
		dependencies[scopedName] = "0.0.0-prealpha.3";
		// Do not pass dependencies object as the sinopia cannot work with scoped dependencies. Instead move them manually.
		addDependencies(testInjector, projectFolder, {}).wait();
		//create module dir, and add a package.json
		shelljs.mkdir("-p", scopedModule);
		fs.writeFile(scopedPackageJson, JSON.stringify({ name: scopedName, version: "1.0.0" })).wait();

		// Act
		preparePlatform(testInjector).wait();

		// Assert
		let tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");

		let scopedDependencyPath = path.join(tnsModulesFolderPath, "@reactivex", "rxjs");
		assert.isTrue(fs.exists(scopedDependencyPath).wait());
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

		let scopedDependencyPath = path.join(tnsModulesFolderPath, "@scoped-plugin", "inner-plugin");
		assert.isTrue(fs.exists(scopedDependencyPath).wait());
	});

	it("Ensures that tns_modules absent when bundling", () => {
		let fs = testInjector.resolve("fs");
		let options = testInjector.resolve("options");
		let tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");

		try {
			options.bundle = false;
			preparePlatform(testInjector).wait();
			assert.isTrue(fs.exists(tnsModulesFolderPath).wait(), "tns_modules created first");

			options.bundle = true;
			preparePlatform(testInjector).wait();
			assert.isFalse(fs.exists(tnsModulesFolderPath).wait(), "tns_modules deleted when bundling");

			options.bundle = false;
			preparePlatform(testInjector).wait();
			assert.isTrue(fs.exists(tnsModulesFolderPath).wait(), "tns_modules recreated");
		} finally {
			options.bundle = false;
		}
	});
});

describe("Flatten npm modules tests", () => {
	it("Doesn't handle the dependencies of devDependencies", () => {
		let projectSetup = setupProject().wait();
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

		let lodashFolderPath = path.join(tnsModulesFolderPath, "lodash");
		assert.isTrue(fs.exists(lodashFolderPath).wait());

		let gulpFolderPath = path.join(tnsModulesFolderPath, "gulp");
		assert.isFalse(fs.exists(gulpFolderPath).wait());

		let gulpJscsFolderPath = path.join(tnsModulesFolderPath, "gulp-jscs");
		assert.isFalse(fs.exists(gulpJscsFolderPath).wait());

		let gulpJshint = path.join(tnsModulesFolderPath, "gulp-jshint");
		assert.isFalse(fs.exists(gulpJshint).wait());

		// Get  all gulp dependencies
		let gulpDependencies = fs.readDirectory(path.join(projectFolder, nodeModulesFolderName, "gulp", nodeModulesFolderName)).wait();
		_.each(gulpDependencies, dependency => {
			assert.isFalse(fs.exists(path.join(tnsModulesFolderPath, dependency)).wait());
		});

		// Get all gulp-jscs dependencies
		let gulpJscsDependencies = fs.readDirectory(path.join(projectFolder, nodeModulesFolderName, "gulp-jscs", nodeModulesFolderName)).wait();
		_.each(gulpJscsDependencies, dependency => {
			assert.isFalse(fs.exists(path.join(tnsModulesFolderPath, dependency)).wait());
		});

		// Get all gulp-jshint dependencies
		let gulpJshintDependencies = fs.readDirectory(path.join(projectFolder, nodeModulesFolderName, "gulp-jshint", nodeModulesFolderName)).wait();
		_.each(gulpJshintDependencies, dependency => {
			assert.isFalse(fs.exists(path.join(tnsModulesFolderPath, dependency)).wait());
		});
	});
});
