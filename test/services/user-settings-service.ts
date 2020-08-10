import { Yok } from "../../lib/common/yok";
import { UserSettingsService } from "../../lib/services/user-settings-service";
import { assert } from "chai";
import * as path from "path";
import { IInjector } from "../../lib/common/definitions/yok";

class JsonFileSettingsServiceMock {
	constructor(public jsonFileSettingsPath: string) { }
}

describe("userSettingsService", () => {
	const profileDir = "my-profile-dir";
	const expectedJsonFileSettingsFilePath = path.join(profileDir, "user-settings.json");

	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("settingsService", {
			getProfileDir: () => profileDir
		});

		testInjector.register("jsonFileSettingsService", JsonFileSettingsServiceMock);
		testInjector.register("userSettingsService", UserSettingsService);
		return testInjector;
	};

	const testCases = [
		{
			methodName: "getSettingValue",
			input: ["settingName"],
			expectedArgs: [
				"settingName",
				undefined
			]
		},
		{
			methodName: "saveSetting",
			input: ["settingName", "settingValue"],
			expectedArgs: [
				"settingName",
				"settingValue",
				undefined
			]
		},
		{
			methodName: "saveSettings",
			input: [{ value: { subValue: 1 } }],
			expectedArgs: [
				{ value: { subValue: 1 } },
				undefined
			]
		},
		{
			methodName: "removeSetting",
			input: ["settingName"],
			expectedArgs: [
				"settingName"
			]
		},
		{
			methodName: "loadUserSettingsFile",
			input: [],
			expectedArgs: []
		}
	];

	for (const testCase of testCases) {
		it(`calls ${testCase.methodName} method of jsonFileSettingsService with correct args`, async () => {
			const testInjector = createTestInjector();
			const dataPassedToJsonFileSettingsService: any[] = [];
			const userSettingsService = testInjector.resolve("userSettingsService");
			const jsonFileSettingsService = userSettingsService.$jsonFileSettingsService;

			jsonFileSettingsService[testCase.methodName] = async (...args: any[]): Promise<void> => {
				dataPassedToJsonFileSettingsService.push(...args);
			};

			await userSettingsService[testCase.methodName](...testCase.input);

			assert.deepEqual(dataPassedToJsonFileSettingsService, testCase.expectedArgs);
			assert.equal(jsonFileSettingsService.jsonFileSettingsPath, expectedJsonFileSettingsFilePath);
		});
	}
});
