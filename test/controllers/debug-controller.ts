import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";
import * as _ from 'lodash';
import { EventEmitter } from "events";
import * as constants from "../../lib/common/constants";
import { CONNECTION_ERROR_EVENT_NAME, DebugCommandErrors, TrackActionNames, DebugTools } from "../../lib/constants";
import { DebugController } from "../../lib/controllers/debug-controller";
import { BuildDataService } from "../../lib/services/build-data-service";
import { DebugDataService } from "../../lib/services/debug-data-service";
import { LiveSyncServiceResolver } from "../../lib/resolvers/livesync-service-resolver";
import { PrepareDataService } from "../../lib/services/prepare-data-service";
import { ProjectDataService } from "../../lib/services/project-data-service";
import { StaticConfig } from "../../lib/config";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { LiveSyncProcessDataService } from "../../lib/services/livesync-process-data-service";
import { IDebugData, IDebugOptions, IDebugResultInfo, IDeviceDebugService } from "../../lib/definitions/debug";
import { IInjector } from "../../lib/common/definitions/yok";
import { IAnalyticsService } from "../../lib/common/declarations";
import { IEventActionData } from "../../lib/common/definitions/google-analytics";

const fakeChromeDebugPort = 123;
const fakeChromeDebugUrl = `fakeChromeDebugUrl?experiments=true&ws=localhost:${fakeChromeDebugPort}`;
const defaultDeviceIdentifier = "Nexus5";

class PlatformDebugService extends EventEmitter /* implements IPlatformDebugService */ {
	public async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<IDebugResultInfo> {
		return { debugUrl: fakeChromeDebugUrl };
	}
}

interface IDebugTestDeviceInfo {
	deviceInfo: {
		status: string;
		platform: string;
		identifier: string;
	};

	isEmulator: boolean;
}

interface IDebugTestData {
	isDeviceFound: boolean;
	deviceInformation: IDebugTestDeviceInfo;
	isApplicationInstalledOnDevice: boolean;
	hostInfo: {
		isWindows: boolean;
		isDarwin: boolean;
	};
}

const getDefaultDeviceInformation = (platform?: string): IDebugTestDeviceInfo => ({
	deviceInfo: {
		status: constants.CONNECTED_STATUS,
		platform: platform || "Android",
		identifier: defaultDeviceIdentifier
	},

	isEmulator: false
});

const getDefaultTestData = (platform?: string): IDebugTestData => ({
	isDeviceFound: true,
	deviceInformation: getDefaultDeviceInformation(platform),
	isApplicationInstalledOnDevice: true,
	hostInfo: {
		isWindows: false,
		isDarwin: true
	}
});

describe("debugController", () => {
	const getTestInjectorForTestConfiguration = (testData: IDebugTestData): IInjector => {
		const testInjector = new Yok();
		testInjector.register("devicesService", {
			getDeviceByIdentifier: (identifier: string): Mobile.IDevice => {
				return testData.isDeviceFound ?
					<Mobile.IDevice>{
						deviceInfo: testData.deviceInformation.deviceInfo,

						applicationManager: {
							isApplicationInstalled: async (appIdentifier: string): Promise<boolean> => testData.isApplicationInstalledOnDevice
						},

						isEmulator: testData.deviceInformation.isEmulator
					} : null;
			}
		});

		testInjector.register("androidDeviceDebugService", PlatformDebugService);

		testInjector.register("iOSDeviceDebugService", PlatformDebugService);

		testInjector.register("mobileHelper", {
			isAndroidPlatform: (platform: string) => {
				return platform.toLowerCase() === "android";
			},
			isiOSPlatform: (platform: string) => {
				return platform.toLowerCase() === "ios";
			}
		});

		testInjector.register("errors", stubs.ErrorsStub);

		testInjector.register("hostInfo", testData.hostInfo);

		testInjector.register("logger", stubs.LoggerStub);

		testInjector.register("analyticsService", {
			trackEventActionInGoogleAnalytics: (data: IEventActionData) => Promise.resolve()
		});

		testInjector.register("buildDataService", BuildDataService);
		testInjector.register("buildController", {});

		testInjector.register("debugDataService", DebugDataService);
		testInjector.register("deviceInstallAppService", {});
		testInjector.register("hmrStatusService", {});
		testInjector.register("hooksService", {});
		testInjector.register("liveSyncServiceResolver", LiveSyncServiceResolver);
		testInjector.register("platformsDataService", {});
		testInjector.register("pluginsService", {});
		testInjector.register("prepareController", {});
		testInjector.register("prepareDataService", PrepareDataService);
		testInjector.register("prepareNativePlatformService", {});
		testInjector.register("projectDataService", ProjectDataService);
		testInjector.register("fs", {});
		testInjector.register("staticConfig", StaticConfig);
		testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
		testInjector.register("androidResourcesMigrationService", {});
		testInjector.register("liveSyncProcessDataService", LiveSyncProcessDataService);

		return testInjector;
	};

	describe("debug", () => {
		const getDebugData = (debugOptions?: IDebugOptions): IDebugData => ({
			deviceIdentifier: defaultDeviceIdentifier,
			applicationIdentifier: "org.nativescript.app1",
			projectDir: "/Users/user/app1",
			projectName: "app1",
			debugOptions: debugOptions || {}
		});

		describe("rejects the result promise when", () => {
			const assertIsRejected = async (testData: IDebugTestData, expectedError: string, userSpecifiedOptions?: IDebugOptions): Promise<void> => {
				const testInjector = getTestInjectorForTestConfiguration(testData);
				const debugController = testInjector.resolve(DebugController);

				const debugData = getDebugData();
				await assert.isRejected(debugController.startDebug(debugData, userSpecifiedOptions), expectedError);
			};

			it("there's no attached device as the specified identifier", async () => {
				const testData = getDefaultTestData();
				testData.isDeviceFound = false;

				await assertIsRejected(testData, "Cannot find device with identifier");
			});

			it("the device is not trusted", async () => {
				const testData = getDefaultTestData();
				testData.deviceInformation.deviceInfo.status = constants.UNREACHABLE_STATUS;

				await assertIsRejected(testData, "is unreachable. Make sure it is Trusted ");
			});

			it("the application is not installed on device", async () => {
				const testData = getDefaultTestData();
				testData.isApplicationInstalledOnDevice = false;

				await assertIsRejected(testData, "is not installed on device with identifier");
			});

			it("device is neither iOS or Android", async () => {
				const testData = getDefaultTestData();
				testData.deviceInformation.deviceInfo.platform = "WP8";

				await assertIsRejected(testData, DebugCommandErrors.UNSUPPORTED_DEVICE_OS_FOR_DEBUGGING);
			});

			const assertIsRejectedWhenPlatformDebugServiceFails = async (platform: string): Promise<void> => {
				const testData = getDefaultTestData();
				testData.deviceInformation.deviceInfo.platform = platform;

				const testInjector = getTestInjectorForTestConfiguration(testData);
				const expectedErrorMessage = "Platform specific error";
				const platformDebugService = testInjector.resolve<IDeviceDebugService>(`${platform}DeviceDebugService`);
				platformDebugService.debug = async (data: IDebugData, debugOptions: IDebugOptions): Promise<any> => {
					throw new Error(expectedErrorMessage);
				};

				const debugController = testInjector.resolve(DebugController);

				const debugData = getDebugData();
				await assert.isRejected(debugController.startDebug(debugData, null), expectedErrorMessage);
			};

			it("androidDeviceDebugService's debug method fails", async () => {
				await assertIsRejectedWhenPlatformDebugServiceFails("android");
			});

			it("iOSDeviceDebugService's debug method fails", async () => {
				await assertIsRejectedWhenPlatformDebugServiceFails("iOS");
			});
		});

		describe(`raises ${CONNECTION_ERROR_EVENT_NAME} event`, () => {
			_.each(["android", "iOS"], platform => {
				it(`when ${platform}DebugService raises ${CONNECTION_ERROR_EVENT_NAME} event`, async () => {
					const testData = getDefaultTestData();
					testData.deviceInformation.deviceInfo.platform = platform;

					const testInjector = getTestInjectorForTestConfiguration(testData);
					const debugController = testInjector.resolve(DebugController);
					let dataRaisedForConnectionError: any = null;
					debugController.on(CONNECTION_ERROR_EVENT_NAME, (data: any) => {
						dataRaisedForConnectionError = data;
					});

					const debugData = getDebugData();
					await assert.isFulfilled(debugController.startDebug(debugData, null));

					const expectedErrorData = { deviceIdentifier: "deviceId", message: "my message", code: 2048 };
					const platformDebugService = testInjector.resolve<IDeviceDebugService>(`${platform}DeviceDebugService`);
					platformDebugService.emit(CONNECTION_ERROR_EVENT_NAME, expectedErrorData);
					assert.deepStrictEqual(dataRaisedForConnectionError, expectedErrorData);
				});
			});
		});

		describe("returns chrome url along with port returned by platform specific debug service", () => {
			_.each(["android", "iOS"], platform => {
				it(`for ${platform} device`, async () => {
					const testData = getDefaultTestData();
					testData.deviceInformation.deviceInfo.platform = platform;

					const testInjector = getTestInjectorForTestConfiguration(testData);
					const debugController = testInjector.resolve(DebugController);

					const debugData = getDebugData();
					const debugInfo = await debugController.startDebug(debugData, null);

					assert.deepStrictEqual(debugInfo, {
						url: fakeChromeDebugUrl,
						port: fakeChromeDebugPort,
						deviceIdentifier: debugData.deviceIdentifier
					});
				});
			});
		});

		describe("tracks to google analytics", () => {
			_.each([
				{
					testName: "Inspector when --inspector is passed",
					debugOptions: { inspector: true },
					additionalData: DebugTools.Inspector
				},
				{
					testName: "Chrome when no options are passed",
					debugOptions: null,
					additionalData: DebugTools.Chrome
				},
				{
					testName: "Chrome when --chrome is passed",
					debugOptions: { chrome: true },
					additionalData: DebugTools.Chrome
				}], testCase => {

					it(testCase.testName, async () => {
						const testData = getDefaultTestData();
						testData.deviceInformation.deviceInfo.platform = "iOS";

						const testInjector = getTestInjectorForTestConfiguration(testData);
						const analyticsService = testInjector.resolve<IAnalyticsService>("analyticsService");
						let dataTrackedToGA: IEventActionData = null;
						analyticsService.trackEventActionInGoogleAnalytics = async (data: IEventActionData): Promise<void> => {
							dataTrackedToGA = data;
						};

						const debugController = testInjector.resolve(DebugController);
						const debugData = getDebugData(testCase.debugOptions);
						await debugController.startDebug(debugData);
						const devicesService = testInjector.resolve<Mobile.IDevicesService>("devicesService");
						const device = devicesService.getDeviceByIdentifier(testData.deviceInformation.deviceInfo.identifier);

						const expectedData = JSON.stringify({
							action: TrackActionNames.Debug,
							device,
							additionalData: testCase.additionalData,
							projectDir: debugData.projectDir
						}, null, 2);

						// Use JSON.stringify as the compared objects link to new instances of different classes.
						assert.deepStrictEqual(JSON.stringify(dataTrackedToGA, null, 2), expectedData);
					});
				});
		});
	});
});
