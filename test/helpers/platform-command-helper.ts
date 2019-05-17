
import { assert } from "chai";
import { InjectorStub } from "../stubs";
import { MobileHelper } from "../../lib/common/mobile/mobile-helper";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { PlatformCommandHelper } from "../../lib/helpers/platform-command-helper";

let isAddPlatformCalled = false;

const projectDir = "/my/path/to/project";
const projectData: any = {
	projectDir,
	platformsDir: "/my/path/to/project/platforms"
};

function createTestInjector() {
	const injector = new InjectorStub();
	injector.register("addPlatformService", {
		addPlatform: () => ({})
	});

	injector.register("platformController", {
		addPlatform: () => isAddPlatformCalled = true
	});

	injector.register("pacoteService", {
		extractPackage: () => ({})
	});
	injector.register("platformValidationService", {
		validatePlatform: () => ({}),
		validatePlatformInstalled: () => ({})
	});

	injector.register("platformCommandHelper", PlatformCommandHelper);

	injector.register("mobileHelper", MobileHelper);
	injector.register("devicePlatformsConstants", DevicePlatformsConstants);

	return injector;
}

describe("PlatformCommandHelper", () => {
	let injector: IInjector = null;
	let platformCommandHelper: IPlatformCommandHelper = null;
	beforeEach(() => {
		injector = createTestInjector();
		platformCommandHelper = injector.resolve("platformCommandHelper");
	});

	describe("add platforms unit tests", () => {
		_.each(["Android", "ANDROID", "android", "iOS", "IOS", "ios"], platform => {
			beforeEach(() => {
				isAddPlatformCalled = false;
			});

			it(`should not fail if platform is not normalized - ${platform}`, async () => {
				const fs = injector.resolve("fs");
				fs.exists = () => false;

				await platformCommandHelper.addPlatforms([platform], projectData, null);

				assert.isTrue(isAddPlatformCalled);
			});
		});
		_.each(["ios", "android"], platform => {
			it(`should fail if ${platform} platform is already installed`, async () => {
				(<any>platformCommandHelper).isPlatformAdded = () => true;

				await assert.isRejected(platformCommandHelper.addPlatforms([platform], projectData, ""), `Platform ${platform} already added`);
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

				(<any>platformCommandHelper).isPlatformAdded = () => false;

				await platformCommandHelper.cleanPlatforms([platform], injector.resolve("projectData"), "");
			});
		});
	});
	describe("update platforms unit tests", () => {
		it("should fail when tha native platform cannot be updated", async () => {
			const packageInstallationManager: IPackageInstallationManager = injector.resolve("packageInstallationManager");
			packageInstallationManager.getLatestVersion = async () => "0.2.0";

			await assert.isRejected(platformCommandHelper.updatePlatforms(["android"], projectData), "Native Platform cannot be updated.");
		});
	});
});
