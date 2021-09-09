import * as stubs from "./../stubs";
import * as yok from "../../lib/common/yok";
import { UpdateController } from "../../lib/controllers/update-controller";
import { assert } from "chai";
import * as sinon from "sinon";
import { IInjector } from "../../lib/common/definitions/yok";
import { IPluginsService } from "../../lib/definitions/plugins";
const projectFolder = "test";

function createTestInjector(projectDir: string = projectFolder): IInjector {
	const testInjector: IInjector = new yok.Yok();
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register(
		"terminalSpinnerService",
		stubs.TerminalSpinnerServiceStub
	);
	testInjector.register("projectData", {
		projectDir,
		initializeProjectData: () => {
			/* empty */
		},
		dependencies: {
			"@nativescript/core": "next",
		},
		devDependencies: {
			"@nativescript/ios": "8.0.0",
			"@nativescript/android": "~8.0.0",
			"@nativescript/webpack": "5.0.0-beta.9",
			"@nativescript/types": "8.1.0",
		},
	});
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("platformCommandHelper", {
		getCurrentPlatformVersion: () => {
			return "5.2.0";
		},
	});
	testInjector.register("packageManager", {
		getTagVersion(packageName: string, tag: string) {
			switch (tag) {
				case "next":
					return "8.0.0-next";
				case "latest":
					return "8.0.4567";
				case "JSC":
					if (packageName === "@nativescript/ios") {
						return "6.5.4-jsc";
					}
			}

			return false;
		},
	});
	testInjector.register("pluginsService", {
		addToPackageJson() {},
	});

	class PackageInstallationManagerStub extends stubs.PackageInstallationManagerStub {
		getInstalledDependencyVersion = async (packageName: string) => {
			const projectData = testInjector.resolve("projectData");
			const deps = {
				...projectData.dependencies,
				...projectData.devDependencies,
			};

			if (deps[packageName]) {
				return deps[packageName];
			}

			return "";
		};
	}
	testInjector.register(
		"packageInstallationManager",
		PackageInstallationManagerStub
	);
	testInjector.register("platformsDataService", stubs.NativeProjectDataStub);
	testInjector.register("pacoteService", stubs.PacoteServiceStub);
	testInjector.register("projectDataService", {
		getProjectData() {
			return testInjector.resolve("projectData");
		},
	});
	testInjector.register("updateController", UpdateController);
	testInjector.register("projectBackupService", stubs.ProjectBackupServiceStub);
	testInjector.register("projectCleanupService", {
		clean() {},
	});

	return testInjector;
}

function assertCalled(stub: sinon.SinonStub, ...args: any[]) {
	assert(
		stub.calledWith(...args),
		`Expected a call with (${args.join(", ")}).`
	);
}

describe("update controller method tests", () => {
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	it("if backup fails, project is not cleaned", async () => {
		const testInjector = createTestInjector();
		const projectBackupService = testInjector.resolve("projectBackupService");
		const projectCleanupService = testInjector.resolve("projectCleanupService");
		const updateController = testInjector.resolve("updateController");

		projectBackupService.shouldFail(true);

		let cleanCalled = false;
		projectCleanupService.clean = () => {
			cleanCalled = true;
		};

		let hasError = false;
		await updateController
			.update({
				projectDir: projectFolder,
				version: "3.3.0",
			})
			.catch(() => {
				hasError = true;
			});

		assert.equal(projectBackupService._backups.length, 1);

		const backup = projectBackupService._backups[0];

		assert.isTrue(
			hasError,
			"expected updateController.update to throw an error"
		);
		assert.isTrue(
			backup._meta.createCalled,
			"expected backup.create() to have been called"
		);
		assert.isFalse(cleanCalled, "clean called even though backup failed");
		assert.isTrue(
			backup._meta.removeCalled,
			"expected backup.remove() to have been called"
		);
	});

	it("handles exact versions", async () => {
		const testInjector = createTestInjector();
		const updateController = testInjector.resolve("updateController");
		const pluginsService = testInjector.resolve<IPluginsService>(
			"pluginsService"
		);

		const stub = sinon.stub(pluginsService, "addToPackageJson");

		await updateController.update({
			projectDir: projectFolder,
			version: "8.0.1234",
		});

		assertCalled(stub, "@nativescript/core", "8.0.1234");
		assertCalled(stub, "@nativescript/webpack", "8.0.1234");
		assertCalled(stub, "@nativescript/types", "8.0.1234");
		assertCalled(stub, "@nativescript/ios", "8.0.1234");
		assertCalled(stub, "@nativescript/android", "8.0.1234");
	});

	it("handles range versions", async () => {
		const testInjector = createTestInjector();
		const updateController = testInjector.resolve("updateController");
		const pluginsService = testInjector.resolve<IPluginsService>(
			"pluginsService"
		);

		const stub = sinon.stub(pluginsService, "addToPackageJson");

		await updateController.update({
			projectDir: projectFolder,
			version: "~8.0.1234",
		});

		assertCalled(stub, "@nativescript/core", "~8.0.1234");
		assertCalled(stub, "@nativescript/webpack", "~8.0.1234");
		assertCalled(stub, "@nativescript/types", "~8.0.1234");
		assertCalled(stub, "@nativescript/ios", "~8.0.1234");
		assertCalled(stub, "@nativescript/android", "~8.0.1234");
	});

	it("handles range versions", async () => {
		const testInjector = createTestInjector();
		const updateController = testInjector.resolve("updateController");
		const pluginsService = testInjector.resolve<IPluginsService>(
			"pluginsService"
		);

		const stub = sinon.stub(pluginsService, "addToPackageJson");

		await updateController.update({
			projectDir: projectFolder,
			version: "^8.0.1234",
		});

		assertCalled(stub, "@nativescript/core", "^8.0.1234");
		assertCalled(stub, "@nativescript/webpack", "^8.0.1234");
		assertCalled(stub, "@nativescript/types", "^8.0.1234");
		assertCalled(stub, "@nativescript/ios", "^8.0.1234");
		assertCalled(stub, "@nativescript/android", "^8.0.1234");
	});

	it("handles latest tag versions", async () => {
		const testInjector = createTestInjector();
		const updateController = testInjector.resolve("updateController");
		const pluginsService = testInjector.resolve<IPluginsService>(
			"pluginsService"
		);

		const stub = sinon.stub(pluginsService, "addToPackageJson");

		await updateController.update({
			projectDir: projectFolder,
			version: "latest",
		});

		assertCalled(stub, "@nativescript/core", "~8.0.4567");
		assertCalled(stub, "@nativescript/webpack", "~8.0.4567");
		assertCalled(stub, "@nativescript/types", "~8.0.4567");
		assertCalled(stub, "@nativescript/ios", "~8.0.4567");
		assertCalled(stub, "@nativescript/android", "~8.0.4567");
	});

	it("handles existing tag versions", async () => {
		const testInjector = createTestInjector();
		const updateController = testInjector.resolve("updateController");
		const pluginsService = testInjector.resolve<IPluginsService>(
			"pluginsService"
		);

		const stub = sinon.stub(pluginsService, "addToPackageJson");

		await updateController.update({
			projectDir: projectFolder,
			version: "next",
		});

		assertCalled(stub, "@nativescript/core", "8.0.0-next");
		assertCalled(stub, "@nativescript/webpack", "8.0.0-next");
		assertCalled(stub, "@nativescript/types", "8.0.0-next");
		assertCalled(stub, "@nativescript/ios", "8.0.0-next");
		assertCalled(stub, "@nativescript/android", "8.0.0-next");
	});

	it("handles non-existing tag versions", async () => {
		const testInjector = createTestInjector();
		const updateController = testInjector.resolve("updateController");
		const pluginsService = testInjector.resolve<IPluginsService>(
			"pluginsService"
		);

		const stub = sinon.stub(pluginsService, "addToPackageJson");

		await updateController.update({
			projectDir: projectFolder,
			version: "nonexistent",
		});

		assert(stub.notCalled);
	});

	it("handles partially existing tag versions", async () => {
		const testInjector = createTestInjector();
		const updateController = testInjector.resolve("updateController");
		const pluginsService = testInjector.resolve<IPluginsService>(
			"pluginsService"
		);

		const stub = sinon.stub(pluginsService, "addToPackageJson");

		await updateController.update({
			projectDir: projectFolder,
			version: "JSC",
		});

		assert(stub.calledOnce);
		assertCalled(stub, "@nativescript/ios", "6.5.4-jsc");
	});

	it("handles no version - falls back to latest", async () => {
		const testInjector = createTestInjector();
		const updateController = testInjector.resolve("updateController");
		const pluginsService = testInjector.resolve<IPluginsService>(
			"pluginsService"
		);

		const stub = sinon.stub(pluginsService, "addToPackageJson");

		await updateController.update({
			projectDir: projectFolder,
		});

		assertCalled(stub, "@nativescript/core", "~8.0.4567");
		assertCalled(stub, "@nativescript/webpack", "~8.0.4567");
		assertCalled(stub, "@nativescript/types", "~8.0.4567");
		assertCalled(stub, "@nativescript/ios", "~8.0.4567");
		assertCalled(stub, "@nativescript/android", "~8.0.4567");
	});
});
