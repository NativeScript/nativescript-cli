/// <reference path=".d.ts" />
"use strict";

import yok = require('../lib/common/yok');
import stubs = require('./stubs');
import * as PlatformAddCommandLib from "../lib/commands/add-platform";
import * as PlatformRemoveCommandLib from "../lib/commands/remove-platform";
import * as PlatformUpdateCommandLib from "../lib/commands/update-platform";
import * as PlatformServiceLib from '../lib/services/platform-service';
import * as StaticConfigLib from "../lib/config";
import * as CommandsServiceLib from "../lib/common/services/commands-service";
import * as optionsLib from "../lib/options";
import * as hostInfoLib from "../lib/common/host-info";
import * as ProjectFilesManagerLib from "../lib/services/project-files-manager";
import {assert} from "chai";

let isCommandExecuted = true;

class PlatformData implements IPlatformData {
	frameworkPackageName = "tns-android";
	normalizedPlatformName = "Android";
	platformProjectService: IPlatformProjectService = null;
	emulatorServices: Mobile.IEmulatorPlatformServices = null;
	projectRoot = "";
	deviceBuildOutputPath = "";
	validPackageNamesForDevice: string[] = [];
	frameworkFilesExtensions = [".jar", ".dat"];
	frameworkVersion = "";
	appDestinationDirectoryPath = "";
	appResourcesDestinationDirectoryPath = "";
	relativeToFrameworkConfigurationFilePath = "";
}

class ErrorsNoFailStub implements IErrors {
	printCallStack: boolean = false;

	fail(formatStr: string, ...args: any[]): void;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): void;

	fail(...args: any[]) { throw new Error(); }
	failWithoutHelp(message: string, ...args: any[]): void {
		throw new Error();
	}

	beginCommand(action: () => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		return (() => {
			let result = false;
			try {
				result = action().wait();
			} catch(ex) {
				/* intentionally left blank */
			}

			return result;
		}).future<boolean>()();
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
		if(_.contains(this.platformsNames, platform)) {
			return new PlatformData();
		}

		return null;
	}

	public get availablePlatforms(): any {
		return undefined;
	}
}

function createTestInjector() {
	let testInjector = new yok.Yok();

	testInjector.register("injector", testInjector);
	testInjector.register("hooksService", stubs.HooksServiceStub);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register('platformService', PlatformServiceLib.PlatformService);
	testInjector.register('errors', ErrorsNoFailStub);
	testInjector.register('logger', stubs.LoggerStub);
	testInjector.register('npmInstallationManager', stubs.NpmInstallationManagerStub);
	testInjector.register('projectData', stubs.ProjectDataStub);
	testInjector.register('platformsData', PlatformsData);
	testInjector.register('devicesServices', {});
	testInjector.register('projectDataService', stubs.ProjectDataService);
	testInjector.register('prompter', {});
	testInjector.register('commands-service', CommandsServiceLib.CommandsService);
	testInjector.registerCommand("platform|add", PlatformAddCommandLib.AddPlatformCommand);
	testInjector.registerCommand("platform|remove", PlatformRemoveCommandLib.RemovePlatformCommand);
	testInjector.registerCommand("platform|update", PlatformUpdateCommandLib.UpdatePlatformCommand);
	testInjector.register("lockfile", { });
	testInjector.register("resources", {});
	testInjector.register("commandsServiceProvider", {
		registerDynamicSubCommands: () => { /* intentionally left blank */ }
	});
	testInjector.register("commandsService", {
		tryExecuteCommand: () => { /* intentionally left blank */ }
	});
	testInjector.register("options", optionsLib.Options);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	testInjector.register("broccoliBuilder", {
		prepareNodeModulesFolder: () => { /* intentionally left blank */ }
	});
	testInjector.register("pluginsService", {
		getAllInstalledPlugins: () => {
			return (() => {
				return <any>[];
			}).future<IPluginData[]>()();
		}
	});
	testInjector.register("projectFilesManager", ProjectFilesManagerLib.ProjectFilesManager);

	return testInjector;
}

describe('Platform Service Tests', () => {
	let platformService: IPlatformService, testInjector: IInjector;
	let commandsService: ICommandsService;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", stubs.FileSystemStub);
		commandsService = testInjector.resolve("commands-service");
		platformService = testInjector.resolve("platformService");
	});

	describe("platform commands tests", () => {
		describe("#AddPlatformCommand", () => {
			it("is not executed when platform is not passed", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|add", []).wait();
				assert.isFalse(isCommandExecuted);
			});

			it("is not executed when platform is not valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							if (commandName !== "help") {
								isCommandExecuted = true;
							}
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|add", ["invalidPlatform"]).wait();
				assert.isFalse(isCommandExecuted);
			});

			it("is executed when platform is valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|add", ["android"]).wait();
				assert.isTrue(isCommandExecuted);
			});

			it("is executed when all platforms are valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|add", ["android", "ios"]).wait();
				assert.isTrue(isCommandExecuted);
			});

			it("is not executed when at least one platform is not valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|add", ["ios", "invalid"]).wait();
				assert.isFalse(isCommandExecuted);
			});
		});

		describe("#RemovePlatformCommand", () => {
			it("is not executed when platform is not passed", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|remove", []).wait();
				assert.isFalse(isCommandExecuted);
			});

			it("is not executed when platform is not valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|remove", ["invalidPlatform"]).wait();
				assert.isFalse(isCommandExecuted);
			});

			it("is executed when platform is valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|remove", ["android"]).wait();
				assert.isTrue(isCommandExecuted);
			});

			it("is executed when all platforms are valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|remove", ["android", "ios"]).wait();
				assert.isTrue(isCommandExecuted);
			});

			it("is not executed when at least one platform is not valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|remove", ["ios", "invalid"]).wait();
				assert.isFalse(isCommandExecuted);
			});
		});

		describe("#UpdatePlatformCommand", () => {
			it("is not executed when platform is not passed", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|update", []).wait();
				assert.isFalse(isCommandExecuted);
			});

			it("is not executed when platform is not valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|update", ["invalidPlatform"]).wait();
				assert.isFalse(isCommandExecuted);
			});

			it("is executed when platform is valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|update", ["android"]).wait();
				assert.isTrue(isCommandExecuted);
			});

			it("is executed when all platforms are valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|update", ["android", "ios"]).wait();
				assert.isTrue(isCommandExecuted);
			});

			it("is not executed when at least one platform is not valid", () => {
				isCommandExecuted = false;
				commandsService.executeCommandUnchecked = (commandName: string): IFuture<boolean> => {
					return (() => {
						if (commandName !== "help") {
							isCommandExecuted = true;
						}
						return false;
					}).future<boolean>()();
				};

				commandsService.tryExecuteCommand("platform|update", ["ios", "invalid"]).wait();
				assert.isFalse(isCommandExecuted);
			});
		});
	});
});
