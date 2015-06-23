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
import helpers = require("../lib/common/helpers");
import ProjectFilesManagerLib = require("../lib/services/project-files-manager");
import os = require("os");

import PluginsServiceLib = require("../lib/services/plugins-service");
import AddPluginCommandLib = require("../lib/commands/plugin/add-plugin");

import path = require("path");
import temp = require("temp");
temp.track();

let assert = require("chai").assert;
let isErrorThrown = false;	

function createTestInjector() {
	let testInjector = new yok.Yok();
	
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
	testInjector.register("projectFilesManager", ProjectFilesManagerLib.ProjectFilesManager);
	
	return testInjector;
}

function createProjectFile(testInjector: IInjector): string {
	let tempFolder = temp.mkdirSync("pluginsService");	
	let options = testInjector.resolve("options");
	options.path = tempFolder;	
	
	let packageJsonData = {
		"name": "testModuleName",
		"version": "0.1.0",
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
	pluginsService.ensureAllDependenciesAreInstalled = () => {
		return (() => { }).future<void>()();
	}
				
	mockBeginCommand(testInjector, "Exception: " + expectedErrorMessage);				
	
	isErrorThrown = false;			
	let commandsService = testInjector.resolve(CommandsServiceLib.CommandsService);
	commandsService.tryExecuteCommand("plugin|add", [plugin]).wait();

	assert.isTrue(isErrorThrown);
}

function createAndroidManifestFile(projectFolder: string, fs:IFileSystem): void {
	let manifest = '<?xml version="1.0" encoding="UTF-8"?>' +
	'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' + 
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>' +
  	'<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>' +
  	'<uses-permission android:name="android.permission.INTERNET"/>' +
    '<application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >' +
        '<activity android:name="com.example.android.basiccontactables.MainActivity" android:label="@string/app_name" android:launchMode="singleTop">' + 
            '<meta-data android:name="android.app.searchable" android:resource="@xml/searchable" />' +
            '<intent-filter>' +
                '<action android:name="android.intent.action.SEARCH" />' +
            '</intent-filter>' + 
            '<intent-filter>' + 
                '<action android:name="android.intent.action.MAIN" />' +
            '</intent-filter>' + 
        '</activity>' + 
    '</application>' + 
'</manifest>';
	
	fs.createDirectory(path.join(projectFolder, "platforms")).wait();
	fs.createDirectory(path.join(projectFolder, "platforms", "android")).wait();
	fs.writeFile(path.join(projectFolder, "platforms", "android", "AndroidManifest.xml"), manifest).wait();
}

describe("Plugins service", () => {
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
			
			// Add plugin			
			let projectFilePath = path.join(projectFolder, "package.json");
			let projectData = require(projectFilePath);
			projectData.dependencies = { };
			projectData.dependencies[pluginName] = "^1.0.0";
			fs.writeJson(projectFilePath, projectData).wait();
			
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
			let packageJsonContent = fs.readJson(path.join(projectFolder, "package.json")).wait();
			let actualDependencies = packageJsonContent.dependencies;
			let expectedDependencies = {
				"plugin1": "^1.0.3"
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
			let packageJsonContent = fs.readJson(path.join(projectFolder, "package.json")).wait();
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
	
	describe("merge xmls tests", () => {
		let testInjector: IInjector;
		beforeEach(() => {
			testInjector = createTestInjector();
			testInjector.registerCommand("plugin|add", AddPluginCommandLib.AddPluginCommand);
		});
		it("fails if the plugin contains incorrect xml", () => {
			let pluginName = "mySamplePlugin";
			let projectFolder = createProjectFile(testInjector);
			let pluginFolderPath = path.join(projectFolder, pluginName);
			let pluginJsonData = {
				"name": pluginName,
				"version": "0.0.1",
				"nativescript": {
					"platforms": {
						"android": "0.10.0"
					}
				}
			};
			let fs = testInjector.resolve("fs");
			fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData).wait();
			
			// Adds AndroidManifest.xml file in platforms/android folder
			createAndroidManifestFile(projectFolder, fs);		
			
			// Mock plugins service
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => { 
				return (() => {
					return [{
						name: ""
					}];
				}).future<IPluginData[]>()();
			}
			
			let appDestinationDirectoryPath = path.join(projectFolder, "platforms", "android");
			
			// Mock platformsData
			let platformsData = testInjector.resolve("platformsData");
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: appDestinationDirectoryPath,
					frameworkPackageName: "tns-android",
					configurationFileName: "AndroidManifest.xml"
				}
			}
			
			// Ensure the pluginDestinationPath folder exists
			let pluginPlatformsDirPath = path.join(appDestinationDirectoryPath, "app", "tns_modules", pluginName, "platforms", "android");
			fs.ensureDirectoryExists(pluginPlatformsDirPath).wait();
			
			// Creates invalid plugin's AndroidManifest.xml file
			let xml = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' + 
    			'<uses-permission android:name="android.permission.READ_CONTACTS"/>';
			let pluginConfigurationFilePath = path.join(pluginPlatformsDirPath, "AndroidManifest.xml");
			fs.writeFile(pluginConfigurationFilePath, xml).wait();
				
			// Expected error message. The assertion happens in mockBeginCommand
			let expectedErrorMessage = `Exception: Invalid xml file ${pluginConfigurationFilePath}. Additional technical information: element parse error: Exception: Invalid xml file ` + 
				`${pluginConfigurationFilePath}. Additional technical information: unclosed xml attribute` + 
				`\n@#[line:1,col:39].` + 
				`\n@#[line:1,col:39].`;
			mockBeginCommand(testInjector, expectedErrorMessage);				
			
			let commandsService = testInjector.resolve(CommandsServiceLib.CommandsService);		
			commandsService.tryExecuteCommand("plugin|add", [pluginFolderPath]).wait();
		});
		it("merges AndroidManifest.xml and produces correct xml", () => {
			let pluginName = "mySamplePlugin";
			let projectFolder = createProjectFile(testInjector);
			let pluginFolderPath = path.join(projectFolder, pluginName);
			let pluginJsonData = {
				"name": pluginName,
				"version": "0.0.1",
				"nativescript": {
					"platforms": {
						"android": "0.10.0"
					}
				}
			};
			let fs = testInjector.resolve("fs");
			fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData).wait();
			
			// Adds AndroidManifest.xml file in platforms/android folder
			createAndroidManifestFile(projectFolder, fs);		
			
			// Mock plugins service
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => { 
				return (() => {
					return [{
						name: ""
					}];
				}).future<IPluginData[]>()();
			}
			
			let appDestinationDirectoryPath = path.join(projectFolder, "platforms", "android");
			
			// Mock platformsData
			let platformsData = testInjector.resolve("platformsData");
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: appDestinationDirectoryPath,
					frameworkPackageName: "tns-android",
					configurationFileName: "AndroidManifest.xml",
					configurationFilePath: path.join(appDestinationDirectoryPath, "AndroidManifest.xml"),
					mergeXmlConfig: [{ "nodename": "manifest", "attrname": "*" }]
				}
			}
			
			// Ensure the pluginDestinationPath folder exists
			let pluginPlatformsDirPath = path.join(appDestinationDirectoryPath, "app", "tns_modules", pluginName, "platforms", "android");
			fs.ensureDirectoryExists(pluginPlatformsDirPath).wait();
			
			// Creates valid plugin's AndroidManifest.xml file
			let xml = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' + 
				'<uses-permission android:name="android.permission.READ_CONTACTS"/>' + 
				'</manifest>';
			let pluginConfigurationFilePath = path.join(pluginPlatformsDirPath, "AndroidManifest.xml");
			fs.writeFile(pluginConfigurationFilePath, xml).wait();
				
			pluginsService.add(pluginFolderPath).wait();
			
			let expectedXml = '<?xmlversion="1.0"encoding="UTF-8"?><manifestxmlns:android="http://schemas.android.com/apk/res/android"package="com.example.android.basiccontactables"android:versionCode="1"android:versionName="1.0"><uses-permissionandroid:name="android.permission.READ_EXTERNAL_STORAGE"/><uses-permissionandroid:name="android.permission.WRITE_EXTERNAL_STORAGE"/><uses-permissionandroid:name="android.permission.INTERNET"/><applicationandroid:allowBackup="true"android:icon="@drawable/ic_launcher"android:label="@string/app_name"android:theme="@style/Theme.Sample"><activityandroid:name="com.example.android.basiccontactables.MainActivity"android:label="@string/app_name"android:launchMode="singleTop"><meta-dataandroid:name="android.app.searchable"android:resource="@xml/searchable"/><intent-filter><actionandroid:name="android.intent.action.SEARCH"/></intent-filter><intent-filter><actionandroid:name="android.intent.action.MAIN"/></intent-filter></activity></application><uses-permissionandroid:name="android.permission.READ_CONTACTS"/></manifest>';
			expectedXml = helpers.stringReplaceAll(expectedXml, os.EOL, "");
			expectedXml = helpers.stringReplaceAll(expectedXml, " ", "");
			
			let actualXml = fs.readText(path.join(appDestinationDirectoryPath, "AndroidManifest.xml")).wait();
			actualXml = helpers.stringReplaceAll(actualXml, "\n", "");
			actualXml = helpers.stringReplaceAll(actualXml, " ", "");
			
			assert.equal(expectedXml, actualXml);
		});
	});
});