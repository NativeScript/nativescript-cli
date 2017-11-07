import { AnalyticsService } from "../../../lib/services/analytics/analytics-service";
import { Yok } from "../../../lib/common/yok";
import * as stubs from "../../stubs";
import { assert } from "chai";
import { EventEmitter } from "events";
import { AnalyticsClients } from "../../../lib/common/constants";

const helpers = require("../../../lib/common/helpers");
const originalIsInteractive = helpers.isInteractive;

const trackFeatureUsage = "TrackFeatureUsage";
const createTestInjector = (): IInjector => {
	const testInjector = new Yok();
	testInjector.register("options", {});
	testInjector.register("logger", stubs.LoggerStub);

	testInjector.register("staticConfig", {
		disableAnalytics: false,
		TRACK_FEATURE_USAGE_SETTING_NAME: trackFeatureUsage,
		PATH_TO_BOOTSTRAP: "pathToBootstrap.js"
	});

	testInjector.register("prompter", {

	});

	testInjector.register("userSettingsService", {
		getSettingValue: async (settingName: string): Promise<any> => {
			return "true";
		}
	});
	testInjector.register("analyticsSettingsService", {
		canDoRequest: (): Promise<boolean> => Promise.resolve(true)
	});
	testInjector.register("osInfo", {});
	testInjector.register("childProcess", {});
	testInjector.register("processService", {
		attachToProcessExitSignals: (context: any, callback: () => void): void => undefined
	});
	testInjector.register("projectDataService", {});
	testInjector.register("mobileHelper", {});

	return testInjector;
};

describe("analyticsService", () => {
	afterEach(() => {
		helpers.isInteractive = originalIsInteractive;
	});

	describe("trackInGoogleAnalytics", () => {
		describe("does not track", () => {
			const testScenario = async (configuration: {
				disableAnalytics: boolean,
				assertMessage: string,
				userSettingsServiceOpts?: { trackFeatureUsageValue: string, defaultValue: string }
			}) => {
				const testInjector = createTestInjector();
				const staticConfig = testInjector.resolve<Config.IStaticConfig>("staticConfig");
				staticConfig.disableAnalytics = configuration.disableAnalytics;

				configuration.userSettingsServiceOpts = configuration.userSettingsServiceOpts || { trackFeatureUsageValue: "false", defaultValue: "true" };
				const userSettingsService = testInjector.resolve<any>("userSettingsService");
				userSettingsService.getSettingValue = async (settingName: string): Promise<string> => {
					if (settingName === trackFeatureUsage) {
						return configuration.userSettingsServiceOpts.trackFeatureUsageValue;
					}

					return configuration.userSettingsServiceOpts.defaultValue;
				};

				let isChildProcessSpawned = false;
				const childProcess = testInjector.resolve<IChildProcess>("childProcess");
				childProcess.spawn = (command: string, args?: string[], options?: any): any => {
					isChildProcessSpawned = true;
				};

				const analyticsService = testInjector.resolve<IAnalyticsService>(AnalyticsService);
				await analyticsService.trackInGoogleAnalytics({
					googleAnalyticsDataType: GoogleAnalyticsDataType.Page,
					customDimensions: {
						customDimension1: "value1"
					}
				});

				assert.isFalse(isChildProcessSpawned, configuration.assertMessage);
			};

			it("does not track when staticConfig's disableAnalytics is true", () => {
				return testScenario({
					disableAnalytics: true,
					assertMessage: "When staticConfig.disableAnalytics is true, no child process should be started, i.e. we should not track anything."
				});
			});

			it(`does not track when ${trackFeatureUsage} is not true`, async () => {
				await testScenario({
					disableAnalytics: false,
					assertMessage: `When ${trackFeatureUsage} is false, no child process should be started, i.e. we should not track anything.`,
					userSettingsServiceOpts: {
						trackFeatureUsageValue: "false", defaultValue: "true"
					}
				});

				await testScenario({
					disableAnalytics: false,
					assertMessage: `When ${trackFeatureUsage} is undefined, no child process should be started, i.e. we should not track anything.`,
					userSettingsServiceOpts: {
						trackFeatureUsageValue: undefined, defaultValue: "true"
					}
				});
			});

		});

		const getSpawnedProcess = (): any => {
			const spawnedProcess: any = new EventEmitter();
			spawnedProcess.stdout = new EventEmitter();
			spawnedProcess.stderr = new EventEmitter();
			spawnedProcess.unref = (): void => undefined;
			return spawnedProcess;
		};

		describe("does not fail", () => {
			const assertExpectedError = async (testInjector: IInjector, opts: { isChildProcessSpawned: boolean, expectedErrorMessage: string }) => {
				const analyticsService = testInjector.resolve<IAnalyticsService>(AnalyticsService);
				await analyticsService.trackInGoogleAnalytics({
					googleAnalyticsDataType: GoogleAnalyticsDataType.Page,
					customDimensions: {
						customDimension1: "value1"
					}
				});

				assert.isTrue(opts.isChildProcessSpawned);
				const logger = testInjector.resolve<stubs.LoggerStub>("logger");
				assert.isTrue(logger.traceOutput.indexOf(opts.expectedErrorMessage) !== -1);
			};

			const setupTest = (expectedErrorMessage: string): any => {
				const testInjector = createTestInjector();
				const opts = {
					isChildProcessSpawned: false,
					expectedErrorMessage
				};

				const childProcess = testInjector.resolve<IChildProcess>("childProcess");
				return {
					testInjector,
					opts,
					childProcess
				};
			};

			it("when unable to start broker process", async () => {
				const { testInjector, childProcess, opts } = setupTest("Unable to get broker instance due to error:  Error: custom error");
				childProcess.spawn = (command: string, args?: string[], options?: any): any => {
					opts.isChildProcessSpawned = true;
					throw new Error("custom error");
				};

				await assertExpectedError(testInjector, opts);
			});

			it("when broker cannot start for required timeout", async () => {
				const { testInjector, childProcess, opts } = setupTest("Unable to get broker instance due to error:  Error: Unable to start Analytics Broker process.");
				const originalSetTimeout = setTimeout;
				childProcess.spawn = (command: string, args?: string[], options?: any): any => {
					opts.isChildProcessSpawned = true;
					global.setTimeout = (callback: (...args: any[]) => void, ms: number, ...otherArgs: any[]) => originalSetTimeout(callback, 1);
					return getSpawnedProcess();
				};

				await assertExpectedError(testInjector, opts);

				global.setTimeout = originalSetTimeout;
			});

			it("when broker is not connected", async () => {
				const { testInjector, childProcess, opts } = setupTest("Broker not found or not connected.");

				childProcess.spawn = (command: string, args?: string[], options?: any): any => {
					opts.isChildProcessSpawned = true;
					const spawnedProcess: any = getSpawnedProcess();

					spawnedProcess.connected = false;
					spawnedProcess.send = (): void => undefined;
					setTimeout(() => spawnedProcess.emit("message", AnalyticsMessages.BrokerReadyToReceive), 1);
					return spawnedProcess;
				};

				await assertExpectedError(testInjector, opts);
			});

			it("when sending message fails", async () => {
				const { testInjector, childProcess, opts } = setupTest("Error while trying to send message to broker: Error: Failed to sent data.");

				childProcess.spawn = (command: string, args?: string[], options?: any): any => {
					opts.isChildProcessSpawned = true;
					const spawnedProcess: any = getSpawnedProcess();

					spawnedProcess.connected = true;
					spawnedProcess.send = (): void => {
						throw new Error("Failed to sent data.");
					};

					setTimeout(() => spawnedProcess.emit("message", AnalyticsMessages.BrokerReadyToReceive), 1);
					return spawnedProcess;
				};

				await assertExpectedError(testInjector, opts);
			});
		});

		describe("sends correct message to broker", () => {
			const setupTest = (expectedResult: any, dataToSend: any, terminalOpts?: { isInteractive: boolean }): { testInjector: IInjector, opts: any } => {
				helpers.isInteractive = () => terminalOpts ? terminalOpts.isInteractive : true;

				const testInjector = createTestInjector();
				const opts = {
					isChildProcessSpawned: false,
					expectedResult,
					dataToSend,
					messageSent: <any>null
				};

				const childProcess = testInjector.resolve<IChildProcess>("childProcess");
				childProcess.spawn = (command: string, args?: string[], options?: any): any => {
					opts.isChildProcessSpawned = true;
					const spawnedProcess: any = getSpawnedProcess();

					spawnedProcess.connected = true;
					spawnedProcess.send = (msg: any, action: () => void): void => {
						opts.messageSent = msg;
						action();
					};

					setTimeout(() => spawnedProcess.emit("message", AnalyticsMessages.BrokerReadyToReceive), 1);

					return spawnedProcess;
				};

				return {
					testInjector,
					opts
				};
			};

			const assertExpectedResult = async (testInjector: IInjector, opts: { isChildProcessSpawned: boolean, expectedResult: any, messageSent: any, dataToSend: any }) => {
				const analyticsService = testInjector.resolve<IAnalyticsService>(AnalyticsService);
				await analyticsService.trackInGoogleAnalytics(opts.dataToSend);

				assert.isTrue(opts.isChildProcessSpawned);
				assert.deepEqual(opts.messageSent, opts.expectedResult);
			};

			const getDataToSend = (gaDataType: string): any => ({
				googleAnalyticsDataType: gaDataType,
				customDimensions: {
					customDimension1: "value1"
				}
			});

			const getExpectedResult = (gaDataType: string, analyticsClient?: string): any => ({
				type: "googleAnalyticsData",
				category: "CLI",
				googleAnalyticsDataType: gaDataType,
				customDimensions: { customDimension1: "value1", cd5: analyticsClient || "CLI" }
			});

			_.each([GoogleAnalyticsDataType.Page, GoogleAnalyticsDataType.Event], (googleAnalyticsDataType: string) => {
				it(`when data is ${googleAnalyticsDataType}`, async () => {
					const { testInjector, opts } = setupTest(getExpectedResult(googleAnalyticsDataType), getDataToSend(googleAnalyticsDataType));
					await assertExpectedResult(testInjector, opts);
				});

				it(`when data is ${googleAnalyticsDataType} and terminal is not interactive`, async () => {
					const { testInjector, opts } = setupTest(getExpectedResult(googleAnalyticsDataType, AnalyticsClients.Unknown), getDataToSend(googleAnalyticsDataType), { isInteractive: false });
					await assertExpectedResult(testInjector, opts);
				});

				_.each([true, false], (isInteractive) => {
					it(`when data is ${googleAnalyticsDataType} terminal is ${isInteractive ? "" : "not "}interactive and --analyticsClient is passed`, async () => {
						const analyticsClient = "AnalyticsClient";

						const { testInjector, opts } = setupTest(getExpectedResult(googleAnalyticsDataType, analyticsClient), getDataToSend(googleAnalyticsDataType), { isInteractive });
						const options = testInjector.resolve<IOptions>("options");
						options.analyticsClient = analyticsClient;

						await assertExpectedResult(testInjector, opts);
					});
				});
			});
		});
	});
});
