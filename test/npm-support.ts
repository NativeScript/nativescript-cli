/// <reference path=".d.ts" />
"use strict";

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
import ProjectFilesManagerLib = require("../lib/services/project-files-manager");
import Future = require("fibers/future");

import path = require("path");
import temp = require("temp");
temp.track();

let assert = require("chai").assert;

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();
	
	testInjector.register("fs", FsLib.FileSystem);
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("platformsData", PlatformsDataLib.PlatformsData);
	testInjector.register("platformService", PlatformServiceLib.PlatformService);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("npmInstallationManager", {});
	testInjector.register("lockfile", {});
	testInjector.register("prompter", {});
	testInjector.register("androidProjectService", {});
	testInjector.register("iOSProjectService", {});
	testInjector.register("devicesServices", {});	
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
		registerDynamicSubCommands: () => {}
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
		}
	};
	packageJsonData["dependencies"] = dependencies;
	
	testInjector.resolve("fs").writeJson(path.join(tempFolder, "package.json"), packageJsonData).wait();
	return tempFolder;
}

describe("Npm support tests", () => {
	it("Ensures that the installed dependencies are prepared correctly", () => {
		let dependencies = {
			"bplist": "0.0.4",
			"lodash": "3.9.3"
		};
		
		let testInjector = createTestInjector();
		let projectFolder = createProject(testInjector, dependencies);
		
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
					prepareAppResources: () => Future.fromResult()
				}
			}	
		};
		
		let platformService = testInjector.resolve("platformService");
		platformService.preparePlatform("android").wait();
		
		// Assert
		let tnsModulesFolderPath = path.join(appDestinationFolderPath, "app", "tns_modules");		
		let lodashFolderPath = path.join(tnsModulesFolderPath, "lodash");
		let bplistFolderPath = path.join(tnsModulesFolderPath, "bplist");
		let bplistCreatorFolderPath = path.join(tnsModulesFolderPath, "bplist-creator");
		let bplistParserFolderPath = path.join(tnsModulesFolderPath, "bplist-parser");
		
		assert.isTrue(fs.exists(lodashFolderPath).wait());
		assert.isTrue(fs.exists(bplistFolderPath).wait());
		assert.isTrue(fs.exists(bplistCreatorFolderPath).wait());
		assert.isTrue(fs.exists(bplistParserFolderPath).wait());
	});
});