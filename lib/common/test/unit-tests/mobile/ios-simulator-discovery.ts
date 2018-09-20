import { IOSSimulatorDiscovery } from "../../../mobile/mobile-core/ios-simulator-discovery";
import { Yok } from "../../../yok";

import { assert } from "chai";
import { DeviceDiscoveryEventNames, CONNECTED_STATUS } from "../../../constants";
import { DevicePlatformsConstants } from "../../../mobile/device-platforms-constants";

let currentlyRunningSimulators: Mobile.IiSimDevice[];

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("injector", injector);
	injector.register("iOSSimResolver", {
		iOSSim: {
			getRunningSimulators: async () => currentlyRunningSimulators
		}
	});
	injector.register("hostInfo", {
		isDarwin: true
	});

	injector.register("devicePlatformsConstants", DevicePlatformsConstants);

	injector.register("mobileHelper", {
		isiOSPlatform: () => {
			return true;
		}
	});

	injector.register("iOSSimulatorDiscovery", IOSSimulatorDiscovery);

	injector.register("iOSSimulatorLogProvider", {});
	injector.register("deviceLogProvider", {});
	injector.register("iOSEmulatorServices", {});

	return injector;
}

function getDeviceInfo(simulator: Mobile.IiSimDevice): Mobile.IDeviceInfo {
	return {
		imageIdentifier: simulator.id,
		identifier: simulator.id,
		displayName: simulator.name,
		model: 'c',
		version: simulator.runtimeVersion,
		vendor: 'Apple',
		platform: 'iOS',
		status: CONNECTED_STATUS,
		errorHelp: null,
		isTablet: false,
		type: 'Emulator'
	};
}

describe("ios-simulator-discovery", () => {
	let testInjector: IInjector;
	let iOSSimulatorDiscovery: Mobile.IDeviceDiscovery;
	let defaultRunningSimulator: any;
	let expectedDeviceInfo: Mobile.IDeviceInfo = null;

	const detectNewSimulatorAttached = async (runningSimulator: any): Promise<Mobile.IiOSSimulator> => {
		return new Promise<Mobile.IiOSSimulator>(async (resolve, reject) => {
			currentlyRunningSimulators.push(_.cloneDeep(runningSimulator));
			iOSSimulatorDiscovery.once(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
				resolve(device);
			});
			await iOSSimulatorDiscovery.startLookingForDevices();
		});
	};

	const detectSimulatorDetached = async (simulatorId: string): Promise<Mobile.IiOSSimulator> => {
		_.remove(currentlyRunningSimulators, simulator => simulator.id === simulatorId);
		return new Promise<Mobile.IDevice>(async (resolve, reject) => {
			iOSSimulatorDiscovery.once(DeviceDiscoveryEventNames.DEVICE_LOST, (device: Mobile.IDevice) => {
				resolve(device);
			});
			await iOSSimulatorDiscovery.startLookingForDevices();
		});
	};

	const detectSimulatorChanged = async (oldId: string, newId: string): Promise<any> => {
		const currentlyRunningSimulator = _.find(currentlyRunningSimulators, simulator => simulator.id === oldId);
		currentlyRunningSimulator.id = newId;
		let lostDevicePromise: Promise<Mobile.IDevice>;
		let foundDevicePromise: Promise<Mobile.IDevice>;

		iOSSimulatorDiscovery.on(DeviceDiscoveryEventNames.DEVICE_LOST, (device: Mobile.IDevice) => {
			lostDevicePromise = Promise.resolve(device);
		});

		iOSSimulatorDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
			foundDevicePromise = Promise.resolve(device);
		});

		await iOSSimulatorDiscovery.startLookingForDevices();

		const deviceLost = await lostDevicePromise;
		const deviceFound = await foundDevicePromise;
		return { deviceLost, deviceFound };
	};

	beforeEach(() => {
		currentlyRunningSimulators = [];
		testInjector = createTestInjector();
		iOSSimulatorDiscovery = testInjector.resolve("iOSSimulatorDiscovery");
		expectedDeviceInfo = {
			imageIdentifier: "id",
			identifier: "id",
			displayName: 'name',
			model: 'c',
			version: '9.2.1',
			vendor: 'Apple',
			platform: 'iOS',
			status: CONNECTED_STATUS,
			errorHelp: null,
			isTablet: false,
			type: 'Emulator'
		};

		defaultRunningSimulator = {
			id: "id",
			name: "name",
			fullId: "a.b.c",
			runtimeVersion: "9.2.1",
		};
	});

	it("finds new device when it is attached", async () => {
		const device = await detectNewSimulatorAttached(defaultRunningSimulator);
		assert.deepEqual(device.deviceInfo, expectedDeviceInfo);
	});

	it("raises deviceLost when device is detached", async () => {
		const device = await detectNewSimulatorAttached(defaultRunningSimulator);
		assert.deepEqual(device.deviceInfo, expectedDeviceInfo);
		const lostDevice = await detectSimulatorDetached(device.deviceInfo.identifier);
		assert.deepEqual(lostDevice, device);
	});

	it("raises deviceLost and deviceFound when device's id has changed (change simulator type)", async () => {
		const device = await detectNewSimulatorAttached(defaultRunningSimulator);
		const newId = "newId";
		assert.deepEqual(device.deviceInfo, expectedDeviceInfo);

		const devices = await detectSimulatorChanged(device.deviceInfo.identifier, newId);
		assert.deepEqual(devices.deviceLost, device);
		expectedDeviceInfo.identifier = newId;
		expectedDeviceInfo.imageIdentifier = newId;
		assert.deepEqual(devices.deviceFound.deviceInfo, expectedDeviceInfo);
	});

	it("raises events in correct order when simulator is started, closed and started again", async () => {
		let device = await detectNewSimulatorAttached(defaultRunningSimulator);
		assert.deepEqual(device.deviceInfo, expectedDeviceInfo);
		const lostDevice = await detectSimulatorDetached(device.deviceInfo.identifier);
		assert.deepEqual(lostDevice, device);

		device = await detectNewSimulatorAttached(defaultRunningSimulator);
		assert.deepEqual(device.deviceInfo, expectedDeviceInfo);
	});

	it("finds new device when it is attached and reports it as new only once", async () => {
		const device = await detectNewSimulatorAttached(defaultRunningSimulator);
		assert.deepEqual(device.deviceInfo, expectedDeviceInfo);
		iOSSimulatorDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (d: Mobile.IDevice) => {
			throw new Error("Device found should not be raised for the same device.");
		});

		await iOSSimulatorDiscovery.startLookingForDevices();
		await iOSSimulatorDiscovery.startLookingForDevices();
	});

	it("does not detect iOS Simulator when not running on OS X", async () => {
		testInjector.resolve("hostInfo").isDarwin = false;
		iOSSimulatorDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
			throw new Error("Device found should not be raised when OS is not OS X.");
		});
		await iOSSimulatorDiscovery.startLookingForDevices();
	});

	it("checkForDevices return future", async () => {
		testInjector.resolve("hostInfo").isDarwin = false;
		iOSSimulatorDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
			throw new Error("Device found should not be raised when OS is not OS X.");
		});
		await (<any>iOSSimulatorDiscovery).checkForDevices();
	});

	it('find correctly two simulators', async () => {
		const firstSimulator = await detectNewSimulatorAttached(defaultRunningSimulator);
		assert.deepEqual(firstSimulator.deviceInfo, expectedDeviceInfo);

		const secondRunningSimulator = {
			id: 'secondSimulator',
			name: 'secondName',
			fullId: 'd.e.c',
			runtimeVersion: '9.2'
		};

		const secondSimulator = await detectNewSimulatorAttached(secondRunningSimulator);
		assert.deepEqual(secondSimulator.deviceInfo, getDeviceInfo(secondRunningSimulator));
	});
});
