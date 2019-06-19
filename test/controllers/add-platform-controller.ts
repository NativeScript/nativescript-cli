import { InjectorStub, PacoteServiceStub } from "../stubs";
import { PlatformController } from "../../lib/controllers/platform-controller";
import { AddPlatformService } from "../../lib/services/platform/add-platform-service";
import { assert } from "chai";
import { format } from "util";
import { AddPlaformErrors } from "../../lib/constants";

let actualMessage: string = null;
const latestFrameworkVersion = "5.3.1";
let extractedPackageFromPacote: string = null;

function createInjector(data?: { latestFrameworkVersion: string }) {
	const version = (data && data.latestFrameworkVersion) || latestFrameworkVersion;

	const injector = new InjectorStub();
	injector.register("platformController", PlatformController);
	injector.register("addPlatformService", AddPlatformService);
	injector.register("pacoteService", PacoteServiceStub);

	injector.register("pacoteService", {
		extractPackage: async (name: string): Promise<void> => { extractedPackageFromPacote = name; }
	});

	const logger = injector.resolve("logger");
	logger.info = (message: string) => actualMessage = message;

	const packageInstallationManager = injector.resolve("packageInstallationManager");
	packageInstallationManager.getLatestCompatibleVersion = async () => version;

	const fs = injector.resolve("fs");
	fs.readJson = () => ({ version });

	return injector;
}

const projectDir = "/my/test/dir";

describe("PlatformController", () => {
	const testCases = [
		{
			name: "should add the platform (tns platform add <platform>@4.2.1)",
			latestFrameworkVersion: "4.2.1"
		},
		{
			name: "should add the latest compatible version (tns platform add <platform>)",
			latestFrameworkVersion,
			getPlatformParam: (platform: string) => `${platform}@${latestFrameworkVersion}`
		},
		{
			name: "should add the platform when --frameworkPath is provided",
			frameworkPath: "/my/path/to/framework.tgz",
			latestFrameworkVersion: "5.4.0"
		}
	];

	afterEach(() => {
		actualMessage = null;
	});

	_.each(testCases, testCase => {
		_.each(["ios", "android"], platform => {
			it(`${testCase.name} for ${platform} platform`, async () => {
				const injector = createInjector({ latestFrameworkVersion: testCase.latestFrameworkVersion });

				const platformParam = testCase.getPlatformParam ? testCase.getPlatformParam(platform) : platform;
				const platformController: PlatformController = injector.resolve("platformController");
				await platformController.addPlatform({ projectDir, platform: platformParam, frameworkPath: testCase.frameworkPath });

				const expectedMessage = `Platform ${platform} successfully added. v${testCase.latestFrameworkVersion}`;
				assert.deepEqual(actualMessage, expectedMessage);
			});
		});
	});

	_.each(["ios", "android"], platform => {
		it(`should fail when path passed frameworkPath does not exist for ${platform}`, async () => {
			const frameworkPath = "invalidPath";
			const errorMessage = format(AddPlaformErrors.InvalidFrameworkPathStringFormat, frameworkPath);

			const injector = createInjector();
			const fs = injector.resolve("fs");
			fs.exists = (filePath: string) => filePath !== frameworkPath;

			const platformController: PlatformController = injector.resolve("platformController");

			await assert.isRejected(platformController.addPlatform({ projectDir, platform, frameworkPath }), errorMessage);
		});
		it(`should respect platform version in package.json's nativescript key for ${platform}`, async () => {
			const version = "2.5.0";

			const injector = createInjector();

			const projectDataService = injector.resolve("projectDataService");
			projectDataService.getNSValue = () => ({ version });

			const platformController: PlatformController = injector.resolve("platformController");
			await platformController.addPlatform({ projectDir, platform });

			const expectedPackageToAdd = `tns-${platform}@${version}`;
			assert.deepEqual(extractedPackageFromPacote, expectedPackageToAdd);
		});
		it(`should install latest platform if no information found in package.json's nativescript key for ${platform}`, async () => {
			const injector = createInjector();

			const projectDataService = injector.resolve("projectDataService");
			projectDataService.getNSValue = () => <any>null;

			const platformController: PlatformController = injector.resolve("platformController");
			await platformController.addPlatform({ projectDir, platform });

			const expectedPackageToAdd = `tns-${platform}@${latestFrameworkVersion}`;
			assert.deepEqual(extractedPackageFromPacote, expectedPackageToAdd);
		});
	});
});
