import { assert } from "chai";
import { isDeviceDiscoveryDone } from "../../../mobile/ios/device/ios-device-operations";

describe("isDeviceDiscoveryDone", () => {
	const options = (extra: object = {}) => <any>{ ...extra };

	it("ends as soon as the requested device is found", () => {
		const isRequestedDeviceFound = () => true;
		assert.isTrue(
			isDeviceDiscoveryDone(false, 100, options({ isRequestedDeviceFound })),
		);
	});

	it("keeps waiting for the requested device when another one shows up", () => {
		const isRequestedDeviceFound = () => false;
		assert.isFalse(
			isDeviceDiscoveryDone(true, 5000, options({ isRequestedDeviceFound })),
		);
	});

	it("gives other devices time to arrive when none was requested", () => {
		assert.isFalse(isDeviceDiscoveryDone(true, 100, options()));
		assert.isTrue(isDeviceDiscoveryDone(true, 2000, options()));
	});

	it("keeps waiting while no device was found", () => {
		assert.isFalse(isDeviceDiscoveryDone(false, 5000, options()));
	});

	it("doesn't end early on a full discovery", () => {
		assert.isFalse(
			isDeviceDiscoveryDone(true, 5000, options({ fullDiscovery: true })),
		);
	});

	it("works without options", () => {
		assert.isTrue(isDeviceDiscoveryDone(true, 2000));
	});
});
