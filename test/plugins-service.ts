/// <reference path=".d.ts" />
"use strict";

import yok = require('../lib/common/yok');
import stubs = require('./stubs');
import NpmLib = require("../lib/node-package-manager");
import FsLib = require("../lib/common/file-system");
import ProjectDataLib = require("../lib/project-data");
import ChildProcessLib = require("../lib/common/child-process");
import PlatformServiceLib = require('../lib/services/platform-service');
import OptionsLib = require("../lib/options");
import CommandsServiceLib = require("../lib/common/services/commands-service");
import StaticConfigLib = require("../lib/config");
import HostInfoLib = require("../lib/common/host-info");
import ErrorsLib = require("../lib/common/errors");
import ProjectHelperLib = require("../lib/common/project-helper");
import PlatformsDataLib = require("../lib/platforms-data");
import ProjectDataServiceLib = require("../lib/services/project-data-service");

import PluginsServiceLib = require("../lib/services/plugins-service");
import AddPluginCommandLib = require("../lib/commands/plugin/add-plugin");

import path = require("path");
import temp = require("temp");
temp.track();

let assert = require("chai").assert;
let isErrorThrown = false;	

function createTestInjector() {
	var testInjector = new yok.Yok();
	
	testInjector.register("npm", NpmLib.NodePackageManager);
	testInjector.register("fs", FsLib.FileSystem);
	testInjector.register("projectData", ProjectDataLib.ProjectData);
	testInjector.register("platforsmData", stubs.PlatformsDataStub);
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	testInjector.register("platformService", PlatformServiceLib.PlatformService);
	testInjector.register("platformsData", PlatformsDataLib.PlatformsData);
	testInjector.register("androidProjectService", {});
	testInjector.register("iOSProjectService", {});
	testInjector.register("devicesServices", {});
	testInjector.register("projectDataService", ProjectDataServiceLib.ProjectDataService);
	testInjector.register("prompter", {});
	testInjector.register("broccoliBuilder", {});
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("commandsService", CommandsServiceLib.CommandsService);
	testInjector.register("commandsServiceProvider", {
		registerDynamicSubCommands: () => {}
	});
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("lockfile", { });
	testInjector.register("projectHelper", ProjectHelperLib.ProjectHelper);
	
	testInjector.register("pluginsService", PluginsServiceLib.PluginsService);
	testInjector.register("analyticsService", {
		trackException: () => { return (() => { }).future<void>()(); },
		checkConsent: () => { return (() => { }).future<void>()(); },
		trackFeature: () => { return (() => { }).future<void>()(); }
	});
	
	return testInjector;
}

function createProjectFile(testInjector: IInjector): string {
	let tempFolder = temp.mkdirSync("pluginsService");	
	let options = testInjector.resolve("options");
	options.path = tempFolder;	
	
	let packageJsonData = {
		"name": "testModuleName",
		"version": "0.0.0",
		"nativescript": {
			"id": "org.nativescript.Test",
			"tns-android": {
				"version": "1.0.0"
			}
		}
	};
	
	testInjector.resolve("fs").writeJson(path.join(tempFolder, "package.json"), packageJsonData).wait();
	return tempFolder;
}

function mockBeginCommand(testInjector: IInjector, expectedErrorMessage: string) {
	let errors = testInjector.resolve("errors");
	errors.beginCommand = (action: () => IFuture<boolean>): IFuture<void> => {
		return (() => {
			try {
				return action().wait();
			} catch(err) {
				isErrorThrown = true;
				assert.equal(err.toString(), expectedErrorMessage);
			}
		}).future<void>()();
	};
}

function addPluginWhenExpectingToFail(testInjector: IInjector, plugin: string, expectedErrorMessage: string) {
	createProjectFile(testInjector);
	
	let pluginsService = testInjector.resolve("pluginsService");
	pluginsService.getAllInstalledPlugins = () => { 
		return (() => {
			return [{
				name: ""
			}];
		}).future<IPluginData[]>()();
	}
				
	mockBeginCommand(testInjector, "Exception: " + expectedErrorMessage);				
	
	isErrorThrown = false;			
	let commandsService = testInjector.resolve(CommandsServiceLib.CommandsService);
	commandsService.tryExecuteCommand("plugin|add", [plugin]).wait();

	assert.isTrue(isErrorThrown);
}

describe("plugins service", () => {
	let testInjector: IInjector;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.registerCommand("plugin|add", AddPluginCommandLib.AddPluginCommand);
	});
	
	describe("plugin add", () => {
		it("fails when no param is specified to plugin add command", () => {
			addPluginWhenExpectingToFail(testInjector, null, "You must specify plugin name.");
		}); 
		it("fails when invalid nativescript plugin name is specified", () => {
			addPluginWhenExpectingToFail(testInjector, "lodash", "lodash is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.");
		});
		it("fails when the plugin is already installed", () => {
			let pluginName = "plugin1";
			let projectFolder = createProjectFile(testInjector);
			let fs = testInjector.resolve("fs");
			let nodeModulesFolderPath = path.join(projectFolder, "node_modules");
			fs.createDirectory(nodeModulesFolderPath).wait();
			fs.createDirectory(path.join(nodeModulesFolderPath, pluginName)).wait();
			
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => { 
				return (() => {
					return [{
						name: "plugin1"
					}];
				}).future<IPluginData[]>()();
			}
			
			mockBeginCommand(testInjector, "Exception: " + 'Plugin "plugin1" is already installed.');				
	
			isErrorThrown = false;			
			let commandsService = testInjector.resolve(CommandsServiceLib.CommandsService);
			commandsService.tryExecuteCommand("plugin|add", [pluginName]).wait();
			
			assert.isTrue(isErrorThrown);
		});
		it("fails when the plugin does not support the installed framework", () => {
			let isWarningMessageShown = false;
			let expectedWarningMessage = "mySamplePlugin 1.0.1 for android is not compatible with the currently installed framework version 1.0.0.";
			
			// Creates plugin in temp folder			
			let pluginName = "mySamplePlugin";
			let projectFolder = createProjectFile(testInjector);
			let pluginFolderPath = path.join(projectFolder, pluginName);
			let pluginJsonData = {
				"name": pluginName,
				"version": "0.0.1",
				"nativescript": {
					"platforms": {
						"android": "1.0.1"
					}
				},
			};
			let fs = testInjector.resolve("fs");
			fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData).wait();
			
			// Adds android platform
			fs.createDirectory(path.join(projectFolder, "platforms")).wait();
			fs.createDirectory(path.join(projectFolder, "platforms", "android")).wait();
			
			// Mock logger.warn
			let logger = testInjector.resolve("logger");
			logger.warn = (message: string) => {
				assert.equal(message, expectedWarningMessage);
				isWarningMessageShown = true;
			}
			
			// Mock pluginsService
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => { 
				return (() => {
					return [{
						name: ""
					}];
				}).future<IPluginData[]>()();
			}
			
			// Mock platformsData
			let platformsData = testInjector.resolve("platformsData");
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: path.join(projectFolder, "platforms", "android"),
					frameworkPackageName: "tns-android"
				}
			}
			
			let commandsService = testInjector.resolve("commandsService");
			commandsService.tryExecuteCommand("plugin|add", [pluginFolderPath]).wait();
			
			assert.isTrue(isWarningMessageShown);
		});
		it("adds plugin by name", () => {
			let pluginName = "plugin1";
			let projectFolder = createProjectFile(testInjector);
			
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => { 
				return (() => {
					return [{
						name: ""
					}];
				}).future<IPluginData[]>()();
			}
			
			let commandsService = testInjector.resolve(CommandsServiceLib.CommandsService);
			commandsService.tryExecuteCommand("plugin|add", [pluginName]).wait();
			
			let fs = testInjector.resolve("fs");
			
			// Asserts that the all plugin's content is successfully added to node_modules folder
			let nodeModulesFolderPath = path.join(projectFolder, "node_modules");
			assert.isTrue(fs.exists(nodeModulesFolderPath).wait());
			
			let pluginFolderPath = path.join(nodeModulesFolderPath, pluginName);
			assert.isTrue(fs.exists(pluginFolderPath).wait());
			
			let pluginFiles = ["injex.js", "main.js", "package.json"];
			_.each(pluginFiles, pluginFile => {
				assert.isTrue(fs.exists(path.join(pluginFolderPath, pluginFile)).wait());
			});
			
			// Asserts that the plugin is added in package.json file
			let packageJsonContent = require(path.join(projectFolder, "package.json"));
			let actualDependencies = packageJsonContent.dependencies;
			let expectedDependencies = {
				"plugin1": "^1.0.0"
			};
			assert.deepEqual(actualDependencies, expectedDependencies); 
		});
		it("adds plugin by name and version", () => {
			let pluginName = "plugin1";
			let projectFolder = createProjectFile(testInjector);
			
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => { 
				return (() => {
					return [{
						name: ""
					}];
				}).future<IPluginData[]>()();
			}
			
			let commandsService = testInjector.resolve(CommandsServiceLib.CommandsService);
			commandsService.tryExecuteCommand("plugin|add", [pluginName+"@1.0.0"]).wait();
			
			let fs = testInjector.resolve("fs");
			
			// Assert that the all plugin's content is successfully added to node_modules folder
			let nodeModulesFolderPath = path.join(projectFolder, "node_modules");
			assert.isTrue(fs.exists(nodeModulesFolderPath).wait());
			
			let pluginFolderPath = path.join(nodeModulesFolderPath, pluginName);
			assert.isTrue(fs.exists(pluginFolderPath).wait());
			
			let pluginFiles = ["injex.js", "main.js", "package.json"];
			_.each(pluginFiles, pluginFile => {
				assert.isTrue(fs.exists(path.join(pluginFolderPath, pluginFile)).wait());
			});
			
			// Assert that the plugin is added in package.json file
			let packageJsonContent = require(path.join(projectFolder, "package.json"));
			let actualDependencies = packageJsonContent.dependencies;
			let expectedDependencies = {
				"plugin1": "^1.0.0"
			};
			assert.deepEqual(actualDependencies, expectedDependencies);
		});
		it("adds plugin by local path", () => {
			// Creates a plugin in tempFolder
			let pluginName = "mySamplePlugin";
			let projectFolder = createProjectFile(testInjector);
			let pluginFolderPath = path.join(projectFolder, pluginName);
			let pluginJsonData = {
				"name": pluginName,
				"version": "0.0.1",
				"nativescript": {
					"platforms": {
						
					}
				},
			};
			let fs = testInjector.resolve("fs");
			fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData).wait();
			
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => { 
				return (() => {
					return [{
						name: ""
					}];
				}).future<IPluginData[]>()();
			}
			
			let commandsService = testInjector.resolve(CommandsServiceLib.CommandsService);
			commandsService.tryExecuteCommand("plugin|add", [pluginFolderPath]).wait();
			
			// Assert that the all plugin's content is successfully added to node_modules folder
			let nodeModulesFolderPath = path.join(projectFolder, "node_modules");
			assert.isTrue(fs.exists(nodeModulesFolderPath).wait());
			assert.isTrue(fs.exists(path.join(nodeModulesFolderPath, pluginName)).wait());
			
			let pluginFiles = ["package.json"];
			_.each(pluginFiles, pluginFile => {
				assert.isTrue(fs.exists(path.join(nodeModulesFolderPath, pluginName, pluginFile)).wait());
			});
		});
		it("adds plugin by github url", () => {
			// TODO: add test
		});
		it("doesn't install dev dependencies when --production option is specified", () => {
			// Creates a plugin in tempFolder
			let pluginName = "mySamplePlugin";
			let projectFolder = createProjectFile(testInjector);
			let pluginFolderPath = path.join(projectFolder, pluginName);
			let pluginJsonData = {
				"name": pluginName,
				"version": "0.0.1",
				"nativescript": {
					"platforms": {
						
					}
				},
				"devDependencies": {
					"grunt": "0.4.2"
				}
			};
			let fs = testInjector.resolve("fs");
			fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData).wait();
			
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => { 
				return (() => {
					return [{
						name: ""
					}];
				}).future<IPluginData[]>()();
			}
			
			// Mock options
			let options = testInjector.resolve("options");
			options.production = true;
			
			let commandsService = testInjector.resolve(CommandsServiceLib.CommandsService);
			commandsService.tryExecuteCommand("plugin|add", [pluginFolderPath]).wait();
			
			let nodeModulesFolderPath = path.join(projectFolder, "node_modules");
			assert.isFalse(fs.exists(path.join(nodeModulesFolderPath, pluginName, "node_modules", "grunt")).wait());
		});
		it("install dev dependencies when --production option is not specified", () => {
			// Creates a plugin in tempFolder
			let pluginName = "mySamplePlugin";
			let projectFolder = createProjectFile(testInjector);
			let pluginFolderPath = path.join(projectFolder, pluginName);
			let pluginJsonData = {
				"name": pluginName,
				"version": "0.0.1",
				"nativescript": {
					"platforms": {
						
					}
				},
				"dependencies": {
					"lodash": "3.8.0"
				},
				"devDependencies": {
					"grunt": "0.4.2"
				}
			};
			let fs = testInjector.resolve("fs");
			fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData).wait();
			
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => { 
				return (() => {
					return [{
						name: ""
					}];
				}).future<IPluginData[]>()();
			}
			
			// Mock options
			let options = testInjector.resolve("options");
			options.production = false;
			
			let commandsService = testInjector.resolve(CommandsServiceLib.CommandsService);
			commandsService.tryExecuteCommand("plugin|add", [pluginFolderPath]).wait();
		});
	});
});