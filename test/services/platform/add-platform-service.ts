import { InjectorStub } from "../../stubs";
import { AddPlatformService } from "../../../lib/services/platform/add-platform-service";
import { PacoteService } from "../../../lib/services/pacote-service";
import { assert } from "chai";

const nativePrepare: INativePrepare = null;

function createTestInjector() {
	const injector = new InjectorStub();
	injector.register("pacoteService", {
		extractPackage: async (name: string) => ({})
	});
	injector.register("terminalSpinnerService", {
		createSpinner: () => {
			return {
				start: () => ({}),
				stop: () => ({})
			};
		}
	});
	injector.register("addPlatformService", AddPlatformService);

	const fs = injector.resolve("fs");
	fs.exists = () => false;

	return injector;
}

describe("AddPlatformService", () => {
	describe("addPlatform", () => {
		let injector: IInjector, addPlatformService: AddPlatformService, projectData: IProjectData;
		beforeEach(() => {
			injector = createTestInjector();
			addPlatformService = injector.resolve("addPlatformService");
			projectData = injector.resolve("projectData");
		});

		_.each(["ios", "android"], platform => {
			it(`should fail if unable to extract runtime package for ${platform}`, async () => {
				const errorMessage = "Pacote service unable to extract package";

				const pacoteService: PacoteService = injector.resolve("pacoteService");
				pacoteService.extractPackage = async (): Promise<void> => { throw new Error(errorMessage); };

				const platformData = injector.resolve("platformsData").getPlatformData(platform, projectData);

				await assert.isRejected(addPlatformService.addPlatformSafe(projectData, platformData, "somePackage", nativePrepare), errorMessage);
			});
			it(`shouldn't add native platform when skipNativePrepare is provided for ${platform}`, async () => {
				const projectDataService = injector.resolve("projectDataService");
				projectDataService.getNSValue = () => ({ version: "4.2.0" });

				let isCreateNativeProjectCalled = false;
				const platformsData = injector.resolve("platformsData");
				const platformData = platformsData.getPlatformData(platform, injector.resolve("projectData"));
				platformData.platformProjectService.createProject = () => isCreateNativeProjectCalled = true;
				platformsData.getPlatformData = () => platformData;

				await addPlatformService.addPlatformSafe(projectData, platformData, platform, { skipNativePrepare: true } );
				assert.isFalse(isCreateNativeProjectCalled);
			});
			it(`should add native platform when skipNativePrepare is not provided for ${platform}`, async () => {
				const projectDataService = injector.resolve("projectDataService");
				projectDataService.getNSValue = () => ({ version: "4.2.0" });

				let isCreateNativeProjectCalled = false;
				const platformsData = injector.resolve("platformsData");
				const platformData = platformsData.getPlatformData(platform, injector.resolve("projectData"));
				platformData.platformProjectService.createProject = () => isCreateNativeProjectCalled = true;
				platformsData.getPlatformData = () => platformData;

				await addPlatformService.addPlatformSafe(projectData, platformData, platform, nativePrepare);
				assert.isTrue(isCreateNativeProjectCalled);
			});
		});
	});
});
