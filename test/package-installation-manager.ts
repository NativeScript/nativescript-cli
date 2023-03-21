import { assert } from "chai";
import * as ConfigLib from "../lib/config";
import * as ErrorsLib from "../lib/common/errors";
import * as FsLib from "../lib/common/file-system";
import * as HostInfoLib from "../lib/common/host-info";
import * as LoggerLib from "../lib/common/logger/logger";
import * as NpmLib from "../lib/node-package-manager";
import * as YarnLib from "../lib/yarn-package-manager";
import * as PnpmLib from "../lib/pnpm-package-manager";
import * as PackageManagerLib from "../lib/package-manager";
import * as PackageInstallationManagerLib from "../lib/package-installation-manager";
import * as OptionsLib from "../lib/options";
import * as StaticConfigLib from "../lib/config";
import * as yok from "../lib/common/yok";
import * as ChildProcessLib from "../lib/common/child-process";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";
import { ProjectDataService } from "../lib/services/project-data-service";
import { ProjectConfigServiceStub, ProjectDataStub } from "./stubs";
import { IInjector } from "../lib/common/definitions/yok";
import * as _ from "lodash";
import { IDictionary } from "../lib/common/declarations";

function createTestInjector(): IInjector {
	const testInjector = new yok.Yok();

	testInjector.register("projectData", ProjectDataStub);
	testInjector.register("config", ConfigLib.Configuration);
	testInjector.register("logger", LoggerLib.Logger);
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("fs", FsLib.FileSystem);
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	testInjector.register("settingsService", SettingsService);
	testInjector.register("projectDataService", ProjectDataService);
	testInjector.register("devicePlatformsConstants", {});
	testInjector.register("androidResourcesMigrationService", {});

	testInjector.register("httpClient", {});
	testInjector.register("pacoteService", {
		manifest: () => Promise.resolve(),
	});
	testInjector.register("userSettingsService", {
		getSettingValue: async (settingName: string): Promise<void> => undefined,
	});
	testInjector.register("npm", NpmLib.NodePackageManager);
	testInjector.register("yarn", YarnLib.YarnPackageManager);
	testInjector.register("pnpm", PnpmLib.PnpmPackageManager);
	testInjector.register("packageManager", PackageManagerLib.PackageManager);
	testInjector.register("projectConfigService", ProjectConfigServiceStub);
	testInjector.register(
		"packageInstallationManager",
		PackageInstallationManagerLib.PackageInstallationManager
	);

	return testInjector;
}

function mockNpm(
	testInjector: IInjector,
	versions: string[],
	latestVersion: string
) {
	testInjector.register("npm", {
		view: async (packageName: string, config: any): Promise<string[]> => {
			if (config.versions) {
				return versions;
			}

			throw new Error(`Unable to find propertyName ${config}.`);
		},
	});
}

interface ITestData {
	/**
	 * All versions of the package, including the ones from another tags.
	 */
	versions: string[];

	/**
	 * The version under latest tag.
	 */
	packageLatestVersion: string;

	/**
	 * Version of nativescript-cli, based on which the version of the package that will be installed is detected.
	 */
	cliVersion: string;

	/**
	 * Version, based on which the version of the package that will be installed is detected.
	 * Used when semantically the correct reference version is different than the CLI version.
	 * (e.g. inspector package version should be determined by the project's ios runtime version)
	 */
	referenceVersion?: string;

	/**
	 * Expected result
	 */
	expectedResult: string;
}

describe("Npm installation manager tests", () => {
	describe("getLatestCompatibleVersion", () => {
		const testData: IDictionary<ITestData> = {
			"when there's only one available version and it matches CLI's version": {
				versions: ["1.4.0"],
				packageLatestVersion: "1.4.0",
				cliVersion: "1.4.0",
				expectedResult: "1.4.0",
			},

			"when there's only one available version and it is higher than match CLI's version": {
				versions: ["1.4.0"],
				packageLatestVersion: "1.4.0",
				cliVersion: "1.2.0",
				expectedResult: "1.4.0",
			},

			"when there's only one available version and it is lower than CLI's version": {
				versions: ["1.4.0"],
				packageLatestVersion: "1.4.0",
				cliVersion: "1.6.0",
				expectedResult: "1.4.0",
			},

			"when there are multiple package versions and the latest one matches ~<cli-version>": {
				versions: ["1.2.0", "1.3.0", "1.3.1", "1.3.2", "1.3.3", "1.4.0"],
				packageLatestVersion: "1.3.3",
				cliVersion: "1.3.0",
				expectedResult: "1.3.3",
			},

			"when there are multiple package versions and the latest one matches ~<cli-version> when there are newer matching versions but they are not under latest tag": {
				versions: ["1.2.0", "1.3.0", "1.3.1", "1.3.2", "1.3.3", "1.4.0"],
				packageLatestVersion: "1.3.2",
				cliVersion: "1.3.0",
				expectedResult: "1.3.2",
			},

			"when there are multiple package versions and the latest one is lower than ~<cli-version>": {
				versions: ["1.2.0", "1.3.0", "1.3.1", "1.3.2", "1.3.3", "1.4.0"],
				packageLatestVersion: "1.4.0",
				cliVersion: "1.5.0",
				expectedResult: "1.4.0",
			},

			"when there are multiple package versions and there's beta version matching CLI's semver": {
				versions: ["1.2.0", "1.3.0", "1.3.1", "1.4.0", "1.5.0-2016-02-25-182"],
				packageLatestVersion: "1.4.0",
				cliVersion: "1.5.0",
				expectedResult: "1.4.0",
			},

			"when there are multiple package versions and package's latest version is greater than CLI's version": {
				versions: [
					"1.2.0",
					"1.3.0",
					"1.3.1",
					"1.4.0",
					"1.5.0-2016-02-25-182",
					"1.5.0",
					"1.6.0",
				],
				packageLatestVersion: "1.6.0",
				cliVersion: "1.5.0",
				expectedResult: "1.5.0",
			},

			"when there are multiple versions latest one does not match CLI's semver and other versions are not matching either": {
				versions: [
					"1.0.0",
					"1.0.1",
					"1.2.0",
					"1.3.1",
					"1.4.0",
					"1.5.0-2016-02-25-182",
					"1.5.0",
				],
				packageLatestVersion: "1.0.0",
				cliVersion: "1.1.0",
				expectedResult: "1.0.0",
			},

			"when CLI's version is beta (has dash) latest matching beta version is returned": {
				versions: [
					"1.0.0",
					"1.0.1",
					"1.4.0",
					"1.5.0-2016-02-25-182",
					"1.5.0-2016-02-26-202",
				],
				packageLatestVersion: "1.4.0",
				cliVersion: "1.5.0-182",
				expectedResult: "1.5.0-2016-02-26-202",
			},

			"when CLI's version is beta (has dash) latest matching official version is returned when beta versions do not match": {
				versions: [
					"1.0.0",
					"1.0.1",
					"1.4.0",
					"1.5.0-2016-02-25-182",
					"1.5.0-2016-02-26-202",
				],
				packageLatestVersion: "1.4.0",
				cliVersion: "1.6.0-2016-03-01-182",
				expectedResult: "1.4.0",
			},

			"when CLI's version is beta (has dash) latest matching official version is returned when beta versions do not match (when the prerelease of CLI is higher than prerelease version of runtime)": {
				versions: [
					"1.0.0",
					"1.0.1",
					"1.4.0",
					"1.6.0-2016-02-25-182",
					"1.6.0-2016-02-26-202",
				],
				packageLatestVersion: "1.4.0",
				cliVersion: "1.6.0-2016-10-01-182",
				expectedResult: "1.4.0",
			},
			"When CLI Version has patch version larger than an existing package, should return max compliant package from the same major.minor version": {
				versions: [
					"1.0.0",
					"1.0.1",
					"1.4.0",
					"2.5.0",
					"2.5.1",
					"2.5.2",
					"3.0.0",
				],
				packageLatestVersion: "3.0.0",
				cliVersion: "2.5.4",
				expectedResult: "2.5.2",
			},
			"When reference version is specified as argument": {
				versions: ["122.0.4", "123.0.0", "123.0.1", "123.1.0", "124.0.0"],
				packageLatestVersion: "124.0.0",
				cliVersion: "0.0.0", // should not matter
				expectedResult: "123.0.1",
				referenceVersion: "123.0.5",
			},
		};

		_.each(testData, (currentTestData: ITestData, testName: string) => {
			it(`returns correct latest compatible version, ${testName}`, async () => {
				const testInjector = createTestInjector();

				mockNpm(
					testInjector,
					currentTestData.versions,
					currentTestData.packageLatestVersion
				);

				// Mock staticConfig.version
				const staticConfig = testInjector.resolve("staticConfig");
				staticConfig.version = currentTestData.cliVersion;

				// Mock packageInstallationManager.getLatestVersion
				const packageInstallationManager = testInjector.resolve(
					"packageInstallationManager"
				);
				packageInstallationManager.getLatestVersion = (packageName: string) =>
					Promise.resolve(currentTestData.packageLatestVersion);

				const actualLatestCompatibleVersion = await packageInstallationManager.getLatestCompatibleVersion(
					"",
					currentTestData.referenceVersion
				);
				assert.equal(
					actualLatestCompatibleVersion,
					currentTestData.expectedResult
				);
			});
		});
	});
});
