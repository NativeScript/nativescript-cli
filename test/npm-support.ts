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
import { PreparePlatformNativeService } from "../lib/services/prepare-platform-native-service";
import { PreparePlatformJSService } from "../lib/services/prepare-platform-js-service";
import { DeviceAppDataFactory } from "../lib/common/mobile/device-app-data/device-app-data-factory";
import { LocalToDevicePathDataFactory } from "../lib/common/mobile/local-to-device-path-data-factory";
import { MobileHelper } from "../lib/common/mobile/mobile-helper";
import { ProjectFilesProvider } from "../lib/providers/project-files-provider";
import { MobilePlatformsCapabilities } from "../lib/mobile-platforms-capabilities";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { XmlValidator } from "../lib/xml-validator";
import ProjectChangesLib = require("../lib/services/project-changes-service");
import { Messages } from "../lib/common/messages/messages";
import { NodeModulesDependenciesBuilder } from "../lib/tools/node-modules/node-modules-dependencies-builder";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";

import path = require("path");
import temp = require("temp");
temp.track();

const assert = require("chai").assert;
const nodeModulesFolderName = "node_modules";
const packageJsonName = "package.json";

function createTestInjector(): IInjector {
	const testInjector = new yok.Yok();
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
	testInjector.register("preparePlatformNativeService", PreparePlatformNativeService);
	testInjector.register("preparePlatformJSService", PreparePlatformJSService);
	testInjector.register("pluginVariablesService", {});
	testInjector.register("deviceAppDataFactory", DeviceAppDataFactory);
	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("projectFilesProvider", ProjectFilesProvider);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("xmlValidator", XmlValidator);
	testInjector.register("config", StaticConfigLib.Configuration);
	testInjector.register("projectChangesService", ProjectChangesLib.ProjectChangesService);
	testInjector.register("emulatorPlatformService", stubs.EmulatorPlatformService);
	testInjector.register("analyticsService", {
		track: async (): Promise<any> => undefined
	});
	testInjector.register("messages", Messages);
	testInjector.register("nodeModulesDependenciesBuilder", NodeModulesDependenciesBuilder);
	testInjector.register("settingsService", SettingsService);
	testInjector.register("devicePathProvider", {});
	testInjector.register("progressIndicator", {
		getSpinner: (msg: string) => ({
			start: (): void => undefined,
			stop: (): void => undefined,
			message: (): void => undefined
		})
	});
	testInjector.register("httpClient", {});

	return testInjector;
}

function createProject(testInjector: IInjector, dependencies?: any): string {
	const tempFolder = temp.mkdirSync("npmSupportTests");
	const options = testInjector.resolve("options");
	options.path = tempFolder;

	dependencies = dependencies || {
		"lodash": "3.9.3"
	};

	const packageJsonData: any = {
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

async function setupProject(dependencies?: any): Promise<any> {
	const testInjector = createTestInjector();
	const projectFolder = createProject(testInjector, dependencies);

	const fs = testInjector.resolve("fs");

	// Creates app folder
	const appFolderPath = path.join(projectFolder, "app");
	fs.createDirectory(appFolderPath);
	const appResourcesFolderPath = path.join(appFolderPath, "App_Resources");
	fs.createDirectory(appResourcesFolderPath);
	fs.createDirectory(path.join(appResourcesFolderPath, "Android"));
	fs.createDirectory(path.join(appResourcesFolderPath, "Android", "mockdir"));
	fs.createDirectory(path.join(appFolderPath, "tns_modules"));

	// Creates platforms/android folder
	const androidFolderPath = path.join(projectFolder, "platforms", "android");
	fs.ensureDirectoryExists(androidFolderPath);

	// Mock platform data
	const appDestinationFolderPath = path.join(androidFolderPath, "assets");
	const platformsData = testInjector.resolve("platformsData");

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
				afterPrepareAllPlugins: () => Promise.resolve(),
				beforePrepareAllPlugins: () => Promise.resolve(),
				getAppResourcesDestinationDirectoryPath: () => path.join(androidFolderPath, "src", "main", "res"),
				processConfigurationFilesFromAppResources: () => Promise.resolve(),
				ensureConfigurationFileInAppResources: (): any => null,
				interpolateConfigurationFile: (): void => undefined,
				isPlatformPrepared: (projectRoot: string) => false,
				validatePlugins: (projectData: IProjectData) => Promise.resolve(),
				checkForChanges: () => { /* */ },
				cleanProject: () => Promise.resolve()
			}
		};
	};

	return {
		testInjector: testInjector,
		projectFolder: projectFolder,
		appDestinationFolderPath: appDestinationFolderPath,
	};
}

async function addDependencies(testInjector: IInjector, projectFolder: string, dependencies: any, devDependencies?: any): Promise<void> {
	const fs = testInjector.resolve("fs");
	const packageJsonPath = path.join(projectFolder, "package.json");
	const packageJsonData = fs.readJson(packageJsonPath);

	const currentDependencies = packageJsonData.dependencies;
	_.extend(currentDependencies, dependencies);

	if (devDependencies) {
		const currentDevDependencies = packageJsonData.devDependencies;
		_.extend(currentDevDependencies, devDependencies);
	}
	fs.writeJson(packageJsonPath, packageJsonData);
}

async function preparePlatform(testInjector: IInjector): Promise<void> {
	const platformService: IPlatformService = testInjector.resolve("platformService");
	const projectData: IProjectData = testInjector.resolve("projectData");
	projectData.initializeProjectData();
	const options: IOptions = testInjector.resolve("options");

	await platformService.preparePlatform({
		platform: "android",
		appFilesUpdaterOptions: { bundle: !!options.bundle, release: options.release },
		platformTemplate: "",
		projectData,
		config: options,
		env: {}
	});
}

describe("Npm support tests", () => {
	let testInjector: IInjector, projectFolder: string, appDestinationFolderPath: string;
	beforeEach(async () => {
		const projectSetup = await setupProject();
		testInjector = projectSetup.testInjector;
		projectFolder = projectSetup.projectFolder;
		appDestinationFolderPath = projectSetup.appDestinationFolderPath;
	});
	it("Ensures that the installed dependencies are prepared correctly", async () => {
		const fs: IFileSystem = testInjector.resolve("fs");
		// Setup
		await addDependencies(testInjector, projectFolder, { "bplist": "0.0.4" });

		// Act
		await preparePlatform(testInjector);

		// Assert
		const tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");

		const results = fs.enumerateFilesInDirectorySync(tnsModulesFolderPath, (file, stat) => {
			return true;
		}, { enumerateDirectories: true });

		assert.isTrue(results.filter((val) => _.endsWith(val, "lodash")).length === 1);
		assert.isTrue(results.filter((val) => _.endsWith(val, path.join(tnsModulesFolderPath, "bplist"))).length === 1);
		assert.isTrue(results.filter((val) => _.endsWith(val, "bplist-creator")).length === 1);
		assert.isTrue(results.filter((val) => _.endsWith(val, "bplist-parser")).length === 1);
	});
	it("Ensures that scoped dependencies are prepared correctly", async () => {
		// Setup
		const fs = testInjector.resolve("fs");
		const scopedName = "@reactivex/rxjs";
		const dependencies: any = {};
		dependencies[scopedName] = "0.0.0-prealpha.3";
		// Do not pass dependencies object as the sinopia cannot work with scoped dependencies. Instead move them manually.
		await addDependencies(testInjector, projectFolder, dependencies);
		// Act
		await preparePlatform(testInjector);
		// Assert
		const tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");
		const scopedDependencyPath = path.join(tnsModulesFolderPath, "@reactivex", "rxjs");
		assert.isTrue(fs.exists(scopedDependencyPath));
	});

	it("Ensures that scoped dependencies are prepared correctly when are not in root level", async () => {
		// Setup
		const customPluginName = "plugin-with-scoped-dependency";
		const customPluginDirectory = temp.mkdirSync("custom-plugin-directory");

		const fs: IFileSystem = testInjector.resolve("fs");
		await fs.unzip(path.join("resources", "test", `${customPluginName}.zip`), customPluginDirectory);

		await addDependencies(testInjector, projectFolder, { "plugin-with-scoped-dependency": `file:${path.join(customPluginDirectory, customPluginName)}` });
		// Act
		await preparePlatform(testInjector);
		// Assert
		const tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");
		const results = fs.enumerateFilesInDirectorySync(tnsModulesFolderPath, (file, stat) => {
			return true;
		}, { enumerateDirectories: true });

		const filteredResults = results.filter((val) => {
			return _.endsWith(val, path.join("@scoped-plugin", "inner-plugin"));
		});

		assert.isTrue(filteredResults.length === 1);
	});

	it("Ensures that tns_modules absent when bundling", async () => {
		const fs = testInjector.resolve("fs");
		const options = testInjector.resolve("options");
		const tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");

		try {
			options.bundle = false;
			await preparePlatform(testInjector);
			assert.isTrue(fs.exists(tnsModulesFolderPath), "tns_modules created first");

			options.bundle = true;
			await preparePlatform(testInjector);
			assert.isFalse(fs.exists(tnsModulesFolderPath), "tns_modules deleted when bundling");

			options.bundle = false;
			await preparePlatform(testInjector);
			assert.isTrue(fs.exists(tnsModulesFolderPath), "tns_modules recreated");
		} finally {
			options.bundle = false;
		}
	});
});

describe("Flatten npm modules tests", () => {
	it("Doesn't handle the dependencies of devDependencies", async () => {
		const projectSetup = await setupProject({});
		const testInjector = projectSetup.testInjector;
		const projectFolder = projectSetup.projectFolder;
		const appDestinationFolderPath = projectSetup.appDestinationFolderPath;

		const devDependencies = {
			"gulp": "3.9.0",
			"gulp-jscs": "1.6.0",
			"gulp-jshint": "1.11.0"
		};

		await addDependencies(testInjector, projectFolder, {}, devDependencies);

		await preparePlatform(testInjector);

		// Assert
		const fs = testInjector.resolve("fs");
		const tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");

		const gulpFolderPath = path.join(tnsModulesFolderPath, "gulp");
		assert.isFalse(fs.exists(gulpFolderPath));

		const gulpJscsFolderPath = path.join(tnsModulesFolderPath, "gulp-jscs");
		assert.isFalse(fs.exists(gulpJscsFolderPath));

		const gulpJshint = path.join(tnsModulesFolderPath, "gulp-jshint");
		assert.isFalse(fs.exists(gulpJshint));

		// Get	all gulp dependencies
		const gulpJsonContent = fs.readJson(path.join(projectFolder, nodeModulesFolderName, "gulp", packageJsonName));
		_.each(_.keys(gulpJsonContent.dependencies), dependency => {
			assert.isFalse(fs.exists(path.join(tnsModulesFolderPath, dependency)));
		});

		// Get all gulp-jscs dependencies
		const gulpJscsJsonContent = fs.readJson(path.join(projectFolder, nodeModulesFolderName, "gulp-jscs", packageJsonName));
		_.each(_.keys(gulpJscsJsonContent.dependencies), dependency => {
			assert.isFalse(fs.exists(path.join(tnsModulesFolderPath, dependency)));
		});

		// Get all gulp-jshint dependencies
		const gulpJshintJsonContent = fs.readJson(path.join(projectFolder, nodeModulesFolderName, "gulp-jshint", packageJsonName));
		_.each(_.keys(gulpJshintJsonContent.dependencies), dependency => {
			assert.isFalse(fs.exists(path.join(tnsModulesFolderPath, dependency)));
		});
	});
});
