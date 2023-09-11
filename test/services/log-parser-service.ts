import { assert } from "chai";
import {
	CONNECTED_STATUS,
	DEVICE_LOG_EVENT_NAME,
} from "../../lib/common/constants";
import { LogParserService } from "../../lib/services/log-parser-service";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { IOSDebuggerPortService } from "../../lib/services/ios-debugger-port-service";
import { EventEmitter } from "events";
import { Yok } from "../../lib/common/yok";
import { IInjector } from "../../lib/common/definitions/yok";

const appId = "org.nativescript.test";
const deviceId = "fbece8e562ac63749a1018a9f1ea57614c5c953a";
const device = <Mobile.IDevice>{
	deviceInfo: {
		identifier: deviceId,
		status: CONNECTED_STATUS,
		platform: "ios",
	},
};
class DeveiceLogProviderMock extends EventEmitter {}

function createTestInjector() {
	const injector = new Yok();
	injector.register("deviceLogProvider", DeveiceLogProviderMock);
	injector.register("devicePlatformsConstants", DevicePlatformsConstants);
	injector.register("logParserService", LogParserService);
	injector.register("devicesService", {
		getDeviceByIdentifier: () => {
			return device;
		},
	});
	injector.register("errors", {});

	return injector;
}

function getDebuggerPortMessage(port: number) {
	return `NativeScript debugger has opened inspector socket on port ${port} for ${appId}.`;
}

describe("iOSLogParserService", () => {
	let injector: IInjector,
		logParserService: LogParserService,
		deviceLogProvider: Mobile.IDeviceLogProvider;

	beforeEach(() => {
		injector = createTestInjector();
		logParserService = injector.resolve("logParserService");
		deviceLogProvider = injector.resolve("deviceLogProvider");
	});

	function emitDeviceLog(message: string) {
		deviceLogProvider.emit(
			DEVICE_LOG_EVENT_NAME,
			message,
			device.deviceInfo.identifier
		);
	}

	function attachOnDebuggerFoundEvent(): IIOSDebuggerPortData[] {
		const receivedData: any[] = [];

		logParserService.addParseRule({
			handler: (matches: RegExpMatchArray) => {
				const data = {
					port: parseInt(matches[1]),
					appId: matches[2],
					deviceId,
				};
				receivedData.push(data);
			},
			regex: IOSDebuggerPortService.DEBUG_PORT_LOG_REGEX,
			name: "testDebugPort",
		});

		return receivedData;
	}

	describe("addParseRule", () => {
		it(`should execute handler if regex matches`, async () => {
			const emittedMessagesCount = 1;
			const data = attachOnDebuggerFoundEvent();

			emitDeviceLog("test message");
			emitDeviceLog(getDebuggerPortMessage(18181));

			assert.deepStrictEqual(data.length, emittedMessagesCount);
			assert.deepStrictEqual(data[0], {
				port: 18181,
				deviceId: deviceId,
				appId: appId,
			});
		});
		it("should call handler for all mactches in order for same matches", async () => {
			const emittedMessagesCount = 5;
			const data = attachOnDebuggerFoundEvent();

			emitDeviceLog(getDebuggerPortMessage(18181));
			emitDeviceLog(getDebuggerPortMessage(18181));
			emitDeviceLog(getDebuggerPortMessage(18181));
			emitDeviceLog(getDebuggerPortMessage(18181));
			emitDeviceLog(getDebuggerPortMessage(64087));

			assert.deepStrictEqual(data.length, emittedMessagesCount);
			assert.deepStrictEqual(data[0], {
				port: 18181,
				deviceId: deviceId,
				appId: appId,
			});
			assert.deepStrictEqual(data[1], {
				port: 18181,
				deviceId: deviceId,
				appId: appId,
			});
			assert.deepStrictEqual(data[2], {
				port: 18181,
				deviceId: deviceId,
				appId: appId,
			});
			assert.deepStrictEqual(data[3], {
				port: 18181,
				deviceId: deviceId,
				appId: appId,
			});
			assert.deepStrictEqual(data[4], {
				port: 64087,
				deviceId: deviceId,
				appId: appId,
			});
		});
		it("should call handler for all matches in order for different matches", async () => {
			const emittedMessagesCount = 5;
			const data = attachOnDebuggerFoundEvent();

			emitDeviceLog(getDebuggerPortMessage(45898));
			emitDeviceLog(getDebuggerPortMessage(1809));
			emitDeviceLog(getDebuggerPortMessage(65072));
			emitDeviceLog(getDebuggerPortMessage(12345));
			emitDeviceLog(getDebuggerPortMessage(18181));

			assert.deepStrictEqual(data.length, emittedMessagesCount);
			assert.deepStrictEqual(data[0], {
				port: 45898,
				deviceId: deviceId,
				appId: appId,
			});
			assert.deepStrictEqual(data[1], {
				port: 1809,
				deviceId: deviceId,
				appId: appId,
			});
			assert.deepStrictEqual(data[2], {
				port: 65072,
				deviceId: deviceId,
				appId: appId,
			});
			assert.deepStrictEqual(data[3], {
				port: 12345,
				deviceId: deviceId,
				appId: appId,
			});
			assert.deepStrictEqual(data[4], {
				port: 18181,
				deviceId: deviceId,
				appId: appId,
			});
		});
		it(`should not execute handler if no match`, async () => {
			const data = attachOnDebuggerFoundEvent();

			emitDeviceLog("some test message");
			emitDeviceLog("another test message");

			assert.equal(data.length, 0);
		});
	});
});
