import * as stubs from "./stubs";
import * as yok from "../lib/common/yok";
import { DebugAndroidCommand, DebugPlatformCommand } from "../lib/commands/debug";
import { assert } from "chai";
import { Configuration, StaticConfig } from "../lib/config";
import { Options } from "../lib/options";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { FileSystem } from "../lib/common/file-system";
import { AndroidProjectService } from "../lib/services/android-project-service";
import { AndroidDebugBridge } from "../lib/common/mobile/android/android-debug-bridge";
import { AndroidDebugBridgeResultHandler } from "../lib/common/mobile/android/android-debug-bridge-result-handler";
import { DebugCommandErrors } from "../lib/constants";
import { CONNECTED_STATUS, UNREACHABLE_STATUS } from "../lib/common/constants";
const helpers = require("../lib/common/helpers");
const originalIsInteracive = helpers.isInteractive;

function createTestInjector(): IInjector {
	let testInjector: IInjector = new yok.Yok();

	testInjector.register("debug|android", DebugAndroidCommand);
	testInjector.register("config", Configuration);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("options", Options);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register('childProcess', stubs.ChildProcessStub);
	testInjector.register('androidDebugService', stubs.DebugServiceStub);
	testInjector.register('fs', FileSystem);
	testInjector.register('errors', stubs.ErrorsStub);
	testInjector.register('hostInfo', {});
	testInjector.register("analyticsService", {
		trackException: async (): Promise<void> => undefined,
		checkConsent: async (): Promise<void> => undefined,
		trackFeature: async (): Promise<void> => undefined
	});
	testInjector.register('devicesService', {
		initialize: async () => { /* Intentionally left blank */ },
		detectCurrentlyAttachedDevices: async () => { /* Intentionally left blank */ },
		getDeviceInstances: (): any[] => { return []; },
		execute: async (): Promise<any> => ({})
	});
	testInjector.register("debugLiveSyncService", stubs.LiveSyncServiceStub);
	testInjector.register("androidProjectService", AndroidProjectService);
	testInjector.register("androidToolsInfo", stubs.AndroidToolsInfoStub);
	testInjector.register("hostInfo", {});
	testInjector.register("projectData", { platformsDir: "test", initializeProjectData: () => { /* empty */ } });
	testInjector.register("projectDataService", {});
	testInjector.register("sysInfo", {});
	testInjector.register("mobileHelper", {});
	testInjector.register("pluginVariablesService", {});
	testInjector.register("deviceAppDataFactory", {});
	testInjector.register("projectTemplatesService", {});
	testInjector.register("xmlValidator", {});
	testInjector.register("npm", {});
	testInjector.register("debugDataService", {
		createDebugData: () => ({})
	});
	testInjector.register("androidEmulatorServices", {});
	testInjector.register("adb", AndroidDebugBridge);
	testInjector.register("androidDebugBridgeResultHandler", AndroidDebugBridgeResultHandler);
	testInjector.register("platformService", stubs.PlatformServiceStub);
	testInjector.register("platformsData", {
		availablePlatforms: {
			Android: "Android",
			iOS: "iOS"
		}
	});

	testInjector.register("prompter", {});
	testInjector.registerCommand("debug|android", DebugAndroidCommand);
	testInjector.register("liveSyncCommandHelper", {
		executeLiveSyncOperation: async (): Promise<void> => {
			return null;
		}
	});

	return testInjector;
}

describe("debug command tests", () => {
	describe("getDeviceForDebug", () => {
		it("throws error when both --for-device and --emulator are passed", async () => {
			const testInjector = createTestInjector();
			const options = testInjector.resolve<IOptions>("options");
			options.forDevice = options.emulator = true;
			const debugCommand = testInjector.resolve<DebugPlatformCommand>(DebugPlatformCommand, { debugService: {}, platform: "android" });
			await assert.isRejected(debugCommand.getDeviceForDebug(), DebugCommandErrors.UNABLE_TO_USE_FOR_DEVICE_AND_EMULATOR);
		});

		it("returns selected device, when --device is passed", async () => {
			const testInjector = createTestInjector();
			const devicesService = testInjector.resolve<Mobile.IDevicesService>("devicesService");
			const deviceInstance = <Mobile.IDevice>{};
			const specifiedDeviceOption = "device1";
			devicesService.getDevice = async (deviceOption: string): Promise<Mobile.IDevice> => {
				if (deviceOption === specifiedDeviceOption) {
					return deviceInstance;
				}
			};

			const options = testInjector.resolve<IOptions>("options");
			options.device = specifiedDeviceOption;
			const debugCommand = testInjector.resolve<DebugPlatformCommand>(DebugPlatformCommand, { debugService: {}, platform: "android" });
			const selectedDeviceInstance = await debugCommand.getDeviceForDebug();
			assert.deepEqual(selectedDeviceInstance, deviceInstance);
		});

		const assertErrorIsThrown = async (getDeviceInstancesResult: Mobile.IDevice[], passedOptions?: { forDevice: boolean, emulator: boolean }) => {
			const testInjector = createTestInjector();
			if (passedOptions) {
				const options = testInjector.resolve<IOptions>("options");
				options.forDevice = passedOptions.forDevice;
				options.emulator = passedOptions.emulator;
			}

			const devicesService = testInjector.resolve<Mobile.IDevicesService>("devicesService");
			devicesService.getDeviceInstances = (): Mobile.IDevice[] => getDeviceInstancesResult;

			const debugCommand = testInjector.resolve<DebugPlatformCommand>(DebugPlatformCommand, { debugService: {}, platform: "android" });
			await assert.isRejected(debugCommand.getDeviceForDebug(), DebugCommandErrors.NO_DEVICES_EMULATORS_FOUND_FOR_OPTIONS);
		};

		it("throws error when there are no devices/emulators available", () => {
			return assertErrorIsThrown([]);
		});

		it("throws error when there are no devices/emulators available for selected platform", () => {
			return assertErrorIsThrown([
				<Mobile.IDevice>{
					deviceInfo: {
						platform: "ios",
						status: CONNECTED_STATUS
					}
				}
			]);
		});

		it("throws error when there are only not-trusted devices/emulators available for selected platform", () => {
			return assertErrorIsThrown([
				<Mobile.IDevice>{
					deviceInfo: {
						platform: "android",
						status: UNREACHABLE_STATUS
					}
				}
			]);
		});

		it("throws error when there are only devices and --emulator is passed", () => {
			return assertErrorIsThrown([
				<Mobile.IDevice>{
					deviceInfo: {
						platform: "android",
						status: CONNECTED_STATUS
					},
					isEmulator: false
				}
			], {
					forDevice: false,
					emulator: true
				});
		});

		it("throws error when there are only emulators and --forDevice is passed", () => {
			return assertErrorIsThrown([
				<Mobile.IDevice>{
					deviceInfo: {
						platform: "android",
						status: CONNECTED_STATUS
					},
					isEmulator: true
				}
			], {
					forDevice: true,
					emulator: false
				});
		});

		it("returns the only available device/emulator when it matches passed -- options", async () => {
			const testInjector = createTestInjector();
			const deviceInstance = <Mobile.IDevice>{
				deviceInfo: {
					platform: "android",
					status: CONNECTED_STATUS
				},
				isEmulator: true
			};

			const devicesService = testInjector.resolve<Mobile.IDevicesService>("devicesService");
			devicesService.getDeviceInstances = (): Mobile.IDevice[] => [deviceInstance];

			const debugCommand = testInjector.resolve<DebugPlatformCommand>(DebugPlatformCommand, { debugService: {}, platform: "android" });
			const actualDeviceInstance = await debugCommand.getDeviceForDebug();
			assert.deepEqual(actualDeviceInstance, deviceInstance);
		});

		describe("when multiple devices are detected", () => {
			beforeEach(() => {
				helpers.isInteractive = originalIsInteracive;
			});

			after(() => {
				helpers.isInteractive = originalIsInteracive;
			});

			describe("when terminal is interactive", () => {

				it("prompts the user with information about available devices for specified platform only and returns the selected device instance", async () => {
					helpers.isInteractive = () => true;
					const testInjector = createTestInjector();
					const deviceInstance1 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance1",
							displayName: "displayName1"
						},
						isEmulator: true
					};

					const deviceInstance2 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance2",
							displayName: "displayName2"
						},
						isEmulator: true
					};

					const iOSDeviceInstance = <Mobile.IDevice>{
						deviceInfo: {
							platform: "ios",
							status: CONNECTED_STATUS,
							identifier: "iosDevice",
							displayName: "iPhone"
						},
						isEmulator: true
					};

					const devicesService = testInjector.resolve<Mobile.IDevicesService>("devicesService");
					devicesService.getDeviceInstances = (): Mobile.IDevice[] => [deviceInstance1, deviceInstance2, iOSDeviceInstance];

					let choicesPassedToPrompter: string[];
					const prompter = testInjector.resolve<IPrompter>("prompter");
					prompter.promptForChoice = async (promptMessage: string, choices: any[]): Promise<string> => {
						choicesPassedToPrompter = choices;
						return choices[1];
					};

					const debugCommand = testInjector.resolve<DebugPlatformCommand>(DebugPlatformCommand, { debugService: {}, platform: "android" });
					const actualDeviceInstance = await debugCommand.getDeviceForDebug();
					const expectedChoicesPassedToPrompter = [deviceInstance1, deviceInstance2].map(d => `${d.deviceInfo.identifier} - ${d.deviceInfo.displayName}`);
					assert.deepEqual(choicesPassedToPrompter, expectedChoicesPassedToPrompter);

					assert.deepEqual(actualDeviceInstance, deviceInstance2);
				});
			});

			describe("when terminal is not interactive", () => {
				beforeEach(() => {
					helpers.isInteractive = () => false;
				});

				const assertCorrectInstanceIsUsed = async (opts: { forDevice: boolean, emulator: boolean, isEmulatorTest: boolean, excludeLastDevice?: boolean }) => {
					const testInjector = createTestInjector();
					const deviceInstance1 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance1",
							displayName: "displayName1",
							version: "5.1"
						},
						isEmulator: opts.isEmulatorTest
					};

					const deviceInstance2 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance2",
							displayName: "displayName2",
							version: "6.0"
						},
						isEmulator: opts.isEmulatorTest
					};

					const deviceInstance3 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance3",
							displayName: "displayName3",
							version: "7.1"
						},
						isEmulator: !opts.isEmulatorTest
					};

					const options = testInjector.resolve<IOptions>("options");
					options.forDevice = opts.forDevice;
					options.emulator = opts.emulator;

					const devicesService = testInjector.resolve<Mobile.IDevicesService>("devicesService");
					const deviceInstances = [deviceInstance1, deviceInstance2];
					if (!opts.excludeLastDevice) {
						deviceInstances.push(deviceInstance3);
					}

					devicesService.getDeviceInstances = (): Mobile.IDevice[] => deviceInstances;

					const debugCommand = testInjector.resolve<DebugPlatformCommand>(DebugPlatformCommand, { debugService: {}, platform: "android" });
					const actualDeviceInstance = await debugCommand.getDeviceForDebug();

					assert.deepEqual(actualDeviceInstance, deviceInstance2);
				};

				it("returns the emulator with highest API level when --emulator is passed", () => {
					return assertCorrectInstanceIsUsed({ forDevice: false, emulator: true, isEmulatorTest: true });
				});

				it("returns the device with highest API level when --forDevice is passed", () => {
					return assertCorrectInstanceIsUsed({ forDevice: true, emulator: false, isEmulatorTest: false });
				});

				it("returns the emulator with highest API level when neither --emulator and --forDevice are passed", () => {
					return assertCorrectInstanceIsUsed({ forDevice: false, emulator: false, isEmulatorTest: true });
				});

				it("returns the device with highest API level when neither --emulator and --forDevice are passed and emulators are not available", async () => {
					return assertCorrectInstanceIsUsed({ forDevice: false, emulator: false, isEmulatorTest: false, excludeLastDevice: true });
				});
			});
		});
	});

	describe("Debugger tests", () => {
		let testInjector: IInjector;

		beforeEach(() => {
			testInjector = createTestInjector();
		});

		it("Ensures that debugLivesync flag is true when executing debug --watch command", async () => {
			const debugCommand = testInjector.resolveCommand("debug|android");
			const options: IOptions = testInjector.resolve("options");
			options.watch = true;
			const devicesService = testInjector.resolve<Mobile.IDevicesService>("devicesService");
			devicesService.getDeviceInstances = (): Mobile.IDevice[] => {
				return [<any>{ deviceInfo: { status: "Connected", platform: "android" } }];
			};

			const debugLiveSyncService = testInjector.resolve<IDebugLiveSyncService>("debugLiveSyncService");
			debugLiveSyncService.liveSync = async (deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncData: ILiveSyncInfo): Promise<void> => {
				return null;
			};

			await debugCommand.execute(["android", "--watch"]);
			const config: IConfiguration = testInjector.resolve("config");
			assert.isTrue(config.debugLivesync);
		});

		it("Ensures that beforePrepareAllPlugins will not call gradle when livesyncing", async () => {
			let config: IConfiguration = testInjector.resolve("config");
			config.debugLivesync = true;
			let childProcess: stubs.ChildProcessStub = testInjector.resolve("childProcess");
			let androidProjectService: IPlatformProjectService = testInjector.resolve("androidProjectService");
			let projectData: IProjectData = testInjector.resolve("projectData");
			let spawnFromEventCount = childProcess.spawnFromEventCount;
			await androidProjectService.beforePrepareAllPlugins(projectData);
			assert.isTrue(spawnFromEventCount === 0);
			assert.isTrue(spawnFromEventCount === childProcess.spawnFromEventCount);
		});

		it("Ensures that beforePrepareAllPlugins will call gradle with clean option when *NOT* livesyncing", async () => {
			let config: IConfiguration = testInjector.resolve("config");
			config.debugLivesync = false;
			let childProcess: stubs.ChildProcessStub = testInjector.resolve("childProcess");
			let androidProjectService: IPlatformProjectService = testInjector.resolve("androidProjectService");
			let projectData: IProjectData = testInjector.resolve("projectData");
			let spawnFromEventCount = childProcess.spawnFromEventCount;
			await androidProjectService.beforePrepareAllPlugins(projectData);
			assert.isTrue(childProcess.lastCommand.indexOf("gradle") !== -1);
			assert.isTrue(childProcess.lastCommandArgs[0] === "clean");
			assert.isTrue(spawnFromEventCount === 0);
			assert.isTrue(spawnFromEventCount + 1 === childProcess.spawnFromEventCount);
		});
	});
});
