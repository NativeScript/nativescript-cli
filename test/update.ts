import * as path from "path";
import * as stubs from "./stubs";
import * as yok from "../lib/common/yok";
import { UpdateCommand } from "../lib/commands/update";
import { assert } from "chai";
import * as sinon from 'sinon';
import { Options } from "../lib/options";
import { AndroidProjectService } from "../lib/services/android-project-service";
import {StaticConfig } from "../lib/config";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
const projectFolder = "test";

function createTestInjector(
	installedPlatforms: string[] = [],
	availablePlatforms: string[] = [],
	projectDir: string = projectFolder,
	validate: Function = async (): Promise<IValidatePlatformOutput> => {
		return {
			checkEnvironmentRequirementsOutput: {
				canExecute: true,
				selectedOption: ""
			}
		};
	}
): IInjector {
	const testInjector: IInjector = new yok.Yok();
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("options", Options);
	testInjector.register('fs', stubs.FileSystemStub);
	testInjector.register("analyticsService", {
		trackException: async (): Promise<void> => undefined,
		checkConsent: async (): Promise<void> => undefined,
		trackFeature: async (): Promise<void> => undefined
	});
	testInjector.register('hostInfo', {});
	testInjector.register('errors', stubs.ErrorsStub);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("androidProjectService", AndroidProjectService);
	testInjector.register("androidToolsInfo", stubs.AndroidToolsInfoStub);
	testInjector.register("projectData", { projectDir, initializeProjectData: () => { /* empty */ } });
	testInjector.register("projectDataService", {
		getNSValue: () => {
			return "1.0.0";
		}
	});
	testInjector.register("pluginVariablesService", {});
	testInjector.register("platformService", {
		getInstalledPlatforms: function(): string[]{
			return installedPlatforms;
		},
		getAvailablePlatforms: function(): string[]{
			return availablePlatforms;
		},
		removePlatforms: async (): Promise<void> => undefined,
		addPlatforms: async (): Promise<void> => undefined,
	});
	testInjector.register("platformsData", {
		availablePlatforms: {
			Android: "Android",
			iOS: "iOS"
		},
		getPlatformData: () => {
			return {
				platformProjectService: {
						validate
					}
				};
		}
	});
	testInjector.register("settingsService", SettingsService);
	testInjector.register("pluginsService", {
		add: async (): Promise<void> => undefined,
		remove: async (): Promise<void> => undefined,
		ensureAllDependenciesAreInstalled: () => { return Promise.resolve(); },
	});
	testInjector.register("update", UpdateCommand);

	return testInjector;
}

describe("update command method tests", () => {
	describe("canExecute", () => {
		it("calls platform service validate", async () => {
			let validated = false;
			const testInjector = createTestInjector(
				[],
				["android"],
				projectFolder,
				() => {
					validated = true;
					return Promise.resolve();
				});
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecute = updateCommand.canExecute(["3.3.0"]);

			return canExecute.then(() => {
				assert.equal(validated, true);
			});
		});

		it("returns false if too many artuments", async () => {
			const testInjector = createTestInjector([], ["android"]);
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecuteOutput = await updateCommand.canExecute(["333", "111", "444"]);

			return assert.equal(canExecuteOutput.canExecute, false);
		});

		it("returns false if projectDir empty string", async () => {
			const testInjector = createTestInjector([], ["android"], "");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecuteOutput = await updateCommand.canExecute([]);

			return assert.equal(canExecuteOutput.canExecute, false);
		});

		it("returns true all ok", async () => {
			const testInjector = createTestInjector([], ["android"]);
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecuteOutput = await updateCommand.canExecute(["3.3.0"]);

			return assert.equal(canExecuteOutput.canExecute, true);
		});
	});

	describe("execute", () => {
		let sandbox: sinon.SinonSandbox;

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("if backup fails, pltforms not deleted and added, temp removed", async () => {
			const installedPlatforms: string[] = ["android"];
			const testInjector = createTestInjector(installedPlatforms);
			const fs = testInjector.resolve("fs");
			const deleteDirectory: sinon.SinonStub = sandbox.stub(fs, "deleteDirectory");
			const platformService = testInjector.resolve("platformService");
			sandbox.stub(fs, "copyFile").throws();
			sandbox.spy(platformService, "addPlatforms");
			sandbox.spy(platformService, "removePlatforms");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);

			return updateCommand.execute(["3.3.0"]).then(() => {
				assert.isTrue(deleteDirectory.calledWith(path.join(projectFolder, UpdateCommand.tempFolder)));
				assert.isFalse(platformService.removePlatforms.calledWith(installedPlatforms));
				assert.isFalse(platformService.addPlatforms.calledWith(installedPlatforms));
			});
		});

		it("calls copy to temp for package.json and folders(backup)", async () => {
			const testInjector = createTestInjector();
			const fs = testInjector.resolve("fs");
			const copyFileStub = sandbox.stub(fs, "copyFile");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return updateCommand.execute(["3.3.0"]).then( () => {
				assert.isTrue(copyFileStub.calledWith(path.join(projectFolder, "package.json")));
				for (const folder of UpdateCommand.folders) {
					assert.isTrue(copyFileStub.calledWith(path.join(projectFolder, folder)));
				}
			});
		});

		it("calls copy from temp for package.json and folders to project folder(restore)", async () => {
			const testInjector = createTestInjector();
			testInjector.resolve("platformService").removePlatforms = () => {
				throw new Error();
			};
			const fs = testInjector.resolve("fs");
			const deleteDirectoryStub: sinon.SinonStub = sandbox.stub(fs, "deleteDirectory");
			const copyFileStub = sandbox.stub(fs, "copyFile");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const tempDir = path.join(projectFolder, UpdateCommand.tempFolder);

			return updateCommand.execute(["3.3.0"]).then(() => {
				assert.isTrue(copyFileStub.calledWith(path.join(tempDir, "package.json"), projectFolder));
				for (const folder of UpdateCommand.folders) {
					assert.isTrue(deleteDirectoryStub.calledWith(path.join(projectFolder, folder)));
					assert.isTrue(copyFileStub.calledWith(path.join(tempDir, folder), projectFolder));
				}
			});
		});

		it("calls remove for all folders", async () => {
			const testInjector = createTestInjector();
			const fs = testInjector.resolve("fs");
			const deleteDirectory: sinon.SinonStub = sandbox.stub(fs, "deleteDirectory");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return updateCommand.execute([]).then(() => {
				for (const folder of UpdateCommand.folders) {
					assert.isTrue(deleteDirectory.calledWith(path.join(projectFolder, folder)));
				}
			});
		});

		it("calls remove platforms and add platforms", async () => {
			const installedPlatforms: string[] = ["android"];
			const testInjector = createTestInjector(installedPlatforms);
			const platformService = testInjector.resolve("platformService");
			sandbox.spy(platformService, "addPlatforms");
			sandbox.spy(platformService, "removePlatforms");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return updateCommand.execute([]).then(() => {
				assert(platformService.removePlatforms.calledWith(installedPlatforms));
				assert(platformService.addPlatforms.calledWith(installedPlatforms));
			});
		});

		it("call add platforms with specific verison", async () => {
			const version = "3.3.0";
			const installedPlatforms: string[] = ["android"];
			const testInjector = createTestInjector(installedPlatforms);
			const platformService = testInjector.resolve("platformService");
			sandbox.spy(platformService, "addPlatforms");
			sandbox.spy(platformService, "removePlatforms");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return updateCommand.execute([version]).then(() => {
				assert(platformService.addPlatforms.calledWith([`${installedPlatforms}@${version}`]));
			});
		});

		it("calls remove and add of core modules and widgets", async () => {
			const testInjector = createTestInjector();
			const pluginsService = testInjector.resolve("pluginsService");
			sandbox.spy(pluginsService, "remove");
			sandbox.spy(pluginsService, "add");
			sandbox.spy(pluginsService, "ensureAllDependenciesAreInstalled");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return updateCommand.execute([]).then(() => {
				assert(pluginsService.add.calledWith("tns-core-modules"));
				assert(pluginsService.remove.calledWith("tns-core-modules"));
				assert(pluginsService.remove.calledWith("tns-core-modules-widgets"));
				assert(pluginsService.ensureAllDependenciesAreInstalled.called);
			});
		});

		it("calls add of core modules with specific version", async () => {
			const version = "3.3.0";
			const testInjector = createTestInjector();
			const pluginsService = testInjector.resolve("pluginsService");
			sandbox.spy(pluginsService, "remove");
			sandbox.spy(pluginsService, "add");
			sandbox.spy(pluginsService, "ensureAllDependenciesAreInstalled");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return updateCommand.execute([version]).then(() => {
				assert(pluginsService.add.calledWith(`tns-core-modules@${version}`));
			});
		});
	});
});
