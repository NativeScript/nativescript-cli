import { Yok } from '../lib/common/yok';
import * as stubs from './stubs';
import { NodePackageManager } from "../lib/node-package-manager";
import { NpmInstallationManager } from "../lib/npm-installation-manager";
import { FileSystem } from "../lib/common/file-system";
import { ProjectData } from "../lib/project-data";
import { ChildProcess } from "../lib/common/child-process";
import { PlatformService } from '../lib/services/platform-service';
import { Options } from "../lib/options";
import { CommandsService } from "../lib/common/services/commands-service";
import { StaticConfig } from "../lib/config";
import { HostInfo } from "../lib/common/host-info";
import { Errors } from "../lib/common/errors";
import { ProjectHelper } from "../lib/common/project-helper";
import { PlatformsData } from "../lib/platforms-data";
import { ProjectDataService } from "../lib/services/project-data-service";
import { ProjectFilesManager } from "../lib/common/services/project-files-manager";
import { ResourceLoader } from "../lib/common/resource-loader";
import { PluginsService } from "../lib/services/plugins-service";
import { AddPluginCommand } from "../lib/commands/plugin/add-plugin";
import { MessagesService } from "../lib/common/services/messages-service";
import { NodeModulesBuilder } from "../lib/tools/node-modules/node-modules-builder";
import { AndroidProjectService } from "../lib/services/android-project-service";
import { AndroidToolsInfo } from "../lib/android-tools-info";
import { assert } from "chai";
import { DeviceAppDataFactory } from "../lib/common/mobile/device-app-data/device-app-data-factory";
import { LocalToDevicePathDataFactory } from "../lib/common/mobile/local-to-device-path-data-factory";
import { MobileHelper } from "../lib/common/mobile/mobile-helper";
import { ProjectFilesProvider } from "../lib/providers/project-files-provider";
import { MobilePlatformsCapabilities } from "../lib/mobile-platforms-capabilities";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { XmlValidator } from "../lib/xml-validator";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import StaticConfigLib = require("../lib/config");
import * as path from "path";
import * as temp from "temp";
temp.track();

let isErrorThrown = false;

function createTestInjector() {
	const testInjector = new Yok();
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
	testInjector.register("projectHelper", ProjectHelper);

	testInjector.register("pluginsService", PluginsService);
	testInjector.register("analyticsService", {
		trackException: () => { return Promise.resolve(); },
		checkConsent: () => { return Promise.resolve(); },
		trackFeature: () => { return Promise.resolve(); },
		trackEventActionInGoogleAnalytics: (data: IEventActionData) => Promise.resolve(),
		trackInGoogleAnalytics: (data: IGoogleAnalyticsData) => Promise.resolve(),
		trackAcceptFeatureUsage: (settings: { acceptTrackFeatureUsage: boolean }) => Promise.resolve()
	});
	testInjector.register("projectFilesManager", ProjectFilesManager);
	testInjector.register("pluginVariablesService", {
		savePluginVariablesInProjectFile: (pluginData: IPluginData) => Promise.resolve(),
		interpolatePluginVariables: (pluginData: IPluginData, pluginConfigurationFileContent: string) => Promise.resolve(pluginConfigurationFileContent)
	});
	testInjector.register("npmInstallationManager", NpmInstallationManager);

	testInjector.register("deviceAppDataFactory", DeviceAppDataFactory);
	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("projectFilesProvider", ProjectFilesProvider);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("projectTemplatesService", {
		defaultTemplate: Promise.resolve("")
	});
	testInjector.register("xmlValidator", XmlValidator);
	testInjector.register("config", StaticConfigLib.Configuration);
	testInjector.register("helpService", {
		showCommandLineHelp: async (): Promise<void> => (undefined)
	});
	testInjector.register("settingsService", SettingsService);
	testInjector.register("progressIndicator", {
		getSpinner: (msg: string) => ({
			start: (): void => undefined,
			stop: (): void => undefined,
			message: (): void => undefined
		})
	});
	testInjector.register("httpClient", {});
	testInjector.register("extensibilityService", {});
	return testInjector;
}

function createProjectFile(testInjector: IInjector): string {
	const tempFolder = temp.mkdirSync("pluginsService");
	const options = testInjector.resolve("options");
	options.path = tempFolder;

	const packageJsonData = {
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
	const errors = testInjector.resolve("errors");
	errors.beginCommand = async (action: () => Promise<boolean>): Promise<boolean> => {
		try {
			return await action();
		} catch (err) {
			isErrorThrown = true;
			assert.equal(err.toString(), expectedErrorMessage);
		}
	};
}

async function addPluginWhenExpectingToFail(testInjector: IInjector, plugin: string, expectedErrorMessage: string, command?: string) {
	createProjectFile(testInjector);

	const pluginsService: IPluginsService = testInjector.resolve("pluginsService");
	pluginsService.getAllInstalledPlugins = async (projectData: IProjectData) => {
		return <any[]>[{ name: "" }];
	};
	pluginsService.ensureAllDependenciesAreInstalled = () => {
		return Promise.resolve();
	};

	mockBeginCommand(testInjector, "Exception: " + expectedErrorMessage);

	isErrorThrown = false;
	const commandsService = testInjector.resolve(CommandsService);
	await commandsService.tryExecuteCommand(`plugin|${command}`, [plugin]);

	assert.isTrue(isErrorThrown);
}

function createAndroidManifestFile(projectFolder: string, fs: IFileSystem): void {
	const manifest = `
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
	const commands = ["add", "install"];
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.registerCommand("plugin|add", AddPluginCommand);
		testInjector.registerCommand("plugin|install", AddPluginCommand);
	});

	_.each(commands, command => {
		describe(`plugin ${command}`, () => {
			it("fails when no param is specified to plugin install command", async () => {
				await addPluginWhenExpectingToFail(testInjector, null, "You must specify plugin name.", command);
			});
			it("fails when invalid nativescript plugin name is specified", async () => {
				await addPluginWhenExpectingToFail(testInjector, "lodash", "lodash is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.", command);
			});
			it("fails when the plugin is already installed", async () => {
				const pluginName = "plugin1";
				const projectFolder = createProjectFile(testInjector);
				const fs = testInjector.resolve("fs");

				// Add plugin
				const projectFilePath = path.join(projectFolder, "package.json");
				const projectData = require(projectFilePath);
				projectData.dependencies = {};
				projectData.dependencies[pluginName] = "^1.0.0";
				fs.writeJson(projectFilePath, projectData);

				const pluginsService: IPluginsService = testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (projData: IProjectData) => {
					return <any[]>[{ name: "plugin1" }];
				};

				mockBeginCommand(testInjector, "Exception: " + 'Plugin "plugin1" is already installed.');

				isErrorThrown = false;
				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [pluginName]);

				assert.isTrue(isErrorThrown);
			});
			it("fails when the plugin does not support the installed framework", async () => {
				let isWarningMessageShown = false;
				const expectedWarningMessage = "mySamplePlugin 1.5.0 for android is not compatible with the currently installed framework version 1.4.0.";

				// Creates plugin in temp folder
				const pluginName = "mySamplePlugin";
				const projectFolder = createProjectFile(testInjector);
				const pluginFolderPath = path.join(projectFolder, pluginName);
				const pluginJsonData = {
					"name": pluginName,
					"version": "0.0.1",
					"nativescript": {
						"platforms": {
							"android": "1.5.0"
						}
					},
				};
				const fs = testInjector.resolve("fs");
				fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

				// Adds android platform
				fs.createDirectory(path.join(projectFolder, "platforms"));
				fs.createDirectory(path.join(projectFolder, "platforms", "android"));
				fs.createDirectory(path.join(projectFolder, "platforms", "android", "app"));

				// Mock logger.warn
				const logger = testInjector.resolve("logger");
				logger.warn = (message: string) => {
					assert.equal(message, expectedWarningMessage);
					isWarningMessageShown = true;
				};

				// Mock pluginsService
				const pluginsService: IPluginsService = testInjector.resolve("pluginsService");
				const projectData: IProjectData = testInjector.resolve("projectData");
				projectData.initializeProjectData();
				pluginsService.getAllInstalledPlugins = async (projData: IProjectData) => {
					return <any[]>[{ name: "" }];
				};

				// Mock platformsData
				const platformsData = testInjector.resolve("platformsData");
				platformsData.getPlatformData = (platform: string) => {
					return {
						appDestinationDirectoryPath: path.join(projectFolder, "platforms", "android"),
						frameworkPackageName: "tns-android",
						normalizedPlatformName: "Android"
					};
				};

				await pluginsService.add(pluginFolderPath, projectData);

				assert.isTrue(isWarningMessageShown);
			});
			it("adds plugin by name", async () => {
				const pluginName = "plugin1";
				const projectFolder = createProjectFile(testInjector);

				const pluginsService: IPluginsService = testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (projectData: IProjectData) => {
					return <any[]>[{ name: "" }];
				};

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [pluginName]);

				const fs = testInjector.resolve("fs");

				// Asserts that the all plugin's content is successfully added to node_modules folder
				const nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isTrue(fs.exists(nodeModulesFolderPath));

				const pluginFolderPath = path.join(nodeModulesFolderPath, pluginName);
				assert.isTrue(fs.exists(pluginFolderPath));

				const pluginFiles = ["injex.js", "main.js", "package.json"];
				_.each(pluginFiles, pluginFile => {
					assert.isTrue(fs.exists(path.join(pluginFolderPath, pluginFile)));
				});

				// Asserts that the plugin is added in package.json file
				const packageJsonContent = fs.readJson(path.join(projectFolder, "package.json"));
				const actualDependencies = packageJsonContent.dependencies;
				const expectedDependencies = { "plugin1": "^1.0.3" };
				const expectedDependenciesExact = { "plugin1": "1.0.3" };
				assert.isTrue(_.isEqual(actualDependencies, expectedDependencies) || _.isEqual(actualDependencies, expectedDependenciesExact));
			});
			it("adds plugin by name and version", async () => {
				const pluginName = "plugin1";
				const projectFolder = createProjectFile(testInjector);

				const pluginsService: IPluginsService = testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (projectData: IProjectData) => {
					return <any[]>[{ name: "" }];
				};

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [pluginName + "@1.0.0"]);

				const fs = testInjector.resolve("fs");

				// Assert that the all plugin's content is successfully added to node_modules folder
				const nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isTrue(fs.exists(nodeModulesFolderPath));

				const pluginFolderPath = path.join(nodeModulesFolderPath, pluginName);
				assert.isTrue(fs.exists(pluginFolderPath));

				const pluginFiles = ["injex.js", "main.js", "package.json"];
				_.each(pluginFiles, pluginFile => {
					assert.isTrue(fs.exists(path.join(pluginFolderPath, pluginFile)));
				});

				// Assert that the plugin is added in package.json file
				const packageJsonContent = fs.readJson(path.join(projectFolder, "package.json"));
				const actualDependencies = packageJsonContent.dependencies;
				const expectedDependencies = { "plugin1": "^1.0.0" };
				const expectedDependenciesExact = { "plugin1": "1.0.0" };
				assert.isTrue(_.isEqual(actualDependencies, expectedDependencies) || _.isEqual(actualDependencies, expectedDependenciesExact));
			});
			it("adds plugin by local path", async () => {
				// Creates a plugin in tempFolder
				const pluginName = "mySamplePlugin";
				const projectFolder = createProjectFile(testInjector);
				const pluginFolderPath = path.join(projectFolder, pluginName);
				const pluginJsonData = {
					"name": pluginName,
					"version": "0.0.1",
					"nativescript": {
						"platforms": {

						}
					},
				};
				const fs = testInjector.resolve("fs");
				fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

				const pluginsService: IPluginsService = testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (projectData: IProjectData) => {
					return <any[]>[{ name: "" }];
				};

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [pluginFolderPath]);

				// Assert that the all plugin's content is successfully added to node_modules folder
				const nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isTrue(fs.exists(nodeModulesFolderPath));
				assert.isTrue(fs.exists(path.join(nodeModulesFolderPath, pluginName)));

				const pluginFiles = ["package.json"];
				_.each(pluginFiles, pluginFile => {
					assert.isTrue(fs.exists(path.join(nodeModulesFolderPath, pluginName, pluginFile)));
				});
			});
			it("adds plugin by github url", () => {
				// TODO: add test
			});
			it("doesn't install dev dependencies when --production option is specified", async () => {
				// Creates a plugin in tempFolder
				const pluginName = "mySamplePlugin";
				const projectFolder = createProjectFile(testInjector);
				const pluginFolderPath = path.join(projectFolder, pluginName);
				const pluginJsonData = {
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
				const fs = testInjector.resolve("fs");
				fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

				const pluginsService: IPluginsService = testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (projectData: IProjectData) => {
					return <any[]>[{ name: "" }];
				};

				// Mock options
				const options = testInjector.resolve("options");
				options.production = true;

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [pluginFolderPath]);

				const nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isFalse(fs.exists(path.join(nodeModulesFolderPath, pluginName, "node_modules", "grunt")));
			});
			it("install dev dependencies when --production option is not specified", async () => {
				// Creates a plugin in tempFolder
				const pluginName = "mySamplePlugin";
				const projectFolder = createProjectFile(testInjector);
				const pluginFolderPath = path.join(projectFolder, pluginName);
				const pluginJsonData = {
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
				const fs = testInjector.resolve("fs");
				fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

				const pluginsService: IPluginsService = testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (projectData: IProjectData) => {
					return <any[]>[{ name: "" }];
				};

				// Mock options
				const options = testInjector.resolve("options");
				options.production = false;

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [pluginFolderPath]);
			});
		});
	});

	describe("merge xmls tests", () => {
		beforeEach(() => {
			testInjector = createTestInjector();
			testInjector.registerCommand("plugin|add", AddPluginCommand);
		});
		it("fails if the plugin contains incorrect xml", async () => {
			const pluginName = "mySamplePlugin";
			const projectFolder = createProjectFile(testInjector);
			const pluginFolderPath = path.join(projectFolder, pluginName);
			const pluginJsonData: IDependencyData = {
				name: pluginName,
				nativescript: {
					platforms: {
						android: "0.10.0"
					}
				},
				depth: 0,
				directory: "some dir"
			};
			const fs = testInjector.resolve("fs");
			fs.writeJson(path.join(pluginFolderPath, "package.json"), pluginJsonData);

			// Adds AndroidManifest.xml file in platforms/android folder
			createAndroidManifestFile(projectFolder, fs);

			// Mock plugins service
			const pluginsService: IPluginsService = testInjector.resolve("pluginsService");
			pluginsService.getAllInstalledPlugins = async (projectData: IProjectData) => {
				return <any[]>[{ name: "" }];
			};

			const appDestinationDirectoryPath = path.join(projectFolder, "platforms", "android");

			// Mock platformsData
			const platformsData = testInjector.resolve("platformsData");
			platformsData.getPlatformData = (platform: string) => {
				return {
					appDestinationDirectoryPath: appDestinationDirectoryPath,
					frameworkPackageName: "tns-android",
					configurationFileName: "AndroidManifest.xml",
					normalizedPlatformName: "Android",
					platformProjectService: {
						preparePluginNativeCode: (pluginData: IPluginData) => Promise.resolve()
					}
				};
			};

			// Ensure the pluginDestinationPath folder exists
			const pluginPlatformsDirPath = path.join(projectFolder, "node_modules", pluginName, "platforms", "android");
			const projectData: IProjectData = testInjector.resolve("projectData");
			projectData.initializeProjectData();
			fs.ensureDirectoryExists(pluginPlatformsDirPath);

			// Creates invalid plugin's AndroidManifest.xml file
			const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.basiccontactables" android:versionCode="1" android:versionName="1.0" >' +
				'<uses-permission android:name="android.permission.READ_CONTACTS"/>';
			const pluginConfigurationFilePath = path.join(pluginPlatformsDirPath, "AndroidManifest.xml");
			fs.writeFile(pluginConfigurationFilePath, xml);

			// Expected error message. The assertion happens in mockBeginCommand
			const expectedErrorMessage = `Exception: Invalid xml file ${pluginConfigurationFilePath}. Additional technical information: element parse error: Exception: Invalid xml file ` +
				`${pluginConfigurationFilePath}. Additional technical information: unclosed xml attribute` +
				`\n@#[line:1,col:39].` +
				`\n@#[line:1,col:39].`;
			mockBeginCommand(testInjector, expectedErrorMessage);
			await pluginsService.prepare(pluginJsonData, "android", projectData, {});
		});
	});
});
