import { assert } from "chai";
import { CONNECTED_STATUS, DEBUGGER_PORT_FOUND_EVENT_NAME, DEVICE_LOG_EVENT_NAME } from "../../lib/common/constants";
import { IOSDeviceOperations } from "../../lib/common/mobile/ios/device/ios-device-operations";
import { IOSLogParserService } from "../../lib/services/ios-log-parser-service";
import { IOSSimulatorLogProvider } from "../../lib/common/mobile/ios/simulator/ios-simulator-log-provider";
import { Yok } from "../../lib/common/yok";

const appId = "org.nativescript.test";
const deviceId = "fbece8e562ac63749a1018a9f1ea57614c5c953a";
const device = <Mobile.IDevice>{
	deviceInfo: {
		identifier: deviceId,
		status: CONNECTED_STATUS
	}
};

function createTestInjector() {
	const injector = new Yok();
	injector.register("deviceLogProvider", {
		setProjectNameForDevice: () => ({})
	});

	injector.register("iosDeviceOperations", IOSDeviceOperations);
	injector.register("iOSLogParserService", IOSLogParserService);
	injector.register("iOSProjectService", {
		getFrameworkVersion: () => "4.1.0"
	});
	injector.register("iOSSimResolver", () => ({}));
	injector.register("iOSSimulatorLogProvider", IOSSimulatorLogProvider);

	injector.register("logger", {
		trace: () => ({})
	});

	injector.register("processService", {
		attachToProcessExitSignals: () => ({})
	});
	injector.register("projectData", {
		projectName: "test",
		projectId: appId
	});

	return injector;
}

function getDebuggerPortMessage(port: number) {
	return `NativeScript debugger has opened inspector socket on port ${port} for ${appId}.`;
}

describe("iOSLogParserService", () => {
	let injector: IInjector, iOSLogParserService: IIOSLogParserService, iosDeviceOperations: IIOSDeviceOperations;

	beforeEach(() => {
		injector = createTestInjector();
		iOSLogParserService = injector.resolve("iOSLogParserService");
		iosDeviceOperations = injector.resolve("iosDeviceOperations");
		iosDeviceOperations.startDeviceLog = () => ({});
	});

	function emitDeviceLog(message: string) {
		iosDeviceOperations.emit(DEVICE_LOG_EVENT_NAME, {
			deviceId: device.deviceInfo.identifier,
			message: message
		});
	}

	function attachOnDebuggerFoundEvent(emittedMessagesCount: number): Promise<IIOSDebuggerPortData[]> {
		const receivedData: IIOSDebuggerPortData[] = [];

		return new Promise((resolve, reject) => {
			iOSLogParserService.on(DEBUGGER_PORT_FOUND_EVENT_NAME, (data: IIOSDebuggerPortData) => {
				receivedData.push(data);
				if (receivedData.length === emittedMessagesCount) {
					resolve(receivedData);
				}
			});
		});
	}

	describe("startLookingForDebuggerPort", () => {
		it(`should emit ${DEBUGGER_PORT_FOUND_EVENT_NAME} event`, async () => {
			const emittedMessagesCount = 1;
			const promise = attachOnDebuggerFoundEvent(emittedMessagesCount);

			iOSLogParserService.startParsingLog(device);
			emitDeviceLog("test message");
			emitDeviceLog(getDebuggerPortMessage(18181));

			const data = await promise;

			assert.deepEqual(data.length, emittedMessagesCount);
			assert.deepEqual(data[0], { port: 18181, deviceId: deviceId, appId: appId });
		});
		it("should receive all log data when cache logs are emitted in case when default port is not available", async () => {
			const emittedMessagesCount = 5;
			const promise = attachOnDebuggerFoundEvent(emittedMessagesCount);

			iOSLogParserService.startParsingLog(device);
			emitDeviceLog(getDebuggerPortMessage(18181));
			emitDeviceLog(getDebuggerPortMessage(18181));
			emitDeviceLog(getDebuggerPortMessage(18181));
			emitDeviceLog(getDebuggerPortMessage(18181));
			emitDeviceLog(getDebuggerPortMessage(64087));

			const data = await promise;

			assert.deepEqual(data.length, emittedMessagesCount);
			assert.deepEqual(data[0], { port: 18181, deviceId: deviceId, appId: appId });
			assert.deepEqual(data[1], { port: 18181, deviceId: deviceId, appId: appId });
			assert.deepEqual(data[2], { port: 18181, deviceId: deviceId, appId: appId });
			assert.deepEqual(data[3], { port: 18181, deviceId: deviceId, appId: appId });
			assert.deepEqual(data[4], { port: 64087, deviceId: deviceId, appId: appId });
		});
		it("should receive all log data when cache logs are emitted in case when default port is available", async () => {
			const emittedMessagesCount = 5;
			const promise = attachOnDebuggerFoundEvent(emittedMessagesCount);

			iOSLogParserService.startParsingLog(device);
			emitDeviceLog(getDebuggerPortMessage(45898));
			emitDeviceLog(getDebuggerPortMessage(1809));
			emitDeviceLog(getDebuggerPortMessage(65072));
			emitDeviceLog(getDebuggerPortMessage(12345));
			emitDeviceLog(getDebuggerPortMessage(18181));

			const data = await promise;

			assert.deepEqual(data.length, emittedMessagesCount);
			assert.deepEqual(data[0], { port: 45898, deviceId: deviceId, appId: appId });
			assert.deepEqual(data[1], { port: 1809, deviceId: deviceId, appId: appId });
			assert.deepEqual(data[2], { port: 65072, deviceId: deviceId, appId: appId });
			assert.deepEqual(data[3], { port: 12345, deviceId: deviceId, appId: appId });
			assert.deepEqual(data[4], { port: 18181, deviceId: deviceId, appId: appId });
		});
		it(`should not receive ${DEBUGGER_PORT_FOUND_EVENT_NAME} event when debugger port message is not emitted`, () => {
			let isDebuggedPortFound = false;

			iOSLogParserService.on(DEBUGGER_PORT_FOUND_EVENT_NAME, (data: IIOSDebuggerPortData) => isDebuggedPortFound = true);

			iOSLogParserService.startParsingLog(device);
			emitDeviceLog("some test message");
			emitDeviceLog("another test message");

			assert.isFalse(isDebuggedPortFound);
		});
	});
});
