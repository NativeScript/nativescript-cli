import { Yok } from "../lib/common/yok";
import * as stubs from "./stubs";
import { PackageManager } from "../lib/package-manager";
import { PackageInstallationManager } from "../lib/package-installation-manager";
import { NodePackageManager } from "../lib/node-package-manager";
import { YarnPackageManager } from "../lib/yarn-package-manager";
import { Yarn2PackageManager } from "../lib/yarn2-package-manager";
import { PnpmPackageManager } from "../lib/pnpm-package-manager";
import { BunPackageManager } from "../lib/bun-package-manager";
import { ProjectData } from "../lib/project-data";
import { ChildProcess } from "../lib/common/child-process";
import { Options } from "../lib/options";
import { CommandsService } from "../lib/common/services/commands-service";
import { StaticConfig } from "../lib/config";
import { HostInfo } from "../lib/common/host-info";
import { Errors } from "../lib/common/errors";
import { PlatformsDataService } from "../lib/services/platforms-data-service";
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
import { LocalToDevicePathDataFactory } from "../lib/common/mobile/local-to-device-path-data-factory";
import { MobileHelper } from "../lib/common/mobile/mobile-helper";
import { ProjectFilesProvider } from "../lib/providers/project-files-provider";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import * as StaticConfigLib from "../lib/config";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import * as _ from "lodash";
import {
	PLATFORMS_DIR_NAME,
	PLUGINS_BUILD_DATA_FILENAME,
	PlatformTypes,
} from "../lib/constants"; // PACKAGE_JSON_FILE_NAME, CONFIG_FILE_NAME_JS, CONFIG_FILE_NAME_TS
import { GradleCommandService } from "../lib/services/android/gradle-command-service";
import { GradleBuildService } from "../lib/services/android/gradle-build-service";
import { GradleBuildArgsService } from "../lib/services/android/gradle-build-args-service";
import * as util from "util";
import { IPluginData, IPluginsService } from "../lib/definitions/plugins";
import { IProjectData } from "../lib/definitions/project";
import { IStringDictionary } from "../lib/common/declarations";
import { IInjector } from "../lib/common/definitions/yok";
import {
	IEventActionData,
	IGoogleAnalyticsData,
} from "../lib/common/definitions/google-analytics";
// import { ProjectConfigService } from "../lib/services/project-config-service";
import { FileSystem } from "../lib/common/file-system";
import { ProjectHelper } from "../lib/common/project-helper";
import { LiveSyncProcessDataService } from "../lib/services/livesync-process-data-service";
// import { basename } from 'path';

let isErrorThrown = false;

interface ITestCase {
	testName: string;
	inputDependencies: any[];
	expectedOutput: any[] | Error;
	expectedWarning?: string;
}

function createTestInjector() {
	const testInjector = new Yok();
	testInjector.register("messagesService", MessagesService);
	testInjector.register("userSettingsService", {
		getSettingValue: async (settingName: string): Promise<void> => undefined,
	});
	testInjector.register("packageManager", PackageManager);
	testInjector.register(
		"projectConfigService",
		stubs.PackageInstallationManagerStub,
	);
	testInjector.register("npm", NodePackageManager);
	testInjector.register("yarn", YarnPackageManager);
	testInjector.register("yarn2", Yarn2PackageManager);
	testInjector.register("pnpm", PnpmPackageManager);
	testInjector.register("bun", BunPackageManager);
	testInjector.register("fs", FileSystem);
	// const fileSystemStub = new stubs.FileSystemStub();
	// fileSystemStub.exists = (fileName: string) => {
	// 	if (fileName.indexOf('nativescript.config.ts')) {
	// 		return false;
	// 	}

	// 	return true;
	// };
	// fileSystemStub.readText = (filename: string, encoding?: IReadFileOptions | string): string => {
	// 	if (filename.indexOf("package.json") > -1) {
	// 	return `{}`; //packageJsonContent;
	// 	} else if (filename.indexOf(CONFIG_FILE_NAME_JS) > -1) {
	// 	return `module.exports = {}`;
	// 	} else if (filename.indexOf(CONFIG_FILE_NAME_TS) > -1) {
	// 	return `export default {}`;
	// 	}
	// };
	// testInjector.register("fs", fileSystemStub);

	testInjector.register("adb", {});
	testInjector.register("androidDebugBridgeResultHandler", {});
	testInjector.register("projectData", ProjectData);
	testInjector.register("platforsmData", stubs.NativeProjectDataStub);
	testInjector.register("childProcess", ChildProcess);
	testInjector.register("platformsDataService", PlatformsDataService);
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
	testInjector.register("optionsTracker", {
		trackOptions: () => Promise.resolve(null),
	});
	testInjector.register("commandsService", CommandsService);
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("projectHelper", ProjectHelper);

	testInjector.register("pluginsService", PluginsService);
	testInjector.register("analyticsService", {
		trackException: () => {
			return Promise.resolve();
		},
		checkConsent: () => {
			return Promise.resolve();
		},
		trackFeature: () => {
			return Promise.resolve();
		},
		trackEventActionInGoogleAnalytics: (data: IEventActionData) =>
			Promise.resolve(),
		trackInGoogleAnalytics: (data: IGoogleAnalyticsData) => Promise.resolve(),
		trackAcceptFeatureUsage: (settings: { acceptTrackFeatureUsage: boolean }) =>
			Promise.resolve(),
	});
	testInjector.register("projectFilesManager", ProjectFilesManager);
	testInjector.register("pluginVariablesService", {
		savePluginVariablesInProjectFile: (pluginData: IPluginData) =>
			Promise.resolve(),
		interpolatePluginVariables: (
			pluginData: IPluginData,
			pluginConfigurationFileContent: string,
		) => Promise.resolve(pluginConfigurationFileContent),
	});
	testInjector.register(
		"packageInstallationManager",
		PackageInstallationManager,
	);

	testInjector.register(
		"localToDevicePathDataFactory",
		LocalToDevicePathDataFactory,
	);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("projectFilesProvider", ProjectFilesProvider);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("projectTemplatesService", {
		defaultTemplate: Promise.resolve(""),
	});
	testInjector.register("config", StaticConfigLib.Configuration);
	testInjector.register("helpService", {
		showCommandLineHelp: async (): Promise<void> => undefined,
	});
	testInjector.register("settingsService", SettingsService);
	testInjector.register("httpClient", {});
	testInjector.register("extensibilityService", {});
	testInjector.register(
		"androidPluginBuildService",
		stubs.AndroidPluginBuildServiceStub,
	);
	testInjector.register("analyticsSettingsService", {});
	testInjector.register(
		"androidResourcesMigrationService",
		stubs.AndroidResourcesMigrationServiceStub,
	);

	testInjector.register("platformEnvironmentRequirements", {});
	testInjector.register("filesHashService", {
		hasChangesInShasums: (
			oldPluginNativeHashes: IStringDictionary,
			currentPluginNativeHashes: IStringDictionary,
		) => true,
		generateHashes: async (files: string[]): Promise<IStringDictionary> => ({}),
	});
	testInjector.register("pacoteService", {
		manifest: async (packageName: string) => {
			const projectData = testInjector.resolve("projectData");
			const fs = testInjector.resolve("fs");
			let result = {};
			let packageJsonPath = null;

			const packageToInstall = packageName.split("@")[0];

			if (fs.exists(packageToInstall)) {
				packageJsonPath = path.join(packageName, "package.json");
			} else {
				packageJsonPath = path.join(
					projectData.projectDir,
					"node_modules",
					packageToInstall,
					"package.json",
				);
			}

			if (fs.exists(packageJsonPath)) {
				result = fs.readJson(packageJsonPath);
			}

			return result;
		},
		extractPackage: async (
			packageName: string,
			destinationDirectory: string,
			options?: IPacoteExtractOptions,
		): Promise<void> => undefined,
	});
	testInjector.register("gradleCommandService", GradleCommandService);
	testInjector.register("gradleBuildService", GradleBuildService);
	testInjector.register("gradleBuildArgsService", GradleBuildArgsService);
	testInjector.register("cleanupService", {
		setShouldDispose: (shouldDispose: boolean): void => undefined,
	});
	testInjector.register("nodeModulesDependenciesBuilder", {});
	testInjector.register("tempService", stubs.TempServiceStub);
	testInjector.register(
		"projectConfigService",
		stubs.ProjectConfigServiceStub.initWithConfig({
			id: "org.nativescript.Test",
		}),
	);
	testInjector.register(
		"liveSyncProcessDataService",
		LiveSyncProcessDataService
	);

	return testInjector;
}

function createProjectFile(testInjector: IInjector): string {
	const fs = testInjector.resolve("fs") as FileSystem;
	const tempFolder = mkdtempSync(path.join(tmpdir(), "pluginsService-"));
	const options = testInjector.resolve("options");
	options.path = tempFolder;

	const packageJsonData = {
		name: "testModuleName",
		description: "@nativescript/core", // important for project file checks - currently just looking for the @nativescript/core keyword
		version: "0.1.0",
		devDependencies: {
			"tns-android": "1.4.0",
		},
		// "nativescript": {
		// 	"id": "org.nativescript.Test",
		// 	"tns-android": {
		// 		"version": "1.4.0"
		// 	}
		// }
	};

	fs.writeJson(path.join(tempFolder, "package.json"), packageJsonData);
	// fs.writeFile(
	// 	path.join(tempFolder, CONFIG_FILE_NAME_TS),
	// 	`export default { id: 'org.nativescript.Test' }`
	// );

	return tempFolder;
}

function mockBeginCommand(
	testInjector: IInjector,
	expectedErrorMessage: string,
) {
	const errors = testInjector.resolve("errors");
	errors.beginCommand = async (
		action: () => Promise<boolean>,
	): Promise<boolean> => {
		try {
			return await action();
		} catch (err) {
			// await new Promise(resolve => setTimeout(resolve, 100000));
			isErrorThrown = true;
			assert.equal(err.toString(), expectedErrorMessage);
		}
	};
}

async function addPluginWhenExpectingToFail(
	testInjector: IInjector,
	plugin: string,
	expectedErrorMessage: string,
	command?: string,
) {
	createProjectFile(testInjector);

	const pluginsService: IPluginsService =
		testInjector.resolve("pluginsService");
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

describe("Plugins service", () => {
	let testInjector: IInjector;
	const commands = ["add", "install"];
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.registerCommand("plugin|add", AddPluginCommand);
		testInjector.registerCommand("plugin|install", AddPluginCommand);
	});

	_.each(commands, (command) => {
		describe(`plugin ${command}`, () => {
			it("fails when no param is specified to plugin install command", async () => {
				await addPluginWhenExpectingToFail(
					testInjector,
					null,
					"You must specify plugin name.",
					command,
				);
			});
			it("fails when invalid nativescript plugin name is specified", async () => {
				await addPluginWhenExpectingToFail(
					testInjector,
					"lodash",
					"lodash is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.",
					command,
				);
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

				const pluginsService: IPluginsService =
					testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (
					projData: IProjectData,
				) => {
					return <any[]>[{ name: "plugin1" }];
				};

				mockBeginCommand(
					testInjector,
					"Exception: " + 'Plugin "plugin1" is already installed.',
				);

				isErrorThrown = false;
				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [
					pluginName,
				]);

				assert.isTrue(isErrorThrown);
			});
			it("fails when the plugin does not support the installed framework", async () => {
				let isWarningMessageShown = false;
				const expectedWarningMessage =
					"mySamplePlugin requires at least version 1.5.0 of platform android. Currently installed version is 1.4.0.";

				// Creates plugin in temp folder
				const pluginName = "mySamplePlugin";
				const projectFolder = createProjectFile(testInjector);
				const pluginFolderPath = path.join(projectFolder, pluginName);
				const pluginJsonData = {
					name: pluginName,
					version: "0.0.1",
					nativescript: {
						platforms: {
							android: "1.5.0",
						},
					},
				};
				const fs = testInjector.resolve("fs");
				fs.writeJson(
					path.join(pluginFolderPath, "package.json"),
					pluginJsonData,
				);

				// Adds android platform
				fs.createDirectory(path.join(projectFolder, PLATFORMS_DIR_NAME));
				fs.createDirectory(
					path.join(projectFolder,PLATFORMS_DIR_NAME, "android", "app"),
				);

				// Mock logger.warn
				const logger = testInjector.resolve("logger");
				logger.warn = (message: string) => {
					assert.equal(message, expectedWarningMessage);
					isWarningMessageShown = true;
				};

				// Mock pluginsService
				const pluginsService: IPluginsService =
					testInjector.resolve("pluginsService");
				const projectData: IProjectData = testInjector.resolve("projectData");
				projectData.initializeProjectData();
				pluginsService.getAllInstalledPlugins = async (
					projData: IProjectData,
				) => {
					return <any[]>[{ name: "" }];
				};

				// Mock platformsDataService
				const platformsDataService = testInjector.resolve(
					"platformsDataService",
				);
				platformsDataService.getPlatformData = (platform: string) => {
					return {
						appDestinationDirectoryPath: path.join(
							projectFolder,
							PLATFORMS_DIR_NAME,
							"android",
						),
						frameworkPackageName: "tns-android",
						normalizedPlatformName: "Android",
					};
				};
				const projectDataService = testInjector.resolve("projectDataService");
				projectDataService.getRuntimePackage = (
					projectDir: string,
					platform: PlatformTypes,
				) => {
					return {
						name: "tns-android",
						version: "1.4.0",
					};
				};

				await pluginsService.add(pluginFolderPath, projectData);

				assert.isTrue(isWarningMessageShown);
			});
			it("adds plugin by name", async () => {
				const pluginName = "plugin1";
				const projectFolder = createProjectFile(testInjector);

				const pluginsService: IPluginsService =
					testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (
					projectData: IProjectData,
				) => {
					return <any[]>[{ name: "" }];
				};

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [
					pluginName,
				]);

				const fs = testInjector.resolve("fs");

				// Asserts that the all plugin's content is successfully added to node_modules folder
				const nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isTrue(fs.exists(nodeModulesFolderPath));

				const pluginFolderPath = path.join(nodeModulesFolderPath, pluginName);
				assert.isTrue(fs.exists(pluginFolderPath));

				const pluginFiles = ["injex.js", "main.js", "package.json"];
				_.each(pluginFiles, (pluginFile) => {
					assert.isTrue(fs.exists(path.join(pluginFolderPath, pluginFile)));
				});

				// Asserts that the plugin is added in package.json file
				const packageJsonContent = fs.readJson(
					path.join(projectFolder, "package.json"),
				);
				const actualDependencies = packageJsonContent.dependencies;
				const expectedDependencies = { plugin1: "^1.0.3" };
				const expectedDependenciesExact = { plugin1: "1.0.3" };
				assert.isTrue(
					_.isEqual(actualDependencies, expectedDependencies) ||
						_.isEqual(actualDependencies, expectedDependenciesExact),
				);
			});
			it("adds plugin by name and version", async () => {
				const pluginName = "plugin1";
				const projectFolder = createProjectFile(testInjector);

				const pluginsService: IPluginsService =
					testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (
					projectData: IProjectData,
				) => {
					return <any[]>[{ name: "" }];
				};

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [
					pluginName + "@1.0.0",
				]);

				const fs = testInjector.resolve("fs");

				// Assert that the all plugin's content is successfully added to node_modules folder
				const nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isTrue(fs.exists(nodeModulesFolderPath));

				const pluginFolderPath = path.join(nodeModulesFolderPath, pluginName);
				assert.isTrue(fs.exists(pluginFolderPath));

				const pluginFiles = ["injex.js", "main.js", "package.json"];
				_.each(pluginFiles, (pluginFile) => {
					assert.isTrue(fs.exists(path.join(pluginFolderPath, pluginFile)));
				});

				// Assert that the plugin is added in package.json file
				const packageJsonContent = fs.readJson(
					path.join(projectFolder, "package.json"),
				);
				const actualDependencies = packageJsonContent.dependencies;
				const expectedDependencies = { plugin1: "^1.0.0" };
				const expectedDependenciesExact = { plugin1: "1.0.0" };
				assert.isTrue(
					_.isEqual(actualDependencies, expectedDependencies) ||
						_.isEqual(actualDependencies, expectedDependenciesExact),
				);
			});
			it("adds plugin by local path", async () => {
				// Creates a plugin in tempFolder
				const pluginName = "mySamplePlugin";
				const projectFolder = createProjectFile(testInjector);
				const pluginFolderPath = path.join(projectFolder, pluginName);
				const pluginJsonData = {
					name: pluginName,
					version: "0.0.1",
					nativescript: {
						platforms: {},
					},
				};
				const fs = testInjector.resolve("fs");
				fs.writeJson(
					path.join(pluginFolderPath, "package.json"),
					pluginJsonData,
				);

				const pluginsService: IPluginsService =
					testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (
					projectData: IProjectData,
				) => {
					return <any[]>[{ name: "" }];
				};

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [
					pluginFolderPath,
				]);

				// Assert that the all plugin's content is successfully added to node_modules folder
				const nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isTrue(fs.exists(nodeModulesFolderPath));
				assert.isTrue(fs.exists(path.join(nodeModulesFolderPath, pluginName)));

				const pluginFiles = ["package.json"];
				_.each(pluginFiles, (pluginFile) => {
					assert.isTrue(
						fs.exists(path.join(nodeModulesFolderPath, pluginName, pluginFile)),
					);
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
					name: pluginName,
					version: "0.0.1",
					nativescript: {
						platforms: {},
					},
					devDependencies: {
						grunt: "*",
					},
				};
				const fs = testInjector.resolve("fs");
				fs.writeJson(
					path.join(pluginFolderPath, "package.json"),
					pluginJsonData,
				);

				const pluginsService: IPluginsService =
					testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (
					projectData: IProjectData,
				) => {
					return <any[]>[{ name: "" }];
				};

				// Mock options
				const options = testInjector.resolve("options");
				options.production = true;

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [
					pluginFolderPath,
				]);

				const nodeModulesFolderPath = path.join(projectFolder, "node_modules");
				assert.isFalse(
					fs.exists(
						path.join(
							nodeModulesFolderPath,
							pluginName,
							"node_modules",
							"grunt",
						),
					),
				);
			});
			it("install dev dependencies when --production option is not specified", async () => {
				// Creates a plugin in tempFolder
				const pluginName = "mySamplePlugin";
				const projectFolder = createProjectFile(testInjector);
				const pluginFolderPath = path.join(projectFolder, pluginName);
				const pluginJsonData = {
					name: pluginName,
					version: "0.0.1",
					nativescript: {
						platforms: {},
					},
					dependencies: {
						lodash: "*",
					},
					devDependencies: {
						grunt: "*",
					},
				};
				const fs = testInjector.resolve("fs");
				fs.writeJson(
					path.join(pluginFolderPath, "package.json"),
					pluginJsonData,
				);

				const pluginsService: IPluginsService =
					testInjector.resolve("pluginsService");
				pluginsService.getAllInstalledPlugins = async (
					projectData: IProjectData,
				) => {
					return <any[]>[{ name: "" }];
				};

				// Mock options
				const options = testInjector.resolve("options");
				options.production = false;

				const commandsService = testInjector.resolve(CommandsService);
				await commandsService.tryExecuteCommand(`plugin|${command}`, [
					pluginFolderPath,
				]);
			});
		});
	});

	describe("preparePluginNativeCode", () => {
		const setupTest = (opts: {
			hasChangesInShasums?: boolean;
			newPluginHashes?: IStringDictionary;
			buildDataFileExists?: boolean;
			hasPluginPlatformsDir?: boolean;
			pluginHashesAfterPrepare?: IStringDictionary;
		}): any => {
			const testData: any = {
				pluginsService: null,
				isPreparePluginNativeCodeCalled: false,
				dataPassedToWriteJson: null,
			};

			const unitTestsInjector = new Yok();
			unitTestsInjector.register("platformsDataService", {
				getPlatformData: (_platform: string, pData: IProjectData) => ({
					projectRoot: "projectRoot",
					platformProjectService: {
						preparePluginNativeCode: async (
							pluginData: IPluginData,
							projData: IProjectData,
						) => {
							testData.isPreparePluginNativeCodeCalled = true;
						},
					},
					platformsData: {},
					normalizedPlatformName: "iOS",
				}),
			});

			const pluginHashes = opts.newPluginHashes || { file1: "hash1" };
			const samplePluginData: IPluginData = <any>{
				fullPath: "plugin_full_path",
				name: "plugin_name",
				pluginPlatformsFolderPath: (_platform: string) =>
					path.join("plugin_dir", PLATFORMS_DIR_NAME, _platform.toLowerCase()),
			};

			unitTestsInjector.register("filesHashService", {
				hasChangesInShasums: (
					oldPluginNativeHashes: IStringDictionary,
					currentPluginNativeHashes: IStringDictionary,
				) => !!opts.hasChangesInShasums,
				generateHashes: async (files: string[]): Promise<IStringDictionary> =>
					testData.isPreparePluginNativeCodeCalled &&
					opts.pluginHashesAfterPrepare
						? opts.pluginHashesAfterPrepare
						: pluginHashes,
			});

			unitTestsInjector.register("fs", {
				exists: (file: string) => {
					if (file.indexOf(PLUGINS_BUILD_DATA_FILENAME) !== -1) {
						return !!opts.buildDataFileExists;
					}

					if (file.indexOf(PLATFORMS_DIR_NAME) !== -1) {
						return !!opts.hasPluginPlatformsDir;
					}

					return true;
				},
				readJson: (file: string) => ({
					[samplePluginData.name]: pluginHashes,
				}),
				writeJson: (file: string, json: any) => {
					testData.dataPassedToWriteJson = json;
				},
				enumerateFilesInDirectorySync: (): string[] => ["some_file"],
			});

			unitTestsInjector.register("packageManager", {});
			unitTestsInjector.register("options", {});
			unitTestsInjector.register("logger", {});
			unitTestsInjector.register("errors", {});
			unitTestsInjector.register("injector", unitTestsInjector);
			unitTestsInjector.register("mobileHelper", MobileHelper);
			unitTestsInjector.register(
				"devicePlatformsConstants",
				DevicePlatformsConstants,
			);
			unitTestsInjector.register("nodeModulesDependenciesBuilder", {});
			unitTestsInjector.register("tempService", stubs.TempServiceStub);

			const pluginsService: PluginsService =
				unitTestsInjector.resolve(PluginsService);
			testData.pluginsService = pluginsService;
			testData.pluginData = samplePluginData;
			return testData;
		};

		const platform = "platform";
		const projectData: IProjectData = <any>{};

		it("does not prepare the files when plugin does not have platforms dir", async () => {
			const testData = setupTest({ hasPluginPlatformsDir: false });
			await testData.pluginsService.preparePluginNativeCode({
				pluginData: testData.pluginData,
				platform,
				projectData,
			});
			assert.isFalse(testData.isPreparePluginNativeCodeCalled);
		});

		it("prepares the files when plugin has platforms dir and has not been built before", async () => {
			const newPluginHashes = { file: "hash" };
			const testData = setupTest({
				newPluginHashes,
				hasPluginPlatformsDir: true,
			});
			await testData.pluginsService.preparePluginNativeCode({
				pluginData: testData.pluginData,
				platform,
				projectData,
			});
			assert.isTrue(testData.isPreparePluginNativeCodeCalled);
			assert.deepStrictEqual(testData.dataPassedToWriteJson, {
				[testData.pluginData.name]: newPluginHashes,
			});
		});

		it("should hash the plugin files after prepare", async () => {
			const newPluginHashes = { file: "hash" };
			const pluginHashesAfterPrepare = { file: "hasedafterprepare" };
			const testData = setupTest({
				newPluginHashes,
				hasPluginPlatformsDir: true,
				pluginHashesAfterPrepare,
			});
			await testData.pluginsService.preparePluginNativeCode({
				pluginData: testData.pluginData,
				platform,
				projectData,
			});
			assert.isTrue(testData.isPreparePluginNativeCodeCalled);
			assert.deepStrictEqual(testData.dataPassedToWriteJson, {
				[testData.pluginData.name]: pluginHashesAfterPrepare,
			});
		});

		it("does not prepare the files when plugin has platforms dir and files have not changed since then", async () => {
			const testData = setupTest({
				hasChangesInShasums: false,
				buildDataFileExists: true,
				hasPluginPlatformsDir: true,
			});
			await testData.pluginsService.preparePluginNativeCode({
				pluginData: testData.pluginData,
				platform,
				projectData,
			});
			assert.isFalse(testData.isPreparePluginNativeCodeCalled);
		});
	});

	const createUnitTestsInjector = () => {
		const unitTestsInjector = new Yok();
		unitTestsInjector.register("platformsDataService", {});
		unitTestsInjector.register("filesHashService", {});
		unitTestsInjector.register("fs", {
			exists: (filePath: string) => filePath.indexOf("ios") !== -1,
			readDirectory: (dir: string) =>
				dir.indexOf("nativescript-ui-core") !== -1 ? ["a.framework"] : [],
		});
		unitTestsInjector.register("packageManager", {});
		unitTestsInjector.register("options", {});
		unitTestsInjector.register("logger", stubs.LoggerStub);
		unitTestsInjector.register("errors", stubs.ErrorsStub);
		unitTestsInjector.register("injector", unitTestsInjector);
		unitTestsInjector.register("mobileHelper", MobileHelper);
		unitTestsInjector.register(
			"devicePlatformsConstants",
			DevicePlatformsConstants,
		);
		unitTestsInjector.register("nodeModulesDependenciesBuilder", {});
		unitTestsInjector.register("tempService", stubs.TempServiceStub);
		unitTestsInjector.register(
			"liveSyncProcessDataService",
			LiveSyncProcessDataService
		);
		return unitTestsInjector;
	};

	describe("convertToPluginData", () => {
		const pluginDir = "pluginDir";
		const dataFromPluginPackageJson = {
			name: "name",
			version: "1.0.0",
			directory: pluginDir,
			nativescript: {
				platforms: {
					ios: "6.0.0",
					android: "6.0.0",
				},
			},
		};

		it("returns correct pluginData", () => {
			const unitTestsInjector = createUnitTestsInjector();
			const pluginsService: PluginsService =
				unitTestsInjector.resolve(PluginsService);
			const pluginData = (<any>pluginsService).convertToPluginData(
				dataFromPluginPackageJson,
				"my project dir",
			);
			// Remove the comparison of a function
			delete pluginData["pluginPlatformsFolderPath"];
			assert.deepStrictEqual(pluginData, <any>{
				name: "name",
				version: "1.0.0",
				fullPath: pluginDir,
				isPlugin: true,
				platformsData: { android: "6.0.0", ios: "6.0.0" },
				nativescript: { platforms: { android: "6.0.0", ios: "6.0.0" } },
				pluginVariables: undefined,
			});
		});

		it("always returns lowercased platform in the path to plugins dir", () => {
			const unitTestsInjector = createUnitTestsInjector();
			const pluginsService: PluginsService =
				unitTestsInjector.resolve(PluginsService);
			const pluginData = (<any>pluginsService).convertToPluginData(
				dataFromPluginPackageJson,
				"my project dir",
			);

			const expectediOSPath = path.join(pluginDir, PLATFORMS_DIR_NAME, "ios");
			const expectedAndroidPath = path.join(
				pluginDir,
				PLATFORMS_DIR_NAME,
				"android"
			);
			assert.equal(
				pluginData.pluginPlatformsFolderPath("iOS"),
				expectediOSPath,
			);
			assert.equal(
				pluginData.pluginPlatformsFolderPath("ios"),
				expectediOSPath,
			);
			assert.equal(
				pluginData.pluginPlatformsFolderPath("IOS"),
				expectediOSPath,
			);

			assert.equal(
				pluginData.pluginPlatformsFolderPath("Android"),
				expectedAndroidPath,
			);
			assert.equal(
				pluginData.pluginPlatformsFolderPath("android"),
				expectedAndroidPath,
			);
			assert.equal(
				pluginData.pluginPlatformsFolderPath("ANDROID"),
				expectedAndroidPath,
			);
		});
	});

	describe("getAllProductionPlugins", () => {
		const testCases: ITestCase[] = [
			{
				testName:
					"returns empty array when none of the dependencies is nativescript plugin",
				inputDependencies: [
					{
						name: "css-tree",
						directory: "/Users/username/projectDir/node_modules/css-tree",
						depth: 0,
						version: "1.0.0-alpha.39",
						dependencies: ["mdn-data", "source-map"],
					},
					{
						name: "nativescript-hook",
						directory:
							"/Users/username/projectDir/node_modules/nativescript-hook",
						depth: 0,
						version: "0.2.5",
						dependencies: ["glob", "mkdirp"],
					},
				],
				expectedOutput: <any[]>[],
			},
			{
				testName: "returns correct data when there's no duplication of plugins",
				inputDependencies: [
					{
						name: "tns-core-modules",
						directory:
							"/Users/username/projectDir/node_modules/tns-core-modules",
						depth: 0,
						version: "6.3.2",
						nativescript: {
							platforms: {
								ios: "5.0.0",
								android: "5.0.0",
							},
						},
						dependencies: ["@nativescript/core"],
					},
					{
						name: "@nativescript/theme",
						directory:
							"/Users/username/projectDir/node_modules/@nativescript/theme",
						depth: 0,
						version: "2.2.1",
						nativescript: {
							platforms: {
								android: "6.2.0",
								ios: "6.2.0",
							},
						},
						dependencies: [],
					},
				],
				expectedOutput: [
					{
						fullPath:
							"/Users/username/projectDir/node_modules/tns-core-modules",
						isPlugin: true,
						name: "tns-core-modules",
						platformsData: {
							android: "5.0.0",
							ios: "5.0.0",
						},
						nativescript: {
							platforms: {
								android: "5.0.0",
								ios: "5.0.0",
							},
						},
						version: "6.3.2",
					},
					{
						fullPath:
							"/Users/username/projectDir/node_modules/@nativescript/theme",
						isPlugin: true,
						name: "@nativescript/theme",
						platformsData: {
							android: "6.2.0",
							ios: "6.2.0",
						},
						nativescript: {
							platforms: {
								android: "6.2.0",
								ios: "6.2.0",
							},
						},
						version: "2.2.1",
					},
				],
			},
			{
				testName:
					"prints warning when same version of plugin is installed multiple times",
				inputDependencies: [
					{
						name: "nativescript-ui-listview",
						directory:
							"/Users/username/projectDir/node_modules/nativescript-ui-listview",
						depth: 0,
						version: "8.0.1",
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						dependencies: ["nativescript-ui-core"],
					},
					{
						name: "nativescript-ui-core",
						directory:
							"/Users/username/projectDir/node_modules/nativescript-ui-core",
						depth: 0,
						version: "4.0.0",
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						dependencies: [],
					},
					{
						name: "nativescript-ui-core",
						directory:
							"/Users/username/projectDir/node_modules/nativescript-ui-listview/node_modules/nativescript-ui-core",
						depth: 1,
						version: "4.0.0",
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						dependencies: [],
					},
				],
				expectedOutput: [
					{
						fullPath:
							"/Users/username/projectDir/node_modules/nativescript-ui-listview",
						isPlugin: true,
						name: "nativescript-ui-listview",
						platformsData: {
							android: "6.0.0",
							ios: "6.0.0",
						},
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						version: "8.0.1",
					},
					{
						fullPath:
							"/Users/username/projectDir/node_modules/nativescript-ui-core",
						isPlugin: true,
						name: "nativescript-ui-core",
						platformsData: {
							android: "6.0.0",
							ios: "6.0.0",
						},
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						version: "4.0.0",
					},
				],
				expectedWarning:
					"Detected the framework a.framework is installed multiple times from the same versions of plugin (4.0.0) at locations: /Users/username/projectDir/node_modules/nativescript-ui-core, " +
					"/Users/username/projectDir/node_modules/nativescript-ui-listview/node_modules/nativescript-ui-core",
			},
			{
				testName:
					"fails when different versions of the same plugin are detected",
				inputDependencies: [
					{
						name: "nativescript-ui-listview",
						directory:
							"/Users/username/projectDir/node_modules/nativescript-ui-listview",
						depth: 0,
						version: "8.0.1",
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						dependencies: ["nativescript-ui-core"],
					},
					{
						name: "nativescript-ui-core",
						directory:
							"/Users/username/projectDir/node_modules/nativescript-ui-core",
						depth: 0,
						version: "3.0.0",
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						dependencies: [],
					},
					{
						name: "nativescript-ui-core",
						directory:
							"/Users/username/projectDir/node_modules/nativescript-ui-listview/node_modules/nativescript-ui-core",
						depth: 1,
						version: "4.0.0",
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						dependencies: [],
					},
				],
				expectedOutput: new Error(
					`Cannot use the same framework a.framework multiple times in your application.
This framework comes from nativescript-ui-core plugin, which is installed multiple times in node_modules:\n` +
						"* Path: /Users/username/projectDir/node_modules/nativescript-ui-core, version: 3.0.0\n" +
						"* Path: /Users/username/projectDir/node_modules/nativescript-ui-listview/node_modules/nativescript-ui-core, version: 4.0.0\n\n" +
						`Probably you need to update your dependencies, remove node_modules and try again.`,
				),
			},
			{
				testName:
					"fails when same framework is installed from multiple plugins",
				inputDependencies: [
					{
						name: "nativescript-ui-core-forked",
						directory:
							"/Users/username/projectDir/node_modules/nativescript-ui-core-forked",
						depth: 0,
						version: "3.0.0",
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						dependencies: [],
					},
					{
						name: "nativescript-ui-core",
						directory:
							"/Users/username/projectDir/node_modules/nativescript-ui-core",
						depth: 0,
						version: "3.0.0",
						nativescript: {
							platforms: {
								android: "6.0.0",
								ios: "6.0.0",
							},
						},
						dependencies: [],
					},
				],
				expectedOutput: new Error(
					`Detected the framework a.framework is installed from multiple plugins at locations:\n` +
						"/Users/username/projectDir/node_modules/nativescript-ui-core-forked/platforms/ios/a.framework\n".replace(
							/\//g,
							path.sep,
						) +
						"/Users/username/projectDir/node_modules/nativescript-ui-core/platforms/ios/a.framework\n\n".replace(
							/\//g,
							path.sep,
						) +
						`Probably you need to update your dependencies, remove node_modules and try again.`,
				),
			},
		];

		for (const testCase of testCases) {
			it(testCase.testName, () => {
				const unitTestsInjector: IInjector = createUnitTestsInjector();
				const pluginsService: IPluginsService =
					unitTestsInjector.resolve(PluginsService);

				if (testCase.expectedOutput instanceof Error) {
					assert.throws(
						() =>
							pluginsService.getAllProductionPlugins(
								<any>{ projectDir: "projectDir" },
								"ios",
								testCase.inputDependencies,
							),
						testCase.expectedOutput.message,
					);
				} else {
					const plugins = pluginsService.getAllProductionPlugins(
						<any>{ projectDir: "projectDir" },
						"ios",
						testCase.inputDependencies,
					);

					if (testCase.expectedWarning) {
						const logger =
							unitTestsInjector.resolve<stubs.LoggerStub>("logger");
						assert.equal(testCase.expectedWarning + "\n", logger.warnOutput);
					}

					for (const plugin of plugins) {
						// deepEqual does not compare functions
						delete plugin.pluginPlatformsFolderPath;
						// pluginVariables is a legacy feature and out of the scope for current tests
						delete plugin.pluginVariables;
					}

					assert.deepStrictEqual(plugins, testCase.expectedOutput);
				}
			});
		}

		it(`caches result based on dependencies`, () => {
			const unitTestsInjector: IInjector = createUnitTestsInjector();
			const pluginsService: IPluginsService =
				unitTestsInjector.resolve(PluginsService);
			const inputDependencies = [
				{
					name: "nativescript-ui-core",
					directory:
						"/Users/username/projectDir/node_modules/nativescript-ui-core",
					depth: 0,
					version: "6.3.0",
					nativescript: {
						platforms: {
							ios: "5.0.0",
							android: "5.0.0",
						},
					},
					dependencies: ["@nativescript/core"],
				},
				{
					name: "nativescript-ui-core",
					directory:
						"/Users/username/projectDir/node_modules/some-package/nativescript-ui-core",
					depth: 1,
					version: "6.3.0",
					nativescript: {
						platforms: {
							ios: "5.0.0",
							android: "5.0.0",
						},
					},
					dependencies: ["@nativescript/core"],
				},
			];

			_.range(3).forEach(() => {
				pluginsService.getAllProductionPlugins(
					<any>{ projectDir: "projectDir" },
					"ios",
					inputDependencies,
				);
			});

			const logger = unitTestsInjector.resolve<stubs.LoggerStub>("logger");

			const expectedWarnMessage =
				"Detected the framework a.framework is installed multiple times from the same versions of plugin (%s) at locations: /Users/username/projectDir/node_modules/nativescript-ui-core, /Users/username/projectDir/node_modules/some-package/nativescript-ui-core\n";
			assert.equal(
				logger.warnOutput,
				util.format(expectedWarnMessage, "6.3.0"),
				"The warn message must be shown only once - the result of the private method must be cached as input dependencies have not changed",
			);
			inputDependencies[0].version = "1.0.0";
			inputDependencies[1].version = "1.0.0";
			pluginsService.getAllProductionPlugins(
				<any>{ projectDir: "projectDir" },
				"ios",
				inputDependencies,
			);
			assert.equal(
				logger.warnOutput,
				util.format(expectedWarnMessage, "6.3.0") +
					util.format(expectedWarnMessage, "1.0.0"),
				"When something in input dependencies change, the cached value shouldn't be taken into account",
			);
		});
	});
});
