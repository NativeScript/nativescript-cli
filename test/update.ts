import * as path from "path";
import * as stubs from "./stubs";
import * as yok from "../lib/common/yok";
import { UpdateCommand } from "../lib/commands/update";
import { assert } from "chai";
import * as sinon from 'sinon';
import { Options } from "../lib/options";
import { AndroidProjectService } from "../lib/services/android-project-service";
import { StaticConfig } from "../lib/config";
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
	testInjector.register("projectData", {
		projectDir,
		initializeProjectData: () => { /* empty */ },
		dependencies: {}
	});
	testInjector.register("projectDataService", {
		getNSValue: () => {
			return "1.0.0";
		}
	});
	testInjector.register("platformCommandsService", {
		getInstalledPlatforms: function(): string[] {
			return installedPlatforms;
		},
		getAvailablePlatforms: function(): string[] {
			return availablePlatforms;
		},
		removePlatforms: async (): Promise<void> => undefined,
		addPlatforms: async (): Promise<void> => undefined,
	});
	testInjector.register("platformValidationService", {});
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
			await updateCommand.canExecute(["3.3.0"]);

			assert.equal(validated, true);
		});

		it("returns false if too many arguments", async () => {
			const testInjector = createTestInjector([], ["android"]);
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecuteOutput = await updateCommand.canExecute(["333", "111", "444"]);

			return assert.equal(canExecuteOutput.canExecute, false);
		});

		it("returns false when projectDir is an empty string", async () => {
			const testInjector = createTestInjector([], ["android"], "");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecuteOutput = await updateCommand.canExecute([]);

			return assert.equal(canExecuteOutput.canExecute, false);
		});

		it("returns true when the setup is correct", async () => {
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

		it("if backup fails, platforms not deleted and added, temp removed", async () => {
			const installedPlatforms: string[] = ["android"];
			const testInjector = createTestInjector(installedPlatforms);
			const fs = testInjector.resolve("fs");
			const deleteDirectory: sinon.SinonStub = sandbox.stub(fs, "deleteDirectory");
			const platformCommandsService = testInjector.resolve("platformCommandsService");
			sandbox.stub(fs, "copyFile").throws();
			sandbox.spy(platformCommandsService, "addPlatforms");
			sandbox.spy(platformCommandsService, "removePlatforms");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);

			await updateCommand.execute(["3.3.0"]);

			assert.isTrue(deleteDirectory.calledWith(path.join(projectFolder, UpdateCommand.tempFolder)));
			assert.isFalse(platformCommandsService.removePlatforms.calledWith(installedPlatforms));
			assert.isFalse(platformCommandsService.addPlatforms.calledWith(installedPlatforms));
		});

		it("calls copy to temp for package.json and folders(backup)", async () => {
			const testInjector = createTestInjector();
			const fs = testInjector.resolve("fs");
			const copyFileStub = sandbox.stub(fs, "copyFile");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);

			await updateCommand.execute(["3.3.0"]);

			assert.isTrue(copyFileStub.calledWith(path.join(projectFolder, "package.json")));
			for (const folder of UpdateCommand.folders) {
				assert.isTrue(copyFileStub.calledWith(path.join(projectFolder, folder)));
			}
		});

		it("calls copy from temp for package.json and folders to project folder(restore)", async () => {
			const testInjector = createTestInjector();
			testInjector.resolve("platformCommandsService").removePlatforms = () => {
				throw new Error();
			};
			const fs = testInjector.resolve("fs");
			const deleteDirectoryStub: sinon.SinonStub = sandbox.stub(fs, "deleteDirectory");
			const copyFileStub = sandbox.stub(fs, "copyFile");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const tempDir = path.join(projectFolder, UpdateCommand.tempFolder);

			await updateCommand.execute(["3.3.0"]);

			assert.isTrue(copyFileStub.calledWith(path.join(tempDir, "package.json"), projectFolder));
			for (const folder of UpdateCommand.folders) {
				assert.isTrue(deleteDirectoryStub.calledWith(path.join(projectFolder, folder)));
				assert.isTrue(copyFileStub.calledWith(path.join(tempDir, folder), projectFolder));
			}
		});

		it("calls remove for all folders", async () => {
			const testInjector = createTestInjector();
			const fs = testInjector.resolve("fs");
			const deleteDirectory: sinon.SinonStub = sandbox.stub(fs, "deleteDirectory");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);

			await updateCommand.execute([]);

			for (const folder of UpdateCommand.folders) {
				assert.isTrue(deleteDirectory.calledWith(path.join(projectFolder, folder)));
			}
		});

		it("calls remove platforms and add platforms", async () => {
			const installedPlatforms: string[] = ["android"];
			const testInjector = createTestInjector(installedPlatforms);
			const platformCommandsService = testInjector.resolve("platformCommandsService");
			sandbox.spy(platformCommandsService, "addPlatforms");
			sandbox.spy(platformCommandsService, "removePlatforms");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);

			await updateCommand.execute([]);

			assert(platformCommandsService.removePlatforms.calledWith(installedPlatforms));
			assert(platformCommandsService.addPlatforms.calledWith(installedPlatforms));
		});

		it("call add platforms with specific verison", async () => {
			const version = "3.3.0";
			const installedPlatforms: string[] = ["android"];
			const testInjector = createTestInjector(installedPlatforms);
			const platformCommandsService = testInjector.resolve("platformCommandsService");
			sandbox.spy(platformCommandsService, "addPlatforms");
			sandbox.spy(platformCommandsService, "removePlatforms");

			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			await updateCommand.execute([version]);

			assert(platformCommandsService.addPlatforms.calledWith([`${installedPlatforms}@${version}`]));
		});

		it("calls remove and add of core modules and widgets", async () => {
			const testInjector = createTestInjector();
			const pluginsService = testInjector.resolve("pluginsService");
			sandbox.spy(pluginsService, "remove");
			sandbox.spy(pluginsService, "add");
			sandbox.spy(pluginsService, "ensureAllDependenciesAreInstalled");
			const $projectData = testInjector.resolve("projectData");
			$projectData.dependencies = {
				"tns-core-modules": "1.0.0",
				"tns-core-modules-widgets": "1.0.0"
			};

			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			await updateCommand.execute([]);

			assert(pluginsService.add.calledWith("tns-core-modules"));
			assert(pluginsService.remove.calledWith("tns-core-modules"));
			assert(pluginsService.remove.calledWith("tns-core-modules-widgets"));
			assert(pluginsService.ensureAllDependenciesAreInstalled.called);
		});

		it("calls add of core modules with specific version", async () => {
			const version = "3.3.0";
			const testInjector = createTestInjector();
			const pluginsService = testInjector.resolve("pluginsService");
			sandbox.spy(pluginsService, "remove");
			sandbox.spy(pluginsService, "add");
			sandbox.spy(pluginsService, "ensureAllDependenciesAreInstalled");

			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			await updateCommand.execute([version]);

			assert(pluginsService.add.calledWith(`tns-core-modules@${version}`));
		});
	});
});
