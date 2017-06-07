import { DebugService } from "../../lib/services/debug-service";
import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";
import { EventEmitter } from "events";
import * as constants from "../../lib/common/constants";
import { CONNECTION_ERROR_EVENT_NAME } from "../../lib/constants";

const fakeChromeDebugUrl = "fakeChromeDebugUrl";
class PlatformDebugService extends EventEmitter /* implements IPlatformDebugService */ {
	public async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string[]> {
		return [fakeChromeDebugUrl];
	}
};

interface IDebugTestDeviceInfo {
	deviceInfo: {
		status: string;
		platform: string;
	};

	isEmulator: boolean;
};

interface IDebugTestData {
	isDeviceFound: boolean;
	deviceInformation: IDebugTestDeviceInfo;
	isApplicationInstalledOnDevice: boolean;
	hostInfo: {
		isWindows: boolean;
		isDarwin: boolean;
	};
};

const getDefaultDeviceInformation = (platform?: string): IDebugTestDeviceInfo => ({
	deviceInfo: {
		status: constants.CONNECTED_STATUS,
		platform: platform || "Android"
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

describe("debugService", () => {
	const getTestInjectorForTestConfiguration = (testData: IDebugTestData): IInjector => {
		const testInjector = new Yok();
		testInjector.register("devicesService", {
			getDeviceByIdentifier: (identifier: string): Mobile.IDevice => {
				return testData.isDeviceFound ?
					<Mobile.IDevice> {
						deviceInfo: testData.deviceInformation.deviceInfo,

						applicationManager: {
							isApplicationInstalled: async (appIdentifier: string): Promise<boolean> => testData.isApplicationInstalledOnDevice
						},

						isEmulator: testData.deviceInformation.isEmulator
					} : null;
			}
		});

		testInjector.register("androidDebugService", PlatformDebugService);

		testInjector.register("iOSDebugService", PlatformDebugService);

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

		return testInjector;
	};

	describe("debug", () => {
		const getDebugData = (deviceIdentifier?: string): IDebugData => ({
			applicationIdentifier: "org.nativescript.app1",
			deviceIdentifier: deviceIdentifier || "Nexus5",
			projectDir: "/Users/user/app1",
			projectName: "app1"
		});

		describe("rejects the result promise when", () => {
			const assertIsRejected = async (testData: IDebugTestData, expectedError: string, userSpecifiedOptions?: IDebugOptions): Promise<void> => {
				const testInjector = getTestInjectorForTestConfiguration(testData);
				const debugService = testInjector.resolve<IDebugServiceBase>(DebugService);

				const debugData = getDebugData();
				await assert.isRejected(debugService.debug(debugData, userSpecifiedOptions), expectedError);
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

			it("the OS is neither Windows or macOS and device is iOS", async () => {
				const testData = getDefaultTestData();
				testData.deviceInformation.deviceInfo.platform = "iOS";
				testData.hostInfo.isDarwin = testData.hostInfo.isWindows = false;

				await assertIsRejected(testData, "Debugging on iOS devices is not supported for");
			});

			it("device is neither iOS or Android", async () => {
				const testData = getDefaultTestData();
				testData.deviceInformation.deviceInfo.platform = "WP8";

				await assertIsRejected(testData, "Unsupported device OS:");
			});

			it("when trying to debug on iOS Simulator on macOS, debug-brk is passed, but pathToAppPackage is not", async () => {
				const testData = getDefaultTestData();
				testData.deviceInformation.deviceInfo.platform = "iOS";
				testData.deviceInformation.isEmulator = true;

				await assertIsRejected(testData, "To debug on iOS simulator you need to provide path to the app package.", { debugBrk: true });
			});

			const assertIsRejectedWhenPlatformDebugServiceFails = async (platform: string): Promise<void> => {
				const testData = getDefaultTestData();
				testData.deviceInformation.deviceInfo.platform = platform;

				const testInjector = getTestInjectorForTestConfiguration(testData);
				const expectedErrorMessage = "Platform specific error";
				const platformDebugService = testInjector.resolve<IPlatformDebugService>(`${platform}DebugService`);
				platformDebugService.debug = async (debugData: IDebugData, debugOptions: IDebugOptions): Promise<any> => {
					throw new Error(expectedErrorMessage);
				};

				const debugService = testInjector.resolve<IDebugServiceBase>(DebugService);

				const debugData = getDebugData();
				await assert.isRejected(debugService.debug(debugData, null), expectedErrorMessage);
			};

			it("androidDebugService's debug method fails", async () => {
				await assertIsRejectedWhenPlatformDebugServiceFails("android");
			});

			it("iOSDebugService's debug method fails", async () => {
				await assertIsRejectedWhenPlatformDebugServiceFails("iOS");
			});
		});

		describe("passes correct args to", () => {
			const assertPassedDebugOptions = async (platform: string, userSpecifiedOptions?: IDebugOptions, hostInfo?: { isWindows: boolean, isDarwin: boolean }): Promise<IDebugOptions> => {
				const testData = getDefaultTestData();
				testData.deviceInformation.deviceInfo.platform = platform;
				if (hostInfo) {
					testData.hostInfo = hostInfo;
				}

				const testInjector = getTestInjectorForTestConfiguration(testData);
				const platformDebugService = testInjector.resolve<IPlatformDebugService>(`${platform}DebugService`);
				let passedDebugOptions: IDebugOptions = null;
				platformDebugService.debug = async (debugData: IDebugData, debugOptions: IDebugOptions): Promise<any> => {
					passedDebugOptions = debugOptions;
					return [];
				};

				const debugService = testInjector.resolve<IDebugServiceBase>(DebugService);

				const debugData = getDebugData();
				await assert.isFulfilled(debugService.debug(debugData, userSpecifiedOptions));
				assert.isTrue(passedDebugOptions.chrome);
				assert.isTrue(passedDebugOptions.start);

				return passedDebugOptions;
			};

			_.each(["android", "iOS"], platform => {
				describe(`${platform}DebugService's debug method`, () => {
					describe("on macOS", () => {
						it("passes chrome and start as true, when no debugOptions are passed to debugService", async () => {
							await assertPassedDebugOptions(platform);
						});

						it("when calling debug service with chrome and start set to false, should disregard them and set both to true", async () => {
							await assertPassedDebugOptions(platform, { chrome: false, start: false });
						});

						it("passes other custom options without modification", async () => {
							const passedDebugOptions = await assertPassedDebugOptions(platform, { emulator: true, useBundledDevTools: true });
							assert.isTrue(passedDebugOptions.useBundledDevTools);
							assert.isTrue(passedDebugOptions.emulator);
						});
					});

					describe("on Windows", () => {
						const assertEmulatorOption = (passedDebugOptions: IDebugOptions) => {
							if (platform === "iOS") {
								assert.isFalse(passedDebugOptions.emulator);
							}
						};

						it("passes chrome and start as true, when no debugOptions are passed to debugService", async () => {
							const passedDebugOptions = await assertPassedDebugOptions(platform, null, { isWindows: true, isDarwin: false });
							assertEmulatorOption(passedDebugOptions);
						});

						it("when calling debug service with chrome and start set to false, should disregard them and set both to true", async () => {
							const passedDebugOptions = await assertPassedDebugOptions(platform, { chrome: false, start: false }, { isWindows: true, isDarwin: false });
							assertEmulatorOption(passedDebugOptions);
						});

						it("passes other custom options without modification", async () => {
							const passedDebugOptions = await assertPassedDebugOptions(platform, { debugBrk: true, useBundledDevTools: true });
							assert.isTrue(passedDebugOptions.useBundledDevTools);
							assert.isTrue(passedDebugOptions.debugBrk);
						});
					});

				});
			});
		});

		describe(`raises ${CONNECTION_ERROR_EVENT_NAME} event`, () => {
			_.each(["android", "iOS"], platform => {
				it(`when ${platform}DebugService raises ${CONNECTION_ERROR_EVENT_NAME} event`, async () => {
					const testData = getDefaultTestData();
					testData.deviceInformation.deviceInfo.platform = platform;

					const testInjector = getTestInjectorForTestConfiguration(testData);
					const debugService = testInjector.resolve<IDebugServiceBase>(DebugService);
					let dataRaisedForConnectionError: any = null;
					debugService.on(CONNECTION_ERROR_EVENT_NAME, (data: any) => {
						dataRaisedForConnectionError = data;
					});

					const debugData = getDebugData();
					await assert.isFulfilled(debugService.debug(debugData, null));

					const expectedErrorData = { deviceId: "deviceId", message: "my message", code: 2048 };
					const platformDebugService = testInjector.resolve<IPlatformDebugService>(`${platform}DebugService`);
					platformDebugService.emit(CONNECTION_ERROR_EVENT_NAME, expectedErrorData);
					assert.deepEqual(dataRaisedForConnectionError, expectedErrorData);
				});
			});
		});

		describe("returns chrome url returned by platform specific debug service", () => {
			_.each(["android", "iOS"], platform => {
				it(`for ${platform} device`, async () => {
					const testData = getDefaultTestData();
					testData.deviceInformation.deviceInfo.platform = platform;

					const testInjector = getTestInjectorForTestConfiguration(testData);
					const debugService = testInjector.resolve<IDebugServiceBase>(DebugService);

					const debugData = getDebugData();
					const url = await debugService.debug(debugData, null);

					assert.deepEqual(url, fakeChromeDebugUrl);
				});
			});
		});
	});
});
