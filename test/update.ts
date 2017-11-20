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
import * as shelljs from "shelljs";
const projectFolder = "test";

function createTestInjector(
	installedPlatforms: string[] = [],
	availablePlatforms: string[] = [],
	projectDir: string = projectFolder,
	validate: Function = (): Promise<void> => Promise.resolve()
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
			const canExecute = updateCommand.canExecute(["333", "111", "444"]);

			return assert.eventually.equal(canExecute, false);
		});

		it("returns false if projectDir empty string", async () => {
			const testInjector = createTestInjector([], ["android"], "");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecute = updateCommand.canExecute([]);

			return assert.eventually.equal(canExecute, false);
		});

		it("returns true all ok", async () => {
			const testInjector = createTestInjector([], ["android"]);
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecute = updateCommand.canExecute(["3.3.0"]);

			return assert.eventually.equal(canExecute, true);
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

		it("calls backup and executeCore", async () => {
			sandbox.stub(shelljs);
			const testInjector = createTestInjector();
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const executeCoreStub: sinon.SinonStub = sinon.stub(updateCommand as any, "executeCore");
			const backupStub: sinon.SinonStub = sinon.stub(updateCommand as any, "backup");
			updateCommand.execute(["3.3.0"]);

			assert.isTrue(backupStub.called);
			assert.isTrue(executeCoreStub.called);
		});

		it("if backup fails, execute core not called and temp removed", async () => {
			sandbox.stub(shelljs);
			const rmStub: sinon.SinonStub = shelljs.rm as sinon.SinonStub;
			const testInjector = createTestInjector();
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			sandbox.stub(updateCommand as any, "backup").throws();
			const executeCoreStub: sinon.SinonStub = sinon.stub(updateCommand as any, "executeCore");
			updateCommand.execute(["3.3.0"]);

			assert.isFalse(executeCoreStub.called);
			assert.isTrue(rmStub.calledWith("-fr", path.join(projectFolder, (updateCommand as any).tempFolder)));
		});
	});

	describe("backup", () => {
		let sandbox: sinon.SinonSandbox;

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("calls copy to temp for package.json and folders", async () => {
			sandbox.stub(shelljs);
			const cpStub: sinon.SinonStub = shelljs.cp as sinon.SinonStub;
			const testInjector = createTestInjector();
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			sinon.stub(updateCommand as any, "executeCore");
			updateCommand.execute(["3.3.0"]);

			assert.isTrue(cpStub.calledWith(path.join(projectFolder, "package.json")));
			for (const folder of (updateCommand as any).folders) {
				assert.isTrue(cpStub.calledWith("-rf", path.join(projectFolder, folder)));
			}
		});
	});

	describe("backup", () => {
		let sandbox: sinon.SinonSandbox;

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("calls copy to temp for package.json and folders", async () => {
			sandbox.stub(shelljs);
			const cpStub: sinon.SinonStub = shelljs.cp as sinon.SinonStub;
			const testInjector = createTestInjector();
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const tempDir = path.join(projectFolder, (updateCommand as any).tempFolder);
			sinon.stub(updateCommand as any, "executeCore");
			(updateCommand as any).backup(tempDir);

			assert.isTrue(cpStub.calledWith(path.join(projectFolder, "package.json")));
			for (const folder of (updateCommand as any).folders) {
				assert.isTrue(cpStub.calledWith("-rf", path.join(projectFolder, folder)));
			}
		});
	});

	describe("restoreBackup", () => {
		let sandbox: sinon.SinonSandbox;

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("calls copy to temp for package.json and folders", async () => {
			sandbox.stub(shelljs);
			const cpStub: sinon.SinonStub = shelljs.cp as sinon.SinonStub;
			const testInjector = createTestInjector();
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const tempDir = path.join(projectFolder, (updateCommand as any).tempFolder, projectFolder);
			sinon.stub(updateCommand as any, "executeCore");
			(updateCommand as any).restoreBackup(tempDir);

			assert.isTrue(cpStub.calledWith("-f", path.join(tempDir, "package.json"), projectFolder));
			for (const folder of (updateCommand as any).folders) {
				assert.isTrue(cpStub.calledWith("-fr", path.join(tempDir, folder), projectFolder));
			}
		});
	});

	describe("executeCore", () => {
		let sandbox: sinon.SinonSandbox;

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
		});

		afterEach(() => {
			sandbox.restore();
		});

		it("calls remove for all falders", async () => {
			sandbox.stub(shelljs);
			const rmStub: sinon.SinonStub = shelljs.rm as sinon.SinonStub;
			const testInjector = createTestInjector();
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return (updateCommand as any).executeCore([]).then(() => {
				for (const folder of (updateCommand as any).folders) {
					assert.isTrue(rmStub.calledWith("-rf", path.join(projectFolder, folder)));
				}
			});
		});

		it("calls remove platforms and add platforms", async () => {
			sandbox.stub(shelljs);
			const installedPlatforms: string[] = ["android"];
			const testInjector = createTestInjector(installedPlatforms);
			const platformService = testInjector.resolve("platformService");
			sandbox.spy(platformService, "addPlatforms");
			sandbox.spy(platformService, "removePlatforms");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return (updateCommand as any).executeCore([]).then(() => {
				assert(platformService.removePlatforms.calledWith(installedPlatforms));
				assert(platformService.addPlatforms.calledWith(installedPlatforms));
			});
		});

		it("call add platforms with specific verison", async () => {
			sandbox.stub(shelljs);
			const version = "3.3.0";
			const installedPlatforms: string[] = ["android"];
			const testInjector = createTestInjector(installedPlatforms);
			const platformService = testInjector.resolve("platformService");
			sandbox.spy(platformService, "addPlatforms");
			sandbox.spy(platformService, "removePlatforms");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return (updateCommand as any).executeCore([version]).then(() => {
				assert(platformService.addPlatforms.calledWith([`${installedPlatforms}@${version}`]));
			});
		});

		it("calls remove and add of core modules and widgets", async () => {
			sandbox.stub(shelljs);
			const testInjector = createTestInjector();
			const pluginsService = testInjector.resolve("pluginsService");
			sandbox.spy(pluginsService, "remove");
			sandbox.spy(pluginsService, "add");
			sandbox.spy(pluginsService, "ensureAllDependenciesAreInstalled");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return (updateCommand as any).executeCore([]).then(() => {
				assert(pluginsService.add.calledWith("tns-core-modules"));
				assert(pluginsService.remove.calledWith("tns-core-modules"));
				assert(pluginsService.remove.calledWith("tns-core-modules-widgets"));
				assert(pluginsService.ensureAllDependenciesAreInstalled.called);
			});
		});

		it("calls add of core modules with specific version", async () => {
			sandbox.stub(shelljs);
			const version = "3.3.0";
			const testInjector = createTestInjector();
			const pluginsService = testInjector.resolve("pluginsService");
			sandbox.spy(pluginsService, "remove");
			sandbox.spy(pluginsService, "add");
			sandbox.spy(pluginsService, "ensureAllDependenciesAreInstalled");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			return (updateCommand as any).executeCore([version]).then(() => {
				assert(pluginsService.add.calledWith(`tns-core-modules@${version}`));
			});
		});
	});
});
