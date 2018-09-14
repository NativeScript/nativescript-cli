import * as yok from "../lib/common/yok";
import * as stubs from "./stubs";
import * as PlatformAddCommandLib from "../lib/commands/add-platform";
import * as PlatformRemoveCommandLib from "../lib/commands/remove-platform";
import * as PlatformUpdateCommandLib from "../lib/commands/update-platform";
import * as PlatformCleanCommandLib from "../lib/commands/platform-clean";
import * as PlatformServiceLib from '../lib/services/platform-service';
import * as StaticConfigLib from "../lib/config";
import * as CommandsServiceLib from "../lib/common/services/commands-service";
import * as optionsLib from "../lib/options";
import * as hostInfoLib from "../lib/common/host-info";
import * as ProjectFilesManagerLib from "../lib/common/services/project-files-manager";
import { assert } from "chai";
import { DeviceAppDataFactory } from "../lib/common/mobile/device-app-data/device-app-data-factory";
import { LocalToDevicePathDataFactory } from "../lib/common/mobile/local-to-device-path-data-factory";
import { MobileHelper } from "../lib/common/mobile/mobile-helper";
import { ProjectFilesProvider } from "../lib/providers/project-files-provider";
import { MobilePlatformsCapabilities } from "../lib/mobile-platforms-capabilities";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { XmlValidator } from "../lib/xml-validator";
import * as ChildProcessLib from "../lib/common/child-process";
import ProjectChangesLib = require("../lib/services/project-changes-service");
import { Messages } from "../lib/common/messages/messages";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";

let isCommandExecuted = true;

class PlatformData implements IPlatformData {
	frameworkPackageName = "tns-android";
	normalizedPlatformName = "Android";
	platformProjectService: IPlatformProjectService = <any>{
		validate: async (projectData: IProjectData): Promise<IValidatePlatformOutput> => {
			return {
				checkEnvironmentRequirementsOutput: {
					canExecute: true,
					selectedOption: ""
				}
			};
		}
	};
	projectRoot = "";
	deviceBuildOutputPath = "";
	getValidBuildOutputData = (buildOptions: IBuildOutputOptions) => ({ packageNames: [""] });
	validPackageNamesForDevice: string[] = [];
	frameworkFilesExtensions = [".jar", ".dat"];
	appDestinationDirectoryPath = "";
	relativeToFrameworkConfigurationFilePath = "";
	fastLivesyncFileExtensions: string[] = [];
}

class ErrorsNoFailStub implements IErrors {
	printCallStack: boolean = false;

	fail(formatStr: string, ...args: any[]): never;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): never;

	fail(...args: any[]): never { throw new Error(); }
	failWithoutHelp(message: string, ...args: any[]): never {
		throw new Error();
	}

	async beginCommand(action: () => Promise<boolean>, printHelpCommand: () => Promise<void>): Promise<boolean> {
		let result = false;
		try {
			result = await action();
		} catch (ex) {
			/* intentionally left blank */
		}

		return result;
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void { /* intentionally left blank */ }

	validateArgs(client: string, knownOpts: any, shorthands: any): any { return null; }
	validateYargsArguments(parsed: any, knownOpts: any, shorthands: any, clientName?: string): void { /* intentionally left blank */ }
}

class PlatformsData implements IPlatformsData {
	platformsNames = ["android", "ios"];
	getPlatformData(platform: string): IPlatformData {
		if (_.includes(this.platformsNames, platform)) {
			return new PlatformData();
		}

		return null;
	}

	public get availablePlatforms(): any {
		return undefined;
	}
}

function createTestInjector() {
	const testInjector = new yok.Yok();

	testInjector.register("injector", testInjector);
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("nodeModulesDependenciesBuilder", {});
	testInjector.register('platformService', PlatformServiceLib.PlatformService);
	testInjector.register('errors', ErrorsNoFailStub);
	testInjector.register('logger', stubs.LoggerStub);
	testInjector.register('npmInstallationManager', stubs.NpmInstallationManagerStub);
	testInjector.register('projectData', stubs.ProjectDataStub);
	testInjector.register('platformsData', PlatformsData);
	testInjector.register('devicesService', {});
	testInjector.register('projectDataService', stubs.ProjectDataService);
	testInjector.register('prompter', {});
	testInjector.register('sysInfo', {});
	testInjector.register('commands-service', CommandsServiceLib.CommandsService);
	testInjector.registerCommand("platform|add", PlatformAddCommandLib.AddPlatformCommand);
	testInjector.registerCommand("platform|remove", PlatformRemoveCommandLib.RemovePlatformCommand);
	testInjector.registerCommand("platform|update", PlatformUpdateCommandLib.UpdatePlatformCommand);
	testInjector.registerCommand("platform|clean", PlatformCleanCommandLib.CleanCommand);
	testInjector.register("resources", {});
	testInjector.register("commandsServiceProvider", {
		registerDynamicSubCommands: () => { /* intentionally left blank */ }
	});
	testInjector.register("commandsService", {
		tryExecuteCommand: () => { /* intentionally left blank */ }
	});
	testInjector.register("options", optionsLib.Options);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	testInjector.register("nodeModulesBuilder", {
		prepareNodeModulesFolder: () => { /* intentionally left blank */ }
	});
	testInjector.register("pluginsService", {
		getAllInstalledPlugins: async (): Promise<any[]> => []
	});
	testInjector.register("projectFilesManager", ProjectFilesManagerLib.ProjectFilesManager);
	testInjector.register("hooksService", stubs.HooksServiceStub);

	testInjector.register("deviceAppDataFactory", DeviceAppDataFactory);
	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("projectFilesProvider", ProjectFilesProvider);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("xmlValidator", XmlValidator);
	testInjector.register("npm", {});
	testInjector.register("preparePlatformNativeService", {});
	testInjector.register("preparePlatformJSService", {});
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	testInjector.register("projectChangesService", ProjectChangesLib.ProjectChangesService);
	testInjector.register("analyticsService", {
		track: async () => async (): Promise<any[]> => undefined
	});
	testInjector.register("messages", Messages);
	testInjector.register("devicePathProvider", {});
	testInjector.register("helpService", {
		showCommandLineHelp: async (): Promise<void> => (undefined)
	});
	testInjector.register("settingsService", SettingsService);
	testInjector.register("terminalSpinnerService", {
		createSpinner: (msg: string) => ({
			start: (): void => undefined,
			stop: (): void => undefined,
			message: (): void => undefined
		})
	});
	testInjector.register("extensibilityService", {});
	testInjector.register("analyticsSettingsService", {
		getPlaygroundInfo: () => Promise.resolve(null)
	});
	testInjector.register("filesHashService", {});
	testInjector.register("platformEnvironmentRequirements", {
		checkEnvironmentRequirements: async (platform?: string, projectDir?: string, runtimeVersion?: string): Promise<ICheckEnvironmentRequirementsOutput> => {
			return {
				canExecute: true,
				selectedOption: ""
			};
		}
	});
	testInjector.register("pacoteService", {
		extractPackage: async (packageName: string, destinationDirectory: string, options?: IPacoteExtractOptions): Promise<void> => undefined
	});

	return testInjector;
}

describe('Platform Service Tests', () => {
	let platformService: IPlatformService, testInjector: IInjector;
	let commandsService: ICommandsService;
	let fs: IFileSystem;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", stubs.FileSystemStub);
		commandsService = testInjector.resolve("commands-service");
		platformService = testInjector.resolve("platformService");
		fs = testInjector.resolve("fs");
	});

	describe("platform commands tests", () => {
		describe("#AddPlatformCommand", () => {
			it("is not executed when platform is not passed", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|add", []);
				assert.isFalse(isCommandExecuted);
			});

			it("is not executed when platform is not valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|add", ["invalidPlatform"]);
				assert.isFalse(isCommandExecuted);
			});

			it("is executed when platform is valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|add", ["android"]);
				assert.isTrue(isCommandExecuted);
			});

			it("is executed when all platforms are valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|add", ["android", "ios"]);
				assert.isTrue(isCommandExecuted);
			});

			it("is not executed when at least one platform is not valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|add", ["ios", "invalid"]);
				assert.isFalse(isCommandExecuted);
			});
		});

		describe("#RemovePlatformCommand", () => {
			it("is not executed when platform is not passed", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|remove", []);
				assert.isFalse(isCommandExecuted);
			});

			it("is not executed when platform is not valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|remove", ["invalidPlatform"]);
				assert.isFalse(isCommandExecuted);
			});

			it("is executed when platform is valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}
					return false;
				};

				await commandsService.tryExecuteCommand("platform|remove", ["android"]);
				assert.isTrue(isCommandExecuted);
			});

			it("is executed when all platforms are valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|remove", ["android", "ios"]);
				assert.isTrue(isCommandExecuted);
			});

			it("is not executed when at least one platform is not valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {

					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|remove", ["ios", "invalid"]);
				assert.isFalse(isCommandExecuted);
			});
		});

		describe("#CleanPlatformCommand", () => {
			beforeEach(() => {
				fs.exists = (platform: string) => {
					return false;
				};
			});

			it("is not executed when platform is not passed", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|clean", []);
				assert.isFalse(isCommandExecuted);
			});

			it("is not executed when platform is not valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|clean", ["invalidPlatform"]);
				assert.isFalse(isCommandExecuted);
			});

			it("is executed when platform is valid", async () => {
				let commandsExecutedCount = 0;
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
						commandsExecutedCount++;
					}

					return false;
				};

				fs.exists = (platform: string) => {
					return platform === "android";
				};

				await commandsService.tryExecuteCommand("platform|add", ["android"]);
				await commandsService.tryExecuteCommand("platform|clean", ["android"]);
				assert.isTrue(isCommandExecuted);
				assert.isTrue(commandsExecutedCount === 2);
			});

			it("is not executed when platform is not added", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|clean", ["android"]);
				assert.isFalse(isCommandExecuted);
			});

			it("is executed when all platforms are valid", async () => {
				let commandsExecutedCount = 0;
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {

					if (commandName !== "help") {
						isCommandExecuted = true;
						commandsExecutedCount++;
					}

					return false;
				};

				fs.exists = (platform: string) => {
					return ["android", "ios"].indexOf(platform) !== -1;
				};

				await commandsService.tryExecuteCommand("platform|add", ["android"]);
				await commandsService.tryExecuteCommand("platform|add", ["ios"]);
				await commandsService.tryExecuteCommand("platform|clean", ["android", "ios"]);
				assert.isTrue(isCommandExecuted);
				assert.isTrue(commandsExecutedCount === 3);
			});

			it("is not executed when at least one platform is not added", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				fs.exists = (platform: string) => {
					return platform === "android";
				};

				await commandsService.tryExecuteCommand("platform|clean", ["android", "ios"]);
				assert.isFalse(isCommandExecuted);
			});

			it("is not executed when at least one platform is not valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|clean", ["ios", "invalid"]);
				assert.isFalse(isCommandExecuted);
			});

			it("will call removePlatform and addPlatform on the platformService passing the provided platforms", async () => {
				const platformActions: { action: string, platforms: string[] }[] = [];
				const cleanCommand = testInjector.resolveCommand("platform|clean");

				platformService.removePlatforms = async (platforms: string[]) => {
					platformActions.push({ action: "removePlatforms", platforms });
				};

				platformService.addPlatforms = async (platforms: string[]) => {

					platformActions.push({ action: "addPlatforms", platforms });

				};

				await cleanCommand.execute(["ios"]);

				const expectedPlatformActions = [
					{ action: "removePlatforms", platforms: ["ios"] },
					{ action: "addPlatforms", platforms: ["ios"] },
				];

				assert.deepEqual(platformActions, expectedPlatformActions, "Expected `remove ios`, `add ios` calls to the platformService.");
			});
		});

		describe("#UpdatePlatformCommand", () => {
			it("is not executed when platform is not passed", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|update", []);
				assert.isFalse(isCommandExecuted);
			});

			it("is not executed when platform is not valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|update", ["invalidPlatform"]);
				assert.isFalse(isCommandExecuted);
			});

			it("is executed when platform is valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|update", ["android"]);
				assert.isTrue(isCommandExecuted);
			});

			it("is executed when all platforms are valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|update", ["android", "ios"]);
				assert.isTrue(isCommandExecuted);
			});

			it("is not executed when at least one platform is not valid", async () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = async (commandName: string): Promise<boolean> => {
					if (commandName !== "help") {
						isCommandExecuted = true;
					}

					return false;
				};

				await commandsService.tryExecuteCommand("platform|update", ["ios", "invalid"]);
				assert.isFalse(isCommandExecuted);
			});
		});
	});
});
