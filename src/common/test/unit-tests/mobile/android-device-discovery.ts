import { AndroidDeviceDiscovery } from "../../../mobile/mobile-core/android-device-discovery";
import { AndroidDebugBridge } from "../../../mobile/android/android-debug-bridge";
import { AndroidDebugBridgeResultHandler } from "../../../mobile/android/android-debug-bridge-result-handler";
import { Yok } from "../../../yok";
import { DeviceDiscoveryEventNames } from "../../../constants";

import { EventEmitter } from "events";
import { EOL } from "os";
import { assert } from "chai";

class AndroidDeviceMock {
	public deviceInfo: any = {};

	constructor(public identifier: string, public status: string) {
		this.deviceInfo.identifier = identifier;
		this.deviceInfo.status = status;
	}

	public async init() { /* intentionally empty body */ }
}

interface IChildProcessMock {
	stdout: MockEventEmitter;
	stderr: MockEventEmitter;
}

class MockEventEmitter extends EventEmitter implements IChildProcessMock {
	public stdout: MockEventEmitter;
	public stderr: MockEventEmitter;
}

let mockStdoutEmitter: MockEventEmitter;
let mockStderrEmitter: MockEventEmitter;
let mockChildProcess: any;

function createTestInjector(): IInjector {
	const injector = new Yok();
	injector.register("injector", injector);
	injector.register("adb", AndroidDebugBridge);
	injector.register("errors", {});
	injector.register("logger", {});
	injector.register("androidDebugBridgeResultHandler", AndroidDebugBridgeResultHandler);
	injector.register("mobileHelper", {
		isAndroidPlatform: () => {
			return true;
		}
	});
	injector.register("childProcess", {
		spawn: (command: string, args?: string[], options?: any) => {
			mockChildProcess = new MockEventEmitter();
			mockChildProcess.stdout = mockStdoutEmitter;
			mockChildProcess.stderr = mockStderrEmitter;
			return mockChildProcess;
		},
		spawnFromEvent: (command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: any) => {
			return Promise.resolve(args);
		}
	});

	injector.register("staticConfig", {
		getAdbFilePath: () => {
			return Promise.resolve("adbPath");
		}
	});

	injector.register("androidDeviceDiscovery", AndroidDeviceDiscovery);
	const originalResolve = injector.resolve;
	// replace resolve as we do not want to create real AndroidDevice
	const resolve = (param: any, ctorArguments?: IDictionary<any>) => {
		if (ctorArguments && Object.prototype.hasOwnProperty.call(ctorArguments, "status") &&
			Object.prototype.hasOwnProperty.call(ctorArguments, "identifier")) {
			return new AndroidDeviceMock(ctorArguments["identifier"], ctorArguments["status"]);
		} else {
			return originalResolve.apply(injector, [param, ctorArguments]);
		}
	};
	injector.resolve = resolve;

	return injector;
}

describe("androidDeviceDiscovery", () => {
	let androidDeviceDiscovery: Mobile.IAndroidDeviceDiscovery;
	let injector: IInjector;
	const androidDeviceIdentifier = "androidDevice";
	const androidDeviceStatus = "device";
	let devicesFound: any[];

	beforeEach(() => {
		mockChildProcess = null;
		injector = createTestInjector();
		mockStdoutEmitter = new MockEventEmitter();
		mockStderrEmitter = new MockEventEmitter();
		androidDeviceDiscovery = injector.resolve("androidDeviceDiscovery");
		devicesFound = [];
	});

	describe("startLookingForDevices", () => {
		it("finds correctly one device", async () => {
			androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
				devicesFound.push(device);
			});

			// As startLookingForDevices is blocking, we should emit data on the next tick, so the future will be resolved and we'll receive the data.
			setTimeout(() => {
				const output = `List of devices attached ${EOL}${androidDeviceIdentifier}	${androidDeviceStatus}${EOL}${EOL}`;
				mockStdoutEmitter.emit('data', output);
				mockChildProcess.emit('close', 0);
			}, 1);

			await androidDeviceDiscovery.startLookingForDevices();
			assert.isTrue(devicesFound.length === 1, "We should have found ONE device.");
			assert.deepEqual(devicesFound[0].deviceInfo.identifier, androidDeviceIdentifier);
			assert.deepEqual(devicesFound[0].status, androidDeviceStatus);
		});
	});

	describe("ensureAdbServerStarted", () => {
		it("should spawn adb with start-server parameter", async () => {
			const ensureAdbServerStartedOutput = await androidDeviceDiscovery.ensureAdbServerStarted();
			assert.isTrue(_.includes(ensureAdbServerStartedOutput, "start-server"), "start-server should be passed to adb.");
		});
	});

	describe("startLookingForDevices", () => {
		it("finds correctly one device", async () => {
			let promise: Promise<void>;
			androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
				promise = new Promise<void>((resolve, reject) => {
					devicesFound.push(device);
					resolve();
				});
			});

			setTimeout(() => {
				const output = `List of devices attached ${EOL}${androidDeviceIdentifier}	${androidDeviceStatus}${EOL}${EOL}`;
				mockStdoutEmitter.emit('data', output);
				mockChildProcess.emit('close', 0);
			}, 0);

			await androidDeviceDiscovery.startLookingForDevices();
			await promise;
			assert.isTrue(devicesFound.length === 1, "We should have found ONE device.");
			assert.deepEqual(devicesFound[0].deviceInfo.identifier, androidDeviceIdentifier);
			assert.deepEqual(devicesFound[0].status, androidDeviceStatus);
		});

		it("finds correctly more than one device", async () => {
			let promise: Promise<void>;
			androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
				promise = new Promise<void>((resolve, reject) => {
					devicesFound.push(device);
					if (devicesFound.length === 2) {
						resolve();
					}
				});
			});

			setTimeout(() => {
				const output = `List of devices attached ${EOL}${androidDeviceIdentifier}	${androidDeviceStatus}${EOL}secondDevice	${androidDeviceStatus}${EOL}`;
				mockStdoutEmitter.emit('data', output);
				mockChildProcess.emit('close', 0);
			}, 0);

			await androidDeviceDiscovery.startLookingForDevices();
			await promise;
			assert.isTrue(devicesFound.length === 2, "We should have found two devices.");
			assert.deepEqual(devicesFound[0].deviceInfo.identifier, androidDeviceIdentifier);
			assert.deepEqual(devicesFound[0].status, androidDeviceStatus);
			assert.deepEqual(devicesFound[1].deviceInfo.identifier, "secondDevice");
			assert.deepEqual(devicesFound[1].status, androidDeviceStatus);
		});

		it("does not find any devices when there are no devices", async () => {
			androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
				throw new Error("Devices should not be found.");
			});

			setTimeout(() => {
				const output = `List of devices attached${EOL}`;
				mockStdoutEmitter.emit('data', output);
				mockChildProcess.emit('close', 0);
			}, 0);

			await androidDeviceDiscovery.startLookingForDevices();
			assert.isTrue(devicesFound.length === 0, "We should have NOT found devices.");
		});

		const validateDeviceFoundWhenAdbReportsAdditionalMessages = async (adbMessage: string) => {
			let promise: Promise<void>;
			androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
				promise = new Promise<void>((resolve, reject) => {
					devicesFound.push(device);
					resolve();
				});
			});

			setTimeout(() => {
				const output = `List of devices attached ${EOL}${adbMessage}${EOL}${androidDeviceIdentifier}	${androidDeviceStatus}${EOL}${EOL}`;
				mockStdoutEmitter.emit('data', output);
				mockChildProcess.emit('close', 0);
			}, 0);

			await androidDeviceDiscovery.startLookingForDevices();
			await promise;
			assert.isTrue(devicesFound.length === 1, "We should have found ONE device.");
			assert.deepEqual(devicesFound[0].deviceInfo.identifier, androidDeviceIdentifier);
			assert.deepEqual(devicesFound[0].status, androidDeviceStatus);
		};

		describe("does not report adb messages as new devices", () => {
			const adbAdditionalMessages = [
				`adb server is out of date.  killing...${EOL}* daemon started successfully *`,
				`adb server version (31) doesn't match this client (36); killing...${EOL}* daemon started successfully *`,
				"* daemon started successfully *",
				`* daemon not running. starting it now on port 5037 *${EOL}* daemon started successfully *`
			];

			for (let index = 0; index < adbAdditionalMessages.length; index++) {
				const msg = adbAdditionalMessages[index];

				it(`msg: ${msg}`, async () => {
					await validateDeviceFoundWhenAdbReportsAdditionalMessages(msg);
				});

			}
		});

		describe("when device is already found", () => {
			const defaultAdbOutput = `List of devices attached ${EOL}${androidDeviceIdentifier}	${androidDeviceStatus}${EOL}${EOL}`;
			beforeEach(async () => {
				let promise: Promise<void>;
				androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
					promise = new Promise<void>((resolve, reject) => {
						devicesFound.push(device);
						resolve();
					});
				});

				setTimeout(() => {
					mockStdoutEmitter.emit('data', defaultAdbOutput);
					mockChildProcess.emit('close', 0);
				}, 0);

				await androidDeviceDiscovery.startLookingForDevices();
				await promise;
				androidDeviceDiscovery.removeAllListeners(DeviceDiscoveryEventNames.DEVICE_FOUND);
			});

			it("does not report it as found next time when startLookingForDevices is called and same device is still connected", async () => {
				androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
					throw new Error("Should not report same device as found");
				});

				setTimeout(() => {
					mockStdoutEmitter.emit('data', defaultAdbOutput);
					mockChildProcess.emit('close', 0);
				}, 0);

				await androidDeviceDiscovery.startLookingForDevices();
				assert.isTrue(devicesFound.length === 1, "We should have found ONE device.");
				assert.deepEqual(devicesFound[0].deviceInfo.identifier, androidDeviceIdentifier);
				assert.deepEqual(devicesFound[0].status, androidDeviceStatus);
			});

			it("reports it as removed next time when called and device is removed", async () => {
				let promise: Promise<Mobile.IDevice>;

				androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_LOST, (device: Mobile.IDevice) => {
					promise = Promise.resolve(device);
				});

				setTimeout(() => {
					const output = `List of devices attached${EOL}`;
					mockStdoutEmitter.emit('data', output);
					mockChildProcess.emit('close', 0);
				}, 0);
				await androidDeviceDiscovery.startLookingForDevices();
				const lostDevice = await promise;
				assert.deepEqual(lostDevice.deviceInfo.identifier, androidDeviceIdentifier);
				assert.deepEqual(lostDevice.deviceInfo.status, androidDeviceStatus);
			});

			it("does not report it as removed two times when called and device is removed", async () => {
				let promise: Promise<Mobile.IDevice>;

				androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_LOST, (device: Mobile.IDevice) => {
					promise = Promise.resolve(device);
				});

				const output = `List of devices attached${EOL}`;
				setTimeout(() => {
					mockStdoutEmitter.emit('data', output);
					mockChildProcess.emit('close', 0);
				}, 0);

				await androidDeviceDiscovery.startLookingForDevices();

				const lostDevice = await promise;
				assert.deepEqual(lostDevice.deviceInfo.identifier, androidDeviceIdentifier);
				assert.deepEqual(lostDevice.deviceInfo.status, androidDeviceStatus);

				androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_LOST, (device: Mobile.IDevice) => {
					throw new Error("Should not report device as removed next time after it has been already reported.");
				});

				setTimeout(() => {
					mockStdoutEmitter.emit('data', output);
					mockChildProcess.emit('close', 0);
				}, 0);

				await androidDeviceDiscovery.startLookingForDevices();
			});

			it("reports it as removed and added after that next time when called and device's status is changed", async () => {
				let deviceLostPromise: Promise<Mobile.IDevice>;
				let deviceFoundPromise: Promise<Mobile.IDevice>;

				androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_LOST, (device: Mobile.IDevice) => {
					_.remove(devicesFound, d => d.deviceInfo.identifier === device.deviceInfo.identifier);
					deviceLostPromise = Promise.resolve(device);
				});

				androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
					devicesFound.push(device);
					deviceFoundPromise = Promise.resolve(device);
				});

				const output = `List of devices attached${EOL}${androidDeviceIdentifier}	unauthorized${EOL}${EOL}`;
				setTimeout(() => {
					mockStdoutEmitter.emit('data', output);
					mockChildProcess.emit('close', 0);
				}, 0);

				await androidDeviceDiscovery.startLookingForDevices();

				const lostDevice = await deviceLostPromise;
				assert.deepEqual(lostDevice.deviceInfo.identifier, androidDeviceIdentifier);
				assert.deepEqual(lostDevice.deviceInfo.status, androidDeviceStatus);

				await deviceFoundPromise;
				assert.isTrue(devicesFound.length === 1, "We should have found ONE device.");
				assert.deepEqual(devicesFound[0].deviceInfo.identifier, androidDeviceIdentifier);
				assert.deepEqual(devicesFound[0].status, "unauthorized");

				// Verify the device will not be reported as found next time when adb returns the same output:
				// In case it is reported, an error will be raised - Future resolved more than once for deviceFoundFuture
				setTimeout(() => {
					mockStdoutEmitter.emit('data', output);
					mockChildProcess.emit('close', 0);
				}, 0);
				await androidDeviceDiscovery.startLookingForDevices();
				assert.isTrue(devicesFound.length === 1, "We should have found ONE device.");
			});
		});

		it("throws error when adb writes on stderr", async () => {
			androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
				throw new Error("Devices should not be found.");
			});

			const error = new Error("ADB Error");

			try {
				setTimeout(() => {
					mockStderrEmitter.emit('data', error);
					mockChildProcess.emit('close', 1);
				}, 0);

				await androidDeviceDiscovery.startLookingForDevices();
			} catch (err) {
				assert.deepEqual(err, error.toString());
			}

		});

		it("throws error when adb writes on stderr multiple times", async () => {
			const error1 = new Error("ADB Error");
			const error2 = new Error("ADB Error 2");

			try {
				setTimeout(() => {
					mockStderrEmitter.emit('data', error1);
					mockStderrEmitter.emit('data', error2);
					mockChildProcess.emit("close", 1);
				}, 0);

				await androidDeviceDiscovery.startLookingForDevices();

			} catch (err) {
				assert.deepEqual(err, error1.toString() + error2.toString());
			}

		});

		it("throws error when adb's child process throws error", async () => {
			androidDeviceDiscovery.on(DeviceDiscoveryEventNames.DEVICE_FOUND, (device: Mobile.IDevice) => {
				throw new Error("Devices should not be found.");
			});
			const error = new Error("ADB Error");
			try {
				setTimeout(() => {
					mockChildProcess.emit('error', error);
				}, 0);

				await androidDeviceDiscovery.startLookingForDevices();
			} catch (err) {
				assert.deepEqual(err, error);
			}
		});
	});
});
