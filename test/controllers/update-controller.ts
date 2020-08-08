import * as stubs from "./../stubs";
import * as yok from "../../lib/common/yok";
import { UpdateController } from "../../lib/controllers/update-controller";
import { assert } from "chai";
import * as sinon from "sinon";
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
	testInjector.register("errors", stubs.ErrorsStub);
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
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("platformCommandHelper", {
		getCurrentPlatformVersion: () => {
			return "7.0.0";
		}
	});

	testInjector.register("packageManager", {
		getTagVersion: () => {
			return "2.3.0";
		}
	});
	testInjector.register("addPlatformService", {
		setPlatformVersion: () => {/**/ }
	});
	testInjector.register("pluginsService", {
		addToPackageJson: () => {/**/ }
	});
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("packageInstallationManager", stubs.PackageInstallationManagerStub);
	testInjector.register("platformsDataService", stubs.NativeProjectDataStub);
	testInjector.register("pacoteService", stubs.PacoteServiceStub);
	testInjector.register("projectDataService", stubs.ProjectDataService);
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

		await updateController.update({ projectDir: projectFolder, version: "3.3.0" });

		assert.isTrue(deleteDirectory.calledWith(path.join(projectFolder, UpdateController.backupFolder)));
		assert.isFalse(deleteDirectory.calledWith(path.join(projectFolder, "platforms")));
	});

	it("calls copy to temp for package.json and folders(backup)", async () => {
		const testInjector = createTestInjector();
		const fs = testInjector.resolve("fs");
		const copyFileStub = sandbox.stub(fs, "copyFile");
		const updateController = testInjector.resolve("updateController");

		await updateController.update({ projectDir: projectFolder, version: "3.3.0" });

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
		const tempDir = path.join(projectFolder, UpdateController.backupFolder);

		await updateController.update({ projectDir: projectFolder, version: "3.3.0" });

		assert.isTrue(copyFileStub.calledWith(path.join(tempDir, "package.json"), projectFolder));
		for (const folder of UpdateController.folders) {
			assert.isTrue(copyFileStub.calledWith(path.join(tempDir, folder), projectFolder));
		}
	});

	for (const projectType of ["Angular", "React"]) {
		it(`should update dependencies from project type: ${projectType}`, async () => {
			const testInjector = createTestInjector();
			testInjector.resolve("platformCommandHelper").removePlatforms = () => {
				throw new Error();
			};

			const fs = testInjector.resolve("fs");
			const copyFileStub = sandbox.stub(fs, "copyFile");
			const updateController = testInjector.resolve("updateController");
			const tempDir = path.join(projectFolder, UpdateController.backupFolder);

			const projectDataService = testInjector.resolve<IProjectDataService>("projectDataService");
			projectDataService.getProjectData = (projectDir: string) => {
				return <any>{
					projectDir,
					projectType,
					dependencies: {
						"@nativescript/core": "~7.0.0",
					},
					devDependencies: {
						"@nativescript/webpack": "~2.1.0"
					}
				};
			};

			const packageInstallationManager = testInjector.resolve<IPackageInstallationManager>("packageInstallationManager");
			const latestCompatibleVersion = "1.1.1";
			packageInstallationManager.getLatestCompatibleVersionSafe = async (packageName: string, referenceVersion?: string): Promise<string> => {
				assert.isString(packageName);
				assert.isFalse(_.isEmpty(packageName));
				return latestCompatibleVersion;
			};

			const pacoteService = testInjector.resolve<IPacoteService>("pacoteService");
			pacoteService.manifest = async (packageName: string, options?: IPacoteManifestOptions): Promise<any> => {
				assert.isString(packageName);
				assert.isFalse(_.isEmpty(packageName));

				return {
					dependencies: {
						"@nativescript/core": "~7.0.0",
						"dep2": "1.1.0"
					},
					devDependencies: {
						"devDep1": "1.2.0",
						"@nativescript/webpack": "~2.1.0"
					},
					name: "template1"
				};
			};

			const pluginsService = testInjector.resolve<IPluginsService>("pluginsService");
			const dataAddedToPackageJson: IDictionary<any> = {
				dependencies: {},
				devDependencies: {}
			};
			pluginsService.addToPackageJson = (plugin: string, version: string, isDev: boolean, projectDir: string): void => {
				if (isDev) {
					dataAddedToPackageJson.devDependencies[plugin] = version;
				} else {
					dataAddedToPackageJson.dependencies[plugin] = version;
				}
			};

			await updateController.update({ projectDir: projectFolder });

			assert.isTrue(copyFileStub.calledWith(path.join(tempDir, "package.json"), projectFolder));
			for (const folder of UpdateController.folders) {
				assert.isTrue(copyFileStub.calledWith(path.join(tempDir, folder), projectFolder));
			}

			assert.deepEqual(dataAddedToPackageJson, {
				dependencies: {
					"@nativescript/core": "~7.0.0",
				},
				devDependencies: {
					"@nativescript/webpack": "~2.1.0"
				}
			});
		});
	}
});
