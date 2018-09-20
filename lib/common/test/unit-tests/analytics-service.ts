import { CommonLoggerStub, ErrorsStub } from "./stubs";
import { Yok } from "../../yok";
import { AnalyticsServiceBase } from '../../services/analytics-service-base';
import helpersLib = require("../../helpers");
import { HostInfo } from "../../host-info";
import { OsInfo } from "../../os-info";
require("../../vendor/EqatecMonitor.min"); // note - it modifies global scope!
const assert = require("chai").assert;
const cliGlobal = <ICliGlobal>global;
const originalEqatec = cliGlobal._eqatec;
const originalIsInteractive = helpersLib.isInteractive;
const exception = "Exception";
const message = "Track Exception Msg";

let trackedFeatureNamesAndValues: string[] = [];
let savedSettingNamesAndValues = "";
let trackedExceptionMessages: string[] = [];
let lastUsedEqatecSettings: IEqatecSettings;
let usedEqatecSettings: IEqatecSettings[] = [];
let apiKeysPassedToCreateEqatecSettings: string[] = [];
let isEqatecStopCalled = false;
let startCalledCount = 0;

class AnalyticsServiceInheritor extends AnalyticsServiceBase {
	public featureTrackingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_API_KEY
	];

	public acceptUsageReportingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_API_KEY
	];

	public exceptionsTrackingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_EXCEPTIONS_API_KEY
	];

	public dispose(): void {
		// nothing to do here
	}
}

function setGlobalEqatec(shouldSetUserThrowException: boolean, shouldStartThrow: boolean): void {
	cliGlobal._eqatec = {
		createSettings: (apiKey: string) => {
			apiKeysPassedToCreateEqatecSettings.push(apiKey);
			return <any>{};
		},
		createMonitor: (settings: any) => {
			lastUsedEqatecSettings = settings;
			usedEqatecSettings.push(settings);

			return {
				trackFeature: (featureNameAndValue: string) => {
					trackedFeatureNamesAndValues.push(featureNameAndValue);
				},
				trackException: (exceptionToTrack: any, messageToTrack: string) => {
					trackedExceptionMessages.push(messageToTrack);
				},
				stop: () => { isEqatecStopCalled = true; },
				setInstallationID: (guid: string) => { /*a mock*/ },
				setUserID: (userId: string) => {
					if (shouldSetUserThrowException) {
						throw new Error("setUserID throws");
					}
				},
				start: () => {
					startCalledCount++;
					if (shouldStartThrow) {
						throw new Error("start throws");
					}
				},
				setStartCount: (count: number) => { /*a mock */ },
				status: () => ({ isSending: false })
			};
		},

	};
}

class UserSettingsServiceStub {
	constructor(public featureTracking: boolean,
		public exceptionsTracking: boolean,
		public testInjector: IInjector) { }

	async getSettingValue<T>(settingName: string): Promise<T | string> {
		const $staticConfig: Config.IStaticConfig = this.testInjector.resolve("staticConfig");

		if (settingName === $staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME) {
			return this.featureTracking !== undefined ? this.featureTracking.toString() : undefined;
		} else if (settingName === $staticConfig.ERROR_REPORT_SETTING_NAME) {
			return this.exceptionsTracking !== undefined ? this.exceptionsTracking.toString() : undefined;
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
	setGlobalEqatec(testScenario.shouldSetUserThrowException, testScenario.shouldStartThrow);

	const testInjector = new Yok();
	testInjector.register("logger", CommonLoggerStub);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("analyticsService", AnalyticsServiceBase);
	testInjector.register("analyticsSettingsService", {
		canDoRequest: () => {
			return Promise.resolve(testScenario.canDoRequest);
		},
		getClientName: () => {
			return "UnitTests";
		},
		getPrivacyPolicyLink: () => {
			return "privacy policy link";
		},
		getUserId: () => {
			return Promise.resolve("UnitTestsUserId");
		},
		getClientId: () => {
			return Promise.resolve("UnitTestsUserId");
		},
		getUserSessionsCount: () => Promise.resolve(0),
		setUserSessionsCount: (count: number) => Promise.resolve()
	});

	testInjector.register("options", {
		analyticsClient: null
	});
	testInjector.register("prompter", {
		confirm: (messageToUser: string, defaultAction?: () => boolean) => {
			return Promise.resolve(testScenario.prompterConfirmResult);
		}
	});
	testInjector.register("staticConfig", {
		ERROR_REPORT_SETTING_NAME: "TrackExceptions",
		TRACK_FEATURE_USAGE_SETTING_NAME: "TrackFeatureUsage",
		CLIENT_NAME: "common-lib",
		ANALYTICS_API_KEY: "AnalyticsAPIKey",
		ANALYTICS_EXCEPTIONS_API_KEY: "AnalyticsExceptionsAPIKey"
	});
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("osInfo", OsInfo);
	testInjector.register("userSettingsService", new UserSettingsServiceStub(testScenario.featureTracking, testScenario.exceptionsTracking, testInjector));
	helpersLib.isInteractive = () => {
		return testScenario.isInteractive;
	};

	testInjector.register("processService", {
		attachToProcessExitSignals: (context: any, callback: () => void): void => (undefined)
	});

	return testInjector;
}

describe("analytics-service-base", () => {
	let baseTestScenario: ITestScenario;
	const featureName = "unit tests feature";
	let service: IAnalyticsService = null;

	beforeEach(() => {
		baseTestScenario = {
			canDoRequest: true,
			featureTracking: true,
			exceptionsTracking: true,
			isInteractive: true,
			prompterConfirmResult: true,
			shouldSetUserThrowException: false,
			shouldStartThrow: false
		};
		trackedFeatureNamesAndValues = [];
		trackedExceptionMessages = [];
		savedSettingNamesAndValues = "";
		isEqatecStopCalled = false;
		lastUsedEqatecSettings = <any>{};
		usedEqatecSettings = [];
		apiKeysPassedToCreateEqatecSettings = [];

		service = null;
		startCalledCount = 0;
	});

	afterEach(() => {
		// clean up the process.exit event handler
		if (service) {
			service.tryStopEqatecMonitors();
		}
	});

	after(() => {
		cliGlobal._eqatec = originalEqatec;
		helpersLib.isInteractive = originalIsInteractive;
	});

	describe("trackFeature", () => {
		it("tracks feature when console is interactive", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackFeature(featureName);
			assert.isTrue(trackedFeatureNamesAndValues.indexOf(`CLI.${featureName}`) !== -1);
			service.tryStopEqatecMonitors();
		});

		it("tracks feature when console is not interactive", async () => {
			baseTestScenario.isInteractive = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackFeature(featureName);
			assert.isTrue(trackedFeatureNamesAndValues.indexOf(`Non-interactive.${featureName}`) !== -1);
			service.tryStopEqatecMonitors();
		});

		it("does not track feature when console is interactive and feature tracking is disabled", async () => {
			baseTestScenario.featureTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackFeature(featureName);
			assert.deepEqual(trackedFeatureNamesAndValues, []);
		});

		it("does not track feature when console is not interactive and feature tracking is disabled", async () => {
			baseTestScenario.featureTracking = baseTestScenario.isInteractive = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackFeature(featureName);
			assert.deepEqual(trackedFeatureNamesAndValues, []);
		});

		it("does not track feature when console is interactive and feature tracking is enabled, but cannot make request", async () => {
			baseTestScenario.canDoRequest = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackFeature(featureName);
			assert.deepEqual(trackedFeatureNamesAndValues, []);
		});

		it("does not track feature when console is not interactive and feature tracking is enabled, but cannot make request", async () => {
			baseTestScenario.canDoRequest = baseTestScenario.isInteractive = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackFeature(featureName);
			assert.deepEqual(trackedFeatureNamesAndValues, []);
		});

		it("does not throw exception when eqatec start throws", async () => {
			baseTestScenario.shouldStartThrow = true;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackFeature(featureName);
			assert.deepEqual(trackedFeatureNamesAndValues, []);
		});
	});

	describe("trackException", () => {
		it("tracks when all conditions are correct", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackException(exception, message);
			assert.isTrue(trackedExceptionMessages.indexOf(message) !== -1);
		});

		it("does not track when exception tracking is disabled", async () => {
			baseTestScenario.exceptionsTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackException(exception, message);
			assert.deepEqual(trackedExceptionMessages, []);
		});

		it("does not track when feature tracking is enabled, but cannot make request", async () => {
			baseTestScenario.canDoRequest = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackException(exception, message);
			assert.deepEqual(trackedExceptionMessages, []);
		});

		it("does not throw exception when eqatec start throws", async () => {
			baseTestScenario.shouldStartThrow = true;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.trackException(exception, message);
			assert.deepEqual(trackedExceptionMessages, []);
		});
	});

	describe("track", () => {
		const name = "unitTests";
		it("tracks when all conditions are correct", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.track(name, featureName);
			assert.isTrue(trackedFeatureNamesAndValues.indexOf(`${name}.${featureName}`) !== -1);
		});

		it("does not track when feature tracking is disabled", async () => {
			baseTestScenario.featureTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.track(name, featureName);
			assert.deepEqual(trackedFeatureNamesAndValues, []);
		});

		it("does not track when feature tracking is enabled, but cannot make request", async () => {
			baseTestScenario.canDoRequest = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.track(name, featureName);
			assert.deepEqual(trackedFeatureNamesAndValues, []);
		});

		it("does not throw exception when eqatec start throws", async () => {
			baseTestScenario.shouldStartThrow = true;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.track(name, featureName);
			assert.deepEqual(trackedFeatureNamesAndValues, []);
		});
	});

	describe("isEnabled", () => {
		it("returns true when analytics status is enabled", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.isTrue(await service.isEnabled(staticConfig.ERROR_REPORT_SETTING_NAME));
			assert.isTrue(await service.isEnabled(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME));
		});

		it("returns false when analytics status is disabled", async () => {
			baseTestScenario.exceptionsTracking = baseTestScenario.featureTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.isFalse(await service.isEnabled(staticConfig.ERROR_REPORT_SETTING_NAME));
			assert.isFalse(await service.isEnabled(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME));
		});

		it("returns false when analytics status is notConfirmed", async () => {
			baseTestScenario.exceptionsTracking = baseTestScenario.featureTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.isFalse(await service.isEnabled(staticConfig.ERROR_REPORT_SETTING_NAME));
			assert.isFalse(await service.isEnabled(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME));
		});
	});

	describe("setStatus", () => {
		it("sets correct status", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			await service.setStatus(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, false);
			assert.isTrue(savedSettingNamesAndValues.indexOf(`${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.false`) !== -1);
		});

		it("calls eqatec stop when all analytics trackings are disabled", async () => {
			baseTestScenario.exceptionsTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			// start eqatec
			await service.trackFeature(featureName);
			assert.isTrue(trackedFeatureNamesAndValues.indexOf(`CLI.${featureName}`) !== -1);
			await service.setStatus(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, false);
			assert.isTrue(savedSettingNamesAndValues.indexOf(`${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.false`) !== -1);
			assert.isTrue(isEqatecStopCalled);
		});

	});

	describe("getStatusMessage", () => {
		it("returns correct string results when status is enabled", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			const expectedMsg = "Expected result";
			assert.equal(`${expectedMsg} is enabled.`, await service.getStatusMessage(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, false, expectedMsg));
		});

		it("returns correct string results when status is disabled", async () => {
			baseTestScenario.featureTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			const expectedMsg = "Expected result";
			assert.equal(`${expectedMsg} is disabled.`, await service.getStatusMessage(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, false, expectedMsg));
		});

		it("returns correct string results when status is not confirmed", async () => {
			baseTestScenario.featureTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			const expectedMsg = "Expected result";
			assert.equal(`${expectedMsg} is disabled until confirmed.`, await service.getStatusMessage(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, false, expectedMsg));
		});

		it("returns correct json results when status is enabled", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.deepEqual(JSON.stringify({ "enabled": true }), await service.getStatusMessage(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, true, ""));
		});

		it("returns correct json results when status is disabled", async () => {
			baseTestScenario.featureTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.deepEqual(JSON.stringify({ "enabled": false }), await service.getStatusMessage(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, true, ""));
		});

		it("returns correct json results when status is not confirmed", async () => {
			baseTestScenario.featureTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.deepEqual(JSON.stringify({ "enabled": null }), await service.getStatusMessage(staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, true, ""));
		});
	});

	describe("checkConsent", () => {
		it("enables feature tracking when user confirms", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.exceptionsTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.isTrue(savedSettingNamesAndValues.indexOf(`${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.true`) !== -1);
		});

		it("enables exception tracking when user confirms feature tracking and exception tracking is not set before that", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.exceptionsTracking = undefined;
			baseTestScenario.prompterConfirmResult = true;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.isTrue(savedSettingNamesAndValues.indexOf(`${staticConfig.ERROR_REPORT_SETTING_NAME}.true`) !== -1);
		});

		it("disables feature tracking user confirms", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.prompterConfirmResult = false;
			baseTestScenario.exceptionsTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.isTrue(savedSettingNamesAndValues.indexOf(`${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.false`) !== -1);
		});

		it("disables exception tracking when user rejects feature tracking and exception tracking is not set before that", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.exceptionsTracking = undefined;
			baseTestScenario.prompterConfirmResult = false;

			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.isTrue(savedSettingNamesAndValues.indexOf(`${staticConfig.ERROR_REPORT_SETTING_NAME}.false`) !== -1);
		});

		[false, true].forEach(featureTrackingValue => {
			it(`sets exception tracking to feature tracking's value when the first one is not set, but feature tracking is set to ${featureTrackingValue}`, async () => {
				baseTestScenario.featureTracking = featureTrackingValue;
				baseTestScenario.exceptionsTracking = undefined;
				const testInjector = createTestInjector(baseTestScenario);
				service = testInjector.resolve<IAnalyticsService>("analyticsService");
				await service.checkConsent();
				const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
				assert.isTrue(savedSettingNamesAndValues.indexOf(`${staticConfig.ERROR_REPORT_SETTING_NAME}.${featureTrackingValue}`) !== -1);
			});
		});

		it("does nothing when exception and feature tracking are already set", async () => {
			baseTestScenario.featureTracking = baseTestScenario.exceptionsTracking = true;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			assert.deepEqual(savedSettingNamesAndValues, "");
		});

		it("does nothing when cannot make request", async () => {
			baseTestScenario.canDoRequest = false;
			baseTestScenario.featureTracking = baseTestScenario.exceptionsTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			assert.deepEqual(savedSettingNamesAndValues, "");
		});

		it("does nothing when values are not set and console is not interactive", async () => {
			baseTestScenario.isInteractive = false;
			baseTestScenario.featureTracking = baseTestScenario.exceptionsTracking = undefined;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			assert.deepEqual(savedSettingNamesAndValues, "");
		});

		it("sends information that user had accepted feature tracking", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.exceptionsTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.isTrue(trackedFeatureNamesAndValues.indexOf(`Accept${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.true`) !== -1);
		});

		it("sends information that user had rejected feature tracking", async () => {
			baseTestScenario.featureTracking = undefined;
			baseTestScenario.prompterConfirmResult = false;
			baseTestScenario.exceptionsTracking = false;
			const testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			await service.checkConsent();
			const staticConfig: Config.IStaticConfig = testInjector.resolve("staticConfig");
			assert.isTrue(trackedFeatureNamesAndValues.indexOf(`Accept${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.false`) !== -1);
		});
	});

	describe("uses correct settings on different os-es", () => {
		const name = "unitTests";
		let testInjector: IInjector;
		let osInfo: IOsInfo;
		let osType: () => string;
		let osRelease: () => string;
		const release = "1.0";

		beforeEach(() => {
			testInjector = createTestInjector(baseTestScenario);
			service = testInjector.resolve<IAnalyticsService>("analyticsService");
			osInfo = testInjector.resolve("osInfo");
			osType = osInfo.type;
			osRelease = osInfo.release;
		});

		afterEach(() => {
			osInfo.type = osType;
			osInfo.release = osRelease;
		});

		it("sets correct userAgent on Windows", async () => {
			osInfo.type = () => { return "Windows_NT"; };
			osInfo.release = () => { return release; };
			await service.track(name, featureName);
			assert.equal(lastUsedEqatecSettings.userAgent, `(Windows NT ${release})`);
		});

		it("sets correct userAgent on MacOS", async () => {
			osInfo.type = () => { return "Darwin"; };
			osInfo.release = () => { return release; };
			await service.track(name, featureName);
			assert.equal(lastUsedEqatecSettings.userAgent, `(Mac OS X ${release})`);
		});

		it("sets correct userAgent on other OSs", async () => {
			osInfo.type = () => { return "Linux"; };
			osInfo.release = () => { return release; };
			await service.track(name, featureName);
			assert.equal(lastUsedEqatecSettings.userAgent, `(Linux)`);
		});
	});

	describe("tracks to multiple projects simultaneously", () => {
		let analyticsService: AnalyticsServiceInheritor;
		const getNodeJsVersionString = () => {
			const reportedVersion = process.version.slice(1).replace(/[.]/g, "_");
			return `NodeJSVersion.${reportedVersion}`;
		};

		it("features when featureTrackingAPIKeys setting contains multiple keys", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			analyticsService = testInjector.resolve<AnalyticsServiceInheritor>("analyticsService");
			analyticsService.featureTrackingAPIKeys = [
				"ApiKey1",
				"ApiKey2"
			];

			const secondFeatureName = "second feature";

			await analyticsService.trackFeature(featureName);
			await analyticsService.trackFeature(secondFeatureName);

			assert.equal(startCalledCount, 2, "When we have two API Keys, the start method should be called exactly two times.");
			assert.deepEqual(apiKeysPassedToCreateEqatecSettings, analyticsService.featureTrackingAPIKeys);

			const featureFullName = `CLI.${featureName}`;
			const secondFeatureFullName = `CLI.${secondFeatureName}`;
			const nodeJsVersionString = getNodeJsVersionString();
			const expectedTrackedFeatures = [
				nodeJsVersionString,
				featureFullName,
				nodeJsVersionString,
				featureFullName,
				secondFeatureFullName,
				secondFeatureFullName
			];

			assert.deepEqual(trackedFeatureNamesAndValues, expectedTrackedFeatures);
		});

		it("exceptions when exceptionsTrackingAPIKeys setting contains multiple keys", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			analyticsService = testInjector.resolve<AnalyticsServiceInheritor>("analyticsService");
			analyticsService.exceptionsTrackingAPIKeys = [
				"ApiKey1",
				"ApiKey2"
			];

			const secondExceptionMessage = "second exception";

			await analyticsService.trackException(exception, message);
			await analyticsService.trackException(exception, secondExceptionMessage);

			assert.equal(startCalledCount, 2, "When we have two API Keys, the start method should be called exactly two times.");
			assert.deepEqual(apiKeysPassedToCreateEqatecSettings, analyticsService.exceptionsTrackingAPIKeys);

			const expectedExceptionMessage = [
				message,
				message, // for second project
				secondExceptionMessage,
				secondExceptionMessage // for second project
			];

			assert.deepEqual(trackedExceptionMessages, expectedExceptionMessage);

			const nodeJsVersionString = getNodeJsVersionString();

			// NodeJSVersion should be tracked in all processes for exceptions tracking.
			const expectedTrackedMessages = [
				nodeJsVersionString,
				nodeJsVersionString,
			];
			assert.deepEqual(trackedFeatureNamesAndValues, expectedTrackedMessages);
		});

		it("accept feature tracking when acceptUsageReportingAPIKeys setting contains multiple keys", async () => {
			const testInjector = createTestInjector(baseTestScenario);
			analyticsService = testInjector.resolve<AnalyticsServiceInheritor>("analyticsService");
			analyticsService.acceptUsageReportingAPIKeys = [
				"ApiKey1",
				"ApiKey2"
			];

			await analyticsService.trackAcceptFeatureUsage({ acceptTrackFeatureUsage: true });
			await analyticsService.trackAcceptFeatureUsage({ acceptTrackFeatureUsage: false });

			const staticConfig = testInjector.resolve<Config.IStaticConfig>("staticConfig");

			assert.equal(startCalledCount, 2, "When we have two API Keys, the start method should be called exactly two times.");
			assert.deepEqual(apiKeysPassedToCreateEqatecSettings, analyticsService.acceptUsageReportingAPIKeys);
			const acceptTrackFeatureUsageTrue = `Accept${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.true`;
			const acceptTrackFeatureUsageFalse = `Accept${staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}.false`;
			const nodeJsVersionString = getNodeJsVersionString();
			const expectedTrackedFeatures = [
				nodeJsVersionString,
				acceptTrackFeatureUsageTrue,
				nodeJsVersionString,
				acceptTrackFeatureUsageTrue,
				acceptTrackFeatureUsageFalse,
				acceptTrackFeatureUsageFalse
			];

			assert.deepEqual(trackedFeatureNamesAndValues, expectedTrackedFeatures);
		});
	});
});
