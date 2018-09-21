import { AndroidVirtualDeviceService } from "../../../mobile/android/android-virtual-device-service";
import { EmulatorHelper } from "../../../mobile/emulator-helper";
import { Yok } from "../../../yok";

import { assert } from "chai";
import * as path from "path";
import { AndroidVirtualDevice, NOT_RUNNING_EMULATOR_STATUS, RUNNING_EMULATOR_STATUS } from '../../../constants';

const avdManagerOutput = `Parsing /Users/havaluova/Library/Android/sdk/build-tools/27.0.3/package.xmlParsing /Users/havaluova/Library/Android/sdk/build-tools/28.0.0/package.xmlParsing /Users/havaluova/Library/Android/sdk/emulator/package.xmlParsing /Users/havaluova/Library/Android/sdk/extras/android/m2repository/package.xmlParsing /Users/havaluova/Library/Android/sdk/extras/google/google_play_services/package.xmlParsing /Users/havaluova/Library/Android/sdk/extras/google/m2repository/package.xmlParsing /Users/havaluova/Library/Android/sdk/extras/intel/Hardware_Accelerated_Execution_Manager/package.xmlParsing /Users/havaluova/Library/Android/sdk/extras/m2repository/com/android/support/constraint/constraint-layout-solver/1.0.2/package.xmlParsing /Users/havaluova/Library/Android/sdk/extras/m2repository/com/android/support/constraint/constraint-layout/1.0.2/package.xmlParsing /Users/havaluova/Library/Android/sdk/patcher/v4/package.xmlParsing /Users/havaluova/Library/Android/sdk/platform-tools/package.xmlParsing /Users/havaluova/Library/Android/sdk/platforms/android-27/package.xmlParsing /Users/havaluova/Library/Android/sdk/platforms/android-28/package.xmlParsing /Users/havaluova/Library/Android/sdk/sources/android-27/package.xmlParsing /Users/havaluova/Library/Android/sdk/system-images/android-27/google_apis_playstore/x86/package.xmlParsing /Users/havaluova/Library/Android/sdk/system-images/android-28/google_apis/x86/package.xmlParsing /Users/havaluova/Library/Android/sdk/system-images/android-28/google_apis_playstore/x86/package.xmlParsing /Users/havaluova/Library/Android/sdk/tools/package.xmlAvailable Android Virtual Devices:
	Name: Nexus_5_API_27
	Device: Nexus 5 (Google)
	Path: ${path.join("/fake", "path", "Nexus_5_API_27.avd")}
	Target: Google Play (Google Inc.)
			Based on: Android API 27 Tag/ABI: google_apis_playstore/x86
	Skin: nexus_5
	Sdcard: 100M
	---------
	Name: Nexus_5X_API_28
	Device: Nexus 5X (Google)
	Path: ${path.join("/fake", "path", "Nexus_5X_API_28.avd")}
	Target: Google Play (Google Inc.)
			Based on: Android API 28 Tag/ABI: google_apis_playstore/x86
	Skin: nexus_5x
	Sdcard: 100M
	---------
	Name: Nexus_6P_API_28
	Device: Nexus 6P (Google)
	Path: ${path.join("/fake", "path", "Nexus_6P_API_28.avd")}
	Target: Google APIs (Google Inc.)
			Based on: Android API 28 Tag/ABI: google_apis/x86
	Skin: nexus_6p
	Sdcard: 100M`;

const avdManagerOutputWithInvalidDevice = `${avdManagerOutput} \n` + `
	The following Android Virtual Devices could not be loaded:
	Name: Pixel_2_XL_API_28
	Path: ${path.join("/fake", "path", "Pixel_2_XL_API_28.avd")}
	Error: Google pixel_2_xl no longer exists as a device`;

function getValueFromIniFilesData(propertyName: string, iniFilePath: string, iniFilesData: IDictionary<Mobile.IAvdInfo>) {
	return iniFilesData && iniFilesData[path.dirname(iniFilePath)] && iniFilesData[path.dirname(iniFilePath)][propertyName];
}

function mockParseIniFile(iniFilePath: string, data: any) {
	if (path.basename(iniFilePath) === "config.ini") {
		return {
			avdId: getValueFromIniFilesData("avdId", iniFilePath, data && data.iniFilesData),
			path: getValueFromIniFilesData("path", iniFilePath, data && data.iniFilesData),
			device: getValueFromIniFilesData("device", iniFilePath, data && data.iniFilesData),
			target: getValueFromIniFilesData("target", iniFilePath, data && data.iniFilesData),
			targetNum: 17
		};
	}
}

function createTestInjector(data: { avdManagerOutput?: string, avdManagerError?: string, iniFilesData?: IDictionary<Mobile.IAvdInfo> }): IInjector {
	const testInjector = new Yok();
	testInjector.register("androidVirtualDeviceService", AndroidVirtualDeviceService);
	testInjector.register("androidIniFileParser", {
		parseIniFile: (iniFilePath: string) => mockParseIniFile(iniFilePath, data)
	});
	testInjector.register("childProcess", {
		trySpawnFromCloseEvent: (command: string) => {
			return {
				stdout: data && data.avdManagerOutput,
				stderr: data && data.avdManagerError
			};
		}
	});
	testInjector.register("devicePlatformsConstants", { Android: "android" });
	testInjector.register("fs", {
		exists: () => true,
		readText: (filePath: string) => ((data && data.iniFilesData) || {})[filePath],
		readDirectory: () => <string[]>[]
	});
	testInjector.register("emulatorHelper", EmulatorHelper);
	testInjector.register("hostInfo", {});
	testInjector.register("logger", { trace: () => ({}) });

	return testInjector;
}

function getAvailableEmulatorData(data: { displayName: string, imageIdentifier: string, version: string, model: string }): Mobile.IDeviceInfo {
	return {
		displayName: data.displayName,
		errorHelp: null,
		identifier: null,
		imageIdentifier: data.imageIdentifier,
		isTablet: false,
		model: data.model,
		platform: "android",
		status: NOT_RUNNING_EMULATOR_STATUS,
		type: "Emulator",
		vendor: "Avd",
		version: data.version
	};
}

function getRunningEmulatorData(data: { displayName: string, imageIdentifier: string, identifier: string, version: string, model: string }): Mobile.IDeviceInfo {
	return {
		identifier: data.identifier,
		imageIdentifier: data.imageIdentifier,
		displayName: data.displayName,
		model: data.model,
		version: data.version,
		vendor: 'Avd',
		status: RUNNING_EMULATOR_STATUS,
		errorHelp: null,
		isTablet: false,
		type: 'Device',
		platform: 'android'
	};
}

describe("androidVirtualDeviceService", () => {
	function mockAvdService(data?: { avdManagerOutput?: string, avdManagerError?: string, iniFilesData?: IDictionary<Mobile.IAvdInfo> }): Mobile.IAndroidVirtualDeviceService {
		const testInjector = createTestInjector(data);
		return testInjector.resolve("androidVirtualDeviceService");
	}

	function getIniFilesData(opts?: { includePixel: boolean }): any {
		const data: any = {
			[path.join("/fake", "path", "Nexus_5_API_27.avd")]: {
				target: "android-27",
				targetNum: 8,
				path: null,
				device: "Nexus 5X",
				avdId: "Nexus_5_API_27"
			},
			[path.join("/fake", "path", "Nexus_5X_API_28.avd")]: {
				target: "android-28",
				targetNum: 9,
				path: null,
				device: "Nexus 5X",
				avdId: "Nexus_5X_API_28"
			},
			[path.join("/fake", "path", "Nexus_6P_API_28.avd")]: {
				target: "android-28",
				targetNum: 9,
				path: null,
				device: "Nexus 6P",
				avdId: "Nexus_6P_API_28"
			},
		};

		if (opts && opts.includePixel) {
			data[path.join("/fake", "path", "Pixel_2_XL_API_28.avd")] = {
				target: "android-28",
				targetNum: 9,
				path: null,
				device: "Pixel 2 XL",
				avdId: "Pixel_2_XL_API_28"
			};
		}

		return data;
	}
	describe("getEmulatorImages", () => {
		describe("when avdmanager is found", () => {
			beforeEach(() => {
				process.env.ANDROID_HOME = "fake/android/home/path";
			});

			it("should return an empty array when no emulators are available", async () => {
				const avdService = mockAvdService({ avdManagerOutput: "" });
				const result = await avdService.getEmulatorImages([]);
				assert.lengthOf(result.devices, 0);
				assert.deepEqual(result.devices, []);
				assert.deepEqual(result.errors, []);
			});

			it(`should return an empty array when no emulators are available (only ${AndroidVirtualDevice.AVAILABLE_AVDS_MESSAGE} message is printed)`, async () => {
				const avdService = mockAvdService({ avdManagerOutput: `${AndroidVirtualDevice.AVAILABLE_AVDS_MESSAGE}\n` });
				const result = await avdService.getEmulatorImages([]);
				assert.lengthOf(result.devices, 0);
				assert.deepEqual(result.devices, []);
				assert.deepEqual(result.errors, []);
			});
			it("should return an empty array when `avdmanager list avds` command fails", async () => {
				const avdManagerError = "some error while executing avdmanager list avds";
				const avdService = mockAvdService({ avdManagerError });
				const result = await avdService.getEmulatorImages([]);
				assert.lengthOf(result.devices, 0);
				assert.deepEqual(result.devices, []);
				assert.lengthOf(result.errors, 1);
				assert.deepEqual(result.errors, [avdManagerError]);
			});
			it("should return all emulators when there are available emulators and no running emulators", async () => {
				const avdService = mockAvdService({
					avdManagerOutput, iniFilesData: getIniFilesData()
				});

				const result = await avdService.getEmulatorImages([]);
				assert.lengthOf(result.devices, 3);
				assert.deepEqual(result.devices[0], getAvailableEmulatorData({ displayName: "Nexus_5_API_27", imageIdentifier: "Nexus_5_API_27", version: "8.1.0", model: "Nexus 5X" }));
				assert.deepEqual(result.devices[1], getAvailableEmulatorData({ displayName: "Nexus_5X_API_28", imageIdentifier: "Nexus_5X_API_28", version: "9.0.0", model: "Nexus 5X" }));
				assert.deepEqual(result.devices[2], getAvailableEmulatorData({ displayName: "Nexus_6P_API_28", imageIdentifier: "Nexus_6P_API_28", version: "9.0.0", model: "Nexus 6P" }));
				assert.deepEqual(result.errors, []);
			});
			it("should return all emulators when there are available and running emulators", async () => {
				const avdService = mockAvdService({
					avdManagerOutput, iniFilesData: getIniFilesData()
				});

				avdService.getRunningEmulatorImageIdentifier = (emulatorId: string) => {
					if (emulatorId === "emulator-5554") {
						return Promise.resolve("Nexus_5_API_27");
					}

					return Promise.resolve("");
				};
				const result = (await avdService.getEmulatorImages(["emulator-5554	device"])).devices;
				assert.deepEqual(result[0], getRunningEmulatorData({ displayName: "Nexus_5_API_27", imageIdentifier: "Nexus_5_API_27", identifier: "emulator-5554", version: "8.1.0", model: "Nexus 5X" }));
				assert.deepEqual(result[1], getAvailableEmulatorData({ displayName: "Nexus_5X_API_28", imageIdentifier: "Nexus_5X_API_28", version: "9.0.0", model: "Nexus 5X" }));
				assert.deepEqual(result[2], getAvailableEmulatorData({ displayName: "Nexus_6P_API_28", imageIdentifier: "Nexus_6P_API_28", version: "9.0.0", model: "Nexus 6P" }));
			});
		});

		describe("when avdmanager is not found", () => {
			it("should return an empty array when ANDROID_HOME is not set", async () => {
				const androidHomeDir = process.env.ANDROID_HOME;
				process.env.ANDROID_HOME = undefined;
				const avdService = mockAvdService();
				const result = (await avdService.getEmulatorImages([])).devices;
				assert.lengthOf(result, 0);
				assert.deepEqual(result, []);
				process.env.ANDROID_HOME = androidHomeDir;
			});
		});

		describe("when avdmanager reports some device no longer exists", () => {
			it("should return the emulator when it actually exists", async () => {
				const avdService = mockAvdService({
					avdManagerOutput: avdManagerOutputWithInvalidDevice, iniFilesData: getIniFilesData({ includePixel: true })
				});

				const result = await avdService.getEmulatorImages([]);

				assert.lengthOf(result.devices, 4);
				assert.deepEqual(result.devices[0], getAvailableEmulatorData({ displayName: "Nexus_5_API_27", model: "Nexus 5X", imageIdentifier: "Nexus_5_API_27", version: "8.1.0" }));
				assert.deepEqual(result.devices[1], getAvailableEmulatorData({ displayName: "Nexus_5X_API_28", model: "Nexus 5X", imageIdentifier: "Nexus_5X_API_28", version: "9.0.0" }));
				assert.deepEqual(result.devices[2], getAvailableEmulatorData({ displayName: "Nexus_6P_API_28", model: "Nexus 6P", imageIdentifier: "Nexus_6P_API_28", version: "9.0.0" }));
				assert.deepEqual(result.devices[3], getAvailableEmulatorData({ displayName: "Pixel_2_XL_API_28", model: "Pixel 2 XL", imageIdentifier: "Pixel_2_XL_API_28", version: "9.0.0" }));
				assert.deepEqual(result.errors, []);
			});
			it("shouldn't return the emulator when it actually does not exist", async () => {
				const mockData = {
					avdManagerOutput: avdManagerOutputWithInvalidDevice,
					iniFilesData: getIniFilesData({ includePixel: true })
				};
				const testInjector = createTestInjector(mockData);
				const avdService = testInjector.resolve<Mobile.IAndroidVirtualDeviceService>("androidVirtualDeviceService");
				const androidIniFileParser = testInjector.resolve("androidIniFileParser");
				androidIniFileParser.parseIniFile = (iniFilePath: string) => {
					if (iniFilePath.indexOf("Pixel_2_XL_API_28") !== -1) {
						return null;
					}

					return mockParseIniFile(iniFilePath, mockData);
				};

				const result = await avdService.getEmulatorImages([]);

				assert.lengthOf(result.devices, 3);
				assert.deepEqual(result.devices[0], getAvailableEmulatorData({ displayName: "Nexus_5_API_27", model: "Nexus 5X", imageIdentifier: "Nexus_5_API_27", version: "8.1.0" }));
				assert.deepEqual(result.devices[1], getAvailableEmulatorData({ displayName: "Nexus_5X_API_28", model: "Nexus 5X", imageIdentifier: "Nexus_5X_API_28", version: "9.0.0" }));
				assert.deepEqual(result.devices[2], getAvailableEmulatorData({ displayName: "Nexus_6P_API_28", model: "Nexus 6P", imageIdentifier: "Nexus_6P_API_28", version: "9.0.0" }));
				assert.deepEqual(result.errors, []);
			});
		});
	});

	describe("getRunningEmulatorIds", () => {
		let androidVirtualDeviceService: Mobile.IAndroidVirtualDeviceService = null;

		beforeEach(() => {
			const testInjector = createTestInjector({});
			androidVirtualDeviceService = testInjector.resolve("androidVirtualDeviceService");
		});

		it("should return [] when there are no running emulators", async () => {
			const emulators = await androidVirtualDeviceService.getRunningEmulatorIds([]);
			assert.deepEqual(emulators, []);
		});
		it("should return the devices when there are running emulators", async () => {
			const emulators = await androidVirtualDeviceService.getRunningEmulatorIds(["emulator-5554	device", "emulator-5556	device"]);
			assert.deepEqual(emulators, ["emulator-5554", "emulator-5556"]);
		});
	});
});
