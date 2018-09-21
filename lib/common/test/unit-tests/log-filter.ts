import { LogFilter } from "../../mobile/log-filter";
import { Yok } from "../../yok";
import { DevicePlatformsConstants } from "../../mobile/device-platforms-constants";
import { LoggingLevels } from "../../mobile/logging-levels";
import * as assert from "assert";

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("injector", testInjector);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("loggingLevels", LoggingLevels);
	testInjector.register("logFilter", LogFilter);
	testInjector.register("iOSLogFilter", {
		filterData: (data: string, deviceLogOptions: Mobile.IDeviceLogOptions) => {
			return `ios: ${data} ${deviceLogOptions.logLevel}`;
		}
	});

	testInjector.register("androidLogFilter", {
		filterData: (data: string, deviceLogOptions: Mobile.IDeviceLogOptions) => {
			return `android: ${data} ${deviceLogOptions.logLevel}`;
		}
	});

	return testInjector;
}

describe("logFilter", () => {
	let testInjector: IInjector;
	let logFilter: Mobile.ILogFilter;
	const testData = "testData";
	const infoLogLevel = "INFO";
	const fullLogLevel = "FULL";
	const androidInfoTestData = `android: ${testData} ${infoLogLevel}`;
	const androidFullTestData = `android: ${testData} ${fullLogLevel}`;
	const iosInfoTestData = `ios: ${testData} ${infoLogLevel}`;
	const iosFullTestData = `ios: ${testData} ${fullLogLevel}`;
	let logLevel: string = null;

	beforeEach(() => {
		testInjector = createTestInjector();
		logFilter = testInjector.resolve("logFilter");
		logLevel = null;
	});

	describe("loggingLevel", () => {
		it("verify default value is INFO", () => {
			assert.deepEqual(logFilter.loggingLevel, infoLogLevel, "Default level should be INFO.");
		});

		it("sets default value to FULL", () => {
			logFilter.loggingLevel = fullLogLevel;
			assert.deepEqual(logFilter.loggingLevel, fullLogLevel, "Default level should be FULL.");
		});

		it("keeps default value to INFO when invalid value is passed", () => {
			logFilter.loggingLevel = "invalidValue";
			assert.deepEqual(logFilter.loggingLevel, infoLogLevel, "Default level should be INFO.");
		});

		it("keeps default value to INFO when falsey value is passed", () => {
			logFilter.loggingLevel = null;
			assert.deepEqual(logFilter.loggingLevel, infoLogLevel, "Default level should be INFO.");
		});
	});

	describe("filterData", () => {
		describe("when logLevel is not specified and default log level is not changed", () => {
			it("returns same data when platform is not correct", () => {
				const actualData = logFilter.filterData("invalidPlatform", testData, { logLevel });
				assert.deepEqual(actualData, testData);
			});

			it("returns same data when platform is not passed", () => {
				const actualData = logFilter.filterData(null, testData, { logLevel });
				assert.deepEqual(actualData, testData);
			});

			it("returns correct data when platform is android", () => {
				const actualData = logFilter.filterData("android", testData, { logLevel });
				assert.deepEqual(actualData, androidInfoTestData);
			});

			it("returns correct data when platform is ios", () => {
				const actualData = logFilter.filterData("ios", testData, { logLevel });
				assert.deepEqual(actualData, iosInfoTestData);
			});
		});

		describe("when logLevel is not specified and default log level is set to full", () => {
			beforeEach(() => logFilter.loggingLevel = fullLogLevel);

			it("returns same data when platform is not correct", () => {
				const actualData = logFilter.filterData("invalidPlatform", testData, null);
				assert.deepEqual(actualData, testData);
			});

			it("returns correct data when platform is android", () => {
				const actualData = logFilter.filterData("android", testData, null);
				assert.deepEqual(actualData, androidFullTestData);
			});

			it("returns correct data when platform is ios", () => {
				const actualData = logFilter.filterData("ios", testData, null);
				assert.deepEqual(actualData, iosFullTestData);
			});
		});

		describe("when logLevel is INFO", () => {
			beforeEach(() => logLevel = infoLogLevel);

			it("returns same data when platform is not correct", () => {
				const actualData = logFilter.filterData("invalidPlatform", testData, { logLevel });
				assert.deepEqual(actualData, testData, logLevel);
			});

			it("returns correct data when platform is android", () => {
				const actualData = logFilter.filterData("android", testData, { logLevel });
				assert.deepEqual(actualData, androidInfoTestData);
			});

			it("returns correct data when platform is ios", () => {
				const actualData = logFilter.filterData("ios", testData, { logLevel });
				assert.deepEqual(actualData, iosInfoTestData);
			});
		});

		describe("when logLevel is FULL", () => {
			beforeEach(() => logLevel = fullLogLevel);

			it("returns same data when platform is not correct", () => {
				const actualData = logFilter.filterData("invalidPlatform", testData, { logLevel });
				assert.deepEqual(actualData, testData, logLevel);
			});

			it("returns correct data when platform is android", () => {
				const actualData = logFilter.filterData("android", testData, { logLevel });
				assert.deepEqual(actualData, androidFullTestData);
			});

			it("returns correct data when platform is ios", () => {
				const actualData = logFilter.filterData("ios", testData, { logLevel });
				assert.deepEqual(actualData, iosFullTestData);
			});
		});
	});
});
