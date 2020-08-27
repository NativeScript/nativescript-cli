import { InjectorStub, PacoteServiceStub, TempServiceStub } from "../stubs";
import { PlatformController } from "../../lib/controllers/platform-controller";
import { AddPlatformService } from "../../lib/services/platform/add-platform-service";
import { assert } from "chai";
import { format } from "util";
import * as _ from 'lodash';
import { AddPlaformErrors } from "../../lib/constants";
import { PackageManager } from "../../lib/package-manager";
import { NodePackageManager } from "../../lib/node-package-manager";
import { YarnPackageManager } from "../../lib/yarn-package-manager";
import { PnpmPackageManager } from "../../lib/pnpm-package-manager";

let actualMessage: string = null;
const latestFrameworkVersion = "5.3.1";
// let extractedPackageFromPacote: string = null;

function createInjector(data?: { latestFrameworkVersion: string }) {
	const version = (data && data.latestFrameworkVersion) || latestFrameworkVersion;

	const injector = new InjectorStub();
	injector.register("platformController", PlatformController);
	injector.register("addPlatformService", AddPlatformService);
	injector.register("pacoteService", PacoteServiceStub);
	injector.register("analyticsService", {
		trackEventActionInGoogleAnalytics: () => ({})
  });
  injector.register("packageManager", PackageManager);
  injector.register("npm", NodePackageManager);
  injector.register("yarn", YarnPackageManager);
  injector.register("pnpm", PnpmPackageManager);
  injector.register("userSettingsService", {
		getSettingValue: async (settingName: string): Promise<void> => undefined
	});

	injector.register("pacoteService", {
		extractPackage: async (name: string): Promise<void> => {
      // extractedPackageFromPacote = name;
    }
	});
	injector.register("tempService", TempServiceStub);

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
			name: "should add the platform (tns platform add <platform>@7.0.0)",
			latestFrameworkVersion: "7.0.0"
		},
		{
			name: "should add the latest compatible version (tns platform add <platform>)",
			latestFrameworkVersion,
			getPlatformParam: (platform: string) => `${platform}@${latestFrameworkVersion}`
		},
		{
			name: "should add the platform when --frameworkPath is provided",
			frameworkPath: "/my/path/to/framework.tgz",
			latestFrameworkVersion: "6.5.0"
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
				assert.deepStrictEqual(actualMessage, expectedMessage);
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

    // The following 2 tests are likely no longer needed since devDependencies are used normally now and naturally respect pinned versions or ~ or ^ semver.
		// it(`should respect platform version in package.json's nativescript key for ${platform}`, async () => {
		// 	const version = "2.5.0";

		// 	const injector = createInjector();

		// 	const projectDataService = injector.resolve("projectDataService");
		// 	projectDataService.getNSValue = () => ({ version });

		// 	const platformController: PlatformController = injector.resolve("platformController");
		// 	await platformController.addPlatform({ projectDir, platform });

		// 	const expectedPackageToAdd = `@nativescript/${platform}@${version}`;
		// 	assert.deepStrictEqual(extractedPackageFromPacote, expectedPackageToAdd);
		// });
		// it(`should install latest platform if no information found in package.json's nativescript key for ${platform}`, async () => {
		// 	const injector = createInjector();

		// 	const projectDataService = injector.resolve("projectDataService");
		// 	projectDataService.getNSValue = () => <any>null;

		// 	const platformController: PlatformController = injector.resolve("platformController");
		// 	await platformController.addPlatform({ projectDir, platform });

		// 	const expectedPackageToAdd = `@nativescript/${platform}@${latestFrameworkVersion}`;
		// 	assert.deepStrictEqual(extractedPackageFromPacote, expectedPackageToAdd);
		// });
	});
});
