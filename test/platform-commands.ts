/// <reference path=".d.ts" />
"use strict";

import yok = require('../lib/common/yok');
import stubs = require('./stubs');
import PlatformAddCommandLib = require("../lib/commands/add-platform");
import PlatformRemoveCommandLib = require("../lib/commands/remove-platform");
import PlatformUpdateCommandLib = require("../lib/commands/update-platform");
import PlatformServiceLib = require('../lib/services/platform-service');
import StaticConfigLib = require("../lib/config");
import CommandsServiceLib = require("../lib/common/services/commands-service");
import optionsLib = require("../lib/options");
import hostInfoLib = require("../lib/common/host-info");
import ProjectFilesManagerLib = require("../lib/services/project-files-manager");
import path = require("path");
import Future = require("fibers/future");
var assert = require("chai").assert;
var isCommandExecuted = true;

class PlatformData implements IPlatformData {
	frameworkPackageName = "tns-android";
	normalizedPlatformName = "Android";
	platformProjectService: IPlatformProjectService = null;
	emulatorServices: Mobile.IEmulatorPlatformServices = null;
	projectRoot = "";
	deviceBuildOutputPath = "";
	validPackageNamesForDevice: string[] = [];
	frameworkFilesExtensions = [".jar", ".dat"];
	appDestinationDirectoryPath = "";
	appResourcesDestinationDirectoryPath = "";
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
			try {
				var result = action().wait();
			} catch(ex) {
				return false;
			}

			return result;
		}).future<boolean>()();
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void { }

	validateArgs(client: string, knownOpts: any, shorthands: any): any { return null; }
	validateYargsArguments(parsed: any, knownOpts: any, shorthands: any, clientName?: string): void { }
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
	var testInjector = new yok.Yok();

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
		registerDynamicSubCommands: () => {}
	});
	testInjector.register("commandsService", {
		tryExecuteCommand: () => {}
	});
	testInjector.register("options", optionsLib.Options);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	testInjector.register("broccoliBuilder", {
		prepareNodeModulesFolder: () => {}
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
	var platformService: IPlatformService, testInjector: IInjector;
	var commandsService: ICommandsService;
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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

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
				}

				commandsService.tryExecuteCommand("platform|update", ["ios", "invalid"]).wait();
				assert.isFalse(isCommandExecuted);
			});
		});
	});
});