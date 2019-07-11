import * as stubs from "./stubs";
import * as yok from "../lib/common/yok";
import { UpdateCommand } from "../lib/commands/update";
import { assert } from "chai";
import { Options } from "../lib/options";
import { StaticConfig } from "../lib/config";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
const projectFolder = "test";

function createTestInjector(
	projectDir: string = projectFolder
): IInjector {
	const testInjector: IInjector = new yok.Yok();
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("options", Options);
	testInjector.register("analyticsService", {
		trackException: async (): Promise<void> => undefined,
		checkConsent: async (): Promise<void> => undefined,
		trackFeature: async (): Promise<void> => undefined
	});
	testInjector.register('errors', stubs.ErrorsStub);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("projectData", {
		projectDir,
		initializeProjectData: () => { /* empty */ },
		dependencies: {}
	});
	testInjector.register("settingsService", SettingsService);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("migrateController", {
		shouldMigrate: () => { return false; },
	});

	testInjector.register("updateController", {
		shouldUpdate: () => { return true; },
	});

	return testInjector;
}

describe("update command method tests", () => {
	describe("canExecute", () => {
		it("returns false if too many arguments", async () => {
			const testInjector = createTestInjector();
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecuteOutput = await updateCommand.canExecute(["333", "111", "444"]);

			return assert.equal(canExecuteOutput, false);
		});

		it("returns false when projectDir is an empty string", async () => {
			const testInjector = createTestInjector("");
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecuteOutput = await updateCommand.canExecute([]);

			return assert.equal(canExecuteOutput, false);
		});

		it("returns true when the setup is correct", async () => {
			const testInjector = createTestInjector();
			const updateCommand = testInjector.resolve<UpdateCommand>(UpdateCommand);
			const canExecuteOutput = await updateCommand.canExecute(["3.3.0"]);

			return assert.equal(canExecuteOutput, true);
		});
	});
});
