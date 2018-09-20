import { AndroidApplicationManager } from "../../mobile/android/android-application-manager";
import { Yok } from "../../yok";
import { assert } from "chai";
import { CommonLoggerStub, LogcatHelperStub, AndroidProcessServiceStub, DeviceLogProviderStub, ErrorsStub } from "./stubs";
const invalidIdentifier = "invalid.identifier";
const validDeviceIdentifier = "device.identifier";
const validIdentifier = "org.nativescript.testApp";
const validStartOptions = { appId: validIdentifier, projectName: "" };

class AndroidDebugBridgeStub {
	public calledStopApplication = false;
	public startedWithActivityManager = false;
	public validIdentifierPassed = false;
	public static methodCallCount = 0;
	private expectedValidTestInput: string[] = [
		"org.nativescript.testApp/com.tns.TestClass",
		"org.nativescript.testApp/org.MyCoolApp.MyCoolActivity",
		"org.nativescript.testApp/org.myCoolApp.MyCoolActivity",
		"org.nativescript.testApp/com.tns.$TestClass",
		"org.nativescript.testApp/com.tns._TestClass",
		"org.nativescript.testApp/com.tns.$_TestClass",
		"org.nativescript.testApp/com.tns._$TestClass",
		"org.nativescript.testApp/com.tns.NativeScriptActivity"
	];
	private validTestInput: string[] = [
		"other.stuff/ org.nativescript.testApp/com.tns.TestClass asdaas.dasdh2",
		"other.stuff/ org.nativescript.testApp/org.MyCoolApp.MyCoolActivity asdaas.dasdh2",
		"other.stuff/ org.nativescript.testApp/org.myCoolApp.MyCoolActivity asdaas.dasdh2",
		"other.stuff.the.regex.might.fail.on org.nativescript.testApp/com.tns.$TestClass other.stuff.the.regex.might.fail.on",
		"/might.fail.on  org.nativescript.testApp/com.tns._TestClass /might.fail.on",
		"might.fail.on/ org.nativescript.testApp/com.tns.$_TestClass might.fail.on//",
		"/might.fail org.nativescript.testApp/com.tns._$TestClass something/might.fail.on/",
		"android.intent.action.MAIN: \
			3b2df03 org.nativescript.testApp/com.tns.NativeScriptActivity filter 50dd82e \
			Action: \"android.intent.action.MAIN\" \
			Category: \"android.intent.category.LAUNCHER\" \
			-- \
			intent={act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=org.nativescript.testApp/com.tns.NativeScriptActivity} \
			realActivity=org.nativescript.testApp/com.tns.NativeScriptActivity \
			-- \
			Intent { act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=org.nativescript.testApp/com.tns.NativeScriptActivity } \
			frontOfTask=true task=TaskRecord{fe592ac #449 A=org.nativescript.testApp U=0 StackId=1 sz=1}"
	];

	public async executeShellCommand(args: string[]): Promise<any> {
		if (args && args.length > 0) {
			if (args[0] === "pm") {
				const passedIdentifier = args[2];
				if (passedIdentifier === invalidIdentifier) {
					return "invalid output string";
				} else {
					const testString = this.validTestInput[AndroidDebugBridgeStub.methodCallCount];
					return testString;
				}
			} else {
				this.startedWithActivityManager = this.checkIfStartedWithActivityManager(args);
				if (this.startedWithActivityManager) {
					this.validIdentifierPassed = this.checkIfValidIdentifierPassed(args);
				}
			}

			if (this.startedWithActivityManager && args[1] === "force-stop") {
				this.calledStopApplication = true;
			}
		}

		AndroidDebugBridgeStub.methodCallCount++;
	}

	public async pushFile(localFilePath: string, deviceFilePath: string): Promise<void> {
		await this.executeShellCommand(["push", localFilePath, deviceFilePath]);
	}

	public getInputLength(): number {
		return this.validTestInput.length;
	}

	private checkIfStartedWithActivityManager(args: string[]): boolean {
		const firstArgument = args[0].trim();

		return firstArgument === "am";
	}

	private checkIfValidIdentifierPassed(args: string[]): boolean {
		if (args && args.length) {
			const possibleIdentifier = args[args.length - 1];
			const validTestString = this.expectedValidTestInput[AndroidDebugBridgeStub.methodCallCount];

			return possibleIdentifier === validTestString;
		}

		return false;
	}
}

function createTestInjector(options?: {
	justLaunch?: boolean
}): IInjector {
	const testInjector = new Yok();
	testInjector.register("androidApplicationManager", AndroidApplicationManager);
	testInjector.register("adb", AndroidDebugBridgeStub);
	testInjector.register('childProcess', {});
	testInjector.register("logger", CommonLoggerStub);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("config", {});
	testInjector.register("staticConfig", {});
	testInjector.register("androidDebugBridgeResultHandler", {});
	testInjector.register("options", { justlaunch: options && options.justLaunch || false });
	testInjector.register("identifier", validDeviceIdentifier);
	testInjector.register("logcatHelper", LogcatHelperStub);
	testInjector.register("androidProcessService", AndroidProcessServiceStub);
	testInjector.register("httpClient", {});
	testInjector.register("deviceLogProvider", DeviceLogProviderStub);
	testInjector.register("hooksService", {});
	return testInjector;
}

describe("android-application-manager", () => {

	let testInjector: IInjector;
	let androidApplicationManager: AndroidApplicationManager;
	let androidDebugBridge: AndroidDebugBridgeStub;
	let logcatHelper: LogcatHelperStub;
	let androidProcessService: AndroidProcessServiceStub;
	let deviceLogProvider: DeviceLogProviderStub;
	let logger: CommonLoggerStub;

	function setup(options?: {
		justLaunch?: boolean
	}) {
		testInjector = createTestInjector(options);
		androidApplicationManager = testInjector.resolve("androidApplicationManager");
		androidDebugBridge = testInjector.resolve("adb");
		logcatHelper = testInjector.resolve("logcatHelper");
		androidProcessService = testInjector.resolve("androidProcessService");
		deviceLogProvider = testInjector.resolve("deviceLogProvider");
		logger = testInjector.resolve("logger");
	}

	describe("startApplication", () => {
		it("fires up the right application", async () => {
			setup();
			for (let i = 0; i < androidDebugBridge.getInputLength(); i++) {
				androidDebugBridge.validIdentifierPassed = false;

				await androidApplicationManager.startApplication(validStartOptions);

				assert.isTrue(androidDebugBridge.validIdentifierPassed);
				assert.isTrue(androidDebugBridge.startedWithActivityManager);
			}
		});

		it("is calling monkey to start the application when invalid identifier is passed", async () => {
			setup();

			await androidApplicationManager.startApplication({ appId: invalidIdentifier, projectName: "" });

			assert.isFalse(androidDebugBridge.startedWithActivityManager);
		});

		it("starts the logcat helper", async () => {
			setup();

			await androidApplicationManager.startApplication(validStartOptions);

			assert.equal(logcatHelper.StartCallCount, 1);
		});

		it("do not start the logcat helper with justLaunch param", async () => {
			setup();

			await androidApplicationManager.startApplication(_.extend({}, validStartOptions, { justLaunch: true }));

			assert.equal(logcatHelper.StartCallCount, 0);
		});

		it("do not start the logcat helper with justLaunch user option", async () => {
			setup({ justLaunch: true });

			await androidApplicationManager.startApplication(_.extend({}, validStartOptions, { justLaunch: false }));

			assert.equal(logcatHelper.StartCallCount, 0);
		});

		it("do not start the logcat helper with both justLaunch argument and user option", async () => {
			setup({ justLaunch: true });

			await androidApplicationManager.startApplication(_.extend({}, validStartOptions, { justLaunch: true }));

			assert.equal(logcatHelper.StartCallCount, 0);
		});

		it("passes the pid to the logcat helper", async () => {
			setup();
			const expectedPid = "pid";
			androidProcessService.GetAppProcessIdResult = expectedPid;

			await androidApplicationManager.startApplication(validStartOptions);

			assert.equal(logcatHelper.LastStartCallOptions.pid, expectedPid);
		});

		it("sets the current device pid", async () => {
			setup();
			const expectedPid = "pid";
			androidProcessService.GetAppProcessIdResult = expectedPid;

			await androidApplicationManager.startApplication(validStartOptions);

			assert.equal(deviceLogProvider.currentDevicePids[validDeviceIdentifier], expectedPid);
		});

		it("polls for pid when not available initially and passes it to the logcat helper", async () => {
			setup();
			const expectedPid = "pid";
			androidProcessService.GetAppProcessIdResult = expectedPid;
			androidProcessService.GetAppProcessIdFailAttempts = 1;
			androidApplicationManager.PID_CHECK_INTERVAL = 10;

			await androidApplicationManager.startApplication(validStartOptions);

			assert.equal(logcatHelper.LastStartCallOptions.pid, expectedPid);
			assert.isTrue(logger.traceOutput.indexOf("Wasn't able to get pid") > -1);
			assert.isTrue(logger.output.indexOf(`Unable to find running "${validIdentifier}" application on device `) === -1);
		});

		it("starts the logcat helper without pid after a timeout, when pid not available", () => {
			setup();
			const expectedPidTimeout = 100;
			androidApplicationManager.PID_CHECK_INTERVAL = 10;
			androidApplicationManager.PID_CHECK_TIMEOUT = expectedPidTimeout;
			androidProcessService.GetAppProcessIdResult = null;

			const startApplicationPromise = androidApplicationManager.startApplication(validStartOptions);

			startApplicationPromise.catch(() => {
				assert.isTrue(logcatHelper.DumpCallCount > 0);
				assert.isTrue(logger.traceOutput.indexOf("Wasn't able to get pid") > -1);
			});

			return assert.isRejected(startApplicationPromise, `Unable to find running "${validIdentifier}" application on device `);
		});
	});

	describe("stopApplication", () => {
		it("should stop the logcat helper", async () => {
			setup();

			await androidApplicationManager.stopApplication(validStartOptions);

			assert.equal(logcatHelper.StopCallCount, 1);
		});

		it("should stop the application", async () => {
			setup();

			await androidApplicationManager.stopApplication(validStartOptions);

			assert.isTrue(androidDebugBridge.calledStopApplication);
		});

		it("should reset the current pid", async () => {
			setup();

			await androidApplicationManager.stopApplication(validStartOptions);

			assert.equal(deviceLogProvider.currentDevicePids[validDeviceIdentifier], null);
		});
	});
});
