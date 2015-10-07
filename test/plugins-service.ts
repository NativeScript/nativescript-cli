/// <reference path=".d.ts" />
"use strict";

import {Yok} from '../lib/common/yok';
import future = require("fibers/future");
import * as stubs from './stubs';
import {NodePackageManager} from "../lib/node-package-manager";
import {FileSystem} from "../lib/common/file-system";
import {ProjectData} from "../lib/project-data";
import {ChildProcess} from "../lib/common/child-process";
import {PlatformService} from '../lib/services/platform-service';
import {Options} from "../lib/options";
import {CommandsService} from "../lib/common/services/commands-service";
import {StaticConfig} from "../lib/config";
import {HostInfo} from "../lib/common/host-info";
import {Errors} from "../lib/common/errors";
import {ProjectHelper} from "../lib/common/project-helper";
import {PlatformsData} from "../lib/platforms-data";
import {ProjectDataService} from "../lib/services/project-data-service";
import * as helpers from "../lib/common/helpers";
import {ProjectFilesManager} from "../lib/services/project-files-manager";
import {ResourceLoader} from "../lib/common/resource-loader";
import {EOL} from "os";
import {PluginsService} from "../lib/services/plugins-service";
import {AddPluginCommand} from "../lib/commands/plugin/add-plugin";
import {assert} from "chai";
import * as path from "path";
import * as temp from "temp";
temp.track();

let isErrorThrown = false;

function createTestInjector() {
	let testInjector = new Yok();

	testInjector.register("npm", NodePackageManager);
	testInjector.register("fs", FileSystem);
	testInjector.register("projectData", ProjectData);
	testInjector.register("platforsmData", stubs.PlatformsDataStub);
	testInjector.register("childProcess", ChildProcess);
	testInjector.register("platformService", PlatformService);
	testInjector.register("platformsData", PlatformsData);
	testInjector.register("androidProjectService", {});
	testInjector.register("iOSProjectService", {});
	testInjector.register("devicesServices", {});
	testInjector.register("projectDataService", ProjectDataService);
	testInjector.register("prompter", {});
	testInjector.register("resources", ResourceLoader);
	testInjector.register("broccoliBuilder", {});
	testInjector.register("options", Options);
	testInjector.register("errors", Errors);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("commandsService", CommandsService);
	testInjector.register("commandsServiceProvider", {
		registerDynamicSubCommands: () => { /* intentionally empty body */ }
	});
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("lockfile", { });
	testInjector.register("projectHelper", ProjectHelper);

	testInjector.register("pluginsService", PluginsService);
	testInjector.register("analyticsService", {
		trackException: () => { return future.fromResult(); },
		checkConsent: () => { return future.fromResult(); },
		trackFeature: () => { return future.fromResult(); }
	});
	testInjector.register("projectFilesManager", ProjectFilesManager);
	testInjector.register("pluginVariablesService", {
		savePluginVariablesInProjectFile: (pluginData: IPluginData) => future.fromResult(),
		interpolatePluginVariables: (pluginData: IPluginData, pluginConfigurationFileContent: string) => future.fromResult(pluginConfigurationFileContent)
	});
	testInjector.register("npmInstallationManager", {});

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
	};
	pluginsService.ensureAllDependenciesAreInstalled = () => {
		return future.fromResult();
	};

	mockBeginCommand(testInjector, "Exception: " + expectedErrorMessage);

	isErrorThrown = false;
	let commandsService = testInjector.resolve(CommandsService);
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
		testInjector.registerCommand("plugin|add", AddPluginCommand);
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
			};

			mockBeginCommand(testInjector, "Exception: " + 'Plugin "plugin1" is already installed.');

			isErrorThrown = false;
			let commandsService = testInjector.resolve(CommandsService);
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
			fs.createDirectory(path.join(projectFolder, "platforms", "android", "app")).wait();

			// Mock logger.warn
			let logger = testInjector.resolve("logger");
			logger.warn = (message: string) => {
				assert.equal(message, expectedWarningMessage);
				isWarningMessageShown = true;
			};

			// Mock pluginsService
			let pluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = () => {
				return (() => {
					return [{
						name: ""
					}];
				}).future<IPluginData[]>()();
			};

			// Mock platformsData
			let platformsData = testInjector.resolve("platformsData");
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: path.join(projectFolder, "platforms", "android"),
					frameworkPackageName: "tns-android",
					normalizedPlatformName: "Android"
				};
			};

			pluginsService.add(pluginFolderPath).wait();

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
			};

			let commandsService = testInjector.resolve(CommandsService);
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
			let expectedDependencies = { "plugin1": "^1.0.3" };
			let expectedDependenciesExact = { "plugin1": "1.0.3" };
			assert.isTrue(_.isEqual(actualDependencies, expectedDependencies) || _.isEqual(actualDependencies, expectedDependenciesExact));
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
			};

			let commandsService = testInjector.resolve(CommandsService);
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
			let expectedDependencies = { "plugin1": "^1.0.0" };
			let expectedDependenciesExact = { "plugin1": "1.0.0" };
			assert.isTrue(_.isEqual(actualDependencies, expectedDependencies) || _.isEqual(actualDependencies, expectedDependenciesExact));
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
			};

			let commandsService = testInjector.resolve(CommandsService);
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
			};

			// Mock options
			let options = testInjector.resolve("options");
			options.production = true;

			let commandsService = testInjector.resolve(CommandsService);
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
			};

			// Mock options
			let options = testInjector.resolve("options");
			options.production = false;

			let commandsService = testInjector.resolve(CommandsService);
			commandsService.tryExecuteCommand("plugin|add", [pluginFolderPath]).wait();
		});
	});

	describe("merge xmls tests", () => {
		beforeEach(() => {
			testInjector = createTestInjector();
			testInjector.registerCommand("plugin|add", AddPluginCommand);
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
			};

			let appDestinationDirectoryPath = path.join(projectFolder, "platforms", "android");

			// Mock platformsData
			let platformsData = testInjector.resolve("platformsData");
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: appDestinationDirectoryPath,
					frameworkPackageName: "tns-android",
					configurationFileName: "AndroidManifest.xml",
					normalizedPlatformName: "Android",
					platformProjectService: {
						preparePluginNativeCode: (pluginData: IPluginData) => future.fromResult()
					}
				};
			};

			// Ensure the pluginDestinationPath folder exists
			let pluginPlatformsDirPath = path.join(projectFolder, "node_modules", pluginName, "platforms", "android");
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
			pluginsService.prepare(pluginJsonData).wait();
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
			};

			let appDestinationDirectoryPath = path.join(projectFolder, "platforms", "android");
			fs.ensureDirectoryExists(path.join(appDestinationDirectoryPath, "app")).wait();

			// Mock platformsData
			let platformsData = testInjector.resolve("platformsData");
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: appDestinationDirectoryPath,
					frameworkPackageName: "tns-android",
					configurationFileName: "AndroidManifest.xml",
					configurationFilePath: path.join(appDestinationDirectoryPath, "AndroidManifest.xml"),
					mergeXmlConfig: [{ "nodename": "manifest", "attrname": "*" }],
					platformProjectService:  {
						preparePluginNativeCode: (pluginData: IPluginData) => future.fromResult()
					},
					normalizedPlatformName: "Android"
				};
			};

			// Ensure the pluginDestinationPath folder exists
			let pluginPlatformsDirPath = path.join(projectFolder, "node_modules", pluginName, "platforms", "android");
			fs.ensureDirectoryExists(pluginPlatformsDirPath).wait();

			// Creates valid plugin's AndroidManifest.xml file
			let xml = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
				'<uses-permission android:name="android.permission.READ_CONTACTS"/>' +
				'</manifest>';
			let pluginConfigurationFilePath = path.join(pluginPlatformsDirPath, "AndroidManifest.xml");
			fs.writeFile(pluginConfigurationFilePath, xml).wait();

			pluginsService.prepare(pluginJsonData).wait();

			let expectedXml = '<?xmlversion="1.0"encoding="UTF-8"?><manifestxmlns:android="http://schemas.android.com/apk/res/android"package="com.example.android.basiccontactables"android:versionCode="1"android:versionName="1.0"><uses-permissionandroid:name="android.permission.READ_EXTERNAL_STORAGE"/><uses-permissionandroid:name="android.permission.WRITE_EXTERNAL_STORAGE"/><uses-permissionandroid:name="android.permission.INTERNET"/><applicationandroid:allowBackup="true"android:icon="@drawable/ic_launcher"android:label="@string/app_name"android:theme="@style/Theme.Sample"><activityandroid:name="com.example.android.basiccontactables.MainActivity"android:label="@string/app_name"android:launchMode="singleTop"><meta-dataandroid:name="android.app.searchable"android:resource="@xml/searchable"/><intent-filter><actionandroid:name="android.intent.action.SEARCH"/></intent-filter><intent-filter><actionandroid:name="android.intent.action.MAIN"/></intent-filter></activity></application><uses-permissionandroid:name="android.permission.READ_CONTACTS"/></manifest>';
			expectedXml = helpers.stringReplaceAll(expectedXml, EOL, "");
			expectedXml = helpers.stringReplaceAll(expectedXml, " ", "");

			let actualXml = fs.readText(path.join(appDestinationDirectoryPath, "AndroidManifest.xml")).wait();
			actualXml = helpers.stringReplaceAll(actualXml, "\n", "");
			actualXml = helpers.stringReplaceAll(actualXml, " ", "");

			assert.equal(expectedXml, actualXml);
		});
	});
});
