import { InjectorStub } from "../../stubs";
import { AddPlatformService } from "../../../lib/services/platform/add-platform-service";
import { PacoteService } from "../../../lib/services/pacote-service";
import { assert } from "chai";
import { format } from "util";
import { AddPlaformErrors } from "../../../lib/constants";

let extractedPackageFromPacote: string = null;

function createTestInjector() {
	const injector = new InjectorStub();
	injector.register("pacoteService", {
		extractPackage: async (name: string): Promise<void> => { extractedPackageFromPacote = name; }
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

				await assert.isRejected(addPlatformService.addPlatform(projectData, { platformParam: platform }), errorMessage);
			});
			it(`should fail when path passed to frameworkPath does not exist for ${platform}`, async () => {
				const frameworkPath = "invalidPath";
				const errorMessage = format(AddPlaformErrors.InvalidFrameworkPathStringFormat, frameworkPath);

				await assert.isRejected(addPlatformService.addPlatform(projectData, { platformParam: platform, frameworkPath }), errorMessage);
			});
			it(`should respect platform version in package.json's nativescript key for ${platform}`, async () => {
				const version = "2.5.0";

				const projectDataService = injector.resolve("projectDataService");
				projectDataService.getNSValue = () => ({ version });

				await addPlatformService.addPlatform(projectData, { platformParam: platform });

				const expectedPackageToAdd = `tns-${platform}@${version}`;
				assert.deepEqual(extractedPackageFromPacote, expectedPackageToAdd);
			});
			it(`should install latest platform if no information found in package.json's nativescript key for ${platform}`, async () => {
				const latestCompatibleVersion = "5.0.0";

				const packageInstallationManager = injector.resolve<IPackageInstallationManager>("packageInstallationManager");
				packageInstallationManager.getLatestCompatibleVersion = async () => latestCompatibleVersion;
				const projectDataService = injector.resolve("projectDataService");
				projectDataService.getNSValue = () => <any>null;

				await addPlatformService.addPlatform(projectData, { platformParam: platform });

				const expectedPackageToAdd = `tns-${platform}@${latestCompatibleVersion}`;
				assert.deepEqual(extractedPackageFromPacote, expectedPackageToAdd);
			});
			it(`shouldn't add native platform when skipNativePrepare is provided for ${platform}`, async () => {
				const projectDataService = injector.resolve("projectDataService");
				projectDataService.getNSValue = () => ({ version: "4.2.0" });

				let isCreateNativeProjectCalled = false;
				const platformsData = injector.resolve("platformsData");
				const platformData = platformsData.getPlatformData(platform, injector.resolve("projectData"));
				platformData.platformProjectService.createProject = () => isCreateNativeProjectCalled = true;
				platformsData.getPlatformData = () => platformData;

				await addPlatformService.addPlatform(projectData, { platformParam: platform, nativePrepare: { skipNativePrepare: true } });
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

				await addPlatformService.addPlatform(projectData, { platformParam: platform });
				assert.isTrue(isCreateNativeProjectCalled);
			});
		});
	});
});
