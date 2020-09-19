import * as stubs from "../../stubs";
import { AddPlatformService } from "../../../lib/services/platform/add-platform-service";
import { assert } from "chai";
import * as _ from "lodash";
import { INativePrepare, IProjectData } from "../../../lib/definitions/project";
import { IInjector } from "../../../lib/common/definitions/yok";
// import { project } from "nativescript-dev-xcode";

const nativePrepare: INativePrepare = null;

function createTestInjector() {
	const injector = new stubs.InjectorStub();
	injector.register("pacoteService", {
		extractPackage: async (name: string) => ({}),
	});
	injector.register("terminalSpinnerService", {
		createSpinner: () => {
			return {
				start: () => ({}),
				stop: () => ({}),
			};
		},
	});
	injector.register("packageManager", stubs.NodePackageManagerStub);
	injector.register("addPlatformService", AddPlatformService);
	injector.register("analyticsService", {
		trackEventActionInGoogleAnalytics: () => ({}),
	});
	injector.register("tempService", stubs.TempServiceStub);

	const fs = injector.resolve("fs");
	fs.exists = () => false;

	return injector;
}

describe("AddPlatformService", () => {
	describe("addPlatform", () => {
		let injector: IInjector,
			addPlatformService: AddPlatformService,
			projectData: IProjectData;
		beforeEach(() => {
			injector = createTestInjector();
			addPlatformService = injector.resolve("addPlatformService");
			projectData = injector.resolve("projectData");
		});

		_.each(["ios", "android"], (platform) => {
			it(`should fail if unable to install runtime package for ${platform}`, async () => {
				const errorMessage = "Pacote service unable to extract package";

				const packageManager = injector.resolve("packageManager");
				packageManager.install = () => {
					return Promise.reject(errorMessage);
				};

				const platformsDataService = injector
					.resolve("platformsDataService")
					.getPlatformData(platform, projectData);

				projectData.projectDir = "/some/dummy/dir";
				await assert.isRejected(
					addPlatformService.addPlatformSafe(
						projectData,
						platformsDataService,
						"somePackage",
						{
							frameworkPath: "/tmp/notfound.tgz",
							projectDir: projectData.projectDir,
							platform,
							nativePrepare,
						}
					),
					errorMessage
				);
			});
			it(`shouldn't add native platform when skipNativePrepare is provided for ${platform}`, async () => {
				const projectDataService = injector.resolve("projectDataService");
				projectDataService.getNSValue = () => ({ version: "4.2.0" });

				let isCreateNativeProjectCalled = false;
				const platformsDataService = injector.resolve("platformsDataService");
				const platformData = platformsDataService.getPlatformData(
					platform,
					injector.resolve("projectData")
				);
				platformData.platformProjectService.createProject = () =>
					(isCreateNativeProjectCalled = true);
				platformsDataService.getPlatformData = () => platformData;

				projectData.projectDir = "/some/dummy/dir";
				await addPlatformService.addPlatformSafe(
					projectData,
					platformData,
					platform,
					{
						projectDir: projectData.projectDir,
						platform,
						nativePrepare: { skipNativePrepare: true },
					}
				);
				assert.isFalse(isCreateNativeProjectCalled);
			});
			it(`should add native platform when skipNativePrepare is not provided for ${platform}`, async () => {
				const projectDataService = injector.resolve("projectDataService");
				projectDataService.getNSValue = () => ({ version: "4.2.0" });

				let isCreateNativeProjectCalled = false;
				const platformsDataService = injector.resolve("platformsDataService");
				const platformData = platformsDataService.getPlatformData(
					platform,
					injector.resolve("projectData")
				);
				platformData.platformProjectService.createProject = () =>
					(isCreateNativeProjectCalled = true);
				platformsDataService.getPlatformData = () => platformData;

				projectData.projectDir = "/some/dummy/dir";
				await addPlatformService.addPlatformSafe(
					projectData,
					platformData,
					platform,
					{ projectDir: projectData.projectDir, platform, nativePrepare }
				);
				assert.isTrue(isCreateNativeProjectCalled);
			});
		});
	});
});
