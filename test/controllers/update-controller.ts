import * as stubs from "./../stubs";
import * as yok from "../../lib/common/yok";
import { UpdateController } from "../../lib/controllers/update-controller";
import { assert } from "chai";
import * as sinon from 'sinon';
import * as path from "path";
import { Options } from "../../lib/options";
import { StaticConfig } from "../../lib/config";
import { SettingsService } from "../../lib/common/test/unit-tests/stubs";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
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
	testInjector.register("migrateController", {
		shouldMigrate: () => { return false; },
	});
	testInjector.register('fs', stubs.FileSystemStub);
	testInjector.register('platformCommandHelper', {
		getCurrentPlatformVersion: () => {
			return "5.2.0";
		}
	});

	testInjector.register('packageManager', {
		getTagVersion: () => {
			return "2.3.0";
		}
	});
	testInjector.register("addPlatformService", {
		setPlatformVersion: () => {/**/}
	});
	testInjector.register("pluginsService", {
		addToPackageJson: () => {/**/}
	});
	testInjector.register('devicePlatformsConstants', DevicePlatformsConstants);
	testInjector.register('packageInstallationManager', stubs.PackageInstallationManagerStub);
	testInjector.register('platformsDataService', stubs.NativeProjectDataStub);
	testInjector.register("pacoteService", stubs.PacoteServiceStub);
	testInjector.register('projectDataService', stubs.ProjectDataService);
	testInjector.register("updateController", UpdateController);

	return testInjector;
}

describe("update controller method tests", () => {
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
	});

	afterEach(() => {
		sandbox.restore();
	});

	it("if backup fails, platforms not deleted, temp removed", async () => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");
		const deleteDirectory: sinon.SinonStub = sandbox.stub(fs, "deleteDirectory");
		sandbox.stub(fs, "copyFile").throws();
		const updateController = testInjector.resolve("updateController");

		await updateController.update(projectFolder, ["3.3.0"]);

		assert.isTrue(deleteDirectory.calledWith(path.join(projectFolder, UpdateController.tempFolder)));
		assert.isFalse(deleteDirectory.calledWith(path.join(projectFolder, "platforms")));
	});

	it("calls copy to temp for package.json and folders(backup)", async () => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");
		const copyFileStub = sandbox.stub(fs, "copyFile");
		const updateController = testInjector.resolve("updateController");

		await updateController.update(projectFolder, ["3.3.0"]);

		assert.isTrue(copyFileStub.calledWith(path.join(projectFolder, "package.json")));
		for (const folder of UpdateController.folders) {
			assert.isTrue(copyFileStub.calledWith(path.join(projectFolder, folder)));
		}
	});

	it("calls copy from temp for package.json and folders to project folder(restore)", async () => {
		const testInjector = createTestInjector();
		testInjector.resolve("platformCommandHelper").removePlatforms = () => {
			throw new Error();
		};
		const fs = testInjector.resolve("fs");
		const copyFileStub = sandbox.stub(fs, "copyFile");
		const updateController = testInjector.resolve("updateController");
		const tempDir = path.join(projectFolder, UpdateController.tempFolder);

		await updateController.update(projectFolder, ["3.3.0"]);

		assert.isTrue(copyFileStub.calledWith(path.join(tempDir, "package.json"), projectFolder));
		for (const folder of UpdateController.folders) {
			assert.isTrue(copyFileStub.calledWith(path.join(tempDir, folder), projectFolder));
		}
	});
});
