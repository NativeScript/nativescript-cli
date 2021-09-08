import { Yok } from "../../lib/common/yok";
import { PreviewDevicesService } from "../../lib/services/livesync/playground/devices/preview-devices-service";
import { assert } from "chai";
import { DeviceDiscoveryEventNames } from "../../lib/common/constants";
import { LoggerStub, ErrorsStub } from "../stubs";
import * as sinon from "sinon";
import { IInjector } from "../../lib/common/definitions/yok";

// import { Device } from "nativescript-preview-sdk";
type Device = any;

let foundDevices: Device[] = [];
let lostDevices: Device[] = [];

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("errors", ErrorsStub);
	injector.register("previewDevicesService", PreviewDevicesService);
	injector.register("previewAppLogProvider", {
		on: () => ({}),
	});
	injector.register("previewAppPluginsService", {});
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
		runtimeVersion: "5.0.0",
		uniqueId: "testUniqueId",
	};
}

function resetDevices() {
	foundDevices = [];
	lostDevices = [];
}

describe("PreviewDevicesService", () => {
	describe("getConnectedDevices", () => {
		let previewDevicesService: IPreviewDevicesService = null;
		let clock: sinon.SinonFakeTimers = null;
		beforeEach(() => {
			const injector = createTestInjector();
			previewDevicesService = injector.resolve("previewDevicesService");
			previewDevicesService.on(
				DeviceDiscoveryEventNames.DEVICE_FOUND,
				(device) => {
					foundDevices.push(device);
				}
			);
			previewDevicesService.on(
				DeviceDiscoveryEventNames.DEVICE_LOST,
				(device) => {
					lostDevices.push(device);
				}
			);
			clock = sinon.useFakeTimers();
		});

		afterEach(() => {
			previewDevicesService.removeAllListeners();
			resetDevices();
			clock.restore();
		});

		it("should add new device", () => {
			const device = createDevice("device1");

			previewDevicesService.updateConnectedDevices([device]);

			assert.deepStrictEqual(previewDevicesService.getConnectedDevices(), [
				device,
			]);
			assert.deepStrictEqual(foundDevices, [device]);
			assert.deepStrictEqual(lostDevices, []);
		});
		it("should add new device when there are already connected devices", () => {
			const device1 = createDevice("device1");
			const device2 = createDevice("device2");

			previewDevicesService.updateConnectedDevices([device1]);
			assert.deepStrictEqual(previewDevicesService.getConnectedDevices(), [
				device1,
			]);
			assert.deepStrictEqual(foundDevices, [device1]);
			assert.deepStrictEqual(lostDevices, []);
			resetDevices();

			previewDevicesService.updateConnectedDevices([device1, device2]);

			assert.deepStrictEqual(previewDevicesService.getConnectedDevices(), [
				device1,
				device2,
			]);
			assert.deepStrictEqual(foundDevices, [device2]);
			assert.deepStrictEqual(lostDevices, []);
		});
		it("should add more than one new device", () => {
			const device1 = createDevice("device1");
			const device2 = createDevice("device2");
			const device3 = createDevice("device3");

			previewDevicesService.updateConnectedDevices([device1, device2, device3]);

			assert.deepStrictEqual(previewDevicesService.getConnectedDevices(), [
				device1,
				device2,
				device3,
			]);
			assert.deepStrictEqual(foundDevices, [device1, device2, device3]);
			assert.deepStrictEqual(lostDevices, []);
		});
		it("should remove device", () => {
			const device1 = createDevice("device1");
			previewDevicesService.updateConnectedDevices([device1]);
			assert.deepStrictEqual(previewDevicesService.getConnectedDevices(), [
				device1,
			]);
			assert.deepStrictEqual(foundDevices, [device1]);
			assert.deepStrictEqual(lostDevices, []);
			resetDevices();

			previewDevicesService.updateConnectedDevices([]);
			clock.tick(5000);

			assert.deepStrictEqual(foundDevices, []);
			assert.deepStrictEqual(lostDevices, [device1]);
		});
		it("should add and remove devices in the same time", () => {
			const device1 = createDevice("device1");
			const device2 = createDevice("device2");

			previewDevicesService.updateConnectedDevices([device1]);
			assert.deepStrictEqual(previewDevicesService.getConnectedDevices(), [
				device1,
			]);
			assert.deepStrictEqual(foundDevices, [device1]);
			assert.deepStrictEqual(lostDevices, []);
			resetDevices();

			previewDevicesService.updateConnectedDevices([device2]);
			clock.tick(5000);

			assert.deepStrictEqual(previewDevicesService.getConnectedDevices(), [
				device2,
			]);
			assert.deepStrictEqual(foundDevices, [device2]);
			assert.deepStrictEqual(lostDevices, [device1]);
		});
		it("shouldn't emit deviceFound or deviceLost when preview app is restarted on device", () => {
			const device1 = createDevice("device1");

			previewDevicesService.updateConnectedDevices([device1]);

			assert.deepStrictEqual(previewDevicesService.getConnectedDevices(), [
				device1,
			]);
			assert.deepStrictEqual(foundDevices, [device1]);
			assert.deepStrictEqual(lostDevices, []);
			resetDevices();

			// preview app is restarted
			previewDevicesService.updateConnectedDevices([]);
			clock.tick(500);
			previewDevicesService.updateConnectedDevices([device1]);

			assert.deepStrictEqual(foundDevices, []);
			assert.deepStrictEqual(lostDevices, []);
			assert.deepStrictEqual(previewDevicesService.getConnectedDevices(), [
				device1,
			]);
		});
	});
});
