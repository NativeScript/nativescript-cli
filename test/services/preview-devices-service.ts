import { Yok } from "../../lib/common/yok";
import { PreviewDevicesService } from "../../lib/services/livesync/playground/devices/preview-devices-service";
import { Device } from "nativescript-preview-sdk";
import { assert } from "chai";
import { DeviceDiscoveryEventNames } from "../../lib/common/constants";
import { LoggerStub } from "../stubs";

let foundDevices: Device[] = [];
let lostDevices: Device[] = [];

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("previewDevicesService", PreviewDevicesService);
	injector.register("previewAppLogProvider", {
		on: () => ({})
	});
	injector.register("logger", LoggerStub);
	return injector;
}

function createDevice(id: string): Device {
	return {
		id,
		platform: "ios",
		model: "my test model",
		name: "my test name",
		osVersion: "10.0.0",
		previewAppVersion: "19.0.0",
		runtimeVersion: "5.0.0"
	};
}

function resetDevices() {
	foundDevices = [];
	lostDevices = [];
}

describe("PreviewDevicesService", () => {
	describe("onDevicesPresence", () => {
		let previewDevicesService: IPreviewDevicesService = null;
		beforeEach(() => {
			const injector = createTestInjector();
			previewDevicesService = injector.resolve("previewDevicesService");
			previewDevicesService.on(DeviceDiscoveryEventNames.DEVICE_FOUND, device => {
				foundDevices.push(device);
			});
			previewDevicesService.on(DeviceDiscoveryEventNames.DEVICE_LOST, device => {
				lostDevices.push(device);
			});
		});

		afterEach(() => {
			previewDevicesService.removeAllListeners();
			resetDevices();
		});

		it("should add new device", () => {
			const device = createDevice("device1");

			previewDevicesService.updateConnectedDevices([device]);

			assert.deepEqual(previewDevicesService.getConnectedDevices(), [device]);
			assert.deepEqual(foundDevices, [device]);
			assert.deepEqual(lostDevices, []);
		});
		it("should add new device when there are already connected devices", () => {
			const device1 = createDevice("device1");
			const device2 = createDevice("device2");

			previewDevicesService.updateConnectedDevices([device1]);
			assert.deepEqual(previewDevicesService.getConnectedDevices(), [device1]);
			assert.deepEqual(foundDevices, [device1]);
			assert.deepEqual(lostDevices, []);
			resetDevices();

			previewDevicesService.updateConnectedDevices([device1, device2]);

			assert.deepEqual(previewDevicesService.getConnectedDevices(), [device1, device2]);
			assert.deepEqual(foundDevices, [device2]);
			assert.deepEqual(lostDevices, []);
		});
		it("should add more than one new device", () => {
			const device1 = createDevice("device1");
			const device2 = createDevice("device2");
			const device3 = createDevice("device3");

			previewDevicesService.updateConnectedDevices([device1, device2, device3]);

			assert.deepEqual(previewDevicesService.getConnectedDevices(), [device1, device2, device3]);
			assert.deepEqual(foundDevices, [device1, device2, device3]);
			assert.deepEqual(lostDevices, []);
		});
		it("should remove device", () => {
			const device1 = createDevice("device1");
			previewDevicesService.updateConnectedDevices([device1]);
			assert.deepEqual(previewDevicesService.getConnectedDevices(), [device1]);
			assert.deepEqual(foundDevices, [device1]);
			assert.deepEqual(lostDevices, []);
			resetDevices();

			previewDevicesService.updateConnectedDevices([]);

			assert.deepEqual(foundDevices, []);
			assert.deepEqual(lostDevices, [device1]);
		});
		it("should add and remove devices in the same time", () => {
			const device1 = createDevice("device1");
			const device2 = createDevice("device2");

			previewDevicesService.updateConnectedDevices([device1]);
			assert.deepEqual(previewDevicesService.getConnectedDevices(), [device1]);
			assert.deepEqual(foundDevices, [device1]);
			assert.deepEqual(lostDevices, []);
			resetDevices();

			previewDevicesService.updateConnectedDevices([device2]);

			assert.deepEqual(previewDevicesService.getConnectedDevices(), [device2]);
			assert.deepEqual(foundDevices, [device2]);
			assert.deepEqual(lostDevices, [device1]);
		});
	});
});
