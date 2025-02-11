import { DevicesService } from "../../../mobile/mobile-core/devices-service";
import { Yok } from "../../../yok";
import {
	EmulatorDiscoveryNames,
	DeviceDiscoveryEventNames,
	CONNECTED_STATUS,
	UNREACHABLE_STATUS,
} from "../../../constants";
import {
	DebugCommandErrors,
	DeviceConnectionType,
} from "../../../../constants";

import { EventEmitter } from "events";
import { assert, use } from "chai";
import * as util from "util";
import * as _ from "lodash";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

import { CommonLoggerStub, ErrorsStub } from "../stubs";
import { Messages } from "../../../messages/messages";
import * as constants from "../../../constants";
import { DevicePlatformsConstants } from "../../../mobile/device-platforms-constants";
import { IInjector } from "../../../definitions/yok";
import { IDictionary, IHostInfo } from "../../../declarations";

const helpers = require("../../../helpers");
const originalIsInteractive = helpers.isInteractive;
class AndroidEmulatorDiscoveryStub extends EventEmitter {
	public startLookingForDevices(): void {
		// Intentionally left blank.
	}
}

class DevicesServiceInheritor extends DevicesService {
	public startEmulatorIfNecessary(
		data?: Mobile.IDevicesServicesInitializationOptions,
	): Promise<void> {
		return super.startEmulatorIfNecessary(data);
	}

	public startDeviceDetectionInterval(
		deviceInitOpts: Mobile.IDeviceLookingOptions = <any>{},
	): void {
		return super.startDeviceDetectionInterval(deviceInitOpts);
	}

	public detectCurrentlyAttachedDevices(
		options?: Mobile.IDeviceLookingOptions,
	): Promise<void> {
		return super.detectCurrentlyAttachedDevices(options);
	}
}

class IOSDeviceDiscoveryStub extends EventEmitter {
	public count: number = 0;
	public async startLookingForDevices(): Promise<void> {
		this.count++;
		return;
	}

	public async checkForDevices(): Promise<void> {
		return;
	}
}

class CustomDeviceDiscoveryStub extends EventEmitter {
	public count: number = 0;
	public async startLookingForDevices(): Promise<void> {
		this.count++;
		return;
	}

	public async checkForDevices(): Promise<void> {
		return;
	}
}

class AndroidDeviceDiscoveryStub extends EventEmitter {
	public count: number = 0;
	public async startLookingForDevices(): Promise<void> {
		this.count++;
		return;
	}

	public async checkForDevices(): Promise<void> {
		return;
	}
}

class IOSSimulatorDiscoveryStub extends EventEmitter {
	public count: number = 0;
	public async startLookingForDevices(): Promise<void> {
		this.count++;
		return;
	}

	public async checkForDevices(): Promise<void> {
		return;
	}

	public async checkForAvailableSimulators(): Promise<void> {
		return;
	}
}

function getErrorMessage(
	injector: IInjector,
	message: string,
	...args: string[]
): string {
	return util.format(
		injector.resolve("messages").Devices[message],
		..._.concat(
			args,
			injector.resolve("staticConfig").CLIENT_NAME.toLowerCase(),
		),
	);
}

let androidDeviceDiscovery: EventEmitter;
let iOSDeviceDiscovery: EventEmitter;
let iOSSimulatorDiscovery: EventEmitter;
const androidEmulatorDevice: any = {
	deviceInfo: { identifier: "androidEmulatorDevice", platform: "android" },
	isEmulator: true,
};
const iOSSimulator = {
	deviceInfo: {
		identifier: "ios-simulator-device",
		platform: "ios",
	},
	applicationManager: {
		getInstalledApplications: () =>
			Promise.resolve(["com.telerik.unitTest1", "com.telerik.unitTest2"]),
		startApplication: (packageName: string, framework: string) =>
			Promise.resolve(),
		tryStartApplication: (packageName: string, framework: string) =>
			Promise.resolve(),
		reinstallApplication: (packageName: string, packageFile: string) =>
			Promise.resolve(),
		isApplicationInstalled: (packageName: string) =>
			Promise.resolve(
				_.includes(
					["com.telerik.unitTest1", "com.telerik.unitTest2"],
					packageName,
				),
			),
	},
	deploy: (packageFile: string, packageName: string) => Promise.resolve(),
	isEmulator: true,
};

class AndroidEmulatorServices {
	public isStartEmulatorCalled = false;
	public async startEmulator(
		options: Mobile.IStartEmulatorOptions,
	): Promise<void> {
		this.isStartEmulatorCalled = true;
		androidDeviceDiscovery.emit(
			DeviceDiscoveryEventNames.DEVICE_FOUND,
			androidEmulatorDevice,
		);
		return Promise.resolve();
	}
	public async getRunningEmulatorId(identifier: string): Promise<string> {
		return Promise.resolve(identifier);
	}
	public getRunningEmulator(emulatorId: string): Promise<Mobile.IDeviceInfo> {
		return null;
	}
}

class IOSEmulatorServices {
	public isStartEmulatorCalled = false;
	public async startEmulator(): Promise<void> {
		if (!this.isStartEmulatorCalled) {
			this.isStartEmulatorCalled = true;
			iOSSimulatorDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSSimulator,
			);
		}
		return Promise.resolve();
	}
	public async getRunningEmulatorId(identifier: string): Promise<string> {
		return Promise.resolve(identifier);
	}
	public async getRunningEmulator(): Promise<Mobile.IDeviceInfo> {
		return null;
	}
}

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("logger", CommonLoggerStub);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("iOSDeviceDiscovery", IOSDeviceDiscoveryStub);
	testInjector.register("iOSSimulatorDiscovery", IOSSimulatorDiscoveryStub);
	testInjector.register("androidDeviceDiscovery", AndroidDeviceDiscoveryStub);
	testInjector.register("staticConfig", { CLIENT_NAME: "unit-tests" });
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("androidEmulatorServices", AndroidEmulatorServices);
	testInjector.register("iOSEmulatorServices", IOSEmulatorServices);
	testInjector.register("messages", Messages);
	testInjector.register("prompter", {});

	testInjector.register("mobileHelper", {
		platformNames: ["ios", "android", "visionos"],
		validatePlatformName: (platform: string) => platform.toLowerCase(),
		isiOSPlatform: (platform: string) =>
			!!(platform && platform.toLowerCase() === "ios"),
		isAndroidPlatform: (platform: string) =>
			!!(platform && platform.toLowerCase() === "android"),
		isvisionOSPlatform: (platform: string) =>
			!!(platform && platform.toLowerCase() === "visionos"),
		isApplePlatform: (platform: string) =>
			!!(
				platform &&
				(platform.toLowerCase() === "ios" ||
					platform.toLowerCase() === "visionos")
			),
	});

	testInjector.register("deviceLogProvider", {
		setLogLevel: (logLevel: string, deviceIdentifier: string) => {
			/* no implementation required */
		},
	});

	testInjector.register("hostInfo", {
		isDarwin: false,
	});

	testInjector.register("options", {
		emulator: false,
	});

	testInjector.register("androidProcessService", {
		/* no implementation required */
	});
	testInjector.register(
		"androidEmulatorDiscovery",
		AndroidEmulatorDiscoveryStub,
	);
	testInjector.register("emulatorHelper", {});

	return testInjector;
}

async function throwErrorFunction(): Promise<void> {
	throw new Error("error");
}

const getPromisesResults = async (promises: Promise<any>[]): Promise<any[]> => {
	const results: any = [];
	for (let i = 0; i < promises.length; i++) {
		const currentResult: any = {};
		try {
			currentResult.result = await promises[i];
		} catch (err) {
			currentResult.error = err;
		}

		results.push(currentResult);
	}

	return results;
};

let intervalId = 1;
const nodeJsTimer = {
	ref: () => {
		/* no implementation required */
	},
	unref: () => {
		return intervalId++;
	},
};

const originalSetInterval = setInterval;
function mockSetInterval(testCaseCallback?: Function): void {
	(<any>global).setInterval = (
		callback: (...args: any[]) => void,
		ms: number,
		...args: any[]
	): any => {
		const execution = async () => {
			if (testCaseCallback) {
				testCaseCallback();
			}

			await callback();
		};

		/* tslint:disable:no-floating-promises */
		execution();
		/* tslint:enable:no-floating-promises */

		return nodeJsTimer;
	};
}

function resetDefaultSetInterval(): void {
	global.setInterval = originalSetInterval;
}

async function assertOnNextTick(assertionFunction: Function): Promise<void> {
	await new Promise<void>((resolve) => {
		setTimeout(() => {
			assertionFunction();
			resolve();
		}, 2);
	});
}

describe("devicesService", () => {
	let counter = 0;
	const iOSDevice = {
		deviceInfo: {
			identifier: "ios-device",
			platform: "ios",
			status: constants.CONNECTED_STATUS,
		},
		applicationManager: {
			getInstalledApplications: () =>
				Promise.resolve(["com.telerik.unitTest1", "com.telerik.unitTest2"]),
			startApplication: (appData: Mobile.IApplicationData) => Promise.resolve(),
			tryStartApplication: (appData: Mobile.IApplicationData) =>
				Promise.resolve(),
			reinstallApplication: (packageName: string, packageFile: string) =>
				Promise.resolve(),
			isApplicationInstalled: (packageName: string) =>
				Promise.resolve(
					_.includes(
						["com.telerik.unitTest1", "com.telerik.unitTest2"],
						packageName,
					),
				),
			checkForApplicationUpdates: (): Promise<void> => Promise.resolve(),
			getDebuggableApps: (): Promise<Mobile.IDeviceApplicationInformation[]> =>
				Promise.resolve(null),
			getDebuggableAppViews: (
				appIdentifiers: string[],
			): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> =>
				Promise.resolve(null),
		},
	};

	const androidDevice = {
		deviceInfo: {
			identifier: "android-device",
			platform: "android",
			status: constants.CONNECTED_STATUS,
		},
		applicationManager: {
			getInstalledApplications: () =>
				Promise.resolve([
					"com.telerik.unitTest1",
					"com.telerik.unitTest2",
					"com.telerik.unitTest3",
				]),
			startApplication: (appData: Mobile.IApplicationData) => Promise.resolve(),
			tryStartApplication: (appData: Mobile.IApplicationData) =>
				Promise.resolve(),
			reinstallApplication: (packageName: string, packageFile: string) =>
				Promise.resolve(),
			isApplicationInstalled: (packageName: string) =>
				Promise.resolve(
					_.includes(
						[
							"com.telerik.unitTest1",
							"com.telerik.unitTest2",
							"com.telerik.unitTest3",
						],
						packageName,
					),
				),
			checkForApplicationUpdates: (): Promise<void> => Promise.resolve(),
			getDebuggableApps: (): Promise<Mobile.IDeviceApplicationInformation[]> =>
				Promise.resolve(null),
			getDebuggableAppViews: (
				appIdentifiers: string[],
			): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> =>
				Promise.resolve(null),
		},
	};
	let testInjector: IInjector;
	let devicesService: DevicesServiceInheritor;
	let androidEmulatorServices: any;
	let logger: CommonLoggerStub;

	beforeEach(() => {
		testInjector = createTestInjector();
		devicesService = testInjector.resolve(DevicesService);
		iOSDeviceDiscovery = testInjector.resolve("iOSDeviceDiscovery");
		iOSSimulatorDiscovery = testInjector.resolve("iOSSimulatorDiscovery");
		androidDeviceDiscovery = testInjector.resolve("androidDeviceDiscovery");
		androidEmulatorServices = testInjector.resolve("androidEmulatorServices");
		logger = testInjector.resolve("logger");
		counter = 0;
	});

	it("attaches to events when a new DevicesService is instantiated", () => {
		iOSDeviceDiscovery.emit(DeviceDiscoveryEventNames.DEVICE_FOUND, iOSDevice);
		androidDeviceDiscovery.emit(
			DeviceDiscoveryEventNames.DEVICE_FOUND,
			androidDevice,
		);
		const devices = devicesService.getDeviceInstances();
		assert.isTrue(
			devicesService.hasDevices,
			"After emitting two devices, hasDevices must be true",
		);
		assert.deepStrictEqual(devices[0], iOSDevice);
		assert.deepStrictEqual(devices[1], androidDevice);
	});

	it("attaches to events when a new custom device discovery is instantiated", () => {
		const customDeviceDiscovery = testInjector.resolve(
			CustomDeviceDiscoveryStub,
		);
		devicesService.addDeviceDiscovery(customDeviceDiscovery);
		assert.isFalse(
			devicesService.hasDevices,
			"Initially devicesService hasDevices must be false.",
		);
		customDeviceDiscovery.emit(
			DeviceDiscoveryEventNames.DEVICE_FOUND,
			iOSDevice,
		);
		customDeviceDiscovery.emit(
			DeviceDiscoveryEventNames.DEVICE_FOUND,
			androidDevice,
		);
		const devices = devicesService.getDeviceInstances();
		assert.isTrue(
			devicesService.hasDevices,
			"After emitting two devices, hasDevices must be true",
		);
		assert.deepStrictEqual(devices[0], iOSDevice);
		assert.deepStrictEqual(devices[1], androidDevice);
	});

	describe("emits correct event when emulator images are changed", () => {
		const emulatorDataToEmit: Mobile.IDeviceInfo = {
			identifier: "identifier",
			displayName: "displayName",
			model: "model",
			version: "version",
			vendor: "vendor",
			status: "status",
			errorHelp: null,
			isTablet: false,
			type: "type",
			connectionTypes: [DeviceConnectionType.Local],
			platform: "android",
		};

		it(`emits ${EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND} event when new Android Emulator image is found`, (done: mocha.Done) => {
			const androidEmulatorDiscovery =
				testInjector.resolve<AndroidEmulatorDiscoveryStub>(
					"androidEmulatorDiscovery",
				);
			devicesService.on(
				EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND,
				(emulatorImage: Mobile.IDeviceInfo) => {
					assert.deepStrictEqual(emulatorImage, emulatorDataToEmit);
					done();
				},
			);

			androidEmulatorDiscovery.emit(
				EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND,
				emulatorDataToEmit,
			);
		});

		it(`emits ${EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND} when new iOS Simulator image is found`, (done: mocha.Done) => {
			devicesService.on(
				EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND,
				(emulatorImage: Mobile.IDeviceInfo) => {
					assert.deepStrictEqual(emulatorImage, emulatorDataToEmit);
					done();
				},
			);

			iOSSimulatorDiscovery.emit(
				EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND,
				emulatorDataToEmit,
			);
		});

		it(`emits ${EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST} event when new Android Emulator image is deleted`, (done: mocha.Done) => {
			const androidEmulatorDiscovery =
				testInjector.resolve<AndroidEmulatorDiscoveryStub>(
					"androidEmulatorDiscovery",
				);
			devicesService.on(
				EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST,
				(emulatorImage: Mobile.IDeviceInfo) => {
					assert.deepStrictEqual(emulatorImage, emulatorDataToEmit);
					done();
				},
			);

			androidEmulatorDiscovery.emit(
				EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST,
				emulatorDataToEmit,
			);
		});

		it(`emits ${EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST} when iOS Simulator image is deleted`, (done: mocha.Done) => {
			devicesService.on(
				EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST,
				(emulatorImage: Mobile.IDeviceInfo) => {
					assert.deepStrictEqual(emulatorImage, emulatorDataToEmit);
					done();
				},
			);

			iOSSimulatorDiscovery.emit(
				EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST,
				emulatorDataToEmit,
			);
		});
	});

	describe("startEmulatorIfNecessary behaves as expected:", () => {
		it("throws error if --device and --emulator flags are passed simultaniously", () => {
			assert.isRejected(
				devicesService.startEmulatorIfNecessary({
					emulator: true,
					deviceId: "emulator_image_name",
				}),
				'--device and --emulator are incompatible options.\n\t\t\tIf you are trying to run on specific emulator, use "unit-tests run --device <DeviceID>',
			);
		});
		describe("platform is passed and", () => {
			it("deviceId is NOT passed and NO devices are found, an emulator is started", async () => {
				assert.deepStrictEqual(
					devicesService.getDeviceInstances(),
					[],
					"Initially getDevicesInstances must return empty array.",
				);
				await devicesService.startEmulatorIfNecessary({ platform: "android" });
				assert.deepStrictEqual(devicesService.getDeviceInstances(), [
					androidEmulatorDevice,
				]);
				assert.deepStrictEqual(devicesService.getDevices(), [
					androidEmulatorDevice.deviceInfo,
				]);
			});
			it("deviceId is NOT passed, but devices are found, assert no emulators are started", async () => {
				assert.deepStrictEqual(
					devicesService.getDeviceInstances(),
					[],
					"Initially getDevicesInstances must return empty array.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidEmulatorDevice,
				);
				await devicesService.startEmulatorIfNecessary({ platform: "android" });
				assert.deepStrictEqual(devicesService.getDeviceInstances(), [
					androidEmulatorDevice,
				]);
				assert.equal(devicesService.getDeviceInstances().length, 1);
			});
			it("deviceId is passed and devices are found, assert if deviceId of the running device is the same as the passed deviceId no emulators are started", async () => {
				assert.deepStrictEqual(
					devicesService.getDeviceInstances(),
					[],
					"Initially getDevicesInstances must return empty array.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidEmulatorDevice,
				);
				await devicesService.startEmulatorIfNecessary({
					platform: "android",
					deviceId: androidEmulatorDevice.deviceInfo.identifier,
				});
				assert.deepStrictEqual(devicesService.getDeviceInstances(), [
					androidEmulatorDevice,
				]);
				assert.equal(devicesService.getDeviceInstances().length, 1);
			});
			it("deviceId is passed and devices are found, assert if deviceId of the running device is different than the passed deviceId a new emulator is started", async () => {
				assert.deepStrictEqual(
					devicesService.getDeviceInstances(),
					[],
					"Initially getDevicesInstances must return empty array.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidDevice,
				);
				await devicesService.startEmulatorIfNecessary({
					platform: "android",
					deviceId: "different_image_name",
				});
				assert.equal(devicesService.getDeviceInstances().length, 2);
			});
			it("emulator is passed and NO devices are found, assert an emulator is started", async () => {
				assert.deepStrictEqual(
					devicesService.getDeviceInstances(),
					[],
					"Initially getDevicesInstances must return empty array.",
				);
				await devicesService.startEmulatorIfNecessary({
					platform: "android",
					emulator: true,
				});
				assert.deepStrictEqual(devicesService.getDeviceInstances(), [
					androidEmulatorDevice,
				]);
				assert.equal(devicesService.getDeviceInstances().length, 1);
			});
			it("emulator is passed and devices are found, assert no more emulators are started", async () => {
				assert.deepStrictEqual(
					devicesService.getDeviceInstances(),
					[],
					"Initially getDevicesInstances must return empty array.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidEmulatorDevice,
				);
				await devicesService.startEmulatorIfNecessary({
					platform: "android",
					emulator: true,
				});
				assert.deepStrictEqual(devicesService.getDeviceInstances(), [
					androidEmulatorDevice,
				]);
				assert.equal(devicesService.getDeviceInstances().length, 1);
			});
			it("emulator is passed and devices are found, but the found devices are not emulators, assert an emulator is started", async () => {
				assert.deepStrictEqual(
					devicesService.getDeviceInstances(),
					[],
					"Initially getDevicesInstances must return empty array.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidDevice,
				);
				await devicesService.startEmulatorIfNecessary({
					platform: "android",
					emulator: true,
				});
				assert.deepStrictEqual(devicesService.getDeviceInstances(), [
					androidDevice,
					androidEmulatorDevice,
				]);
				assert.equal(devicesService.getDeviceInstances().length, 2);
			});
			it("deviceid and emulator are not passed there are devices but not for the specified platform, assert all device detections are fired", async () => {
				assert.deepStrictEqual(
					devicesService.getDeviceInstances(),
					[],
					"Initially getDevicesInstances must return empty array.",
				);
				await devicesService.startEmulatorIfNecessary({ platform: "android" });
				assert.equal(
					(<AndroidDeviceDiscoveryStub>androidDeviceDiscovery).count,
					2,
				);
				assert.equal((<IOSDeviceDiscoveryStub>iOSDeviceDiscovery).count, 1);
				assert.equal(
					(<IOSSimulatorDiscoveryStub>iOSSimulatorDiscovery).count,
					1,
				);
			});
			it("deviceId is NOT passed, platform is passed and skipEmulatorStart is passed - should not start emulator", async () => {
				assert.deepStrictEqual(
					devicesService.getDeviceInstances(),
					[],
					"Initially getDevicesInstances must return empty array.",
				);
				await devicesService.startEmulatorIfNecessary({
					platform: "android",
					skipEmulatorStart: true,
				});
				assert.deepStrictEqual(devicesService.getDeviceInstances(), []);
				assert.deepStrictEqual(devicesService.getDevices(), []);
			});
		});
	});

	describe("hasDevices", () => {
		it("is true when device is found", () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			assert.isTrue(
				devicesService.hasDevices,
				"After emitting, hasDevices must be true",
			);
		});

		it("is false when device is found and lost after that", () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_LOST,
				androidDevice,
			);
			assert.isFalse(
				devicesService.hasDevices,
				"After losing all devices, hasDevices must be false.",
			);
		});

		it("is true when two devices are found and one of them is lost after that", () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			iOSDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSDevice,
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_LOST,
				androidDevice,
			);
			assert.isTrue(
				devicesService.hasDevices,
				"After losing only one of two devices, hasDevices must be true.",
			);
		});
	});

	describe("getDeviceInstances and getDevices", () => {
		it("returns one android device, when only one device is attached", () => {
			assert.deepStrictEqual(
				devicesService.getDeviceInstances(),
				[],
				"Initially getDevicesInstances must return empty array.",
			);
			assert.deepStrictEqual(
				devicesService.getDevices(),
				[],
				"Initially getDevices must return empty array.",
			);

			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			assert.deepStrictEqual(devicesService.getDeviceInstances(), [
				androidDevice,
			]);
			assert.deepStrictEqual(devicesService.getDevices(), [
				androidDevice.deviceInfo,
			]);
		});

		it("does not return any devices, when only one device is attached and it is removed after that", () => {
			assert.deepStrictEqual(
				devicesService.getDeviceInstances(),
				[],
				"Initially getDevicesInstances must return empty array.",
			);
			assert.deepStrictEqual(
				devicesService.getDevices(),
				[],
				"Initially getDevices must return empty array.",
			);

			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			assert.deepStrictEqual(devicesService.getDeviceInstances(), [
				androidDevice,
			]);
			assert.deepStrictEqual(devicesService.getDevices(), [
				androidDevice.deviceInfo,
			]);

			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_LOST,
				androidDevice,
			);
			assert.deepStrictEqual(
				devicesService.getDeviceInstances(),
				[],
				"When all devices are lost, getDevicesInstances must return empty array.",
			);
			assert.deepStrictEqual(
				devicesService.getDevices(),
				[],
				"When all devices are lost, getDevices must return empty array.",
			);
		});

		it("returns one android device, when two devices are attached and one of them is removed", () => {
			assert.deepStrictEqual(
				devicesService.getDeviceInstances(),
				[],
				"Initially getDevicesInstances must return empty array.",
			);
			assert.deepStrictEqual(
				devicesService.getDevices(),
				[],
				"Initially getDevices must return empty array.",
			);

			const tempDevice = { deviceInfo: { identifier: "temp-device" } };
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				tempDevice,
			);
			assert.deepStrictEqual(devicesService.getDeviceInstances(), [
				androidDevice,
				tempDevice,
			]);
			assert.deepStrictEqual(devicesService.getDevices(), [
				androidDevice.deviceInfo,
				tempDevice.deviceInfo,
			]);

			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_LOST,
				tempDevice,
			);
			assert.deepStrictEqual(devicesService.getDeviceInstances(), [
				androidDevice,
			]);
			assert.deepStrictEqual(devicesService.getDevices(), [
				androidDevice.deviceInfo,
			]);
		});
	});

	describe("isAppInstalledOnDevices", () => {
		beforeEach(() => {
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			iOSDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSDevice,
			);
		});

		it("returns true for each device on which the app is installed", async () => {
			const deviceIdentifiers = [
					androidDevice.deviceInfo.identifier,
					iOSDevice.deviceInfo.identifier,
				],
				appId = "com.telerik.unitTest1";
			const results = await devicesService.isAppInstalledOnDevices(
				deviceIdentifiers,
				appId,
				"cordova",
				"",
			);
			assert.isTrue(results.length > 0);

			for (let index = 0; index < results.length; index++) {
				const realResult = await results[index];
				assert.isTrue(realResult.isInstalled);
				assert.deepStrictEqual(realResult.appIdentifier, appId);
				assert.deepStrictEqual(
					realResult.deviceIdentifier,
					deviceIdentifiers[index],
				);
			}
		});

		it("returns false for each device on which the app is not installed", async () => {
			const results = devicesService.isAppInstalledOnDevices(
				[androidDevice.deviceInfo.identifier, iOSDevice.deviceInfo.identifier],
				"com.telerik.unitTest3",
				"cordova",
				"",
			);
			assert.isTrue(results.length > 0);
			const isInstalledOnDevices = (await Promise.all(results)).map(
				(r) => r.isInstalled,
			);
			assert.deepStrictEqual(isInstalledOnDevices, [true, false]);
		});

		it("throws error when invalid identifier is passed", async () => {
			const results = devicesService.isAppInstalledOnDevices(
				["invalidDeviceId", iOSDevice.deviceInfo.identifier],
				"com.telerik.unitTest1",
				"cordova",
				"",
			);

			const expectedErrorMessage = getErrorMessage(
				testInjector,
				"NotFoundDeviceByIdentifierErrorMessageWithIdentifier",
				"invalidDeviceId",
			);

			await assert.isRejected(Promise.all(results), expectedErrorMessage);

			_.each(await getPromisesResults(results), (promiseResult) => {
				const error = promiseResult.error;
				if (error) {
					assert.isTrue(
						error.message.indexOf("invalidDeviceId") !== -1,
						"The message must contain the id of the invalid device.",
					);
				} else {
					assert.isTrue(
						promiseResult.result.isInstalled,
						"The app is installed on iOS Device, so we must return true.",
					);
				}
			});
		});
	});

	describe("initialize and other methods behavior after initialze work correctly", () => {
		const tempDevice = {
			deviceInfo: {
				identifier: "temp-device",
				platform: "android",
			},
			applicationManager: {
				getInstalledApplications: () =>
					Promise.resolve([
						"com.telerik.unitTest1",
						"com.telerik.unitTest2",
						"com.telerik.unitTest3",
					]),
				isApplicationInstalled: (packageName: string) =>
					Promise.resolve(
						_.includes(
							[
								"com.telerik.unitTest1",
								"com.telerik.unitTest2",
								"com.telerik.unitTest3",
							],
							packageName,
						),
					),
			},
		};

		describe("when initialize is called with platform and deviceId and device's platform is the same as passed one", () => {
			const assertAllMethodsResults = async (deviceId: string) => {
				assert.isFalse(
					devicesService.hasDevices,
					"Initially devicesService hasDevices must be false.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidDevice,
				);
				await devicesService.initialize({
					platform: "android",
					deviceId: deviceId,
				});
				assert.deepStrictEqual(devicesService.platform, "android");
				assert.deepStrictEqual(devicesService.deviceCount, 1);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					tempDevice,
				);
				assert.isTrue(
					devicesService.hasDevices,
					"After emitting and initializing, hasDevices must be true",
				);
				assert.deepStrictEqual(devicesService.getDeviceInstances(), [
					androidDevice,
					tempDevice,
				]);
				assert.deepStrictEqual(devicesService.getDevices(), [
					androidDevice.deviceInfo,
					tempDevice.deviceInfo,
				]);
				assert.deepStrictEqual(devicesService.deviceCount, 1);
				await devicesService.execute(() => {
					counter++;
					return Promise.resolve();
				});
				assert.deepStrictEqual(
					counter,
					1,
					"The action must be executed on only one device.",
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => false,
				);
				assert.deepStrictEqual(
					counter,
					0,
					"The action must not be executed when canExecute returns false.",
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => true,
				);
				assert.deepStrictEqual(
					counter,
					1,
					"The action must be executed on only one device.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_LOST,
					androidDevice,
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_LOST,
					tempDevice,
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => true,
					{ allowNoDevices: true },
				);
				assert.deepStrictEqual(
					counter,
					0,
					"The action must not be executed when there are no devices.",
				);
				assert.isTrue(logger.output.indexOf(constants.ERROR_NO_DEVICES) !== -1);
			};

			it("when deviceId is deviceIdentifier", async () => {
				await assertAllMethodsResults(androidDevice.deviceInfo.identifier);
			});

			it("when deviceId is index", async () => {
				await assertAllMethodsResults("1");
			});

			it("when deviceId is deviceIdentifier that looks like number (with exponent)", async () => {
				const androidDeviceOriginalId = androidDevice.deviceInfo.identifier;
				androidDevice.deviceInfo.identifier = "16089e09";
				await assertAllMethodsResults(androidDevice.deviceInfo.identifier);
				androidDevice.deviceInfo.identifier = androidDeviceOriginalId;
			});

			it("when deviceId is deviceIdentifier that looks like number", async () => {
				const androidDeviceOriginalId = androidDevice.deviceInfo.identifier;
				androidDevice.deviceInfo.identifier = "4153465641573398";
				await assertAllMethodsResults(androidDevice.deviceInfo.identifier);
				androidDevice.deviceInfo.identifier = androidDeviceOriginalId;
			});

			it("fails when deviceId is invalid index (less than 0)", async () => {
				const expectedErrorMessage = getErrorMessage(
					testInjector,
					"NotFoundDeviceByIndexErrorMessage",
					"-2",
				);
				await assert.isRejected(
					devicesService.initialize({ platform: "android", deviceId: "-1" }),
					expectedErrorMessage,
				);
			});

			it("fails when deviceId is invalid index (more than currently connected devices)", async () => {
				const expectedErrorMessage = getErrorMessage(
					testInjector,
					"NotFoundDeviceByIndexErrorMessage",
					"99",
				);
				await assert.isRejected(
					devicesService.initialize({ platform: "android", deviceId: "100" }),
					expectedErrorMessage,
				);
			});

			it("does not fail when iOSDeviceDiscovery startLookingForDevices fails", async () => {
				(<any>iOSDeviceDiscovery).startLookingForDevices =
					(): Promise<void> => {
						throw new Error("my error");
					};
				await assertAllMethodsResults("1");
				assert.isTrue(logger.traceOutput.indexOf("my error") !== -1);
			});

			it("does not fail when androidDeviceDiscovery startLookingForDevices fails", async () => {
				(<any>androidDeviceDiscovery).startLookingForDevices =
					(): Promise<void> => {
						throw new Error("my error");
					};
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				const hostInfo = testInjector.resolve("hostInfo");
				hostInfo.isDarwin = true;
				await devicesService.initialize({
					platform: "ios",
					deviceId: iOSDevice.deviceInfo.identifier,
				});
				assert.isTrue(logger.traceOutput.indexOf("my error") !== -1);
			});

			it("does not fail when iosSimulatorDiscovery startLookingForDevices fails", async () => {
				const hostInfo = testInjector.resolve("hostInfo");
				hostInfo.isDarwin = true;
				(<any>iOSSimulatorDiscovery).startLookingForDevices =
					(): Promise<void> => {
						throw new Error("my error");
					};
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				await devicesService.initialize({
					platform: "ios",
					deviceId: iOSDevice.deviceInfo.identifier,
				});
				assert.isTrue(logger.traceOutput.indexOf("my error") !== -1);
			});
		});

		it("when initialize is called multiple times, only first execution does the actual work", async () => {
			let initializeCoreCalledCounter = 0;
			(<any>devicesService).initializeCore = async () =>
				initializeCoreCalledCounter++;
			for (let i = 0; i < 4; i++) {
				await devicesService.initialize();
			}

			assert.equal(initializeCoreCalledCounter, 1);
		});

		it("when initialize is called multiple times and initializeCore fails, each execution tries to initialize the service", async () => {
			const expectedError = new Error("err");
			let initializeCoreCalledCounter = 0;

			(<any>devicesService).initializeCore = async () => {
				initializeCoreCalledCounter++;
				throw expectedError;
			};

			const calledCounter = 4;
			for (let i = 0; i < calledCounter; i++) {
				await assert.isRejected(devicesService.initialize(), expectedError);
			}

			assert.equal(initializeCoreCalledCounter, calledCounter);
		});

		it("when initialize is called with platform and deviceId and such device cannot be found", async () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);

			const expectedErrorMessage = getErrorMessage(
				testInjector,
				"NotFoundDeviceByIdentifierErrorMessageWithIdentifier",
				androidDevice.deviceInfo.identifier,
			);
			await assert.isRejected(
				devicesService.initialize({
					platform: "android",
					deviceId: androidDevice.deviceInfo.identifier,
				}),
				expectedErrorMessage,
			);
		});

		it("when initialize is called with platform and deviceId and device's platform is different", async () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			iOSDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSDevice,
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			await assert.isRejected(
				devicesService.initialize({
					platform: "ios",
					deviceId: androidDevice.deviceInfo.identifier,
				}),
				constants.ERROR_CANNOT_RESOLVE_DEVICE,
			);
		});

		describe("when only deviceIdentifier is passed", () => {
			const assertAllMethodsResults = async (deviceId: string) => {
				assert.isFalse(
					devicesService.hasDevices,
					"Initially devicesService hasDevices must be false.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidDevice,
				);
				await devicesService.initialize({ deviceId: deviceId });
				assert.deepStrictEqual(devicesService.platform, "android");
				assert.deepStrictEqual(devicesService.deviceCount, 1);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					tempDevice,
				);
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				assert.isTrue(
					devicesService.hasDevices,
					"After emitting and initializing, hasDevices must be true",
				);
				assert.deepStrictEqual(devicesService.getDeviceInstances(), [
					androidDevice,
					tempDevice,
					iOSDevice,
				]);
				assert.deepStrictEqual(devicesService.getDevices(), [
					androidDevice.deviceInfo,
					tempDevice.deviceInfo,
					iOSDevice.deviceInfo,
				]);
				assert.deepStrictEqual(devicesService.deviceCount, 1);
				counter = 0;
				await devicesService.execute(() => {
					counter++;
					return Promise.resolve();
				});
				assert.deepStrictEqual(
					counter,
					1,
					"The action must be executed on only one device.",
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => false,
				);
				assert.deepStrictEqual(
					counter,
					0,
					"The action must not be executed when canExecute returns false.",
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => true,
				);
				assert.deepStrictEqual(
					counter,
					1,
					"The action must be executed on only one device.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_LOST,
					androidDevice,
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_LOST,
					tempDevice,
				);
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_LOST,
					iOSDevice,
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => true,
					{ allowNoDevices: true },
				);
				assert.deepStrictEqual(
					counter,
					0,
					"The action must not be executed when there are no devices.",
				);
				assert.isTrue(logger.output.indexOf(constants.ERROR_NO_DEVICES) !== -1);
			};

			it("when deviceId is deviceIdentifier", async () => {
				await assertAllMethodsResults(androidDevice.deviceInfo.identifier);
			});

			it("when deviceId is index", async () => {
				await assertAllMethodsResults("1");
			});

			it("fails when deviceId is invalid index (less than 0)", async () => {
				const expectedErrorMessage = getErrorMessage(
					testInjector,
					"NotFoundDeviceByIndexErrorMessage",
					"-2",
				);
				await assert.isRejected(
					devicesService.initialize({ deviceId: "-1" }),
					expectedErrorMessage,
				);
			});

			it("fails when deviceId is invalid index (more than currently connected devices)", async () => {
				const expectedErrorMessage = getErrorMessage(
					testInjector,
					"NotFoundDeviceByIndexErrorMessage",
					"99",
				);
				await assert.isRejected(
					devicesService.initialize({ deviceId: "100" }),
					expectedErrorMessage,
				);
			});

			it("does not fail when iOSDeviceDiscovery startLookingForDevices fails", async () => {
				(<any>iOSDeviceDiscovery).startLookingForDevices =
					(): Promise<void> => {
						throw new Error("my error");
					};
				await assertAllMethodsResults("1");
				assert.isTrue(logger.traceOutput.indexOf("my error") !== -1);
			});

			it("does not fail when androidDeviceDiscovery startLookingForDevices fails", async () => {
				(<any>androidDeviceDiscovery).startLookingForDevices =
					(): Promise<void> => {
						throw new Error("my error");
					};
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				await devicesService.initialize({
					deviceId: iOSDevice.deviceInfo.identifier,
				});
				assert.isTrue(logger.traceOutput.indexOf("my error") !== -1);
			});
		});

		describe("when only platform is passed", () => {
			it("initialize fails when platform is iOS on non-Darwin platform and there are no devices attached when --emulator is passed", async () => {
				testInjector.resolve("hostInfo").isDarwin = false;
				await assert.isRejected(
					devicesService.initialize({ platform: "ios" }),
					constants.ERROR_NO_DEVICES_CANT_USE_IOS_SIMULATOR,
				);
			});

			it("initialize fails when platform is iOS on non-Darwin platform and there are no devices attached", async () => {
				testInjector.resolve("hostInfo").isDarwin = false;
				await assert.isRejected(
					devicesService.initialize({ platform: "ios" }),
					constants.ERROR_NO_DEVICES_CANT_USE_IOS_SIMULATOR,
				);
				assert.isFalse(devicesService.hasDevices, "MUST BE FALSE!!!");
			});

			it("executes action only on iOS Simulator when iOS device is found and --emulator is passed", async () => {
				testInjector.resolve("options").emulator = true;
				testInjector.resolve("hostInfo").isDarwin = true;
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				await devicesService.initialize({ platform: "ios", emulator: true });
				let deviceIdentifier: string;
				counter = 0;
				await devicesService.execute((d: Mobile.IDevice) => {
					deviceIdentifier = d.deviceInfo.identifier;
					counter++;
					return Promise.resolve();
				});
				assert.deepStrictEqual(
					counter,
					1,
					"The action must be executed on only one device. ASAAS",
				);
				assert.deepStrictEqual(
					deviceIdentifier,
					iOSSimulator.deviceInfo.identifier,
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => false,
				);
				assert.deepStrictEqual(
					counter,
					0,
					"The action must not be executed when canExecute returns false.",
				);
				counter = 0;
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_LOST,
					iOSDevice,
				);
				deviceIdentifier = null;
				await devicesService.execute((d: Mobile.IDevice) => {
					deviceIdentifier = d.deviceInfo.identifier;
					counter++;
					return Promise.resolve();
				});
				assert.deepStrictEqual(
					counter,
					1,
					"The action must be executed on only one device.",
				);
				assert.deepStrictEqual(
					deviceIdentifier,
					iOSSimulator.deviceInfo.identifier,
				);
				counter = 0;
				deviceIdentifier = null;
				await devicesService.execute(
					(d: Mobile.IDevice) => {
						deviceIdentifier = d.deviceInfo.identifier;
						counter++;
						return Promise.resolve();
					},
					() => false,
				);
				assert.deepStrictEqual(
					counter,
					0,
					"The action must not be executed when canExecute returns false.",
				);
				assert.deepStrictEqual(deviceIdentifier, null);
			});

			it("all methods work as expected", async () => {
				assert.isFalse(
					devicesService.hasDevices,
					"Initially devicesService hasDevices must be false.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidDevice,
				);
				await devicesService.initialize({ platform: "android" });
				assert.deepStrictEqual(devicesService.platform, "android");
				assert.deepStrictEqual(devicesService.deviceCount, 1);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					tempDevice,
				);
				assert.isTrue(
					devicesService.hasDevices,
					"After emitting and initializing, hasDevices must be true",
				);
				assert.deepStrictEqual(devicesService.getDeviceInstances(), [
					androidDevice,
					tempDevice,
				]);
				assert.deepStrictEqual(devicesService.getDevices(), [
					androidDevice.deviceInfo,
					tempDevice.deviceInfo,
				]);
				assert.deepStrictEqual(devicesService.deviceCount, 2);
				counter = 0;
				await devicesService.execute(() => {
					counter++;
					return Promise.resolve();
				});
				assert.deepStrictEqual(
					counter,
					2,
					"The action must be executed on two devices.",
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => false,
				);
				assert.deepStrictEqual(
					counter,
					0,
					"The action must not be executed when canExecute returns false.",
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => true,
				);
				assert.deepStrictEqual(
					counter,
					2,
					"The action must be executed on two devices.",
				);
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_LOST,
					androidDevice,
				);
				counter = 0;
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => true,
				);
				assert.deepStrictEqual(
					counter,
					1,
					"The action must be executed on only one device.",
				);
				counter = 0;
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_LOST,
					tempDevice,
				);
				await devicesService.execute(
					() => {
						counter++;
						return Promise.resolve();
					},
					() => true,
					{ allowNoDevices: true },
				);
				assert.deepStrictEqual(
					counter,
					0,
					"The action must not be executed when there are no devices.",
				);
				assert.isTrue(logger.output.indexOf(constants.ERROR_NO_DEVICES) !== -1);
				assert.isFalse(androidEmulatorServices.isStartEmulatorCalled);
			});
		});

		it("when only skipInferPlatform is passed (true)", async () => {
			mockSetInterval();
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			iOSDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSDevice,
			);
			await devicesService.initialize({ skipInferPlatform: true });
			assert.deepStrictEqual(devicesService.platform, undefined);
			assert.deepStrictEqual(devicesService.deviceCount, 2);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				tempDevice,
			);
			assert.isTrue(
				devicesService.hasDevices,
				"After emitting and initializing, hasDevices must be true",
			);
			assert.deepStrictEqual(devicesService.getDeviceInstances(), [
				androidDevice,
				iOSDevice,
				tempDevice,
			]);
			assert.deepStrictEqual(devicesService.getDevices(), [
				androidDevice.deviceInfo,
				iOSDevice.deviceInfo,
				tempDevice.deviceInfo,
			]);
			assert.deepStrictEqual(devicesService.deviceCount, 3);
			counter = 0;
			await devicesService.execute(() => {
				counter++;
				return Promise.resolve();
			});
			assert.deepStrictEqual(
				counter,
				3,
				"The action must be executed on two devices.",
			);
			counter = 0;
			await devicesService.execute(
				() => {
					counter++;
					return Promise.resolve();
				},
				() => false,
			);
			assert.deepStrictEqual(
				counter,
				0,
				"The action must not be executed when canExecute returns false.",
			);
			counter = 0;
			await devicesService.execute(
				() => {
					counter++;
					return Promise.resolve();
				},
				() => true,
			);
			assert.deepStrictEqual(
				counter,
				3,
				"The action must be executed on three devices.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_LOST,
				androidDevice,
			);
			counter = 0;
			await devicesService.execute(
				() => {
					counter++;
					return Promise.resolve();
				},
				() => true,
			);
			assert.deepStrictEqual(
				counter,
				2,
				"The action must be executed on two devices.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_LOST,
				tempDevice,
			);
			iOSDeviceDiscovery.emit(DeviceDiscoveryEventNames.DEVICE_LOST, iOSDevice);
			counter = 0;
			await devicesService.execute(
				() => {
					counter++;
					return Promise.resolve();
				},
				() => true,
				{ allowNoDevices: true },
			);
			assert.deepStrictEqual(
				counter,
				0,
				"The action must not be executed when there are no devices.",
			);
			assert.isTrue(logger.output.indexOf(constants.ERROR_NO_DEVICES) !== -1);
		});

		it("when parameters are not passed and devices with same platform are detected", async () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			await devicesService.initialize();
			assert.deepStrictEqual(devicesService.platform, "android");
			assert.deepStrictEqual(devicesService.deviceCount, 1);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				tempDevice,
			);
			assert.isTrue(
				devicesService.hasDevices,
				"After emitting and initializing, hasDevices must be true",
			);
			assert.deepStrictEqual(devicesService.getDeviceInstances(), [
				androidDevice,
				tempDevice,
			]);
			assert.deepStrictEqual(devicesService.getDevices(), [
				androidDevice.deviceInfo,
				tempDevice.deviceInfo,
			]);
			assert.deepStrictEqual(devicesService.deviceCount, 2);
			counter = 0;
			await devicesService.execute(() => {
				counter++;
				return Promise.resolve();
			});
			assert.deepStrictEqual(
				counter,
				2,
				"The action must be executed on two devices.",
			);
			counter = 0;
			await devicesService.execute(
				() => {
					counter++;
					return Promise.resolve();
				},
				() => false,
			);
			assert.deepStrictEqual(
				counter,
				0,
				"The action must not be executed when canExecute returns false.",
			);
			counter = 0;
			await devicesService.execute(
				() => {
					counter++;
					return Promise.resolve();
				},
				() => true,
			);
			assert.deepStrictEqual(
				counter,
				2,
				"The action must be executed on two devices.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_LOST,
				androidDevice,
			);
			counter = 0;
			await devicesService.execute(
				() => {
					counter++;
					return Promise.resolve();
				},
				() => true,
			);
			assert.deepStrictEqual(
				counter,
				1,
				"The action must be executed on only one device.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_LOST,
				tempDevice,
			);
			counter = 0;
			await devicesService.execute(
				() => {
					counter++;
					return Promise.resolve();
				},
				() => true,
				{ allowNoDevices: true },
			);
			assert.deepStrictEqual(
				counter,
				0,
				"The action must not be executed when there are no devices.",
			);
			assert.isTrue(logger.output.indexOf(constants.ERROR_NO_DEVICES) !== -1);
		});

		it("when parameters are not passed and devices with different platforms are detected initialize should throw", async () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			iOSDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSDevice,
			);
			await assert.isRejected(
				devicesService.initialize(),
				"Multiple device platforms detected (android and ios). Specify platform or device on command line.",
			);
		});

		it("caches execution result and does not execute next time when called", async () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			await devicesService.initialize({ platform: "android" });
			assert.deepStrictEqual(devicesService.platform, "android");
			assert.deepStrictEqual(devicesService.deviceCount, 1);
			await devicesService.initialize({ platform: "ios" });
			assert.deepStrictEqual(devicesService.platform, "android");
		});

		describe("when options.emulator is true on non-Darwin OS", () => {
			beforeEach(() => {
				const options = testInjector.resolve("options");
				options.emulator = true;
				const hostInfo = testInjector.resolve("hostInfo");
				hostInfo.isDarwin = false;
			});

			it("throws when iOS platform is specified and iOS device identifier is passed", async () => {
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				await assert.isRejected(
					devicesService.initialize({
						platform: "ios",
						deviceId: iOSDevice.deviceInfo.identifier,
					}),
					constants.ERROR_CANT_USE_SIMULATOR,
				);
			});

			it("throws when iOS device identifier is passed", async () => {
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				await assert.isRejected(
					devicesService.initialize({
						deviceId: iOSDevice.deviceInfo.identifier,
					}),
					constants.ERROR_CANT_USE_SIMULATOR,
				);
			});

			it("throws when iOS platform is specified", async () => {
				await assert.isRejected(
					devicesService.initialize({ platform: "ios" }),
					constants.ERROR_NO_DEVICES_CANT_USE_IOS_SIMULATOR,
				);
			});

			it("throws when paramaters are not passed, but iOS device is detected", async () => {
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				await assert.isRejected(
					devicesService.initialize(),
					constants.ERROR_CANT_USE_SIMULATOR,
				);
			});

			it("does not throw when only skipInferPlatform is passed", async () => {
				mockSetInterval();
				await devicesService.initialize({ skipInferPlatform: true });
			});

			it("does not throw when Android platform is specified and Android device identifier is passed", async () => {
				androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidDevice,
				);
				await devicesService.initialize({
					platform: "android",
					deviceId: androidDevice.deviceInfo.identifier,
				});
			});
		});

		describe("does not fail on Darwin when trying to use iOS simulator", () => {
			beforeEach(() => {
				const options = testInjector.resolve("options");
				options.emulator = true;
				const hostInfo = testInjector.resolve("hostInfo");
				hostInfo.isDarwin = true;
			});

			it("when iOS platform is specified and iOS device identifier is passed", async () => {
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				await devicesService.initialize({
					platform: "ios",
					deviceId: iOSDevice.deviceInfo.identifier,
				});
			});

			it("when iOS device identifier is passed", async () => {
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				await devicesService.initialize({
					deviceId: iOSDevice.deviceInfo.identifier,
				});
			});

			it("when iOS platform is specified", async () => {
				await devicesService.initialize({ platform: "ios" });
			});

			it("when paramaters are not passed, but iOS device is detected", async () => {
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
				await devicesService.initialize();
			});

			it("when only skipInferPlatform is passed", async () => {
				await devicesService.initialize({ skipInferPlatform: true });
			});

			it("when iOS platform is specified and iOS simulator device identifier is passed", async () => {
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSSimulator,
				);
				await devicesService.initialize({
					platform: "ios",
					deviceId: iOSSimulator.deviceInfo.identifier,
				});
			});

			it("when iOS simulator identifier is passed", async () => {
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSSimulator,
				);
				await devicesService.initialize({
					deviceId: iOSSimulator.deviceInfo.identifier,
				});
			});

			it("when paramaters are not passed, but iOS simulator is detected", async () => {
				iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSSimulator,
				);
				await devicesService.initialize();
			});
		});
	});

	describe("setLogLevel", () => {
		it("calls deviceLogProvider's setLogLevel with correct arguments", () => {
			const deviceLogProvider = testInjector.resolve("deviceLogProvider");
			let actualLogLevel: string = null;
			let actualDeviceIdentifier: string = null;

			deviceLogProvider.setLogLevel = (
				logLevel: string,
				deviceIdentifier?: string,
			) => {
				actualLogLevel = logLevel;
				actualDeviceIdentifier = deviceIdentifier;
			};

			const expectedLogLevel = "expectedLogLevel",
				expectedDeviceId = "expcetedDeviceId";

			devicesService.setLogLevel(expectedLogLevel, expectedDeviceId);
			assert.deepStrictEqual(actualLogLevel, expectedLogLevel);
			assert.deepStrictEqual(actualDeviceIdentifier, expectedDeviceId);

			devicesService.setLogLevel(expectedLogLevel);
			assert.deepStrictEqual(actualLogLevel, expectedLogLevel);
			assert.deepStrictEqual(actualDeviceIdentifier, undefined);
		});
	});

	describe("deployOnDevices", () => {
		beforeEach(() => {
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			iOSDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSDevice,
			);
		});

		it("returns undefined for each device on which the app is installed", async () => {
			const results = devicesService.deployOnDevices(
				[androidDevice.deviceInfo.identifier, iOSDevice.deviceInfo.identifier],
				"path",
				"packageName",
				"cordova",
				"",
			);
			assert.isTrue(results.length > 0);
			_.each(await Promise.all(results), (deployOnDevicesResult) => {
				const realResult = deployOnDevicesResult;
				assert.isTrue(
					realResult === undefined,
					"On success, undefined should be returned.",
				);
			});
		});

		it("throws error when invalid identifier is passed", async () => {
			const results = devicesService.deployOnDevices(
				["invalidDeviceId", iOSDevice.deviceInfo.identifier],
				"path",
				"packageName",
				"cordova",
				"",
			);
			const expectedErrorMessage = getErrorMessage(
				testInjector,
				"NotFoundDeviceByIdentifierErrorMessageWithIdentifier",
				"invalidDeviceId",
			);
			await assert.isRejected(Promise.all(results), expectedErrorMessage);
			const realResults = await getPromisesResults(results);
			_.each(realResults, (singlePromiseResult) => {
				const error = singlePromiseResult.error;
				if (error) {
					assert.isTrue(
						error.message.indexOf("invalidDeviceId") !== -1,
						"The message must contain the id of the invalid device.",
					);
				} else {
					assert.isTrue(
						singlePromiseResult.result === undefined,
						"On success, undefined should be returned.",
					);
				}
			});
		});
	});

	describe("getDevicesForPlatform", () => {
		it("returns empty array when there are no devices", () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			assert.deepStrictEqual(
				devicesService.getDevicesForPlatform("android"),
				[],
			);
			assert.deepStrictEqual(devicesService.getDevicesForPlatform("ios"), []);
			assert.deepStrictEqual(
				devicesService.getDevicesForPlatform("invalid platform"),
				[],
			);
		});

		it("returns correct results when devices with different platforms are detected", () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			iOSDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSDevice,
			);
			const tempDeviceInstance = {
				deviceInfo: { identifier: "temp-device", platform: "android" },
			};
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				tempDeviceInstance,
			);
			assert.deepStrictEqual(devicesService.getDevicesForPlatform("android"), [
				androidDevice,
				tempDeviceInstance,
			]);
			assert.deepStrictEqual(devicesService.getDevicesForPlatform("ios"), [
				iOSDevice,
			]);
			assert.deepStrictEqual(
				devicesService.getDevicesForPlatform("invalid platform"),
				[],
			);
		});

		it("returns correct results when devices with different platforms are detected, assert case insensitivity", () => {
			assert.isFalse(
				devicesService.hasDevices,
				"Initially devicesService hasDevices must be false.",
			);
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			iOSDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSDevice,
			);
			const tempDeviceInstance = {
				deviceInfo: { identifier: "temp-device", platform: "AndroId" },
			};
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				tempDeviceInstance,
			);
			assert.deepStrictEqual(devicesService.getDevicesForPlatform("android"), [
				androidDevice,
				tempDeviceInstance,
			]);
			assert.deepStrictEqual(devicesService.getDevicesForPlatform("ios"), [
				iOSDevice,
			]);
			assert.deepStrictEqual(
				devicesService.getDevicesForPlatform("invalid platform"),
				[],
			);

			assert.deepStrictEqual(devicesService.getDevicesForPlatform("AnDroID"), [
				androidDevice,
				tempDeviceInstance,
			]);
			assert.deepStrictEqual(devicesService.getDevicesForPlatform("Ios"), [
				iOSDevice,
			]);
			assert.deepStrictEqual(
				devicesService.getDevicesForPlatform("inValid PlatForm"),
				[],
			);

			assert.deepStrictEqual(devicesService.getDevicesForPlatform("ANDROID"), [
				androidDevice,
				tempDeviceInstance,
			]);
			assert.deepStrictEqual(devicesService.getDevicesForPlatform("IOS"), [
				iOSDevice,
			]);
			assert.deepStrictEqual(
				devicesService.getDevicesForPlatform("INVALID PLATFORM"),
				[],
			);
		});
	});

	describe("isAndroidDevice", () => {
		it("returns true when android device is passed", () => {
			assert.isTrue(devicesService.isAndroidDevice(<any>androidDevice));
		});

		it("returns true when android emulator is passed", () => {
			assert.isTrue(
				devicesService.isAndroidDevice(<any>{
					deviceInfo: { platform: "android" },
					isEmulator: true,
				}),
			);
		});

		it("returns true when android device is passed, assert case insensitivity", () => {
			assert.isTrue(
				devicesService.isAndroidDevice(<any>{
					deviceInfo: { platform: "aNdRoId" },
				}),
			);
			assert.isTrue(
				devicesService.isAndroidDevice(<any>{
					deviceInfo: { platform: "ANDROID" },
				}),
			);
		});

		it("returns false when iOS device is passed", () => {
			assert.isFalse(devicesService.isAndroidDevice(<any>iOSDevice));
			assert.isFalse(devicesService.isAndroidDevice(<any>iOSSimulator));
		});

		it("returns false when device with invalid platform is passed", () => {
			assert.isFalse(
				devicesService.isAndroidDevice(<any>{
					deviceInfo: { platform: "invalid platform" },
				}),
			);
		});
	});

	describe("isiOSDevice", () => {
		it("returns true when iOS device is passed", () => {
			assert.isTrue(devicesService.isiOSDevice(<any>iOSDevice));
		});

		it("returns true when iOS device is passed, assert case insensitivity", () => {
			assert.isTrue(
				devicesService.isiOSDevice(<any>{ deviceInfo: { platform: "iOs" } }),
			);
			assert.isTrue(
				devicesService.isiOSDevice(<any>{ deviceInfo: { platform: "IOS" } }),
			);
		});

		it("returns false when android device is passed", () => {
			assert.isFalse(devicesService.isiOSDevice(<any>androidDevice));
		});

		it("returns false when device with invalid platform is passed", () => {
			assert.isFalse(
				devicesService.isiOSDevice(<any>{
					deviceInfo: { platform: "invalid platform" },
				}),
			);
		});

		it("returns false when iOS emulator is passed", () => {
			assert.isFalse(devicesService.isiOSDevice(<any>iOSSimulator));
		});
	});

	describe("isiOSSimulator", () => {
		it("returns true when iOS simulator is passed", () => {
			assert.isTrue(devicesService.isiOSSimulator(<any>iOSSimulator));
		});

		it("returns true when iOS simulator is passed, assert case insensitivity", () => {
			assert.isTrue(
				devicesService.isiOSSimulator(<any>{
					deviceInfo: { platform: "iOs" },
					isEmulator: true,
				}),
			);
			assert.isTrue(
				devicesService.isiOSSimulator(<any>{
					deviceInfo: { platform: "IOS" },
					isEmulator: true,
				}),
			);
		});

		it("returns false when iOS device is passed", () => {
			assert.isFalse(devicesService.isiOSSimulator(<any>iOSDevice));
		});

		it("returns false when Androd device or Android Emulator is passed", () => {
			assert.isFalse(devicesService.isiOSSimulator(<any>androidDevice));
			assert.isFalse(
				devicesService.isiOSSimulator(<any>{
					deviceInfo: { platform: "android" },
					isEmulator: true,
				}),
			);
		});

		it("returns false when device with invalid platform is passed", () => {
			assert.isFalse(
				devicesService.isiOSSimulator(<any>{
					deviceInfo: { platform: "invalid platform" },
				}),
			);
		});
	});

	describe("getDeviceByDeviceOption", () => {
		it("returns undefined when devicesService is not initialized", () => {
			assert.deepStrictEqual(
				devicesService.getDeviceByDeviceOption(),
				undefined,
			);
		});

		it("returns undefined when devicesService is initialized with platform only", async () => {
			await devicesService.initialize({ platform: "android" });
			assert.deepStrictEqual(
				devicesService.getDeviceByDeviceOption(),
				undefined,
			);
		});

		it("returns undefined when devicesService is initialized with skipInferPlatform only", async () => {
			await devicesService.initialize({ skipInferPlatform: true });
			assert.deepStrictEqual(
				devicesService.getDeviceByDeviceOption(),
				undefined,
			);
		});

		it("returns deviceIdentifier when devicesService is initialized with deviceId only", async () => {
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			await devicesService.initialize({
				deviceId: androidDevice.deviceInfo.identifier,
			});
			assert.deepStrictEqual(
				devicesService.getDeviceByDeviceOption(),
				androidDevice,
			);
		});

		it("returns deviceIdentifier when devicesService is initialized with deviceId (passed as number)", async () => {
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			await devicesService.initialize({ deviceId: "1" });
			assert.deepStrictEqual(
				devicesService.getDeviceByDeviceOption(),
				androidDevice,
			);
		});

		it("returns deviceIdentifier when devicesService is initialized with deviceId and platform", async () => {
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			await devicesService.initialize({
				deviceId: androidDevice.deviceInfo.identifier,
				platform: "android",
			});
			assert.deepStrictEqual(
				devicesService.getDeviceByDeviceOption(),
				androidDevice,
			);
		});

		it("returns deviceIdentifier when devicesService is initialized with deviceId (passed as number) and platform", async () => {
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			await devicesService.initialize({ deviceId: "1", platform: "android" });
			assert.deepStrictEqual(
				devicesService.getDeviceByDeviceOption(),
				androidDevice,
			);
		});
	});

	describe("startDeviceDetectionInterval", () => {
		let setIntervalsCalledCount: number;

		beforeEach(() => {
			setIntervalsCalledCount = 0;
			mockSetInterval();
		});

		afterEach(async () => {
			resetDefaultSetInterval();
		});

		it("should start device detection interval.", async () => {
			let hasStartedDeviceDetectionInterval = false;

			mockSetInterval(() => {
				hasStartedDeviceDetectionInterval = true;
			});

			devicesService.startDeviceDetectionInterval();

			assert.isTrue(hasStartedDeviceDetectionInterval);
		});

		it("should not start device detection interval if there is one running.", async () => {
			(<any>global).setInterval = (
				callback: (...args: any[]) => void,
				ms: number,
				...args: any[]
			): any => {
				const execution = async () => {
					await callback();
				};

				/* tslint:disable:no-floating-promises */
				execution();
				/* tslint:enable:no-floating-promises */

				return {
					ref: () => {
						/* no implementation required */
					},
					unref: () => {
						setIntervalsCalledCount++;
						return intervalId++;
					},
				};
			};

			devicesService.startDeviceDetectionInterval();
			devicesService.startDeviceDetectionInterval();
			devicesService.startDeviceDetectionInterval();

			assert.deepStrictEqual(setIntervalsCalledCount, 1);
		});

		describe("ios devices check", () => {
			let $iOSDeviceDiscovery: Mobile.IDeviceDiscovery;

			beforeEach(() => {
				$iOSDeviceDiscovery = testInjector.resolve("iOSDeviceDiscovery");
			});

			it("should check for ios devices.", async () => {
				let hasCheckedForIosDevices = false;

				$iOSDeviceDiscovery.startLookingForDevices =
					async (): Promise<void> => {
						hasCheckedForIosDevices = true;
					};

				devicesService.startDeviceDetectionInterval();

				assert.isTrue(hasCheckedForIosDevices);
			});

			it("should not throw if ios device check fails throws an exception.", async () => {
				(<any>$iOSDeviceDiscovery).checkForDevices = throwErrorFunction;

				let hasUnhandledRejection = false;
				process.on(
					"unhandledRejection",
					(reason: any, promise: Promise<any>) => {
						hasUnhandledRejection = true;
					},
				);

				devicesService.startDeviceDetectionInterval();

				await assertOnNextTick(() => assert.isFalse(hasUnhandledRejection));
			});
		});

		describe("android devices check", () => {
			let $androidDeviceDiscovery: Mobile.IAndroidDeviceDiscovery;

			beforeEach(() => {
				$androidDeviceDiscovery = testInjector.resolve(
					"androidDeviceDiscovery",
				);
			});

			it("should start interval that will check for android devices.", async () => {
				let hasCheckedForAndroidDevices = false;

				$androidDeviceDiscovery.startLookingForDevices =
					async (): Promise<void> => {
						hasCheckedForAndroidDevices = true;
					};

				mockSetInterval();
				devicesService.startDeviceDetectionInterval();
				await assertOnNextTick(() =>
					assert.isTrue(hasCheckedForAndroidDevices),
				);
			});

			it("should not throw if android device check fails throws an exception.", async () => {
				$androidDeviceDiscovery.startLookingForDevices = throwErrorFunction;
				let hasUnhandledRejection = false;
				process.on(
					"unhandledRejection",
					(reason: any, promise: Promise<any>) => {
						hasUnhandledRejection = true;
					},
				);

				devicesService.startDeviceDetectionInterval();

				await assertOnNextTick(() => assert.isFalse(hasUnhandledRejection));
			});
		});

		describe("ios simulator check", () => {
			let $iOSSimulatorDiscovery: Mobile.IDeviceDiscovery;
			let $hostInfo: IHostInfo;

			beforeEach(() => {
				$iOSSimulatorDiscovery = testInjector.resolve("iOSSimulatorDiscovery");
				(<any>$iOSSimulatorDiscovery).checkForDevices =
					async (): Promise<void> => {
						/** */
					};

				$hostInfo = testInjector.resolve("hostInfo");
				$hostInfo.isDarwin = true;
			});

			it("should not throw if ios simulator check fails throws an exception.", async () => {
				(<any>$iOSSimulatorDiscovery).checkForDevices = throwErrorFunction;

				let hasUnhandledRejection = false;
				process.on(
					"unhandledRejection",
					(reason: any, promise: Promise<any>) => {
						hasUnhandledRejection = true;
					},
				);

				devicesService.startDeviceDetectionInterval();

				await assertOnNextTick(() => assert.isFalse(hasUnhandledRejection));
			});
		});

		describe("custom devices check", () => {
			let customDeviceDiscovery: Mobile.IDeviceDiscovery;

			beforeEach(() => {
				customDeviceDiscovery = testInjector.resolve(CustomDeviceDiscoveryStub);
				devicesService.addDeviceDiscovery(customDeviceDiscovery);
			});

			it("should check for devices in interval", async () => {
				let hasCheckedForDevices = false;

				customDeviceDiscovery.startLookingForDevices =
					async (): Promise<void> => {
						hasCheckedForDevices = true;
					};

				mockSetInterval();
				devicesService.startDeviceDetectionInterval();

				await assertOnNextTick(() => assert.isTrue(hasCheckedForDevices));
			});

			it("should not throw if device check fails throws an exception.", async () => {
				customDeviceDiscovery.startLookingForDevices = throwErrorFunction;

				let hasUnhandledRejection = false;
				process.on(
					"unhandledRejection",
					(reason: any, promise: Promise<any>) => {
						hasUnhandledRejection = true;
					},
				);

				devicesService.startDeviceDetectionInterval();

				await assertOnNextTick(() => assert.isFalse(hasUnhandledRejection));
			});
		});

		describe("check for application updates", () => {
			let $iOSDeviceDiscovery: Mobile.IDeviceDiscovery;
			let $androidDeviceDiscovery: Mobile.IAndroidDeviceDiscovery;
			let hasCheckedForAndroidAppUpdates: boolean;
			let hasCheckedForIosAppUpdates: boolean;

			beforeEach(() => {
				hasCheckedForAndroidAppUpdates = false;
				hasCheckedForIosAppUpdates = false;
				$iOSDeviceDiscovery = testInjector.resolve("iOSDeviceDiscovery");
				$androidDeviceDiscovery = testInjector.resolve(
					"androidDeviceDiscovery",
				);

				androidDevice.applicationManager.checkForApplicationUpdates =
					async (): Promise<void> => {
						hasCheckedForAndroidAppUpdates = true;
					};

				iOSDevice.applicationManager.checkForApplicationUpdates =
					async (): Promise<void> => {
						hasCheckedForIosAppUpdates = true;
					};

				$androidDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					androidDevice,
				);
				$iOSDeviceDiscovery.emit(
					DeviceDiscoveryEventNames.DEVICE_FOUND,
					iOSDevice,
				);
			});

			it("should check for application updates for all connected devices.", async () => {
				devicesService.startDeviceDetectionInterval();

				await assertOnNextTick(() => {
					assert.isTrue(hasCheckedForAndroidAppUpdates);
					assert.isTrue(hasCheckedForIosAppUpdates);
				});
			});

			it("should check for application updates if the check on one device throws an exception.", async () => {
				iOSDevice.applicationManager.checkForApplicationUpdates =
					throwErrorFunction;

				devicesService.startDeviceDetectionInterval();

				await assertOnNextTick(() =>
					assert.isTrue(hasCheckedForAndroidAppUpdates),
				);
			});

			it("should check for application updates only on devices with status Connected", async () => {
				androidDevice.deviceInfo.status = constants.UNREACHABLE_STATUS;
				devicesService.startDeviceDetectionInterval();

				await assertOnNextTick(() => {
					assert.isFalse(hasCheckedForAndroidAppUpdates);
					assert.isTrue(hasCheckedForIosAppUpdates);
				});
			});

			it("should not throw if all checks for application updates on all devices throw exceptions.", () => {
				iOSDevice.applicationManager.checkForApplicationUpdates =
					throwErrorFunction;
				androidDevice.applicationManager.checkForApplicationUpdates =
					throwErrorFunction;

				const callback = () => {
					devicesService.startDeviceDetectionInterval.call(devicesService);
				};

				assert.doesNotThrow(callback);
			});
		});
	});

	describe("detectCurrentlyAttachedDevices", () => {
		let $androidDeviceDiscovery: Mobile.IAndroidDeviceDiscovery;
		let $iOSDeviceDiscovery: Mobile.IDeviceDiscovery;
		let $iOSSimulatorDiscovery: Mobile.IDeviceDiscovery;
		let $hostInfo: IHostInfo;

		beforeEach(() => {
			$hostInfo = testInjector.resolve("hostInfo");
			$androidDeviceDiscovery = testInjector.resolve("androidDeviceDiscovery");
			$iOSDeviceDiscovery = testInjector.resolve("iOSDeviceDiscovery");
			$iOSSimulatorDiscovery = testInjector.resolve("iOSSimulatorDiscovery");
		});

		it("should start looking for android devices.", async () => {
			let hasStartedLookingForAndroidDevices = false;

			$androidDeviceDiscovery.startLookingForDevices =
				async (): Promise<void> => {
					hasStartedLookingForAndroidDevices = true;
				};

			await devicesService.detectCurrentlyAttachedDevices();

			assert.isTrue(hasStartedLookingForAndroidDevices);
		});

		it("should start looking for ios devices.", async () => {
			let hasStartedLookingForIosDevices = false;

			$iOSDeviceDiscovery.startLookingForDevices = async (): Promise<void> => {
				hasStartedLookingForIosDevices = true;
			};

			await devicesService.detectCurrentlyAttachedDevices();

			assert.isTrue(hasStartedLookingForIosDevices);
		});

		const assertNotThrowing = async (deviceDiscoveries: {
			deviceDiscoveriesThatWork: Mobile.IDeviceDiscovery[];
			deviceDiscoveriesThatThrow: Mobile.IDeviceDiscovery[];
		}) => {
			$hostInfo.isDarwin = true;

			const workingDeviceDiscoveriesCalled: boolean[] = [];

			_.each(deviceDiscoveries.deviceDiscoveriesThatWork, (deviceDiscovery) => {
				deviceDiscovery.startLookingForDevices = async (): Promise<void> => {
					workingDeviceDiscoveriesCalled.push(true);
				};
			});

			_.each(
				deviceDiscoveries.deviceDiscoveriesThatThrow,
				(deviceDiscovery) => {
					deviceDiscovery.startLookingForDevices = throwErrorFunction;
				},
			);

			await devicesService.detectCurrentlyAttachedDevices();

			assert.deepStrictEqual(
				workingDeviceDiscoveriesCalled.length,
				deviceDiscoveries.deviceDiscoveriesThatWork.length,
				"We should have called startLookingForDevices for each of the device discoveries that work.",
			);
		};

		it("should not throw if all device discovery services throw exceptions.", async () => {
			const testData: any = {
				deviceDiscoveriesThatWork: [],
				deviceDiscoveriesThatThrow: [
					$iOSDeviceDiscovery,
					$androidDeviceDiscovery,
					$iOSSimulatorDiscovery,
				],
			};
			await assertNotThrowing(testData);
		});

		it("should not throw if iOS device discovery throws an exception and should detect android devices and iOS Simulator.", async () => {
			const testData: any = {
				deviceDiscoveriesThatWork: [$iOSDeviceDiscovery],
				deviceDiscoveriesThatThrow: [
					$androidDeviceDiscovery,
					$iOSSimulatorDiscovery,
				],
			};
			await assertNotThrowing(testData);
		});

		it("should not throw if Android device discovery throws an exception and should detect iOS devices and iOS Simulator.", async () => {
			const testData: any = {
				deviceDiscoveriesThatWork: [$androidDeviceDiscovery],
				deviceDiscoveriesThatThrow: [
					$iOSDeviceDiscovery,
					$iOSSimulatorDiscovery,
				],
			};
			await assertNotThrowing(testData);
		});

		it("should not throw if iOS Simulator device discovery throws an exception and should detect iOS devices and Android devices.", async () => {
			const testData: any = {
				deviceDiscoveriesThatWork: [$iOSSimulatorDiscovery],
				deviceDiscoveriesThatThrow: [
					$iOSDeviceDiscovery,
					$androidDeviceDiscovery,
				],
			};
			await assertNotThrowing(testData);
		});
	});

	it("should call mapAbstractToTcpPort of android process service with the same parameters.", async () => {
		const expectedDeviceIdentifier = "123456789";
		const expectedAppIdentifier = "com.telerik.myapp";
		const expectedFramework = constants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova;
		let actualDeviceIdentifier: string;
		let actualAppIdentifier: string;
		let actualFramework: string;
		const $androidProcessService: Mobile.IAndroidProcessService =
			testInjector.resolve("androidProcessService");
		$androidProcessService.mapAbstractToTcpPort = async (
			deviceIdentifier: string,
			appIdentifier: string,
			framework: string,
		): Promise<string> => {
			actualDeviceIdentifier = deviceIdentifier;
			actualAppIdentifier = appIdentifier;
			actualFramework = framework;
			return "";
		};

		await devicesService.mapAbstractToTcpPort(
			expectedDeviceIdentifier,
			expectedAppIdentifier,
			expectedFramework,
		);

		assert.deepStrictEqual(actualDeviceIdentifier, expectedDeviceIdentifier);
		assert.deepStrictEqual(actualAppIdentifier, expectedAppIdentifier);
		assert.deepStrictEqual(actualFramework, expectedFramework);
	});

	it("should get debuggable apps correctly for multiple devices.", async () => {
		const $iOSDeviceDiscovery: Mobile.IDeviceDiscovery =
			testInjector.resolve("iOSDeviceDiscovery");
		const $androidDeviceDiscovery: Mobile.IAndroidDeviceDiscovery =
			testInjector.resolve("androidDeviceDiscovery");

		$androidDeviceDiscovery.emit(
			DeviceDiscoveryEventNames.DEVICE_FOUND,
			androidDevice,
		);
		$iOSDeviceDiscovery.emit(DeviceDiscoveryEventNames.DEVICE_FOUND, iOSDevice);

		const androidDebuggableApps = [
			{
				appIdentifier: "com.telerik.myapp",
				deviceIdentifier: androidDevice.deviceInfo.identifier,
				framework: constants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova,
			},
			{
				appIdentifier: "com.telerik.myapp1",
				deviceIdentifier: androidDevice.deviceInfo.identifier,
				framework: constants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript,
			},
		];

		const iosDebuggableApps = [
			{
				appIdentifier: "com.telerik.myapp2",
				deviceIdentifier: iOSDevice.deviceInfo.identifier,
				framework: constants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova,
			},
			{
				appIdentifier: "com.telerik.myapp3",
				deviceIdentifier: iOSDevice.deviceInfo.identifier,
				framework: constants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript,
			},
		];

		androidDevice.applicationManager.getDebuggableApps = async (): Promise<
			Mobile.IDeviceApplicationInformation[]
		> => {
			return androidDebuggableApps;
		};

		iOSDevice.applicationManager.getDebuggableApps = async (): Promise<
			Mobile.IDeviceApplicationInformation[]
		> => {
			return iosDebuggableApps;
		};

		const futures = devicesService.getDebuggableApps([
			androidDevice.deviceInfo.identifier,
			iOSDevice.deviceInfo.identifier,
		]);
		const debuggableAppsResult = await Promise.all(futures);
		const debuggableApps =
			_.flatten<Mobile.IDeviceApplicationInformation>(debuggableAppsResult);

		assert.deepStrictEqual(
			debuggableApps,
			_.concat(androidDebuggableApps, iosDebuggableApps),
		);
	});

	describe("getDebuggableViews", () => {
		let $androidDeviceDiscovery: Mobile.IAndroidDeviceDiscovery;
		const debuggableViews: Mobile.IDebugWebViewInfo[] = [
			{
				description: "descrition",
				webSocketDebuggerUrl: "debugurl",
				url: "url",
				type: "type",
				title: "title",
				id: "id1",
				devtoolsFrontendUrl: "frontenturl",
			},
			{
				description: "descrition1",
				webSocketDebuggerUrl: "debugurl1",
				url: "url1",
				type: "type1",
				title: "title1",
				id: "id2",
				devtoolsFrontendUrl: "frontenturl1",
			},
		];

		beforeEach(() => {
			$androidDeviceDiscovery = testInjector.resolve("androidDeviceDiscovery");

			$androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
		});

		it("should get the correct debuggable views.", async () => {
			androidDevice.applicationManager.getDebuggableAppViews = async (
				appIdentifiers: string[],
			): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> => {
				const result: any = {};
				result[appIdentifiers[0]] = debuggableViews;
				return result;
			};

			const actualDebuggableViews = await devicesService.getDebuggableViews(
				androidDevice.deviceInfo.identifier,
				"com.telerik.myapp",
			);

			assert.deepStrictEqual(actualDebuggableViews, debuggableViews);
		});

		it("should return undefined if debuggable views are found for otheer app but not for the specified.", async () => {
			androidDevice.applicationManager.getDebuggableAppViews = async (
				appIdentifiers: string[],
			): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> => {
				const result: any = {};
				result["com.telerik.otherApp"] = debuggableViews;
				return result;
			};

			const actualDebuggableViews = await devicesService.getDebuggableViews(
				androidDevice.deviceInfo.identifier,
				"com.telerik.myapp",
			);

			assert.deepStrictEqual(actualDebuggableViews, undefined);
		});
	});

	describe("getInstalledApplications", () => {
		beforeEach(() => {
			androidDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				androidDevice,
			);
			iOSDeviceDiscovery.emit(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				iOSDevice,
			);
		});

		_.each([null, undefined, "", "invalid device id"], (deviceId) => {
			it(`fails when invalid identfier is passed: '${
				deviceId === "" ? "empty string" : deviceId
			}'`, async () => {
				const expectedErrorMessage = getErrorMessage(
					testInjector,
					"NotFoundDeviceByIdentifierErrorMessageWithIdentifier",
					deviceId,
				);
				await assert.isRejected(
					devicesService.getInstalledApplications(deviceId),
					expectedErrorMessage,
				);
			});
		});

		it("returns installed applications", async () => {
			const actualResult = await devicesService.getInstalledApplications(
				androidDevice.deviceInfo.identifier,
			);
			assert.deepStrictEqual(actualResult, [
				"com.telerik.unitTest1",
				"com.telerik.unitTest2",
				"com.telerik.unitTest3",
			]);
		});
	});

	describe("getDeviceForDebug", () => {
		it("throws error when both --for-device and --emulator are passed", async () => {
			await assert.isRejected(
				devicesService.pickSingleDevice({
					onlyDevices: true,
					onlyEmulators: true,
					deviceId: null,
				}),
				DebugCommandErrors.UNABLE_TO_USE_FOR_DEVICE_AND_EMULATOR,
			);
		});

		it("returns selected device, when --device is passed", async () => {
			const deviceInstance = <Mobile.IDevice>{};
			const specifiedDeviceOption = "device1";
			devicesService.getDevice = async (
				deviceOption: string,
			): Promise<Mobile.IDevice> => {
				if (deviceOption === specifiedDeviceOption) {
					return deviceInstance;
				}
			};

			const selectedDeviceInstance = await devicesService.pickSingleDevice({
				onlyDevices: false,
				onlyEmulators: false,
				deviceId: specifiedDeviceOption,
			});
			assert.deepStrictEqual(selectedDeviceInstance, deviceInstance);
		});

		const assertErrorIsThrown = async (
			getDeviceInstancesResult: Mobile.IDevice[],
			passedOptions?: { forDevice: boolean; emulator: boolean },
		) => {
			devicesService.getDeviceInstances = (): Mobile.IDevice[] =>
				getDeviceInstancesResult;
			await devicesService.initialize({ platform: "android" });

			await assert.isRejected(
				devicesService.pickSingleDevice({
					onlyDevices: passedOptions ? passedOptions.forDevice : false,
					onlyEmulators: passedOptions ? passedOptions.emulator : false,
					deviceId: null,
				}),
				DebugCommandErrors.NO_DEVICES_EMULATORS_FOUND_FOR_OPTIONS,
			);
		};

		it("throws error when there are no devices/emulators available", () => {
			return assertErrorIsThrown([]);
		});

		it("throws error when there are no devices/emulators available for selected platform", () => {
			return assertErrorIsThrown([
				<Mobile.IDevice>{
					deviceInfo: {
						platform: "ios",
						status: CONNECTED_STATUS,
					},
				},
			]);
		});

		it("throws error when there are only not-trusted devices/emulators available for selected platform", () => {
			return assertErrorIsThrown([
				<Mobile.IDevice>{
					deviceInfo: {
						platform: "android",
						status: UNREACHABLE_STATUS,
					},
				},
			]);
		});

		it("throws error when there are only devices and --emulator is passed", () => {
			return assertErrorIsThrown(
				[
					<Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
						},
						isEmulator: false,
					},
				],
				{
					forDevice: false,
					emulator: true,
				},
			);
		});

		it("throws error when there are only emulators and --forDevice is passed", () => {
			return assertErrorIsThrown(
				[
					<Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
						},
						isEmulator: true,
					},
				],
				{
					forDevice: true,
					emulator: false,
				},
			);
		});

		it("returns the only available device/emulator when it matches passed -- options", async () => {
			const deviceInstance = <Mobile.IDevice>{
				deviceInfo: {
					platform: "android",
					status: CONNECTED_STATUS,
				},
				isEmulator: true,
			};

			devicesService.getDeviceInstances = (): Mobile.IDevice[] => [
				deviceInstance,
			];

			const actualDeviceInstance = await devicesService.pickSingleDevice({
				onlyDevices: false,
				onlyEmulators: false,
				deviceId: null,
			});

			assert.deepStrictEqual(actualDeviceInstance, deviceInstance);
		});

		describe("when multiple devices are detected", () => {
			beforeEach(() => {
				helpers.isInteractive = originalIsInteractive;
			});

			after(() => {
				helpers.isInteractive = originalIsInteractive;
			});

			describe("when terminal is interactive", () => {
				it("prompts the user with information about available devices for specified platform only and returns the selected device instance", async () => {
					helpers.isInteractive = () => true;
					const deviceInstance1 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance1",
							displayName: "displayName1",
						},
						isEmulator: true,
					};

					const deviceInstance2 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance2",
							displayName: "displayName2",
						},
						isEmulator: true,
					};

					const iOSDeviceInstance = <Mobile.IDevice>{
						deviceInfo: {
							platform: "ios",
							status: CONNECTED_STATUS,
							identifier: "iosDevice",
							displayName: "iPhone",
						},
						isEmulator: true,
					};

					await devicesService.initialize({ platform: "android" });
					devicesService.getDeviceInstances = (): Mobile.IDevice[] => [
						deviceInstance1,
						deviceInstance2,
						iOSDeviceInstance,
					];

					let choicesPassedToPrompter: string[];
					const prompter = testInjector.resolve<IPrompter>("prompter");
					prompter.promptForChoice = async (
						promptMessage: string,
						choices: any[],
					): Promise<string> => {
						choicesPassedToPrompter = choices;
						return choices[1];
					};

					const actualDeviceInstance = await devicesService.pickSingleDevice({
						onlyDevices: false,
						onlyEmulators: false,
						deviceId: null,
					});
					const expectedChoicesPassedToPrompter = [
						deviceInstance1,
						deviceInstance2,
					].map(
						(d) => `${d.deviceInfo.identifier} - ${d.deviceInfo.displayName}`,
					);
					assert.deepStrictEqual(
						choicesPassedToPrompter,
						expectedChoicesPassedToPrompter,
					);
					assert.deepStrictEqual(actualDeviceInstance, deviceInstance2);
				});
			});

			describe("when terminal is not interactive", () => {
				beforeEach(() => {
					helpers.isInteractive = () => false;
				});

				const assertCorrectInstanceIsUsed = async (opts: {
					forDevice: boolean;
					emulator: boolean;
					isEmulatorTest: boolean;
					excludeLastDevice?: boolean;
				}) => {
					const deviceInstance1 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance1",
							displayName: "displayName1",
							version: "5.1",
						},
						isEmulator: opts.isEmulatorTest,
					};

					const deviceInstance2 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance2",
							displayName: "displayName2",
							version: "6.0",
						},
						isEmulator: opts.isEmulatorTest,
					};

					const deviceInstance3 = <Mobile.IDevice>{
						deviceInfo: {
							platform: "android",
							status: CONNECTED_STATUS,
							identifier: "deviceInstance3",
							displayName: "displayName3",
							version: "7.1",
						},
						isEmulator: !opts.isEmulatorTest,
					};

					const deviceInstances = [deviceInstance1, deviceInstance2];
					if (!opts.excludeLastDevice) {
						deviceInstances.push(deviceInstance3);
					}

					devicesService.getDeviceInstances = (): Mobile.IDevice[] =>
						deviceInstances;

					const actualDeviceInstance = await devicesService.pickSingleDevice({
						onlyDevices: opts.forDevice,
						onlyEmulators: opts.emulator,
						deviceId: null,
					});

					assert.deepStrictEqual(actualDeviceInstance, deviceInstance2);
				};

				it("returns the emulator with highest API level when --emulator is passed", () => {
					return assertCorrectInstanceIsUsed({
						forDevice: false,
						emulator: true,
						isEmulatorTest: true,
					});
				});

				it("returns the device with highest API level when --forDevice is passed", () => {
					return assertCorrectInstanceIsUsed({
						forDevice: true,
						emulator: false,
						isEmulatorTest: false,
					});
				});

				it("returns the emulator with highest API level when neither --emulator and --forDevice are passed", () => {
					return assertCorrectInstanceIsUsed({
						forDevice: false,
						emulator: false,
						isEmulatorTest: true,
					});
				});

				it("returns the device with highest API level when neither --emulator and --forDevice are passed and emulators are not available", async () => {
					return assertCorrectInstanceIsUsed({
						forDevice: false,
						emulator: false,
						isEmulatorTest: false,
						excludeLastDevice: true,
					});
				});
			});
		});
	});
});
