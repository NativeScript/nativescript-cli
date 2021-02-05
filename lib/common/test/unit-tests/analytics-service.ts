import { CommonLoggerStub, ErrorsStub } from "./stubs";
import { Yok } from "../../yok";
import { AnalyticsService } from "../../../services/analytics/analytics-service";
import { setIsInteractive } from "../../helpers";
import { HostInfo } from "../../host-info";
import { OsInfo } from "../../os-info";
import { IInjector } from "../../definitions/yok";
import { IAnalyticsService } from "../../declarations";
const assert = require("chai").assert;

let savedSettingNamesAndValues = "";

class UserSettingsServiceStub {
	constructor(
		public featureTracking: boolean,
		public exceptionsTracking: boolean,
		public testInjector: IInjector
	) {}

	async getSettingValue<T>(settingName: string): Promise<T | string> {
		const $staticConfig: Config.IStaticConfig = this.testInjector.resolve(
			"staticConfig"
		);

		if (settingName === $staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME) {
			return this.featureTracking !== undefined
				? this.featureTracking.toString()
				: undefined;
		} else if (settingName === $staticConfig.ERROR_REPORT_SETTING_NAME) {
			return this.exceptionsTracking !== undefined
				? this.exceptionsTracking.toString()
				: undefined;
		}
		return undefined;
	}

	async saveSetting<T>(key: string, value: T): Promise<void> {
		savedSettingNamesAndValues += `${key}.${value}`;
	}
}

interface ITestScenario {
	canDoRequest: boolean;
	prompterConfirmResult: boolean;
	isInteractive: boolean;
	featureTracking: boolean;
	exceptionsTracking: boolean;
	shouldSetUserThrowException: boolean;
	shouldStartThrow: boolean;
}

function createTestInjector(testScenario: ITestScenario): IInjector {
	const testInjector = new Yok();

	testInjector.register("logger", CommonLoggerStub);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("analyticsService", AnalyticsService);
	testInjector.register("analyticsSettingsService", {
		canDoRequest: () => {
			return Promise.resolve(testScenario.canDoRequest);
		},
		getClientName: () => {
			return "UnitTests";
		},
		getUserId: () => {
			return Promise.resolve("UnitTestsUserId");
		},
		getClientId: () => {
			return Promise.resolve("UnitTestsUserId");
		},
		getUserSessionsCount: () => Promise.resolve(0),
		setUserSessionsCount: (count: number) => Promise.resolve(),
	});

	testInjector.register("options", {
		analyticsClient: null,
	});
	testInjector.register("prompter", {
		confirm: (messageToUser: string, defaultAction?: () => boolean) => {
			return Promise.resolve(testScenario.prompterConfirmResult);
		},
	});
	testInjector.register("staticConfig", {
		ERROR_REPORT_SETTING_NAME: "TrackExceptions",
		TRACK_FEATURE_USAGE_SETTING_NAME: "TrackFeatureUsage",
		CLIENT_NAME: "common-lib",
		ANALYTICS_API_KEY: "AnalyticsAPIKey",
		ANALYTICS_EXCEPTIONS_API_KEY: "AnalyticsExceptionsAPIKey",
	});
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("osInfo", OsInfo);
	testInjector.register(
		"userSettingsService",
		new UserSettingsServiceStub(
			testScenario.featureTracking,
			testScenario.exceptionsTracking,
			testInjector
		)
	);
	setIsInteractive(() => {
		return testScenario.isInteractive;
	});
	testInjector.register("childProcess", {});
	testInjector.register("projectDataService", {});
	testInjector.register("mobileHelper", {});
	testInjector.register("projectHelper", {
		projectDir: "",
	});

	return testInjector;
}

describe("analytics-service", () => {
	let baseTestScenario: ITestScenario;
	let service: IAnalyticsService = null;

	beforeEach(() => {
		baseTestScenario = {
			canDoRequest: true,
			featureTracking: true,
			exceptionsTracking: true,
			isInteractive: true,
			prompterConfirmResult: true,
			shouldSetUserThrowException: false,
			shouldStartThrow: false,
		};
		savedSettingNamesAndValues = "";

		service = null;
	});

	after(() => {
		setIsInteractive(null);
	});

	describe("isEnabled", () => {
		it("returns true when analytics status is enabled", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.isTrue(
				await service.isEnabled(staticConfig.ERROR_REPORT_SETTING_NAME)
			);
			assert.isTrue(
				await service.isEnabled(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME)
			);
		});

		it("returns false when analytics status is disabled", async () => {
			baseTestScenario.exceptionsTracking = baseTestScenario.featureTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.isFalse(
				await service.isEnabled(staticConfig.ERROR_REPORT_SETTING_NAME)
			);
			assert.isFalse(
				await service.isEnabled(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME)
			);
		});

		it("returns false when analytics status is notConfirmed", async () => {
			baseTestScenario.exceptionsTracking = baseTestScenario.featureTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.isFalse(
				await service.isEnabled(staticConfig.ERROR_REPORT_SETTING_NAME)
			);
			assert.isFalse(
				await service.isEnabled(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME)
			);
		});
	});

	describe("setStatus", () => {
		it("sets correct status", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			await service.setStatus(
				staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME,
				false
			);
			assert.isTrue(
				savedSettingNamesAndValues.indexOf(
					`${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.false`
				) !== -1
			);
		});
	});

	describe("getStatusMessage", () => {
		it("returns correct string results when status is enabled", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			const expectedMsg = "Expected result";
			assert.equal(
				`${expectedMsg} is enabled.`,
				await service.getStatusMessage(
					staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME,
					false,
					expectedMsg
				)
			);
		});

		it("returns correct string results when status is disabled", async () => {
			baseTestScenario.featureTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			const expectedMsg = "Expected result";
			assert.equal(
				`${expectedMsg} is disabled.`,
				await service.getStatusMessage(
					staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME,
					false,
					expectedMsg
				)
			);
		});

		it("returns correct string results when status is not confirmed", async () => {
			baseTestScenario.featureTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			const expectedMsg = "Expected result";
			assert.equal(
				`${expectedMsg} is disabled until confirmed.`,
				await service.getStatusMessage(
					staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME,
					false,
					expectedMsg
				)
			);
		});

		it("returns correct json results when status is enabled", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.deepStrictEqual(
				JSON.stringify({ enabled: true }),
				await service.getStatusMessage(
					staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME,
					true,
					""
				)
			);
		});

		it("returns correct json results when status is disabled", async () => {
			baseTestScenario.featureTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.deepStrictEqual(
				JSON.stringify({ enabled: false }),
				await service.getStatusMessage(
					staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME,
					true,
					""
				)
			);
		});

		it("returns correct json results when status is not confirmed", async () => {
			baseTestScenario.featureTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.deepStrictEqual(
				JSON.stringify({ enabled: null }),
				await service.getStatusMessage(
					staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME,
					true,
					""
				)
			);
		});
	});

	describe("checkConsent", () => {
		it("enables feature tracking when user confirms", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.exceptionsTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.isTrue(
				savedSettingNamesAndValues.indexOf(
					`${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.true`
				) !== -1
			);
		});

		it("enables exception tracking when user confirms feature tracking and exception tracking is not set before that", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.exceptionsTracking = undefined;
			baseTestScenario.prompterConfirmResult = true;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.isTrue(
				savedSettingNamesAndValues.indexOf(
					`${staticConfig.ERROR_REPORT_SETTING_NAME}.true`
				) !== -1
			);
		});

		it("disables feature tracking user confirms", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.prompterConfirmResult = false;
			baseTestScenario.exceptionsTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.isTrue(
				savedSettingNamesAndValues.indexOf(
					`${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.false`
				) !== -1
			);
		});

		it("disables exception tracking when user rejects feature tracking and exception tracking is not set before that", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.exceptionsTracking = undefined;
			baseTestScenario.prompterConfirmResult = false;

			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve(
				"staticConfig"
			);
			assert.isTrue(
				savedSettingNamesAndValues.indexOf(
					`${staticConfig.ERROR_REPORT_SETTING_NAME}.false`
				) !== -1
			);
		});

		[false, true].forEach((featureTrackingValue) => {
			it(`sets exception tracking to feature tracking's value when the first one is not set, but feature tracking is set to ${featureTrackingValue}`, async () => {
				baseTestScenario.featureTracking = featureTrackingValue;
				baseTestScenario.exceptionsTracking = undefined;
				const testInjector = createTestInjector(baseTestScenario);
				service = testInjector.resolve<IAnalyticsService>("analyticsService");
				await service.checkConsent();
				const staticConfig: Config.IStaticConfig = testInjector.resolve(
					"staticConfig"
				);
				assert.isTrue(
					savedSettingNamesAndValues.indexOf(
						`${staticConfig.ERROR_REPORT_SETTING_NAME}.${featureTrackingValue}`
					) !== -1
				);
			});
		});

		it("does nothing when exception and feature tracking are already set", async () => {
			baseTestScenario.featureTracking = baseTestScenario.exceptionsTracking = true;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			assert.deepStrictEqual(savedSettingNamesAndValues, "");
		});

		it("does nothing when cannot make request", async () => {
			baseTestScenario.canDoRequest = false;
			baseTestScenario.featureTracking = baseTestScenario.exceptionsTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			assert.deepStrictEqual(savedSettingNamesAndValues, "");
		});

		it("does nothing when values are not set and console is not interactive", async () => {
			baseTestScenario.isInteractive = false;
			baseTestScenario.featureTracking = baseTestScenario.exceptionsTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			assert.deepStrictEqual(savedSettingNamesAndValues, "");
		});
	});
});
