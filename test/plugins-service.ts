import {Yok} from '../lib/common/yok';
import future = require("fibers/future");
import * as stubs from './stubs';
import {NodePackageManager} from "../lib/node-package-manager";
import {NpmInstallationManager} from "../lib/npm-installation-manager";
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
import {ProjectFilesManager} from "../lib/common/services/project-files-manager";
import {ResourceLoader} from "../lib/common/resource-loader";
import {PluginsService} from "../lib/services/plugins-service";
import {AddPluginCommand} from "../lib/commands/plugin/add-plugin";
import {MessagesService} from "../lib/common/services/messages-service";
import {NodeModulesBuilder} from "../lib/tools/node-modules/node-modules-builder";
import {AndroidProjectService} from "../lib/services/android-project-service";
import {AndroidToolsInfo} from "../lib/android-tools-info";
import {assert} from "chai";
import {DeviceAppDataFactory} from "../lib/common/mobile/device-app-data/device-app-data-factory";
import {LocalToDevicePathDataFactory} from "../lib/common/mobile/local-to-device-path-data-factory";
import {MobileHelper} from "../lib/common/mobile/mobile-helper";
import {ProjectFilesProvider} from "../lib/providers/project-files-provider";
import {DeviceAppDataProvider} from "../lib/providers/device-app-data-provider";
import {MobilePlatformsCapabilities} from "../lib/mobile-platforms-capabilities";
import {DevicePlatformsConstants} from "../lib/common/mobile/device-platforms-constants";
import { XmlValidator } from "../lib/xml-validator";
import StaticConfigLib = require("../lib/config");
import * as path from "path";
import * as temp from "temp";
temp.track();

let isErrorThrown = false;

function createTestInjector() {
	let testInjector = new Yok();
	testInjector.register("messagesService", MessagesService);
	testInjector.register("npm", NodePackageManager);
	testInjector.register("fs", FileSystem);
	testInjector.register("adb", {});
	testInjector.register("androidDebugBridgeResultHandler", {});
	testInjector.register("projectData", ProjectData);
	testInjector.register("platforsmData", stubs.PlatformsDataStub);
	testInjector.register("childProcess", ChildProcess);
	testInjector.register("platformService", PlatformService);
	testInjector.register("platformsData", PlatformsData);
	testInjector.register("androidEmulatorServices", {});
	testInjector.register("androidToolsInfo", AndroidToolsInfo);
	testInjector.register("sysInfo", {});
	testInjector.register("androidProjectService", AndroidProjectService);
	testInjector.register("iOSProjectService", {});
	testInjector.register("devicesService", {});
	testInjector.register("projectDataService", ProjectDataService);
	testInjector.register("prompter", {});
	testInjector.register("resources", ResourceLoader);
	testInjector.register("nodeModulesBuilder", NodeModulesBuilder);
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
	testInjector.register("lockfile", {});
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
	testInjector.register("npmInstallationManager", NpmInstallationManager);

	testInjector.register("deviceAppDataFactory", DeviceAppDataFactory);
	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("projectFilesProvider", ProjectFilesProvider);
	testInjector.register("deviceAppDataProvider", DeviceAppDataProvider);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("projectTemplatesService", {
		defaultTemplate: future.fromResult("")
	});
	testInjector.register("xmlValidator", XmlValidator);
	testInjector.register("config", StaticConfigLib.Configuration);

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
				"version": "1.4.0"
			}
		}
	};

	testInjector.resolve("fs").writeJson(path.join(tempFolder, "package.json"), packageJsonData);
	return tempFolder;
}

function mockBeginCommand(testInjector: IInjector, expectedErrorMessage: string) {
	let errors = testInjector.resolve("errors");
	errors.beginCommand = (action: () => IFuture<boolean>): IFuture<void> => {
		return (() => {
			try {
				return action().wait();
			} catch (err) {
				isErrorThrown = true;
				assert.equal(err.toString(), expectedErrorMessage);
			}
		}).future<void>()();
	};
}

function addPluginWhenExpectingToFail(testInjector: IInjector, plugin: string, expectedErrorMessage: string, command?: string) {
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
	commandsService.tryExecuteCommand(`plugin|${command}`, [plugin]).wait();

	assert.isTrue(isErrorThrown);
}

function createAndroidManifestFile(projectFolder: string, fs: IFileSystem): void {
	let manifest = `
        <?xml version="1.0" encoding="UTF-8"?>
		<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >
            <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
            <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
            <uses-permission android:name="android.permission.INTERNET"/>
            <application android:allowBackup="true" android:icon="@drawable/ic_launcher" android:label="@string/app_name" android:theme="@style/Theme.Sample" >
                <activity android:name="com.example.android.basiccontactables.MainActivity" android:label="@string/app_name" android:launchMode="singleTop">
                    <meta-data android:name="android.app.searchable" android:resource="@xml/searchable" />
                    <intent-filter>
                        <action android:name="android.intent.action.SEARCH" />
                    </intent-filter>
                    <intent-filter>
                        <action android:name="android.intent.action.MAIN" />
                    </intent-filter>
                </activity>
            </application>
		</manifest>`;

	fs.createDirectory(path.join(projectFolder, "platforms"));
	fs.createDirectory(path.join(projectFolder, "platforms", "android"));
	fs.writeFile(path.join(projectFolder, "platforms", "android", "AndroidManifest.xml"), manifest);
}

describe("Plugins service", () => {
	let testInjector: IInjector;
	let commands = ["add", "install"];
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.registerCommand("plugin|add", AddPluginCommand);
		testInjector.registerCommand("plugin|install", AddPluginCommand);
	});

	_.each(commands, command => {
		describe(`plugin ${command}}`, () => {
			it("fails when no param is specified to plugin install command", () => {
				addPluginWhenExpectingToFail(testInjector, null, "You must specify plugin name.", command);
			});
			it("fails when invalid nativescript plugin name is specified", () => {
				addPluginWhenExpectingToFail(testInjector, "lodash", "lodash is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.", command);
			});
			it("fails when the plugin is already installed", () => {
				let pluginName = "plugin1";
				let projectFolder = createProjectFile(testInjector);
				let fs = testInjector.resolve("fs");

				// Add plugin
				let projectFilePath = path.join(projectFolder, "package.json");
				let projectData = require(projectFilePath);
				projectData.dependencies = {};
				projectData.dependencies[pluginName] = "^1.0.0";
				fs.writeJson(projectFilePath, projectData);

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
				commandsService.tryExecuteCommand(`plugin|${command}`, [pluginName]).wait();

				assert.isTrue(isErrorThrown);
			});
			it("fails when the plugin does not support the installed framework", () => {
				let isWarningMessageShown = false;
				let expectedWarningMessage = "mySamplePlugin 1.5.0 for android is not compatible with the currently installed framework version 1.4.0.";

				// Creates plugin in temp folder
				let pluginName = "mySamplePlugin";
				let projectFolder = createProjectFile(testInjector);
				let pluginFolderPath = path.join(projectFolder, pluginName);
				let pluginJsonData = {
					"name": pluginName,
					"version": "0.0.1",
					"nativescript": {
						"platforms": {
							"android": "1.5.0"
						}
					},
				};
				let fs = testInjector.resolve("fs");
				fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

				// Adds android platform
				fs.createDirectory(path.join(projectFolder, "platforms"));
				fs.createDirectory(path.join(projectFolder, "platforms", "android"));
				fs.createDirectory(path.join(projectFolder, "platforms", "android", "app"));

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
				commandsService.tryExecuteCommand(`plugin|${command}`, [pluginName]).wait();

				let fs = testInjector.resolve("fs");

				// Asserts that the all plugin's content is successfully added to node_modules folder
				let nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isTrue(fs.exists(nodeModulesFolderPath));

				let pluginFolderPath = path.join(nodeModulesFolderPath, pluginName);
				assert.isTrue(fs.exists(pluginFolderPath));

				let pluginFiles = ["injex.js", "main.js", "package.json"];
				_.each(pluginFiles, pluginFile => {
					assert.isTrue(fs.exists(path.join(pluginFolderPath, pluginFile)));
				});

				// Asserts that the plugin is added in package.json file
				let packageJsonContent = fs.readJson(path.join(projectFolder, "package.json"));
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
				commandsService.tryExecuteCommand(`plugin|${command}`, [pluginName + "@1.0.0"]).wait();

				let fs = testInjector.resolve("fs");

				// Assert that the all plugin's content is successfully added to node_modules folder
				let nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isTrue(fs.exists(nodeModulesFolderPath));

				let pluginFolderPath = path.join(nodeModulesFolderPath, pluginName);
				assert.isTrue(fs.exists(pluginFolderPath));

				let pluginFiles = ["injex.js", "main.js", "package.json"];
				_.each(pluginFiles, pluginFile => {
					assert.isTrue(fs.exists(path.join(pluginFolderPath, pluginFile)));
				});

				// Assert that the plugin is added in package.json file
				let packageJsonContent = fs.readJson(path.join(projectFolder, "package.json"));
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
				fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

				let pluginsService = testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = () => {
					return (() => {
						return [{
							name: ""
						}];
					}).future<IPluginData[]>()();
				};

				let commandsService = testInjector.resolve(CommandsService);
				commandsService.tryExecuteCommand(`plugin|${command}`, [pluginFolderPath]).wait();

				// Assert that the all plugin's content is successfully added to node_modules folder
				let nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isTrue(fs.exists(nodeModulesFolderPath));
				assert.isTrue(fs.exists(path.join(nodeModulesFolderPath, pluginName)));

				let pluginFiles = ["package.json"];
				_.each(pluginFiles, pluginFile => {
					assert.isTrue(fs.exists(path.join(nodeModulesFolderPath, pluginName, pluginFile)));
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
				fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

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
				commandsService.tryExecuteCommand(`plugin|${command}`, [pluginFolderPath]).wait();

				let nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isFalse(fs.exists(path.join(nodeModulesFolderPath, pluginName, "node_modules", "grunt")));
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
				fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

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
				commandsService.tryExecuteCommand(`plugin|${command}`, [pluginFolderPath]).wait();
			});
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
			fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

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
			fs.ensureDirectoryExists(pluginPlatformsDirPath);

			// Creates invalid plugin's AndroidManifest.xml file
			let xml = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
				'<uses-permission android:name="android.permission.READ_CONTACTS"/>';
			let pluginConfigurationFilePath = path.join(pluginPlatformsDirPath, "AndroidManifest.xml");
			fs.writeFile(pluginConfigurationFilePath, xml);

			// Expected error message. The assertion happens in mockBeginCommand
			let expectedErrorMessage = `Exception: Invalid xml file ${pluginConfigurationFilePath}. Additional technical information: element parse error: Exception: Invalid xml file ` +
				`${pluginConfigurationFilePath}. Additional technical information: unclosed xml attribute` +
				`\n@#[line:1,col:39].` +
				`\n@#[line:1,col:39].`;
			mockBeginCommand(testInjector, expectedErrorMessage);
			pluginsService.prepare(pluginJsonData, "android").wait();
		});
	});
});
