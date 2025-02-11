import { assert } from "chai";
import {
	CONNECTED_STATUS,
	DEBUGGER_PORT_FOUND_EVENT_NAME,
	DEVICE_LOG_EVENT_NAME
} from "../../lib/common/constants";
import { ErrorsStub, LoggerStub } from "../stubs";
import { IOSDebuggerPortService } from "../../lib/services/ios-debugger-port-service";
import { LogParserService } from "../../lib/services/log-parser-service";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";
import { Yok } from "../../lib/common/yok";
import { EventEmitter } from "events";
import * as sinon from "sinon";
import * as _ from "lodash";
import { IInjector } from "../../lib/common/definitions/yok";

class DeviceApplicationManagerMock extends EventEmitter {}

class DeveiceLogProviderMock extends EventEmitter {
	public logData(id: string): void {
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
	injector.register("iOSSimResolver", {
		iOSSim: () => ({})
	});
	injector.register("logger", LoggerStub);
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

function getAppCrashMessage() {
	return `***** Fatal JavaScript exception - application has been terminated. *****`;
}

function getMultilineAppCrashMessage() {
	return `Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: ***** Fatal JavaScript exception - application has been terminated. *****
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: Native stack trace:
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 1   0x1013ef370 NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 2   0x10141fdec NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 3   0x101e84494 ffi_closure_SYSV_inner
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 4   0x101e881b4 .Ldo_closure
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 5   0x183760c3c <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 6   0x1837601b8 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 7   0x18375ff14 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 8   0x1837dd84c <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 9   0x183696f38 _CFXNotificationPost
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 10  0x184107bbc <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 11  0x18d3da2f0 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 12  0x18d3a75e0 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 13  0x18d9d7b1c <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 14  0x18d3a6dd0 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 15  0x18d3a6c6c <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 16  0x18d3a5afc <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 17  0x18e03b84c <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 18  0x18d3a51ec <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 19  0x18de20ac8 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 20  0x18df6ebf8 _performActionsWithDelayForTransitionContext
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 21  0x18d3a4c0c <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 22  0x18d3a45a8 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 23  0x18d3a15e0 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 24  0x18d3a1330 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 25  0x185fcf470 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 26  0x185fd7d6c <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 27  0x1830c0a60 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 28  0x1830c8170 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 29  0x186003878 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 30  0x18600351c <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 31  0x186003ab8 <redacted>
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: JavaScript stack trace:
	Mar 20 15:13:23 iOS-Team-iPad-2-Mini-Black hwJs(NativeScript)[3946] <Notice>: 1   @file:///app/vendor.js:12552:56`;
}

describe("iOSDebuggerPortService", () => {
	let injector: IInjector,
		iOSDebuggerPortService: IIOSDebuggerPortService,
		deviceLogProvider: Mobile.IDeviceLogProvider;
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
		deviceLogProvider.emit(
			DEVICE_LOG_EVENT_NAME,
			message,
			device.deviceInfo.identifier
		);
	}
	describe("getPort", () => {
		const testCases: {
			name: string;
			emittedPort?: number;
			crashApp?: boolean;
			expectedError?: string;
		}[] = [
			{
				name: `should return null when ${DEBUGGER_PORT_FOUND_EVENT_NAME} event is not emitted`,
				emittedPort: null
			},
			{
				name: `should return default port when ${DEBUGGER_PORT_FOUND_EVENT_NAME} event is emitted`,
				emittedPort: 18181
			},
			{
				name: `should return random port when ${DEBUGGER_PORT_FOUND_EVENT_NAME} event is emitted`,
				emittedPort: 65432
			},
			{
				name: `should reject when the app crashes`,
				expectedError: "The application has been terminated.",
				crashApp: true
			}
		];

		_.each(testCases, (testCase) => {
			it(testCase.name, async () => {
				await iOSDebuggerPortService.attachToDebuggerPortFoundEvent(appId);
				if (testCase.emittedPort) {
					emitDeviceLog(getDebuggerPortMessage(testCase.emittedPort));
				} else if (testCase.crashApp) {
					emitDeviceLog(getAppCrashMessage());
				}

				const promise = iOSDebuggerPortService.getPort({
					deviceId: deviceId,
					appId: appId
				});
				clock.tick(70000);
				let port = 0;
				try {
					port = await promise;
					assert.deepStrictEqual(port, testCase.emittedPort);
				} catch (err) {
					assert.deepStrictEqual(err.message, testCase.expectedError);
				}
			});
			it(`${testCase.name} for multiline debugger port message.`, async () => {
				await iOSDebuggerPortService.attachToDebuggerPortFoundEvent(appId);
				if (testCase.emittedPort) {
					emitDeviceLog(getMultilineDebuggerPortMessage(testCase.emittedPort));
				} else if (testCase.crashApp) {
					emitDeviceLog(getMultilineAppCrashMessage());
				}

				const promise = iOSDebuggerPortService.getPort({
					deviceId: deviceId,
					appId: appId
				});
				clock.tick(70000);
				let port = 0;
				try {
					port = await promise;
					assert.deepStrictEqual(port, testCase.emittedPort);
				} catch (err) {
					assert.deepStrictEqual(err.message, testCase.expectedError);
				}
			});
		});
	});
});
