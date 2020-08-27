import { Yok } from "../../../yok";
import * as assert from "assert";
import { DeviceLogEmitter } from "../../../mobile/device-log-emitter";
import { CommonLoggerStub } from "../stubs";
import { LoggingLevels } from "../../../mobile/logging-levels";
import { IInjector } from "../../../definitions/yok";

function createTestInjector(loggingLevel: string, emptyFilteredData?: boolean) {
	const testInjector = new Yok();
	testInjector.register("logFilter", {
		loggingLevel: loggingLevel,
		filterData: (
			platform: string,
			data: string,
			loggingOptions: Mobile.IDeviceLogOptions
		) => {
			return emptyFilteredData ? null : `${loggingOptions.logLevel} ${data}`;
		},
	});

	testInjector.register("logger", CommonLoggerStub);
	testInjector.register("loggingLevels", LoggingLevels);
	testInjector.register("logSourceMapService", {
		replaceWithOriginalFileLocations: (platform: string, message: string) =>
			message,
	});
	return testInjector;
}

describe("proton deviceLogProvider", () => {
	let testInjector: IInjector;
	let deviceLogProvider: any = null;
	const testData = "testData";
	const infoLogLevel = "INFO";
	const fullLogLevel = "FULL";
	const filteredInfoData = `${infoLogLevel} ${testData}`;
	const filteredFullData = `${fullLogLevel} ${testData}`;

	describe("logData", () => {
		describe("when device identifier is not specified", () => {
			it("logs INFO messages when logging level is default", () => {
				testInjector = createTestInjector(infoLogLevel);
				deviceLogProvider = testInjector.resolve(DeviceLogEmitter);
				let emittedData: string = "some default value that should be changed";
				deviceLogProvider.on(
					"data",
					(deviceIdentifier: string, data: string) => {
						emittedData = data;
					}
				);
				deviceLogProvider.logData(testData, "platform");
				assert.deepStrictEqual(emittedData, filteredInfoData);
			});

			it("does not emit data when whole data is filtered", () => {
				testInjector = createTestInjector(infoLogLevel, true);
				deviceLogProvider = testInjector.resolve(DeviceLogEmitter);
				let emittedData: string =
					"some default value that should NOT be changed";
				deviceLogProvider.on(
					"data",
					(deviceIdentifier: string, data: string) => {
						emittedData = data;
					}
				);
				deviceLogProvider.logData(testData, "platform");
				assert.deepStrictEqual(
					emittedData,
					"some default value that should NOT be changed"
				);
			});
		});

		describe("when device identifier is specified", () => {
			it("logs INFO messages when logging level is INFO", () => {
				testInjector = createTestInjector(infoLogLevel);
				deviceLogProvider = testInjector.resolve(DeviceLogEmitter);
				let emittedData: string = "some default value that should be changed";
				let expectedDeviceIdentifier: string = null;
				deviceLogProvider.on(
					"data",
					(deviceIdentifier: string, data: string) => {
						emittedData = data;
						expectedDeviceIdentifier = deviceIdentifier;
					}
				);
				deviceLogProvider.logData(testData, "platform", "deviceId");
				assert.deepStrictEqual(emittedData, filteredInfoData);
				assert.deepStrictEqual(expectedDeviceIdentifier, "deviceId");
			});

			it("does not emit data when whole data is filtered", () => {
				testInjector = createTestInjector(infoLogLevel, true);
				deviceLogProvider = testInjector.resolve(DeviceLogEmitter);
				let emittedData: string =
					"some default value that should NOT be changed";
				let expectedDeviceIdentifier: string = null;
				deviceLogProvider.on(
					"data",
					(deviceIdentifier: string, data: string) => {
						emittedData = data;
						expectedDeviceIdentifier = deviceIdentifier;
					}
				);
				deviceLogProvider.logData(testData, "platform");
				assert.deepStrictEqual(
					emittedData,
					"some default value that should NOT be changed"
				);
				assert.deepStrictEqual(expectedDeviceIdentifier, null);
			});
		});
	});

	describe("setLogLevel", () => {
		it("changes logFilter's loggingLevel when device identifier is not specified", () => {
			testInjector = createTestInjector(infoLogLevel);
			deviceLogProvider = testInjector.resolve(DeviceLogEmitter);
			deviceLogProvider.setLogLevel(fullLogLevel);
			const logFilter = testInjector.resolve("logFilter");
			assert.deepStrictEqual(logFilter.loggingLevel, fullLogLevel);
		});

		it("does not change logFilter's loggingLevel when device identifier is specified", () => {
			testInjector = createTestInjector(infoLogLevel);
			deviceLogProvider = testInjector.resolve(DeviceLogEmitter);
			deviceLogProvider.setLogLevel(fullLogLevel, "deviceID");
			const logFilter = testInjector.resolve("logFilter");
			assert.deepStrictEqual(logFilter.loggingLevel, infoLogLevel);
		});
	});

	describe("keeps correct log level for each device", () => {
		beforeEach(() => {
			testInjector = createTestInjector(infoLogLevel);
			deviceLogProvider = testInjector.resolve(DeviceLogEmitter);
		});

		it("emits full log level for specific deviceIdentifier and info for the rest of the devices", () => {
			deviceLogProvider.setLogLevel(fullLogLevel, "device1");
			let emittedData: string = "some default value that should be changed";
			let expectedDeviceIdentifier: string = null;
			deviceLogProvider.on("data", (deviceIdentifier: string, data: string) => {
				emittedData = data;
				expectedDeviceIdentifier = deviceIdentifier;
			});
			deviceLogProvider.logData(testData, "platform", "device1");
			assert.deepStrictEqual(emittedData, filteredFullData);
			assert.deepStrictEqual(expectedDeviceIdentifier, "device1");
			deviceLogProvider.logData(testData, "platform", "device2");
			assert.deepStrictEqual(emittedData, filteredInfoData);
			assert.deepStrictEqual(expectedDeviceIdentifier, "device2");
			deviceLogProvider.logData(testData, "platform", "device1");
			assert.deepStrictEqual(emittedData, filteredFullData);
			assert.deepStrictEqual(expectedDeviceIdentifier, "device1");
		});

		it("emits info log level for all devices, when setLogLevel is called without identifier", () => {
			deviceLogProvider.setLogLevel(fullLogLevel, "device1");
			let emittedData: string = "some default value that should be changed";
			let expectedDeviceIdentifier: string = null;
			deviceLogProvider.on("data", (deviceIdentifier: string, data: string) => {
				emittedData = data;
				expectedDeviceIdentifier = deviceIdentifier;
			});
			deviceLogProvider.logData(testData, "platform", "device1");
			assert.deepStrictEqual(emittedData, filteredFullData);
			assert.deepStrictEqual(expectedDeviceIdentifier, "device1");

			// Reset log level for all devices
			deviceLogProvider.setLogLevel(infoLogLevel);

			deviceLogProvider.logData(testData, "platform", "device2");
			assert.deepStrictEqual(emittedData, filteredInfoData);
			assert.deepStrictEqual(expectedDeviceIdentifier, "device2");
			deviceLogProvider.logData(testData, "platform", "device1");
			assert.deepStrictEqual(emittedData, filteredInfoData);
			assert.deepStrictEqual(expectedDeviceIdentifier, "device1");
		});
	});
});
