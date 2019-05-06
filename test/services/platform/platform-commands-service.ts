import { PlatformCommandsService } from "../../../lib/services/platform/platform-commands-service";
import { assert } from "chai";
import { InjectorStub } from "../../stubs";

let isAddPlatformCalled = false;

const projectDir = "/my/path/to/project";
const projectData: any = {
	projectDir,
	platformsDir: "/my/path/to/project/platforms"
};

function createTestInjector() {
	const injector = new InjectorStub();
	injector.register("addPlatformService", {
		addPlatform: () => isAddPlatformCalled = true
	});

	injector.register("pacoteService", {
		extractPackage: () => ({})
	});
	injector.register("platformValidationService", {
		validatePlatform: () => ({}),
		validatePlatformInstalled: () => ({})
	});

	injector.register("platformCommandsService", PlatformCommandsService);

	return injector;
}

describe("PlatformCommandsService", () => {
	let injector: IInjector = null;
	let platformCommandsService: PlatformCommandsService = null;
	beforeEach(() => {
		injector = createTestInjector();
		platformCommandsService = injector.resolve("platformCommandsService");
	});

	describe("add platforms unit tests", () => {
		_.each(["Android", "ANDROID", "android", "iOS", "IOS", "ios"], platform => {
			beforeEach(() => {
				isAddPlatformCalled = false;
			});

			it(`should not fail if platform is not normalized - ${platform}`, async () => {
				const fs = injector.resolve("fs");
				fs.exists = () => false;

				await platformCommandsService.addPlatforms([platform], projectData, null);

				assert.isTrue(isAddPlatformCalled);
			});
		});
		_.each(["ios", "android"], platform => {
			it(`should fail if ${platform} platform is already installed`, async () => {
				(<any>platformCommandsService).isPlatformAdded = () => true;

				await assert.isRejected(platformCommandsService.addPlatforms([platform], projectData, ""), `Platform ${platform} already added`);
			});
		});
	});
	describe("clean platforms unit tests", () => {
		_.each(["ios", "anroid"], platform => {
			it(`should preserve the specified in the project nativescript version for ${platform}`, async () => {
				let  versionData = { version: "5.3.1" };

				const projectDataService = injector.resolve("projectDataService");
				projectDataService.getNSValue = () => versionData;
				projectDataService.removeNSProperty = () => { versionData = null; };

				(<any>platformCommandsService).isPlatformAdded = () => false;

				await platformCommandsService.cleanPlatforms([platform], injector.resolve("projectData"), "");
			});
		});
	});
	describe("update platforms unit tests", () => {
		it("should fail when tha native platform cannot be updated", async () => {
			const packageInstallationManager: IPackageInstallationManager = injector.resolve("packageInstallationManager");
			packageInstallationManager.getLatestVersion = async () => "0.2.0";

			await assert.isRejected(platformCommandsService.updatePlatforms(["android"], projectData), "Native Platform cannot be updated.");
		});
	});
});
