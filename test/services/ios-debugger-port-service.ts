import { assert } from "chai";
import { CONNECTED_STATUS, DEBUGGER_PORT_FOUND_EVENT_NAME, DEVICE_LOG_EVENT_NAME } from "../../lib/common/constants";
import { ErrorsStub, LoggerStub } from "../stubs";
import { IOSDebuggerPortService } from "../../lib/services/ios-debugger-port-service";
import { LogParserService } from "../../lib/services/log-parser-service";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { Yok } from "../../lib/common/yok";
import { EventEmitter } from "events";
import * as sinon from "sinon";

class DeviceApplicationManagerMock extends EventEmitter { }

class DeveiceLogProviderMock extends EventEmitter {
	public logData(deviceId: string): void {
		// need this to be empty
	}
}

const appId = "org.nativescript.test";
const deviceId = "fbece8e562ac63749a1018a9f1ea57614c5c953a";
const device = <Mobile.IDevice>{
	deviceInfo: {
		identifier: deviceId,
		status: CONNECTED_STATUS,
		platform: "ios"
	},
	applicationManager: new DeviceApplicationManagerMock()
};

function createTestInjector() {
	const injector = new Yok();

	injector.register("devicePlatformsConstants", DevicePlatformsConstants);
	injector.register("deviceLogProvider", DeveiceLogProviderMock);
	injector.register("errors", ErrorsStub);
	injector.register("iOSDebuggerPortService", IOSDebuggerPortService);
	injector.register("logParserService", LogParserService);
	injector.register("iOSProjectService", {
		getFrameworkVersion: () => "4.1.0"
	});
	injector.register("previewSdkService", {
		on: () => () => ({})
	});
	injector.register("iOSSimResolver", {
		iOSSim: () => ({})
	});
	injector.register("logger", LoggerStub);
	injector.register("processService", {
		attachToProcessExitSignals: () => ({})
	});
	injector.register("projectDataService", {
		getProjectData: (projectDir: string) => ({
			projectName: "test",
			projectId: appId
		})
	});
	injector.register("devicesService", {
		getDeviceByIdentifier: () => {
			return device;
		}
	});
	injector.register("iOSNotification", DeviceApplicationManagerMock);

	return injector;
}

function getDebuggerPortMessage(port: number) {
	return `NativeScript debugger has opened inspector socket on port ${port} for ${appId}.`;
}

function getMultilineDebuggerPortMessage(port: number) {
	return `2018-04-20 09:45:48.645149+0300  localhost locationd[1040]: Created Activity ID: 0x7b46b, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:48.645199+0300  localhost locationd[1040]: Created Activity ID: 0x7b46c, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:48.645234+0300  localhost locationd[1040]: Created Activity ID: 0x7b46d, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:48.645278+0300  localhost locationd[1040]: Created Activity ID: 0x7b46e, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:49.645448+0300  localhost locationd[1040]: Created Activity ID: 0x7b46f, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:49.645518+0300  localhost locationd[1040]: Created Activity ID: 0x7b490, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:49.645554+0300  localhost locationd[1040]: Created Activity ID: 0x7b491, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:49.645592+0300  localhost locationd[1040]: Created Activity ID: 0x7b492, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:49.645623+0300  localhost locationd[1040]: Created Activity ID: 0x7b493, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:49.645641+0300  localhost locationd[1040]: Created Activity ID: 0x7b494, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:50.647222+0300  localhost locationd[1040]: Created Activity ID: 0x7b495, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:50.647294+0300  localhost locationd[1040]: Created Activity ID: 0x7b496, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:50.647331+0300  localhost locationd[1040]: Created Activity ID: 0x7b497, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:50.647369+0300  localhost locationd[1040]: Created Activity ID: 0x7b498, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:50.647400+0300  localhost locationd[1040]: Created Activity ID: 0x7b499, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:50.647417+0300  localhost locationd[1040]: Created Activity ID: 0x7b49a, Description: CL: notifyClientsWithData (Fallback)
		2018-04-20 09:45:51.071718+0300  localhost securityuploadd[17963]: [com.apple.securityd:lifecycle] will exit when clean
		2018-04-20 09:45:51.256053+0300  localhost CoreSimulatorBridge[1046]: Pasteboard change listener callback port <NSMachPort: 0x7ff1b1802390> registered
		2018-04-20 09:45:51.260951+0300  localhost nglog[17917]: NativeScript debugger has opened inspector socket on port ${port} for ${appId}.`;
}

describe("iOSDebuggerPortService", () => {
	let injector: IInjector, iOSDebuggerPortService: IIOSDebuggerPortService, deviceLogProvider: Mobile.IDeviceLogProvider;
	let clock: sinon.SinonFakeTimers = null;

	beforeEach(() => {
		injector = createTestInjector();
		iOSDebuggerPortService = injector.resolve("iOSDebuggerPortService");
		deviceLogProvider = injector.resolve("deviceLogProvider");
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		clock.restore();
	});

	function emitDeviceLog(message: string) {
		deviceLogProvider.emit(DEVICE_LOG_EVENT_NAME, message, device.deviceInfo.identifier);
	}

	function emitStartingIOSApplicationEvent() {
		device.applicationManager.emit("STARTING_IOS_APPLICATION", {
			appId: appId,
			deviceId: device.deviceInfo.identifier
		});
	}

	describe("getPort", () => {
		const testCases = [
			{
				name: `should return null when ${DEBUGGER_PORT_FOUND_EVENT_NAME} event is not emitted`,
				emittedPort: null,
				emitStartingIOSApplicationEvent: false
			},
			{
				name: `should return default port when ${DEBUGGER_PORT_FOUND_EVENT_NAME} event is emitted`,
				emittedPort: 18181,
				emitStartingIOSApplicationEvent: false
			},
			{
				name: `should return random port when ${DEBUGGER_PORT_FOUND_EVENT_NAME} event is emitted`,
				emittedPort: 65432,
				emitStartingIOSApplicationEvent: false
			},
			{
				name: `should return default port when ${DEBUGGER_PORT_FOUND_EVENT_NAME} and STARTING_IOS_APPLICATION events are emitted`,
				emittedPort: 18181,
				emitStartingIOSApplicationEvent: true
			},
			{
				name: `should return random port when ${DEBUGGER_PORT_FOUND_EVENT_NAME} and STARTING_IOS_APPLICATION events are emitted`,
				emittedPort: 12345,
				emitStartingIOSApplicationEvent: true
			}
		];

		const mockProjectDirObj = {
			projectDir: "/Users/username/projectdir"
		};

		_.each(testCases, testCase => {
			it(testCase.name, async () => {
				await iOSDebuggerPortService.attachToDebuggerPortFoundEvent(device, mockProjectDirObj, <any>{});
				if (testCase.emitStartingIOSApplicationEvent) {
					emitStartingIOSApplicationEvent();
				}
				if (testCase.emittedPort) {
					emitDeviceLog(getDebuggerPortMessage(testCase.emittedPort));
				}

				const promise = iOSDebuggerPortService.getPort({ deviceId: deviceId, appId: appId, projectDir: mockProjectDirObj.projectDir });
				clock.tick(20000);
				const port = await promise;
				assert.deepEqual(port, testCase.emittedPort);
			});
			it(`${testCase.name} for multiline debugger port message.`, async () => {
				await iOSDebuggerPortService.attachToDebuggerPortFoundEvent(device, mockProjectDirObj, <any>{});
				if (testCase.emitStartingIOSApplicationEvent) {
					emitStartingIOSApplicationEvent();
				}
				if (testCase.emittedPort) {
					emitDeviceLog(getMultilineDebuggerPortMessage(testCase.emittedPort));
				}

				const promise = iOSDebuggerPortService.getPort({ deviceId: deviceId, appId: appId, projectDir: mockProjectDirObj.projectDir });
				clock.tick(20000);
				const port = await promise;
				assert.deepEqual(port, testCase.emittedPort);
			});
		});
	});
});
