import {assert} from "chai";
import * as ConfigLib from "../lib/config";
import * as ErrorsLib from "../lib/common/errors";
import * as FsLib from "../lib/common/file-system";
import * as HostInfoLib from "../lib/common/host-info";
import * as LoggerLib from "../lib/common/logger";
import * as NpmInstallationManagerLib from "../lib/npm-installation-manager";
import * as OptionsLib from "../lib/options";
import * as StaticConfigLib from "../lib/config";
import Future = require("fibers/future");
import * as yok from "../lib/common/yok";
import ChildProcessLib = require("../lib/common/child-process");

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();

	testInjector.register("config", ConfigLib.Configuration);
	testInjector.register("logger", LoggerLib.Logger);
	testInjector.register("lockfile", { });
	testInjector.register("errors", ErrorsLib.Errors);
	testInjector.register("options", OptionsLib.Options);
	testInjector.register("fs", FsLib.FileSystem);
	testInjector.register("hostInfo", HostInfoLib.HostInfo);
	testInjector.register("staticConfig", StaticConfigLib.StaticConfig);
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);

	testInjector.register("npmInstallationManager", NpmInstallationManagerLib.NpmInstallationManager);

	return testInjector;
}

function mockNpm(testInjector: IInjector, versions: string[], latestVersion: string) {
	testInjector.register("npm", {
		view: (packageName: string, config: any) => {
			return(() => {
				if(config.versions) {
					return versions;
				}

				throw new Error(`Unable to find propertyName ${config}.`);
			}).future<any>()();
		}
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
	 * Expected result
	 */
	expectedResult: string;
}

describe("Npm installation manager tests", () => {
	let testData: IDictionary<ITestData> = {
		"when there's only one available version and it matches CLI's version":	{
			versions: ["1.4.0"],
			packageLatestVersion: "1.4.0",
			cliVersion: "1.4.0",
			expectedResult: "1.4.0"
		},

		"when there's only one available version and it is higher than match CLI's version":	{
			versions: ["1.4.0"],
			packageLatestVersion: "1.4.0",
			cliVersion: "1.2.0",
			expectedResult: "1.4.0"
		},

		"when there's only one available version and it is lower than CLI's version":	{
			versions: ["1.4.0"],
			packageLatestVersion: "1.4.0",
			cliVersion: "1.6.0",
			expectedResult: "1.4.0"
		},

		"when there are multiple package versions and the latest one matches ~<cli-version>":{
			versions: ["1.2.0", "1.3.0", "1.3.1", "1.3.2", "1.3.3", "1.4.0"],
			packageLatestVersion: "1.3.3",
			cliVersion: "1.3.0",
			expectedResult: "1.3.3"
		},

		"when there are multiple package versions and the latest one matches ~<cli-version> when there are newer matching versions but they are not under latest tag":{
			versions: ["1.2.0", "1.3.0", "1.3.1", "1.3.2", "1.3.3", "1.4.0"],
			packageLatestVersion: "1.3.2",
			cliVersion: "1.3.0",
			expectedResult: "1.3.2"
		},

		"when there are multiple package versions and the latest one is lower than ~<cli-version>": {
			versions: ["1.2.0", "1.3.0", "1.3.1", "1.3.2", "1.3.3", "1.4.0"],
			packageLatestVersion: "1.4.0",
			cliVersion: "1.5.0",
			expectedResult: "1.4.0"
		},

		"when there are multiple package versions and there's beta version matching CLI's semver": {
			versions: ["1.2.0", "1.3.0", "1.3.1", "1.4.0", "1.5.0-2016-02-25-182"],
			packageLatestVersion: "1.4.0",
			cliVersion: "1.5.0",
			expectedResult: "1.4.0"
		},

		"when there are multiple package versions and package's latest version is greater than CLI's version": {
			versions: ["1.2.0", "1.3.0", "1.3.1", "1.4.0", "1.5.0-2016-02-25-182", "1.5.0", "1.6.0"],
			packageLatestVersion: "1.6.0",
			cliVersion: "1.5.0",
			expectedResult: "1.5.0"
		},

		"when there are multiple versions latest one does not match CLI's semver and other versions are not matching either": {
			versions: ["1.0.0", "1.0.1", "1.2.0", "1.3.1", "1.4.0", "1.5.0-2016-02-25-182", "1.5.0"],
			packageLatestVersion: "1.0.0",
			cliVersion: "1.1.0",
			expectedResult: "1.0.0"
		},

		"when CLI's version is beta (has dash) latest matching beta version is returned": {
			versions: ["1.0.0", "1.0.1", "1.4.0", "1.5.0-2016-02-25-182", "1.5.0-2016-02-26-202"],
			packageLatestVersion: "1.4.0",
			cliVersion: "1.5.0-182",
			expectedResult: "1.5.0-2016-02-26-202"
		},

		"when CLI's version is beta (has dash) latest matching official version is returned when beta versions do not match": {
			versions: ["1.0.0", "1.0.1", "1.4.0", "1.5.0-2016-02-25-182", "1.5.0-2016-02-26-202"],
			packageLatestVersion: "1.4.0",
			cliVersion: "1.6.0-2016-03-01-182",
			expectedResult: "1.4.0"
		},

		"when CLI's version is beta (has dash) latest matching official version is returned when beta versions do not match (when the prerelease of CLI is higher than prerelease version of runtime)": {
			versions: ["1.0.0", "1.0.1", "1.4.0", "1.6.0-2016-02-25-182", "1.6.0-2016-02-26-202"],
			packageLatestVersion: "1.4.0",
			cliVersion: "1.6.0-2016-10-01-182",
			expectedResult: "1.4.0"
		}
	};

	_.each(testData, (currentTestData: ITestData, testName: string) => {
		it(`returns correct latest compatible version, ${testName}`, () => {
			let testInjector = createTestInjector();

			mockNpm(testInjector, currentTestData.versions, currentTestData.packageLatestVersion);

			// Mock staticConfig.version
			let staticConfig = testInjector.resolve("staticConfig");
			staticConfig.version = currentTestData.cliVersion;

			// Mock npmInstallationManager.getLatestVersion
			let npmInstallationManager = testInjector.resolve("npmInstallationManager");
			npmInstallationManager.getLatestVersion = (packageName: string) => Future.fromResult(currentTestData.packageLatestVersion);

			let actualLatestCompatibleVersion = npmInstallationManager.getLatestCompatibleVersion("").wait();
			assert.equal(actualLatestCompatibleVersion, currentTestData.expectedResult);
		});
	});
});
