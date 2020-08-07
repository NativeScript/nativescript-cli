import * as yok from "../src/common/yok";
import * as stubs from "./stubs";
import * as PlatformAddCommandLib from "../src/commands/add-platform";
import * as PlatformRemoveCommandLib from "../src/commands/remove-platform";
import * as PlatformUpdateCommandLib from "../src/commands/update-platform";
import * as PlatformCleanCommandLib from "../src/commands/platform-clean";
import * as StaticConfigLib from "../src/config";
import * as CommandsServiceLib from "../src/common/services/commands-service";
import * as optionsLib from "../src/options";
import * as hostInfoLib from "../src/common/host-info";
import * as ProjectFilesManagerLib from "../src/common/services/project-files-manager";
import { assert } from "chai";
import { LocalToDevicePathDataFactory } from "../src/common/mobile/local-to-device-path-data-factory";
import { MobileHelper } from "../src/common/mobile/mobile-helper";
import { ProjectFilesProvider } from "../src/providers/project-files-provider";
import { DevicePlatformsConstants } from "../src/common/mobile/device-platforms-constants";
import { XmlValidator } from "../src/xml-validator";
import * as ChildProcessLib from "../src/common/child-process";
import * as ProjectChangesLib from "../src/services/project-changes-service";
import { Messages } from "../src/common/messages/messages";
import { SettingsService } from "../src/common/test/unit-tests/stubs";
import { PlatformValidationService } from "../src/services/platform/platform-validation-service";
import { PlatformCommandHelper } from "../src/helpers/platform-command-helper";
import { MarkingModeServiceStub } from "./stubs";
import { IProjectData, IValidatePlatformOutput } from "../src/definitions/project";
import { IPlatformCommandHelper } from "../src/declarations";
import {
	IBuildOutputOptions,
	ICheckEnvironmentRequirementsOutput,
	IPlatformData,
	IPlatformsDataService
} from "../src/definitions/platform";
import { IErrors, IFailOptions, IFileSystem } from "../src/common/declarations";
import { IInjector } from "../src/common/definitions/yok";
import * as _ from "lodash";

let isCommandExecuted = true;

class PlatformData implements IPlatformData {
	frameworkPackageName = "tns-android";
	normalizedPlatformName = "Android";
	platformNameLowerCase = "android";
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
	getBuildOutputPath = () => "";
	getValidBuildOutputData = (buildOptions: IBuildOutputOptions) => ({ packageNames: [""] });
	validPackageNamesForDevice: string[] = [];
	appDestinationDirectoryPath = "";
	relativeToFrameworkConfigurationFilePath = "";
	fastLivesyncFileExtensions: string[] = [];
}

class ErrorsNoFailStub implements IErrors {
	printCallStack: boolean = false;

	fail(formatStr: string, ...args: any[]): never;
	fail(opts: IFailOptions, ...args: any[]): never;

	fail(...args: any[]): never { throw new Error(); }

	failWithoutHelp(opts: string | IFailOptions, ...args: any[]): never {
		return this.fail(<any>opts, args);
	}

	failWithHelp(opts: string | IFailOptions, ...args: any[]): never {
		return this.fail(<any>opts, args);
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

class PlatformsDataService implements IPlatformsDataService {
	platformNames = ["android", "ios"];
	getPlatformData(platform: string): IPlatformData {
		if (_.includes(this.platformNames, platform)) {
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
	testInjector.register("markingModeService", MarkingModeServiceStub);
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("nodeModulesDependenciesBuilder", {});
	testInjector.register('platformCommandHelper', PlatformCommandHelper);
	testInjector.register('platformValidationService', PlatformValidationService);
	testInjector.register('errors', ErrorsNoFailStub);
	testInjector.register('logger', stubs.LoggerStub);
	testInjector.register('packageInstallationManager', stubs.PackageInstallationManagerStub);
	testInjector.register('projectData', stubs.ProjectDataStub);
	testInjector.register('platformsDataService', PlatformsDataService);
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

	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("projectFilesProvider", ProjectFilesProvider);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("xmlValidator", XmlValidator);
	testInjector.register("npm", {});
	testInjector.register("prepareNativePlatformService", {});
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
	testInjector.register("optionsTracker", {
		trackOptions: () => Promise.resolve(null)
	});
	testInjector.register("usbLiveSyncService", ({}));
	testInjector.register("doctorService", {
		checkForDeprecatedShortImportsInAppDir: (projectDir: string): void => undefined
	});
	testInjector.register("cleanupService", {
		setShouldDispose: (shouldDispose: boolean): void => undefined
	});
	testInjector.register("addPlatformService", {});
	testInjector.register("platformController", {});
	testInjector.register("tempService", stubs.TempServiceStub);
	testInjector.register("platformCommandHelper", PlatformCommandHelper);

	return testInjector;
}

describe('Platform Service Tests', () => {
	let platformCommandHelper: IPlatformCommandHelper, testInjector: IInjector;
	let commandsService: ICommandsService;
	let fs: IFileSystem;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", stubs.FileSystemStub);
		commandsService = testInjector.resolve("commands-service");
		platformCommandHelper = testInjector.resolve("platformCommandHelper");
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

				platformCommandHelper.removePlatforms = async (platforms: string[]) => {
					platformActions.push({ action: "removePlatforms", platforms });
				};

				platformCommandHelper.addPlatforms = async (platforms: string[]) => {

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
