import { Yok } from "../../../yok";
import { SettingsService } from "../../../services/settings-service";
import { assert } from "chai";

const osenv = require("osenv");
const path = require("path");
const originalOsenvHome = osenv.home;
const originalPathResolve = path.resolve;
const originalProcessEnvAppData = process.env.AppData;

interface ITestCase {
	expectedUserAgentName: string;
	expectedProfileDir: string;
	testName: string;
	dataPassedToSetSettings: IConfigurationSettings;
}

describe("settingsService", () => {
	const osenvHome = "homeDir";
	const appDataEnv = "appData";
	const profileDirName = "profileDir";

	before(() => {
		osenv.home = () => osenvHome;
		path.resolve = (p: string) => p;
		process.env.AppData = appDataEnv;
	});

	after(() => {
		osenv.home = originalOsenvHome;
		path.resolve = originalPathResolve;
		process.env.AppData = originalProcessEnvAppData;
	});

	const createTestInjector = (opts?: { userAgentName?: string, isWindows?: boolean }): IInjector => {
		const testInjector = new Yok();
		testInjector.register("staticConfig", {
			USER_AGENT_NAME: opts && opts.userAgentName || "userAgentName",
			PROFILE_DIR_NAME: profileDirName
		});

		testInjector.register("hostInfo", {
			isWindows: opts && _.has(opts, "isWindows") ? opts.isWindows : true
		});

		return testInjector;
	};

	const getExpectedProfileDir = (opts: { isWindows: boolean } = { isWindows: true }) => {
		const defaultProfileDirLocation = opts.isWindows ? appDataEnv : path.join(osenvHome, ".local", "share");
		return path.join(defaultProfileDirLocation, profileDirName);
	};

	describe("sets the profileDir to its default value", () => {
		_.each([true, false], isWindows => {
			it(`when os is ${isWindows ? "" : "not "}Windows`, () => {
				const testInjector = createTestInjector();
				const hostInfo = testInjector.resolve<IHostInfo>("hostInfo");
				hostInfo.isWindows = isWindows;

				const settingsService = testInjector.resolve<ISettingsService>(SettingsService);
				const actualProfileDir = settingsService.getProfileDir();
				const expectedProfileDir = getExpectedProfileDir({ isWindows });
				assert.equal(actualProfileDir, expectedProfileDir);
			});
		});
	});

	describe("setSettings", () => {
		const defaultUserAgentName = "defaultUserAgentName";
		const customUserAgentName = "customUserAgentName";
		const customProfileDir = "customProfileDir";

		const testData: ITestCase[] = [
			{
				expectedUserAgentName: defaultUserAgentName,
				expectedProfileDir: getExpectedProfileDir(),
				testName: "does not fail when nothing is passed",
				dataPassedToSetSettings: null
			},
			{
				expectedUserAgentName: customUserAgentName,
				expectedProfileDir: customProfileDir,
				testName: "sets both userAgentName and profileDir when they are passed",
				dataPassedToSetSettings: { userAgentName: customUserAgentName, profileDir: customProfileDir }
			},
			{
				expectedUserAgentName: customUserAgentName,
				expectedProfileDir: getExpectedProfileDir(),
				testName: "sets only userAgentName when its the only passed value",
				dataPassedToSetSettings: { userAgentName: customUserAgentName }
			},
			{
				expectedUserAgentName: defaultUserAgentName,
				expectedProfileDir: customProfileDir,
				testName: "sets only profileDir when its the only passed value",
				dataPassedToSetSettings: { profileDir: customProfileDir }
			},
		];

		_.each(testData, testCase => {
			it(testCase.testName, () => {
				const testInjector = createTestInjector();
				const staticConfig = testInjector.resolve<Config.IStaticConfig>("staticConfig");
				staticConfig.USER_AGENT_NAME = defaultUserAgentName;

				const settingsService = testInjector.resolve<ISettingsService>(SettingsService);
				settingsService.setSettings(testCase.dataPassedToSetSettings);

				const actualProfileDir = settingsService.getProfileDir();
				assert.equal(actualProfileDir, testCase.expectedProfileDir);
				assert.equal(staticConfig.USER_AGENT_NAME, testCase.expectedUserAgentName);
			});
		});
	});
});
