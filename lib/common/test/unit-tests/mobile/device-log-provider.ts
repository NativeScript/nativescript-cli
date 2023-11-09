// Integration tests between $logFilter ($androidLogFilter and $iOSLogFilter) and $logSourceMapService
// These tests ensure device log is correctly parsed by CLI, i.e. the input is the exact output from device/emulator/simulator
// The output is what CLI will show.

import { Yok } from "../../../yok";
import { LogFilter } from "../../../mobile/log-filter";
import { AndroidLogFilter } from "../../../mobile/android/android-log-filter";
import { IOSLogFilter } from "../../../../services/ios-log-filter";
import { CommonLoggerStub } from "../stubs";
import { LogSourceMapService } from "../../../../services/log-source-map-service";
import { LoggingLevels } from "../../../mobile/logging-levels";
import { DevicePlatformsConstants } from "../../../mobile/device-platforms-constants";
import { DeviceLogProvider } from "../../../mobile/device-log-provider";
import { assert } from "chai";
import * as util from "util";
import * as path from "path";
import { FileSystem } from "../../../file-system";
import { IProjectData } from "../../../../definitions/project";
import { IInjector } from "../../../definitions/yok";
import * as _ from "lodash";
import { IFileSystem } from "../../../declarations";
import { color } from "../../../../color";

const deviceIdentifier = "deviceIdentifier";
let runtimeVersion = "6.1.0";
let platform: string;

const createTestInjector = (): IInjector => {
	const testInjector: IInjector = new Yok();
	testInjector.register("logFilter", LogFilter);
	testInjector.register("androidLogFilter", AndroidLogFilter);
	testInjector.register("iOSLogFilter", IOSLogFilter);
	testInjector.register("logger", CommonLoggerStub);
	testInjector.register("logSourceMapService", LogSourceMapService);
	testInjector.register("options", {
		env: {
			classicLogs: true,
		},
	});
	testInjector.register("loggingLevels", LoggingLevels);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("fs", FileSystem);
	testInjector.register("projectDataService", {
		getProjectData: (projectDir?: string): IProjectData => {
			return <any>{
				getAppDirectoryRelativePath: () => {
					return "app";
				},
				projectIdentifiers: {
					android: "org.nativescript.appTestLogs",
					ios: "org.nativescript.appTestLogs",
				},
				projectDir: "projectDir",
			};
		},
		getRuntimePackage: (projectDir: string, platformName: string): any => {
			return {
				version: runtimeVersion,
			};
		},
	});
	testInjector.register("deviceLogProvider", DeviceLogProvider);

	testInjector.register("platformsDataService", {
		getPlatformData: (pl: string) => {
			return {
				appDestinationDirectoryPath: path.join(
					__dirname,
					"..",
					"..",
					"resources",
					"device-log-provider-integration-tests",
					pl.toLowerCase()
				),
				frameworkPackageName: `tns-${platform.toLowerCase()}`,
			};
		},
	});

	testInjector.register("timelineProfilerService", {
		processLogData() {},
	});

	const logger = testInjector.resolve<CommonLoggerStub>("logger");
	logger.info = (...args: any[]): void => {
		args = args.filter((arg) => Object.keys(arg).indexOf("skipNewLine") === -1);
		logger.output += util.format.apply(null, args.filter(_.isString));
	};
	return testInjector;
};

describe("deviceLogProvider", () => {
	let testInjector: IInjector;
	let logger: CommonLoggerStub;
	let deviceLogProvider: Mobile.IDeviceLogProvider;

	const assertData = (actual: string, expected: string) => {
		const actualFixed = actual
			.replaceAll(/\r\n/g, "\n")
			.replaceAll(/\\/g, "/")
			.replaceAll(/\t/g, color.dim("→"))
			.replaceAll(/ /g, color.dim("⋅"))
			.replaceAll("\n", color.dim("↵") + "\n");
		const expectedFixed = expected
			.replaceAll(/\r\n/g, "\n")
			.replaceAll(/\\/g, "/")
			.replaceAll(/\t/g, color.dim("→"))
			.replaceAll(/ /g, color.dim("⋅"))
			.replaceAll("\n", color.dim("↵") + "\n");

		assert.equal(actualFixed, expectedFixed);
	};

	before(async () => {
		testInjector = createTestInjector();
		const fs = testInjector.resolve<IFileSystem>("fs");
		const logSourceMapService = testInjector.resolve("logSourceMapService");
		const originalFilesLocation = path.join(
			__dirname,
			"..",
			"..",
			"resources",
			"device-log-provider-integration-tests"
		);
		const files = fs.enumerateFilesInDirectorySync(originalFilesLocation);
		for (const file of files) {
			await logSourceMapService.setSourceMapConsumerForFile(file);
		}

		logger = testInjector.resolve<CommonLoggerStub>("logger");
		deviceLogProvider =
			testInjector.resolve<Mobile.IDeviceLogProvider>("deviceLogProvider");
		deviceLogProvider.setProjectDirForDevice(
			"deviceIdentifier",
			"dir_with_runtime_6.1.0"
		);
	});

	beforeEach(() => {
		logger.output = "";
	});

	describe("integration tests", () => {
		describe("android", () => {
			const logDataForAndroid = (data: string): void => {
				// That's the way data is passed to deviceLogProvider from logcatHelper
				const lines = data.split("\n");
				for (const line of lines) {
					deviceLogProvider.logData(line, platform, deviceIdentifier);
				}
			};

			before(() => {
				platform = "android";
				deviceLogProvider.setApplicationPidForDevice(deviceIdentifier, "25038");
			});

			describe("runtime version is below 6.1.0", () => {
				before(() => {
					runtimeVersion = "6.0.0";
					deviceLogProvider.setProjectDirForDevice(
						"deviceIdentifier",
						"dir_with_runtime_6.0.0"
					);
				});

				describe("SDK 28", () => {
					it("console.log", () => {
						logDataForAndroid(
							"08-22 15:31:53.189 25038 25038 I JS      : HMR: Hot Module Replacement Enabled. Waiting for signal."
						);
						assertData(
							logger.output,
							"HMR: Hot Module Replacement Enabled. Waiting for signal.\n"
						);
					});

					it("console.dir", () => {
						logDataForAndroid(`08-22 15:32:03.145 25038 25038 I JS      : ==== object dump start ====
08-22 15:32:03.145 25038 25038 I JS      : level0_0: {
08-22 15:32:03.145 25038 25038 I JS      :   "level1_0": {
08-22 15:32:03.145 25038 25038 I JS      :     "level2": "value"
08-22 15:32:03.145 25038 25038 I JS      :   },
08-22 15:32:03.145 25038 25038 I JS      :   "level1_1": {
08-22 15:32:03.145 25038 25038 I JS      :     "level2": "value2"
08-22 15:32:03.145 25038 25038 I JS      :   }
08-22 15:32:03.145 25038 25038 I JS      : }
08-22 15:32:03.145 25038 25038 I JS      : level0_1: {
08-22 15:32:03.145 25038 25038 I JS      :   "level1_0": "value3"
08-22 15:32:03.145 25038 25038 I JS      : }
08-22 15:32:03.145 25038 25038 I JS      : ==== object dump end ====`);
						assertData(
							logger.output,
							`==== object dump start ====
level0_0: {
  "level1_0": {
    "level2": "value"
  },
  "level1_1": {
    "level2": "value2"
  }
}
level0_1: {
  "level1_0": "value3"
}
==== object dump end ====\n`
						);
					});

					it("multiline console.log statement", () => {
						logDataForAndroid(`08-22 15:32:03.145 25038 25038 I JS      : multiline
08-22 15:32:03.145 25038 25038 I JS      :         message
08-22 15:32:03.145 25038 25038 I JS      :         from
08-22 15:32:03.145 25038 25038 I JS      :         console.log`);
						assertData(
							logger.output,
							`multiline
        message
        from
        console.log\n`
						);
					});

					it("console.trace", async () => {
						logDataForAndroid(`08-22 15:32:03.145 25038 25038 E JS      : Trace: console.trace onTap
08-22 15:32:03.145 25038 25038 E JS      : at viewModel.onTap (file:///data/data/org.nativescript.appTestLogs/files/app/bundle.js:297:17)
08-22 15:32:03.145 25038 25038 E JS      : at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable.notify (file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js:3704:32)
08-22 15:32:03.145 25038 25038 E JS      : at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable._emit (file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js:3724:18)
08-22 15:32:03.145 25038 25038 E JS      : at ClickListenerImpl.onClick (file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js:14608:23)`);
						assertData(
							logger.output,
							`Trace: console.trace onTap
at viewModel.onTap file: app/main-view-model.js:39:0
at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable.notify file: node_modules/tns-core-modules/data/observable/observable.js:107:0
at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable._emit file: node_modules/tns-core-modules/data/observable/observable.js:127:0
at ClickListenerImpl.onClick file: node_modules/tns-core-modules/ui/button/button.js:29:0\n`
						);
					});

					it("console.time(timeEnd) statement", () => {
						logDataForAndroid(
							"08-22 15:32:03.145 25038 25038 I JS      : console.time: 9603.00ms"
						);
						assertData(logger.output, "console.time: 9603.00ms\n");
					});

					it("when an error is thrown, correct callstack is printed", async () => {
						logDataForAndroid(
							// commented out because we're filtering on the adb logcat level now...
							// `08-22 15:32:03.171 25038 25038 D AndroidRuntime: Shutting down VM
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: FATAL EXCEPTION: main
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: Process: org.nativescript.appTestLogs, PID: 25038
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: com.tns.NativeScriptException: Calling js method onClick failed
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: Error: Error in onTap
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethodNative(Native Method)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1242)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethodImpl(Runtime.java:1122)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethod(Runtime.java:1109)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethod(Runtime.java:1089)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethod(Runtime.java:1081)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at com.tns.gen.java.lang.Object_vendor_14601_32_ClickListenerImpl.onClick(Object_vendor_14601_32_ClickListenerImpl.java:18)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at android.view.View.performClick(View.java:6597)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at android.view.View.performClickInternal(View.java:6574)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at android.view.View.access$3100(View.java:778)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at android.view.View$PerformClick.run(View.java:25885)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at android.os.Handler.handleCallback(Handler.java:873)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at android.os.Handler.dispatchMessage(Handler.java:99)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at android.os.Looper.loop(Looper.java:193)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at android.app.ActivityThread.main(ActivityThread.java:6669)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at java.lang.reflect.Method.invoke(Native Method)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:493)
							// 08-22 15:32:03.184 25038 25038 E AndroidRuntime: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:858)`
							`
08-22 15:32:03.210 25038 25038 W System.err: An uncaught Exception occurred on "main" thread.
08-22 15:32:03.210 25038 25038 W System.err: Calling js method onClick failed
08-22 15:32:03.210 25038 25038 W System.err: Error: Error in onTap
08-22 15:32:03.210 25038 25038 W System.err: 
08-22 15:32:03.210 25038 25038 W System.err: StackTrace:
08-22 15:32:03.210 25038 25038 W System.err: 	Frame: function:'viewModel.onTap', file:'file:///data/data/org.nativescript.appTestLogs/files/app/bundle.js', line: 301, column: 15
08-22 15:32:03.210 25038 25038 W System.err: 	Frame: function:'push.../node_modules/tns-core-modules/data/observable/observable.js.Observable.notify', file:'file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js', line: 3704, column: 32
08-22 15:32:03.210 25038 25038 W System.err: 	Frame: function:'push.../node_modules/tns-core-modules/data/observable/observable.js.Observable._emit', file:'file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js', line: 3724, column: 18
08-22 15:32:03.210 25038 25038 W System.err: 	Frame: function:'ClickListenerImpl.onClick', file:'file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js', line: 14608, column: 23
08-22 15:32:03.210 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethodNative(Native Method)
08-22 15:32:03.210 25038 25038 W System.err: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1242)
08-22 15:32:03.210 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethodImpl(Runtime.java:1122)
08-22 15:32:03.210 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1109)
08-22 15:32:03.210 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1089)
08-22 15:32:03.210 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1081)
08-22 15:32:03.210 25038 25038 W System.err: 	at com.tns.gen.java.lang.Object_vendor_14601_32_ClickListenerImpl.onClick(Object_vendor_14601_32_ClickListenerImpl.java:18)
08-22 15:32:03.210 25038 25038 W System.err: 	at android.view.View.performClick(View.java:6597)
08-22 15:32:03.210 25038 25038 W System.err: 	at android.view.View.performClickInternal(View.java:6574)
08-22 15:32:03.210 25038 25038 W System.err: 	at android.view.View.access$3100(View.java:778)
08-22 15:32:03.210 25038 25038 W System.err: 	at android.view.View$PerformClick.run(View.java:25885)
08-22 15:32:03.210 25038 25038 W System.err: 	at android.os.Handler.handleCallback(Handler.java:873)
08-22 15:32:03.210 25038 25038 W System.err: 	at android.os.Handler.dispatchMessage(Handler.java:99)
08-22 15:32:03.210 25038 25038 W System.err: 	at android.os.Looper.loop(Looper.java:193)
08-22 15:32:03.211 25038 25038 W System.err: 	at android.app.ActivityThread.main(ActivityThread.java:6669)
08-22 15:32:03.211 25038 25038 W System.err: 	at java.lang.reflect.Method.invoke(Native Method)
08-22 15:32:03.211 25038 25038 W System.err: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:493)
08-22 15:32:03.211 25038 25038 W System.err: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:858)`
						);

						assertData(
							logger.output,
							`System.err: An uncaught Exception occurred on "main" thread.
System.err: Calling js method onClick failed
System.err: Error: Error in onTap
System.err: ` +
								`
System.err: StackTrace:
System.err: 	Frame: function:'viewModel.onTap', file:'file: app/main-view-model.js:43:0
System.err: 	Frame: function:'push.../node_modules/tns-core-modules/data/observable/observable.js.Observable.notify', file:'file: node_modules/tns-core-modules/data/observable/observable.js:107:0
System.err: 	Frame: function:'push.../node_modules/tns-core-modules/data/observable/observable.js.Observable._emit', file:'file: node_modules/tns-core-modules/data/observable/observable.js:127:0
System.err: 	Frame: function:'ClickListenerImpl.onClick', file:'file: node_modules/tns-core-modules/ui/button/button.js:29:0
System.err: 	at com.tns.Runtime.callJSMethodNative(Native Method)
System.err: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1242)
System.err: 	at com.tns.Runtime.callJSMethodImpl(Runtime.java:1122)
System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1109)
System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1089)
System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1081)
System.err: 	at com.tns.gen.java.lang.Object_vendor_14601_32_ClickListenerImpl.onClick(Object_vendor_14601_32_ClickListenerImpl.java:18)
System.err: 	at android.view.View.performClick(View.java:6597)
System.err: 	at android.view.View.performClickInternal(View.java:6574)
System.err: 	at android.view.View.access$3100(View.java:778)
System.err: 	at android.view.View$PerformClick.run(View.java:25885)
System.err: 	at android.os.Handler.handleCallback(Handler.java:873)
System.err: 	at android.os.Handler.dispatchMessage(Handler.java:99)
System.err: 	at android.os.Looper.loop(Looper.java:193)
System.err: 	at android.app.ActivityThread.main(ActivityThread.java:6669)
System.err: 	at java.lang.reflect.Method.invoke(Native Method)
System.err: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:493)
System.err: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:858)\n`
						);
					});
				});
			});

			describe("runtime version is 6.1.0 or later", () => {
				before(() => {
					runtimeVersion = "6.1.0";
					deviceLogProvider.setProjectDirForDevice(
						"deviceIdentifier",
						"dir_with_runtime_6.1.0"
					);
				});

				describe("SDK 28", () => {
					it("console.log", () => {
						logDataForAndroid(
							"08-23 16:15:55.254 25038 25038 I JS      : HMR: Hot Module Replacement Enabled. Waiting for signal."
						);
						assertData(
							logger.output,
							"HMR: Hot Module Replacement Enabled. Waiting for signal.\n"
						);
					});

					it("console.dir", () => {
						logDataForAndroid(`08-23 16:16:06.570 25038 25038 I JS      : ==== object dump start ====
08-23 16:16:06.570 25038 25038 I JS      : level0_0: {
08-23 16:16:06.570 25038 25038 I JS      :   "level1_0": {
08-23 16:16:06.570 25038 25038 I JS      :     "level2": "value"
08-23 16:16:06.570 25038 25038 I JS      :   },
08-23 16:16:06.570 25038 25038 I JS      :   "level1_1": {
08-23 16:16:06.570 25038 25038 I JS      :     "level2": "value2"
08-23 16:16:06.570 25038 25038 I JS      :   }
08-23 16:16:06.570 25038 25038 I JS      : }
08-23 16:16:06.570 25038 25038 I JS      : level0_1: {
08-23 16:16:06.570 25038 25038 I JS      :   "level1_0": "value3"
08-23 16:16:06.570 25038 25038 I JS      : }
08-23 16:16:06.570 25038 25038 I JS      : ==== object dump end ====`);
						assertData(
							logger.output,
							`==== object dump start ====
level0_0: {
  "level1_0": {
    "level2": "value"
  },
  "level1_1": {
    "level2": "value2"
  }
}
level0_1: {
  "level1_0": "value3"
}
==== object dump end ====\n`
						);
					});

					it("multiline console.log statement", () => {
						logDataForAndroid(`08-23 16:16:06.570 25038 25038 I JS      : multiline
08-23 16:16:06.570 25038 25038 I JS      :         message
08-23 16:16:06.570 25038 25038 I JS      :         from
08-23 16:16:06.570 25038 25038 I JS      :         console.log`);
						assertData(
							logger.output,
							`multiline
        message
        from
        console.log\n`
						);
					});

					it("console.trace", async () => {
						logDataForAndroid(`08-23 16:16:06.571 25038 25038 E JS      : Trace: console.trace onTap
08-23 16:16:06.571 25038 25038 E JS      : at viewModel.onTap (file:///data/data/org.nativescript.appTestLogs/files/app/bundle.js:297:17)
08-23 16:16:06.571 25038 25038 E JS      : at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable.notify (file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js:3704:32)
08-23 16:16:06.571 25038 25038 E JS      : at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable._emit (file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js:3724:18)
08-23 16:16:06.571 25038 25038 E JS      : at ClickListenerImpl.onClick (file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js:14608:23)`);
						assertData(
							logger.output,
							`Trace: console.trace onTap
at viewModel.onTap (file: app/main-view-model.js:39:0)
at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable.notify (file: node_modules/tns-core-modules/data/observable/observable.js:107:0)
at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable._emit (file: node_modules/tns-core-modules/data/observable/observable.js:127:0)
at ClickListenerImpl.onClick (file: node_modules/tns-core-modules/ui/button/button.js:29:0)\n`
						);
					});

					it("console.time(timeEnd) statement", () => {
						logDataForAndroid(
							"08-23 16:16:06.571 25038 25038 I JS      : console.time: 9510.00ms"
						);
						assertData(logger.output, "console.time: 9510.00ms\n");
					});

					it("when an error is thrown, correct callstack is printed", async () => {
						logDataForAndroid(
							// commented out because we're filtering on the adb logcat level now...
							// `08-23 16:16:06.693 25038 25038 D AndroidRuntime: Shutting down VM
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: FATAL EXCEPTION: main
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: Process: org.nativescript.appTestLogs, PID: 25038
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: com.tns.NativeScriptException: Calling js method onClick failed
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: Error: Error in onTap
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethodNative(Native Method)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1209)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethodImpl(Runtime.java:1096)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethod(Runtime.java:1083)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethod(Runtime.java:1063)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at com.tns.Runtime.callJSMethod(Runtime.java:1055)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at com.tns.gen.java.lang.Object_vendor_14601_32_ClickListenerImpl.onClick(Object_vendor_14601_32_ClickListenerImpl.java:18)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at android.view.View.performClick(View.java:6597)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at android.view.View.performClickInternal(View.java:6574)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at android.view.View.access$3100(View.java:778)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at android.view.View$PerformClick.run(View.java:25885)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at android.os.Handler.handleCallback(Handler.java:873)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at android.os.Handler.dispatchMessage(Handler.java:99)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at android.os.Looper.loop(Looper.java:193)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at android.app.ActivityThread.main(ActivityThread.java:6669)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at java.lang.reflect.Method.invoke(Native Method)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:493)
							// 08-23 16:16:06.695 25038 25038 E AndroidRuntime: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:858)`
							`
08-23 16:16:06.798 25038 25038 W System.err: An uncaught Exception occurred on "main" thread.
08-23 16:16:06.798 25038 25038 W System.err: Calling js method onClick failed
08-23 16:16:06.798 25038 25038 W System.err: Error: Error in onTap
08-23 16:16:06.798 25038 25038 W System.err: 
08-23 16:16:06.798 25038 25038 W System.err: StackTrace:
08-23 16:16:06.798 25038 25038 W System.err: 	viewModel.onTap(file:///data/data/org.nativescript.appTestLogs/files/app/bundle.js:301:15)
08-23 16:16:06.798 25038 25038 W System.err: 	at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable.notify(file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js:3704:32)
08-23 16:16:06.798 25038 25038 W System.err: 	at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable._emit(file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js:3724:18)
08-23 16:16:06.798 25038 25038 W System.err: 	at ClickListenerImpl.onClick(file:///data/data/org.nativescript.appTestLogs/files/app/vendor.js:14608:23)
08-23 16:16:06.798 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethodNative(Native Method)
08-23 16:16:06.798 25038 25038 W System.err: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1209)
08-23 16:16:06.799 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethodImpl(Runtime.java:1096)
08-23 16:16:06.799 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1083)
08-23 16:16:06.799 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1063)
08-23 16:16:06.799 25038 25038 W System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1055)
08-23 16:16:06.799 25038 25038 W System.err: 	at com.tns.gen.java.lang.Object_vendor_14601_32_ClickListenerImpl.onClick(Object_vendor_14601_32_ClickListenerImpl.java:18)
08-23 16:16:06.799 25038 25038 W System.err: 	at android.view.View.performClick(View.java:6597)
08-23 16:16:06.799 25038 25038 W System.err: 	at android.view.View.performClickInternal(View.java:6574)
08-23 16:16:06.799 25038 25038 W System.err: 	at android.view.View.access$3100(View.java:778)
08-23 16:16:06.799 25038 25038 W System.err: 	at android.view.View$PerformClick.run(View.java:25885)
08-23 16:16:06.799 25038 25038 W System.err: 	at android.os.Handler.handleCallback(Handler.java:873)
08-23 16:16:06.799 25038 25038 W System.err: 	at android.os.Handler.dispatchMessage(Handler.java:99)
08-23 16:16:06.799 25038 25038 W System.err: 	at android.os.Looper.loop(Looper.java:193)
08-23 16:16:06.799 25038 25038 W System.err: 	at android.app.ActivityThread.main(ActivityThread.java:6669)
08-23 16:16:06.799 25038 25038 W System.err: 	at java.lang.reflect.Method.invoke(Native Method)
08-23 16:16:06.799 25038 25038 W System.err: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:493)
08-23 16:16:06.799 25038 25038 W System.err: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:858)`
						);

						assertData(
							logger.output,
							`System.err: An uncaught Exception occurred on "main" thread.
System.err: Calling js method onClick failed
System.err: Error: Error in onTap
System.err: ` +
								`
System.err: StackTrace:
System.err: 	viewModel.onTap(file: app/main-view-model.js:43:0)
System.err: 	at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable.notify(file: node_modules/tns-core-modules/data/observable/observable.js:107:0)
System.err: 	at push.../node_modules/tns-core-modules/data/observable/observable.js.Observable._emit(file: node_modules/tns-core-modules/data/observable/observable.js:127:0)
System.err: 	at ClickListenerImpl.onClick(file: node_modules/tns-core-modules/ui/button/button.js:29:0)
System.err: 	at com.tns.Runtime.callJSMethodNative(Native Method)
System.err: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1209)
System.err: 	at com.tns.Runtime.callJSMethodImpl(Runtime.java:1096)
System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1083)
System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1063)
System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:1055)
System.err: 	at com.tns.gen.java.lang.Object_vendor_14601_32_ClickListenerImpl.onClick(Object_vendor_14601_32_ClickListenerImpl.java:18)
System.err: 	at android.view.View.performClick(View.java:6597)
System.err: 	at android.view.View.performClickInternal(View.java:6574)
System.err: 	at android.view.View.access$3100(View.java:778)
System.err: 	at android.view.View$PerformClick.run(View.java:25885)
System.err: 	at android.os.Handler.handleCallback(Handler.java:873)
System.err: 	at android.os.Handler.dispatchMessage(Handler.java:99)
System.err: 	at android.os.Looper.loop(Looper.java:193)
System.err: 	at android.app.ActivityThread.main(ActivityThread.java:6669)
System.err: 	at java.lang.reflect.Method.invoke(Native Method)
System.err: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:493)
System.err: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:858)\n`
						);
					});
				});
			});
		});

		describe("iOS", () => {
			before(() => {
				platform = "ios";
				deviceLogProvider.setProjectNameForDevice(
					deviceIdentifier,
					"appTestLogs"
				);
			});

			const logDataForiOS = (data: string): void => {
				deviceLogProvider.logData(data + "\n", platform, deviceIdentifier);
			};

			describe("runtime version is below 6.1.0", () => {
				before(() => {
					runtimeVersion = "6.0.0";
					deviceLogProvider.setProjectDirForDevice(
						"deviceIdentifier",
						"dir_with_runtime_6.0.0"
					);
				});

				describe("iOS 9", () => {
					describe("simulator output", () => {
						it("console.log", () => {
							logDataForiOS(
								"Aug 23 14:38:54 mcsofvladimirov appTestLogs[8455]: CONSOLE INFO file:///app/vendor.js:168:36: HMR: Hot Module Replacement Enabled. Waiting for signal."
							);

							assertData(
								logger.output,
								"CONSOLE INFO file: node_modules/nativescript-dev-webpack/hot.js:3:0 HMR: Hot Module Replacement Enabled. Waiting for signal.\n"
							);
						});

						it("console.dir", () => {
							const dump = `==== object dump start ====
level0_0: {
\t"level1_0": {
\t  "level2": "value"
\t},
\t"level1_1": {
\t\t"level2": "value2"
\t}
}
level0_1: {
\t"level1_0": "value3"
}
==== object dump end ====`;
							logDataForiOS(
								`Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: CONSOLE LOG file:///app/bundle.js:270:20:\n${dump}`
							);
							assertData(
								logger.output,
								`CONSOLE LOG file: app/main-view-model.js:20:0\n${dump}\n`
							);
						});

						it("multiline console.log statement", () => {
							logDataForiOS(
								[
									`Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: CONSOLE LOG file:///app/bundle.js:284:20: multiline`,
									`\tmessage`,
									`\sfrom`,
									`\t\sconsole.log`,
								].join("\n")
							);
							assertData(
								logger.output,
								[
									`CONSOLE LOG file: app/main-view-model.js:34:0 multiline`,
									`\tmessage`,
									`\sfrom`,
									`\t\sconsole.log\n`,
								].join("\n")
							);
						});

						it("console.trace", async () => {
							logDataForiOS(`Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: CONSOLE TRACE file:///app/bundle.js:289:22: console.trace onTap
1   onTap@file:///app/bundle.js:289:22
2   notify@file:///app/vendor.js:3756:37
3   _emit@file:///app/vendor.js:3776:24
4   tap@file:///app/vendor.js:15438:24
5   UIApplicationMain@[native code]
6   _start@file:///app/vendor.js:789:26
7   run@file:///app/vendor.js:817:11
8   @file:///app/bundle.js:155:16
9   ./app.js@file:///app/bundle.js:172:34
10  __webpack_require__@file:///app/runtime.js:751:34
11  checkDeferredModules@file:///app/runtime.js:44:42
12  webpackJsonpCallback@file:///app/runtime.js:31:39
13  anonymous@file:///app/bundle.js:2:61
14  evaluate@[native code]
15  moduleEvaluation@:1:11
16  promiseReactionJob@:1:11`);
							assertData(
								logger.output,
								`CONSOLE TRACE file: app/main-view-model.js:39:0 console.trace onTap
1   onTap@file: app/main-view-model.js:39:0
2   notify@file: node_modules/tns-core-modules/data/observable/observable.js:107:0
3   _emit@file: node_modules/tns-core-modules/data/observable/observable.js:127:0
4   tap@file: node_modules/tns-core-modules/ui/button/button.js:216:0
5   UIApplicationMain@[native code]
6   _start@file: node_modules/tns-core-modules/application/application.js:277:0
7   run@file: node_modules/tns-core-modules/application/application.js:305:0
8   @file: app/app.js:46:0
9   ./app.js@file:///app/bundle.js:172:34
10  __webpack_require__@file: app/webpack/bootstrap:750:0
11  checkDeferredModules@file: app/webpack/bootstrap:43:0
12  webpackJsonpCallback@file: app/webpack/bootstrap:30:0
13  anonymous@file:///app/bundle.js:2:61
14  evaluate@[native code]
15  moduleEvaluation@:1:11
16  promiseReactionJob@:1:11\n`
							);
						});

						it("console.time(timeEnd) statement", () => {
							logDataForiOS(
								`file:///app/main-view-model.js:41:0 CONSOLE INFO console.time: 3152.344ms`
							);
							assertData(
								logger.output,
								"file:///app/main-view-model.js:41:0 CONSOLE INFO console.time: 3152.344ms\n"
							);
						});

						it("when an error is thrown, correct callstack is printed", async () => {
							logDataForiOS(`Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: ***** Fatal JavaScript exception - application has been terminated. *****
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: Native stack trace:
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 1   0x101a2e91f NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 2   0x101a66b60 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 3   0x102407dd6 ffi_closure_unix64_inner
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 4   0x1024087fa ffi_closure_unix64
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 5   0x103146e67 -[UIControl sendAction:to:forEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 6   0x103147143 -[UIControl _sendActionsForEvents:withEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 7   0x103146263 -[UIControl touchesEnded:withEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 8   0x10304699f -[UIWindow _sendTouchesForEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 9   0x1030476d4 -[UIWindow sendEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 10  0x102ff2dc6 -[UIApplication sendEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 11  0x102fcc553 _UIApplicationHandleEventQueue
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 12  0x10580b301 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 13  0x10580122c __CFRunLoopDoSources0
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 14  0x1058006e3 __CFRunLoopRun
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 15  0x1058000f8 CFRunLoopRunSpecific
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 16  0x106dc2ad2 GSEventRunModal
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 17  0x102fd1f09 UIApplicationMain
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 18  0x10240863d ffi_call_unix64
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 19  0x10fc91100
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: JavaScript stack trace:
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 1   onTap@file:///app/bundle.js:293:42
	2   notify@file:///app/vendor.js:3756:37
	3   _emit@file:///app/vendor.js:3776:24
	4   tap@file:///app/vendor.js:15438:24
	5   UIApplicationMain@[native code]
	6   _start@file:///app/vendor.js:789:26
	7   run@file:///app/vendor.js:817:11
	8   @file:///app/bundle.js:155:16
	9   ./app.js@file:///app/bundle.js:172:34
	10  __webpack_require__@file:///app/runtime.js:751:34
	11  checkDeferredModules@file:///app/runtime.js:44:42
	12  webpackJsonpCallback@file:///app/runtime.js:31:39
	13  anonymous@file:///app/bundle.js:2:61
	14  evaluate@[native code]
	15  moduleEvaluation@[native code]
	16  promiseReactionJob@[native code]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: JavaScript error:
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: file:///app/bundle.js:293:42: JS ERROR Error: Error in onTap
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: NativeScript caught signal 11.
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: Native Stack:
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 1   0x101a7384f sig_handler(int)
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 2   0x1060e7b5d _sigtramp
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 3   0xffffffffffffffff
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 4   0x10607ef33 libunwind::UnwindCursor<libunwind::LocalAddressSpace, libunwind::Registers_x86_64>::step()
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 5   0x106082d84 _Unwind_RaiseException
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 6   0x105c99cd3 __cxa_throw
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 7   0x104ef2eea _objc_exception_destructor(void*)
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 8   0x101a2ed58 NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 9   0x101a66b60 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 10  0x102407dd6 ffi_closure_unix64_inner
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 11  0x1024087fa ffi_closure_unix64
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 12  0x103146e67 -[UIControl sendAction:to:forEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 13  0x103147143 -[UIControl _sendActionsForEvents:withEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 14  0x103146263 -[UIControl touchesEnded:withEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 15  0x10304699f -[UIWindow _sendTouchesForEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 16  0x1030476d4 -[UIWindow sendEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 17  0x102ff2dc6 -[UIApplication sendEvent:]
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 18  0x102fcc553 _UIApplicationHandleEventQueue
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 19  0x10580b301 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 20  0x10580122c __CFRunLoopDoSources0
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 21  0x1058006e3 __CFRunLoopRun
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 22  0x1058000f8 CFRunLoopRunSpecific
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 23  0x106dc2ad2 GSEventRunModal
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 24  0x102fd1f09 UIApplicationMain
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 25  0x10240863d ffi_call_unix64
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 26  0x10fc91100
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: JS Stack:
Aug 23 14:38:58 mcsofvladimirov appTestLogs[8455]: 1   UIApplicationMain@[native code]
	2   _start@file:///app/vendor.js:789:26
	3   run@file:///app/vendor.js:817:11
	4   @file:///app/bundle.js:155:16
	5   ./app.js@file:///app/bundle.js:172:34
	6   __webpack_require__@file:///app/runtime.js:751:34
	7   checkDeferredModules@file:///app/runtime.js:44:42
	8   webpackJsonpCallback@file:///app/runtime.js:31:39
	9   anonymous@file:///app/bundle.js:2:61
	10  evaluate@[native code]
	11  moduleEvaluation@:1:11
	12  promiseReactionJob@:1:11`);

							assertData(
								logger.output,
								`***** Fatal JavaScript exception - application has been terminated. *****
Native stack trace:
1   0x101a2e91f NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
2   0x101a66b60 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
3   0x102407dd6 ffi_closure_unix64_inner
4   0x1024087fa ffi_closure_unix64
5   0x103146e67 -[UIControl sendAction:to:forEvent:]
6   0x103147143 -[UIControl _sendActionsForEvents:withEvent:]
7   0x103146263 -[UIControl touchesEnded:withEvent:]
8   0x10304699f -[UIWindow _sendTouchesForEvent:]
9   0x1030476d4 -[UIWindow sendEvent:]
10  0x102ff2dc6 -[UIApplication sendEvent:]
11  0x102fcc553 _UIApplicationHandleEventQueue
12  0x10580b301 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
13  0x10580122c __CFRunLoopDoSources0
14  0x1058006e3 __CFRunLoopRun
15  0x1058000f8 CFRunLoopRunSpecific
16  0x106dc2ad2 GSEventRunModal
17  0x102fd1f09 UIApplicationMain
18  0x10240863d ffi_call_unix64
19  0x10fc91100
JavaScript stack trace:
1   onTap@file: app/main-view-model.js:43:0
	2   notify@file: node_modules/tns-core-modules/data/observable/observable.js:107:0
	3   _emit@file: node_modules/tns-core-modules/data/observable/observable.js:127:0
	4   tap@file: node_modules/tns-core-modules/ui/button/button.js:216:0
	5   UIApplicationMain@[native code]
	6   _start@file: node_modules/tns-core-modules/application/application.js:277:0
	7   run@file: node_modules/tns-core-modules/application/application.js:305:0
	8   @file: app/app.js:46:0
	9   ./app.js@file:///app/bundle.js:172:34
	10  __webpack_require__@file: app/webpack/bootstrap:750:0
	11  checkDeferredModules@file: app/webpack/bootstrap:43:0
	12  webpackJsonpCallback@file: app/webpack/bootstrap:30:0
	13  anonymous@file:///app/bundle.js:2:61
	14  evaluate@[native code]
	15  moduleEvaluation@[native code]
	16  promiseReactionJob@[native code]
JavaScript error:
file: app/main-view-model.js:43:0 JS ERROR Error: Error in onTap
NativeScript caught signal 11.
Native Stack:
1   0x101a7384f sig_handler(int)
2   0x1060e7b5d _sigtramp
3   0xffffffffffffffff
4   0x10607ef33 libunwind::UnwindCursor<libunwind::LocalAddressSpace, libunwind::Registers_x86_64>::step()
5   0x106082d84 _Unwind_RaiseException
6   0x105c99cd3 __cxa_throw
7   0x104ef2eea _objc_exception_destructor(void*)
8   0x101a2ed58 NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
9   0x101a66b60 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
10  0x102407dd6 ffi_closure_unix64_inner
11  0x1024087fa ffi_closure_unix64
12  0x103146e67 -[UIControl sendAction:to:forEvent:]
13  0x103147143 -[UIControl _sendActionsForEvents:withEvent:]
14  0x103146263 -[UIControl touchesEnded:withEvent:]
15  0x10304699f -[UIWindow _sendTouchesForEvent:]
16  0x1030476d4 -[UIWindow sendEvent:]
17  0x102ff2dc6 -[UIApplication sendEvent:]
18  0x102fcc553 _UIApplicationHandleEventQueue
19  0x10580b301 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
20  0x10580122c __CFRunLoopDoSources0
21  0x1058006e3 __CFRunLoopRun
22  0x1058000f8 CFRunLoopRunSpecific
23  0x106dc2ad2 GSEventRunModal
24  0x102fd1f09 UIApplicationMain
25  0x10240863d ffi_call_unix64
26  0x10fc91100
JS Stack:
1   UIApplicationMain@[native code]
	2   _start@file: node_modules/tns-core-modules/application/application.js:277:0
	3   run@file: node_modules/tns-core-modules/application/application.js:305:0
	4   @file: app/app.js:46:0
	5   ./app.js@file:///app/bundle.js:172:34
	6   __webpack_require__@file: app/webpack/bootstrap:750:0
	7   checkDeferredModules@file: app/webpack/bootstrap:43:0
	8   webpackJsonpCallback@file: app/webpack/bootstrap:30:0
	9   anonymous@file:///app/bundle.js:2:61
	10  evaluate@[native code]
	11  moduleEvaluation@:1:11
	12  promiseReactionJob@:1:11\n`
							);
						});
					});
				});

				describe("iOS 12", () => {
					describe("simulator output", () => {
						it("console.log", () => {
							logDataForiOS(
								"2019-08-22 18:21:24.066975+0300  localhost appTestLogs[55619]: (NativeScript) CONSOLE INFO file:///app/vendor.js:168:36: HMR: Hot Module Replacement Enabled. Waiting for signal."
							);

							assertData(
								logger.output,
								"CONSOLE INFO file: node_modules/nativescript-dev-webpack/hot.js:3:0 HMR: Hot Module Replacement Enabled. Waiting for signal.\n"
							);
						});

						it("console.dir", () => {
							const dump = `==== object dump start ====
level0_0: {
	"level1_0": {
		"level2": "value"
	},
	"level1_1": {
		"level2": "value2"
	}
}
level0_1: {
	"level1_0": "value3"
}
==== object dump end ====`;
							logDataForiOS(
								`2019-08-22 18:21:26.133151+0300  localhost appTestLogs[55619]: (NativeScript) CONSOLE LOG file:///app/bundle.js:270:20:\n${dump}`
							);
							assertData(
								logger.output,
								`CONSOLE LOG file: app/main-view-model.js:20:0\n${dump}\n`
							);
						});

						it("multiline console.log statement", () => {
							logDataForiOS(
								[
									`2019-08-22 18:21:26.133260+0300  localhost appTestLogs[55619]: (NativeScript) CONSOLE LOG file:///app/bundle.js:284:20: multiline`,
									`message`,
									`  from`,
									`console.log`,
								].join("\n")
							);
							assertData(
								logger.output,
								[
									`CONSOLE LOG file: app/main-view-model.js:34:0 multiline`,
									`message`,
									`  from`,
									`console.log\n`,
								].join("\n")
							);
						});

						it("console.trace", async () => {
							logDataForiOS(`2019-08-22 18:21:26.133683+0300  localhost appTestLogs[55619]: (NativeScript) CONSOLE TRACE file:///app/bundle.js:289:22: console.trace onTap
1   onTap@file:///app/bundle.js:289:22
2   notify@file:///app/vendor.js:3756:37
3   _emit@file:///app/vendor.js:3776:24
4   tap@file:///app/vendor.js:15438:24
5   UIApplicationMain@[native code]
6   _start@file:///app/vendor.js:789:26
7   run@file:///app/vendor.js:817:11
8   @file:///app/bundle.js:155:16
9   ./app.js@file:///app/bundle.js:172:34
10  __webpack_require__@file:///app/runtime.js:751:34
11  checkDeferredModules@file:///app/runtime.js:44:42
12  webpackJsonpCallback@file:///app/runtime.js:31:39
13  anonymous@file:///app/bundle.js:2:61
14  evaluate@[native code]
15  moduleEvaluation@:1:11
16  promiseReactionJob@:1:11`);
							assertData(
								logger.output,
								`CONSOLE TRACE file: app/main-view-model.js:39:0 console.trace onTap
1   onTap@file: app/main-view-model.js:39:0
2   notify@file: node_modules/tns-core-modules/data/observable/observable.js:107:0
3   _emit@file: node_modules/tns-core-modules/data/observable/observable.js:127:0
4   tap@file: node_modules/tns-core-modules/ui/button/button.js:216:0
5   UIApplicationMain@[native code]
6   _start@file: node_modules/tns-core-modules/application/application.js:277:0
7   run@file: node_modules/tns-core-modules/application/application.js:305:0
8   @file: app/app.js:46:0
9   ./app.js@file:///app/bundle.js:172:34
10  __webpack_require__@file: app/webpack/bootstrap:750:0
11  checkDeferredModules@file: app/webpack/bootstrap:43:0
12  webpackJsonpCallback@file: app/webpack/bootstrap:30:0
13  anonymous@file:///app/bundle.js:2:61
14  evaluate@[native code]
15  moduleEvaluation@:1:11
16  promiseReactionJob@:1:11\n`
							);
						});

						it("console.time(timeEnd) statement", () => {
							logDataForiOS(
								`2019-08-22 18:21:26.133972+0300  localhost appTestLogs[55619]: (NativeScript) file:///app/bundle.js:291:24: CONSOLE INFO console.time: 1988.737ms`
							);
							assertData(
								logger.output,
								"file: app/main-view-model.js:41:0 CONSOLE INFO console.time: 1988.737ms\n"
							);
						});

						it("when an error is thrown, correct callstack is printed", async () => {
							logDataForiOS(`2019-08-22 18:21:26.140685+0300  localhost appTestLogs[55619]: (NativeScript) ***** Fatal JavaScript exception - application has been terminated. *****
2019-08-22 18:21:26.140910+0300  localhost appTestLogs[55619]: (NativeScript) Native stack trace:
2019-08-22 18:21:26.141466+0300  localhost appTestLogs[55619]: (NativeScript) 1   0x10c82491f NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
2019-08-22 18:21:26.141583+0300  localhost appTestLogs[55619]: (NativeScript) 2   0x10c85cb60 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
2019-08-22 18:21:26.141674+0300  localhost appTestLogs[55619]: (NativeScript) 3   0x10d1fddd6 ffi_closure_unix64_inner
2019-08-22 18:21:26.141769+0300  localhost appTestLogs[55619]: (NativeScript) 4   0x10d1fe7fa ffi_closure_unix64
2019-08-22 18:21:26.142022+0300  localhost appTestLogs[55619]: (NativeScript) 5   0x110a32c19 -[UIControl sendAction:to:forEvent:]
2019-08-22 18:21:26.142743+0300  localhost appTestLogs[55619]: (NativeScript) 6   0x110a32f36 -[UIControl _sendActionsForEvents:withEvent:]
2019-08-22 18:21:26.142986+0300  localhost appTestLogs[55619]: (NativeScript) 7   0x110a31eec -[UIControl touchesEnded:withEvent:]
2019-08-22 18:21:26.145364+0300  localhost appTestLogs[55619]: (NativeScript) 8   0x111015eee -[UIWindow _sendTouchesForEvent:]
2019-08-22 18:21:26.146041+0300  localhost appTestLogs[55619]: (NativeScript) 9   0x1110175d2 -[UIWindow sendEvent:]
2019-08-22 18:21:26.146403+0300  localhost appTestLogs[55619]: (NativeScript) 10  0x110ff5d16 -[UIApplication sendEvent:]
2019-08-22 18:21:26.146875+0300  localhost appTestLogs[55619]: (NativeScript) 11  0x1110c6293 __dispatchPreprocessedEventFromEventQueue
2019-08-22 18:21:26.147326+0300  localhost appTestLogs[55619]: (NativeScript) 12  0x1110c8bb9 __handleEventQueueInternal
2019-08-22 18:21:26.147607+0300  localhost appTestLogs[55619]: (NativeScript) 13  0x10fafcbe1 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
2019-08-22 18:21:26.147850+0300  localhost appTestLogs[55619]: (NativeScript) 14  0x10fafc463 __CFRunLoopDoSources0
2019-08-22 18:21:26.148147+0300  localhost appTestLogs[55619]: (NativeScript) 15  0x10faf6b1f __CFRunLoopRun
2019-08-22 18:21:26.148400+0300  localhost appTestLogs[55619]: (NativeScript) 16  0x10faf6302 CFRunLoopRunSpecific
2019-08-22 18:21:26.148730+0300  localhost appTestLogs[55619]: (NativeScript) 17  0x116b7f2fe GSEventRunModal
2019-08-22 18:21:26.149116+0300  localhost appTestLogs[55619]: (NativeScript) 18  0x110fdbba2 UIApplicationMain
2019-08-22 18:21:26.149392+0300  localhost appTestLogs[55619]: (NativeScript) 19  0x10d1fe63d ffi_call_unix64
2019-08-22 18:21:26.149715+0300  localhost appTestLogs[55619]: (NativeScript) 20  0x123da2c60
2019-08-22 18:21:26.149935+0300  localhost appTestLogs[55619]: (NativeScript) JavaScript stack trace:
2019-08-22 18:21:26.150237+0300  localhost appTestLogs[55619]: (NativeScript) 1   onTap@file:///app/bundle.js:293:42
2   notify@file:///app/vendor.js:3756:37
3   _emit@file:///app/vendor.js:3776:24
4   tap@file:///app/vendor.js:15438:24
5   UIApplicationMain@[native code]
6   _start@file:///app/vendor.js:789:26
7   run@file:///app/vendor.js:817:11
8   @file:///app/bundle.js:155:16
9   ./app.js@file:///app/bundle.js:172:34
10  __webpack_require__@file:///app/runtime.js:751:34
11  checkDeferredModules@file:///app/runtime.js:44:42
12  webpackJsonpCallback@file:///app/runtime.js:31:39
13  anonymous@file:///app/bundle.js:2:61
14  evaluate@[native code]
15  moduleEvaluation@[native code]
16  promiseReactionJob@[native code]
2019-08-22 18:21:26.150442+0300  localhost appTestLogs[55619]: (NativeScript) JavaScript error:
2019-08-22 18:21:26.150950+0300  localhost appTestLogs[55619]: (NativeScript) file:///app/bundle.js:293:42: JS ERROR Error: Error in onTap
2019-08-22 18:21:26.151895+0300  localhost appTestLogs[55619]: (NativeScript) NativeScript caught signal 11.
2019-08-22 18:21:26.152193+0300  localhost appTestLogs[55619]: (NativeScript) Native Stack:
2019-08-22 18:21:26.152517+0300  localhost appTestLogs[55619]: (NativeScript) 1   0x10c86984f sig_handler(int)
2019-08-22 18:21:26.152830+0300  localhost appTestLogs[55619]: (NativeScript) 2   0x1104adb5d _sigtramp
2019-08-22 18:21:26.153113+0300  localhost appTestLogs[55619]: (NativeScript) 3   0xffffffffffffffff
2019-08-22 18:21:26.153368+0300  localhost appTestLogs[55619]: (NativeScript) 4   0x1103f3b4d libunwind::UnwindCursor<libunwind::LocalAddressSpace, libunwind::Registers_x86_64>::step()
2019-08-22 18:21:26.153701+0300  localhost appTestLogs[55619]: (NativeScript) 5   0x1103f7e4c _Unwind_RaiseException
2019-08-22 18:21:26.153931+0300  localhost appTestLogs[55619]: (NativeScript) 6   0x10ffd14aa __cxa_throw
2019-08-22 18:21:26.154180+0300  localhost appTestLogs[55619]: (NativeScript) 7   0x10e9eabfa _objc_exception_destructor(void*)
2019-08-22 18:21:26.154425+0300  localhost appTestLogs[55619]: (NativeScript) 8   0x10c824d58 NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
2019-08-22 18:21:26.154680+0300  localhost appTestLogs[55619]: (NativeScript) 9   0x10c85cb60 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
2019-08-22 18:21:26.154900+0300  localhost appTestLogs[55619]: (NativeScript) 10  0x10d1fddd6 ffi_closure_unix64_inner
2019-08-22 18:21:26.155189+0300  localhost appTestLogs[55619]: (NativeScript) 11  0x10d1fe7fa ffi_closure_unix64
2019-08-22 18:21:26.155473+0300  localhost appTestLogs[55619]: (NativeScript) 12  0x110a32c19 -[UIControl sendAction:to:forEvent:]
2019-08-22 18:21:26.155675+0300  localhost appTestLogs[55619]: (NativeScript) 13  0x110a32f36 -[UIControl _sendActionsForEvents:withEvent:]
2019-08-22 18:21:26.155885+0300  localhost appTestLogs[55619]: (NativeScript) 14  0x110a31eec -[UIControl touchesEnded:withEvent:]
2019-08-22 18:21:26.156116+0300  localhost appTestLogs[55619]: (NativeScript) 15  0x111015eee -[UIWindow _sendTouchesForEvent:]
2019-08-22 18:21:26.156345+0300  localhost appTestLogs[55619]: (NativeScript) 16  0x1110175d2 -[UIWindow sendEvent:]
2019-08-22 18:21:26.156541+0300  localhost appTestLogs[55619]: (NativeScript) 17  0x110ff5d16 -[UIApplication sendEvent:]
2019-08-22 18:21:26.157027+0300  localhost appTestLogs[55619]: (NativeScript) 18  0x1110c6293 __dispatchPreprocessedEventFromEventQueue
2019-08-22 18:21:26.159128+0300  localhost appTestLogs[55619]: (NativeScript) 19  0x1110c8bb9 __handleEventQueueInternal
2019-08-22 18:21:26.159227+0300  localhost appTestLogs[55619]: (NativeScript) 20  0x10fafcbe1 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
2019-08-22 18:21:26.159296+0300  localhost appTestLogs[55619]: (NativeScript) 21  0x10fafc463 __CFRunLoopDoSources0
2019-08-22 18:21:26.159357+0300  localhost appTestLogs[55619]: (NativeScript) 22  0x10faf6b1f __CFRunLoopRun
2019-08-22 18:21:26.159541+0300  localhost appTestLogs[55619]: (NativeScript) 23  0x10faf6302 CFRunLoopRunSpecific
2019-08-22 18:21:26.159861+0300  localhost appTestLogs[55619]: (NativeScript) 24  0x116b7f2fe GSEventRunModal
2019-08-22 18:21:26.160353+0300  localhost appTestLogs[55619]: (NativeScript) 25  0x110fdbba2 UIApplicationMain
2019-08-22 18:21:26.160626+0300  localhost appTestLogs[55619]: (NativeScript) 26  0x10d1fe63d ffi_call_unix64
2019-08-22 18:21:26.160825+0300  localhost appTestLogs[55619]: (NativeScript) 27  0x123da2c60
2019-08-22 18:21:26.161039+0300  localhost appTestLogs[55619]: (NativeScript) JS Stack:
2019-08-22 18:21:26.163639+0300  localhost assertiond[29105]: [com.apple.assertiond:process_info] [appTestLogs:55619] Setting jetsam priority to 3 [0x100]
2019-08-22 18:21:26.169429+0300  localhost locationd[29104]: Created Activity ID: 0x32750f3, Description: CL: notifyClientsWithData (Fallback)
2019-08-22 18:21:26.161367+0300  localhost appTestLogs[55619]: (NativeScript) 1   UIApplicationMain@[native code]
2   _start@file:///app/vendor.js:789:26
3   run@file:///app/vendor.js:817:11
4   @file:///app/bundle.js:155:16
5   ./app.js@file:///app/bundle.js:172:34
6   __webpack_require__@file:///app/runtime.js:751:34
7   checkDeferredModules@file:///app/runtime.js:44:42
8   webpackJsonpCallback@file:///app/runtime.js:31:39
9   anonymous@file:///app/bundle.js:2:61
10  evaluate@[native code]
11  moduleEvaluation@:1:11
12  promiseReactionJob@:1:11`);

							assertData(
								logger.output,
								`***** Fatal JavaScript exception - application has been terminated. *****
Native stack trace:
1   0x10c82491f NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
2   0x10c85cb60 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
3   0x10d1fddd6 ffi_closure_unix64_inner
4   0x10d1fe7fa ffi_closure_unix64
5   0x110a32c19 -[UIControl sendAction:to:forEvent:]
6   0x110a32f36 -[UIControl _sendActionsForEvents:withEvent:]
7   0x110a31eec -[UIControl touchesEnded:withEvent:]
8   0x111015eee -[UIWindow _sendTouchesForEvent:]
9   0x1110175d2 -[UIWindow sendEvent:]
10  0x110ff5d16 -[UIApplication sendEvent:]
11  0x1110c6293 __dispatchPreprocessedEventFromEventQueue
12  0x1110c8bb9 __handleEventQueueInternal
13  0x10fafcbe1 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
14  0x10fafc463 __CFRunLoopDoSources0
15  0x10faf6b1f __CFRunLoopRun
16  0x10faf6302 CFRunLoopRunSpecific
17  0x116b7f2fe GSEventRunModal
18  0x110fdbba2 UIApplicationMain
19  0x10d1fe63d ffi_call_unix64
20  0x123da2c60
JavaScript stack trace:
1   onTap@file: app/main-view-model.js:43:0
2   notify@file: node_modules/tns-core-modules/data/observable/observable.js:107:0
3   _emit@file: node_modules/tns-core-modules/data/observable/observable.js:127:0
4   tap@file: node_modules/tns-core-modules/ui/button/button.js:216:0
5   UIApplicationMain@[native code]
6   _start@file: node_modules/tns-core-modules/application/application.js:277:0
7   run@file: node_modules/tns-core-modules/application/application.js:305:0
8   @file: app/app.js:46:0
9   ./app.js@file:///app/bundle.js:172:34
10  __webpack_require__@file: app/webpack/bootstrap:750:0
11  checkDeferredModules@file: app/webpack/bootstrap:43:0
12  webpackJsonpCallback@file: app/webpack/bootstrap:30:0
13  anonymous@file:///app/bundle.js:2:61
14  evaluate@[native code]
15  moduleEvaluation@[native code]
16  promiseReactionJob@[native code]
JavaScript error:
file: app/main-view-model.js:43:0 JS ERROR Error: Error in onTap
NativeScript caught signal 11.
Native Stack:
1   0x10c86984f sig_handler(int)
2   0x1104adb5d _sigtramp
3   0xffffffffffffffff
4   0x1103f3b4d libunwind::UnwindCursor<libunwind::LocalAddressSpace, libunwind::Registers_x86_64>::step()
5   0x1103f7e4c _Unwind_RaiseException
6   0x10ffd14aa __cxa_throw
7   0x10e9eabfa _objc_exception_destructor(void*)
8   0x10c824d58 NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
9   0x10c85cb60 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
10  0x10d1fddd6 ffi_closure_unix64_inner
11  0x10d1fe7fa ffi_closure_unix64
12  0x110a32c19 -[UIControl sendAction:to:forEvent:]
13  0x110a32f36 -[UIControl _sendActionsForEvents:withEvent:]
14  0x110a31eec -[UIControl touchesEnded:withEvent:]
15  0x111015eee -[UIWindow _sendTouchesForEvent:]
16  0x1110175d2 -[UIWindow sendEvent:]
17  0x110ff5d16 -[UIApplication sendEvent:]
18  0x1110c6293 __dispatchPreprocessedEventFromEventQueue
19  0x1110c8bb9 __handleEventQueueInternal
20  0x10fafcbe1 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
21  0x10fafc463 __CFRunLoopDoSources0
22  0x10faf6b1f __CFRunLoopRun
23  0x10faf6302 CFRunLoopRunSpecific
24  0x116b7f2fe GSEventRunModal
25  0x110fdbba2 UIApplicationMain
26  0x10d1fe63d ffi_call_unix64
27  0x123da2c60
JS Stack:
1   UIApplicationMain@[native code]
2   _start@file: node_modules/tns-core-modules/application/application.js:277:0
3   run@file: node_modules/tns-core-modules/application/application.js:305:0
4   @file: app/app.js:46:0
5   ./app.js@file:///app/bundle.js:172:34
6   __webpack_require__@file: app/webpack/bootstrap:750:0
7   checkDeferredModules@file: app/webpack/bootstrap:43:0
8   webpackJsonpCallback@file: app/webpack/bootstrap:30:0
9   anonymous@file:///app/bundle.js:2:61
10  evaluate@[native code]
11  moduleEvaluation@:1:11
12  promiseReactionJob@:1:11\n`
							);
						});
					});
				});
			});

			describe("runtime version is 6.1.0 or later", () => {
				before(() => {
					runtimeVersion = "6.1.0";
					// set this, so the caching in logSourceMapService will detect correct runtime
					deviceLogProvider.setProjectDirForDevice(
						"deviceIdentifier",
						"dir_with_runtime_6.1.0"
					);
				});

				describe("iOS 9", () => {
					describe("simulator output", () => {
						it("console.log", () => {
							logDataForiOS(
								"Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: (NativeScript) CONSOLE INFO file:///app/vendor.js:168:36: HMR: Hot Module Replacement Enabled. Waiting for signal."
							);

							assertData(
								logger.output,
								"CONSOLE INFO file: node_modules/nativescript-dev-webpack/hot.js:3:0: HMR: Hot Module Replacement Enabled. Waiting for signal.\n"
							);
						});

						it("console.dir", () => {
							const dump = `==== object dump start ====
level0_0: {
	"level1_0": {
		"level2": "value"
	},
	"level1_1": {
		"level2": "value2"
	}
}
level0_1: {
	"level1_0": "value3"
}
==== object dump end ====`;
							logDataForiOS(
								`Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: CONSOLE LOG file:///app/bundle.js:270:20:\n${dump}`
							);
							assertData(
								logger.output,
								`CONSOLE LOG file: app/main-view-model.js:20:0:\n${dump}\n`
							);
						});

						it("multiline console.log statement", () => {
							logDataForiOS(
								[
									`Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: CONSOLE LOG file:///app/bundle.js:284:20: multiline`,
									`message`,
									`  from`,
									`console.log`,
								].join("\n")
							);
							assertData(
								logger.output,
								[
									`CONSOLE LOG file: app/main-view-model.js:34:0: multiline`,
									`message`,
									`  from`,
									`console.log\n`,
								].join("\n")
							);
						});

						it("console.trace", async () => {
							logDataForiOS(`Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: CONSOLE TRACE file:///app/bundle.js:289:22: console.trace onTap
onTap(file:///app/bundle.js:289:22)
at notify(file:///app/vendor.js:3756:37)
at _emit(file:///app/vendor.js:3776:24)
at tap(file:///app/vendor.js:15438:24)
at UIApplicationMain([native code])
at _start(file:///app/vendor.js:789:26)
at run(file:///app/vendor.js:817:11)
at file:///app/bundle.js:155:16
at ./app.js(file:///app/bundle.js:172:34)
at __webpack_require__(file:///app/runtime.js:751:34)
at checkDeferredModules(file:///app/runtime.js:44:42)
at webpackJsonpCallback(file:///app/runtime.js:31:39)
at anonymous(file:///app/bundle.js:2:61)
at evaluate([native code])
at moduleEvaluation
at promiseReactionJob`);
							assertData(
								logger.output,
								`CONSOLE TRACE file: app/main-view-model.js:39:0: console.trace onTap
onTap(file: app/main-view-model.js:39:0)
at notify(file: node_modules/tns-core-modules/data/observable/observable.js:107:0)
at _emit(file: node_modules/tns-core-modules/data/observable/observable.js:127:0)
at tap(file: node_modules/tns-core-modules/ui/button/button.js:216:0)
at UIApplicationMain([native code])
at _start(file: node_modules/tns-core-modules/application/application.js:277:0)
at run(file: node_modules/tns-core-modules/application/application.js:305:0)
at file: app/app.js:46:0
at ./app.js(file:///app/bundle.js:172:34)
at __webpack_require__(file: app/webpack/bootstrap:750:0)
at checkDeferredModules(file: app/webpack/bootstrap:43:0)
at webpackJsonpCallback(file: app/webpack/bootstrap:30:0)
at anonymous(file:///app/bundle.js:2:61)
at evaluate([native code])
at moduleEvaluation
at promiseReactionJob\n`
							);
						});

						it("console.time(timeEnd) statement", () => {
							logDataForiOS(
								`Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: file:///app/bundle.js:291:24: CONSOLE INFO console.time: 27523.877ms`
							);
							assertData(
								logger.output,
								"file: app/main-view-model.js:41:0: CONSOLE INFO console.time: 27523.877ms\n"
							);
						});

						it("when an error is thrown, correct callstack is printed", async () => {
							logDataForiOS(`Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: ***** Fatal JavaScript exception - application has been terminated. *****
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: Native stack trace:
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 1   0x10464b62a NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 2   0x104686028 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 3   0x10502c9a6 ffi_closure_unix64_inner
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 4   0x10502d3ca ffi_closure_unix64
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 5   0x105d6de67 -[UIControl sendAction:to:forEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 6   0x105d6e143 -[UIControl _sendActionsForEvents:withEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 7   0x105d6d263 -[UIControl touchesEnded:withEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 8   0x105c6d99f -[UIWindow _sendTouchesForEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 9   0x105c6e6d4 -[UIWindow sendEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 10  0x105c19dc6 -[UIApplication sendEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 11  0x105bf3553 _UIApplicationHandleEventQueue
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 12  0x108432301 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 13  0x10842822c __CFRunLoopDoSources0
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 14  0x1084276e3 __CFRunLoopRun
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 15  0x1084270f8 CFRunLoopRunSpecific
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 16  0x1099e9ad2 GSEventRunModal
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 17  0x105bf8f09 UIApplicationMain
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 18  0x10502d20d ffi_call_unix64
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 19  0x11085f1e0
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: JavaScript stack trace:
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: onTap(file:///app/bundle.js:293:42)
	at notify(file:///app/vendor.js:3756:37)
	at _emit(file:///app/vendor.js:3776:24)
	at tap(file:///app/vendor.js:15438:24)
	at UIApplicationMain([native code])
	at _start(file:///app/vendor.js:789:26)
	at run(file:///app/vendor.js:817:11)
	at file:///app/bundle.js:155:16
	at ./app.js(file:///app/bundle.js:172:34)
	at __webpack_require__(file:///app/runtime.js:751:34)
	at checkDeferredModules(file:///app/runtime.js:44:42)
	at webpackJsonpCallback(file:///app/runtime.js:31:39)
	at anonymous(file:///app/bundle.js:2:61)
	at evaluate([native code])
	at moduleEvaluation([native code])
	at promiseReactionJob([native code])
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: JavaScript error:
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: file:///app/bundle.js:293:42: JS ERROR Error: Error in onTap
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: NativeScript caught signal 11.
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: Native Stack:
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 1   0x1046941df sig_handler(int)
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 2   0x108d0eb5d _sigtramp
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 3   0xffffffffffffffff
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 4   0x108ca5f33 libunwind::UnwindCursor<libunwind::LocalAddressSpace, libunwind::Registers_x86_64>::step()
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 5   0x108ca9d84 _Unwind_RaiseException
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 6   0x1088c0cd3 __cxa_throw
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 7   0x107b19eea _objc_exception_destructor(void*)
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 8   0x10464ba08 NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 9   0x104686028 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 10  0x10502c9a6 ffi_closure_unix64_inner
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 11  0x10502d3ca ffi_closure_unix64
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 12  0x105d6de67 -[UIControl sendAction:to:forEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 13  0x105d6e143 -[UIControl _sendActionsForEvents:withEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 14  0x105d6d263 -[UIControl touchesEnded:withEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 15  0x105c6d99f -[UIWindow _sendTouchesForEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 16  0x105c6e6d4 -[UIWindow sendEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 17  0x105c19dc6 -[UIApplication sendEvent:]
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 18  0x105bf3553 _UIApplicationHandleEventQueue
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 19  0x108432301 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 20  0x10842822c __CFRunLoopDoSources0
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 21  0x1084276e3 __CFRunLoopRun
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 22  0x1084270f8 CFRunLoopRunSpecific
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 23  0x1099e9ad2 GSEventRunModal
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 24  0x105bf8f09 UIApplicationMain
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 25  0x10502d20d ffi_call_unix64
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: 26  0x11085f1e0
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: JS Stack:
Aug 23 18:12:39 mcsofvladimirov appTestLogs[29554]: UIApplicationMain([native code])
	at _start(file:///app/vendor.js:789:26)
	at run(file:///app/vendor.js:817:11)
	at file:///app/bundle.js:155:16
	at ./app.js(file:///app/bundle.js:172:34)
	at __webpack_require__(file:///app/runtime.js:751:34)
	at checkDeferredModules(file:///app/runtime.js:44:42)
	at webpackJsonpCallback(file:///app/runtime.js:31:39)
	at anonymous(file:///app/bundle.js:2:61)
	at evaluate([native code])
	at moduleEvaluation
	at promiseReactionJob`);

							assertData(
								logger.output,
								`***** Fatal JavaScript exception - application has been terminated. *****
Native stack trace:
1   0x10464b62a NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
2   0x104686028 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
3   0x10502c9a6 ffi_closure_unix64_inner
4   0x10502d3ca ffi_closure_unix64
5   0x105d6de67 -[UIControl sendAction:to:forEvent:]
6   0x105d6e143 -[UIControl _sendActionsForEvents:withEvent:]
7   0x105d6d263 -[UIControl touchesEnded:withEvent:]
8   0x105c6d99f -[UIWindow _sendTouchesForEvent:]
9   0x105c6e6d4 -[UIWindow sendEvent:]
10  0x105c19dc6 -[UIApplication sendEvent:]
11  0x105bf3553 _UIApplicationHandleEventQueue
12  0x108432301 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
13  0x10842822c __CFRunLoopDoSources0
14  0x1084276e3 __CFRunLoopRun
15  0x1084270f8 CFRunLoopRunSpecific
16  0x1099e9ad2 GSEventRunModal
17  0x105bf8f09 UIApplicationMain
18  0x10502d20d ffi_call_unix64
19  0x11085f1e0
JavaScript stack trace:
onTap(file: app/main-view-model.js:43:0)
	at notify(file: node_modules/tns-core-modules/data/observable/observable.js:107:0)
	at _emit(file: node_modules/tns-core-modules/data/observable/observable.js:127:0)
	at tap(file: node_modules/tns-core-modules/ui/button/button.js:216:0)
	at UIApplicationMain([native code])
	at _start(file: node_modules/tns-core-modules/application/application.js:277:0)
	at run(file: node_modules/tns-core-modules/application/application.js:305:0)
	at file: app/app.js:46:0
	at ./app.js(file:///app/bundle.js:172:34)
	at __webpack_require__(file: app/webpack/bootstrap:750:0)
	at checkDeferredModules(file: app/webpack/bootstrap:43:0)
	at webpackJsonpCallback(file: app/webpack/bootstrap:30:0)
	at anonymous(file:///app/bundle.js:2:61)
	at evaluate([native code])
	at moduleEvaluation([native code])
	at promiseReactionJob([native code])
JavaScript error:
file: app/main-view-model.js:43:0: JS ERROR Error: Error in onTap
NativeScript caught signal 11.
Native Stack:
1   0x1046941df sig_handler(int)
2   0x108d0eb5d _sigtramp
3   0xffffffffffffffff
4   0x108ca5f33 libunwind::UnwindCursor<libunwind::LocalAddressSpace, libunwind::Registers_x86_64>::step()
5   0x108ca9d84 _Unwind_RaiseException
6   0x1088c0cd3 __cxa_throw
7   0x107b19eea _objc_exception_destructor(void*)
8   0x10464ba08 NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
9   0x104686028 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
10  0x10502c9a6 ffi_closure_unix64_inner
11  0x10502d3ca ffi_closure_unix64
12  0x105d6de67 -[UIControl sendAction:to:forEvent:]
13  0x105d6e143 -[UIControl _sendActionsForEvents:withEvent:]
14  0x105d6d263 -[UIControl touchesEnded:withEvent:]
15  0x105c6d99f -[UIWindow _sendTouchesForEvent:]
16  0x105c6e6d4 -[UIWindow sendEvent:]
17  0x105c19dc6 -[UIApplication sendEvent:]
18  0x105bf3553 _UIApplicationHandleEventQueue
19  0x108432301 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
20  0x10842822c __CFRunLoopDoSources0
21  0x1084276e3 __CFRunLoopRun
22  0x1084270f8 CFRunLoopRunSpecific
23  0x1099e9ad2 GSEventRunModal
24  0x105bf8f09 UIApplicationMain
25  0x10502d20d ffi_call_unix64
26  0x11085f1e0
JS Stack:
UIApplicationMain([native code])
	at _start(file: node_modules/tns-core-modules/application/application.js:277:0)
	at run(file: node_modules/tns-core-modules/application/application.js:305:0)
	at file: app/app.js:46:0
	at ./app.js(file:///app/bundle.js:172:34)
	at __webpack_require__(file: app/webpack/bootstrap:750:0)
	at checkDeferredModules(file: app/webpack/bootstrap:43:0)
	at webpackJsonpCallback(file: app/webpack/bootstrap:30:0)
	at anonymous(file:///app/bundle.js:2:61)
	at evaluate([native code])
	at moduleEvaluation
	at promiseReactionJob\n`
							);
						});
					});
				});

				describe("iOS 12", () => {
					describe("simulator output", () => {
						it("console.log", () => {
							logDataForiOS(
								"2019-08-23 17:08:38.860441+0300  localhost appTestLogs[21053]: (NativeScript) CONSOLE INFO file:///app/vendor.js:168:36: HMR: Hot Module Replacement Enabled. Waiting for signal."
							);

							assertData(
								logger.output,
								"CONSOLE INFO file: node_modules/nativescript-dev-webpack/hot.js:3:0: HMR: Hot Module Replacement Enabled. Waiting for signal.\n"
							);
						});

						it("console.dir", () => {
							const dump = `==== object dump start ====
level0_0: {
	"level1_0": {
		"level2": "value"
	},
	"level1_1": {
		"level2": "value2"
	}
}
level0_1: {
	"level1_0": "value3"
}
==== object dump end ====`;
							logDataForiOS(
								`2019-08-23 17:08:45.217971+0300  localhost appTestLogs[21053]: (NativeScript) CONSOLE LOG file:///app/bundle.js:270:20:\n${dump}`
							);
							assertData(
								logger.output,
								`CONSOLE LOG file: app/main-view-model.js:20:0:\n${dump}\n`
							);
						});

						it("multiline console.log statement", () => {
							logDataForiOS(
								[
									`2019-08-23 17:08:45.218519+0300  localhost appTestLogs[21053]: (NativeScript) CONSOLE LOG file:///app/bundle.js:284:20: multiline`,
									`message`,
									`  from`,
									`console.log`,
								].join("\n")
							);
							assertData(
								logger.output,
								[
									`CONSOLE LOG file: app/main-view-model.js:34:0: multiline`,
									`message`,
									`  from`,
									`console.log\n`,
								].join("\n")
							);
						});

						it("console.trace", async () => {
							logDataForiOS(`2019-08-23 17:08:45.219170+0300  localhost appTestLogs[21053]: (NativeScript) CONSOLE TRACE file:///app/bundle.js:289:22: console.trace onTap
onTap(file:///app/bundle.js:289:22)
at notify(file:///app/vendor.js:3756:37)
at _emit(file:///app/vendor.js:3776:24)
at tap(file:///app/vendor.js:15438:24)
at UIApplicationMain([native code])
at _start(file:///app/vendor.js:789:26)
at run(file:///app/vendor.js:817:11)
at file:///app/bundle.js:155:16
at ./app.js(file:///app/bundle.js:172:34)
at __webpack_require__(file:///app/runtime.js:751:34)
at checkDeferredModules(file:///app/runtime.js:44:42)
at webpackJsonpCallback(file:///app/runtime.js:31:39)
at anonymous(file:///app/bundle.js:2:61)
at evaluate([native code])
at moduleEvaluation
at promiseReactionJob`);
							assertData(
								logger.output,
								`CONSOLE TRACE file: app/main-view-model.js:39:0: console.trace onTap
onTap(file: app/main-view-model.js:39:0)
at notify(file: node_modules/tns-core-modules/data/observable/observable.js:107:0)
at _emit(file: node_modules/tns-core-modules/data/observable/observable.js:127:0)
at tap(file: node_modules/tns-core-modules/ui/button/button.js:216:0)
at UIApplicationMain([native code])
at _start(file: node_modules/tns-core-modules/application/application.js:277:0)
at run(file: node_modules/tns-core-modules/application/application.js:305:0)
at file: app/app.js:46:0
at ./app.js(file:///app/bundle.js:172:34)
at __webpack_require__(file: app/webpack/bootstrap:750:0)
at checkDeferredModules(file: app/webpack/bootstrap:43:0)
at webpackJsonpCallback(file: app/webpack/bootstrap:30:0)
at anonymous(file:///app/bundle.js:2:61)
at evaluate([native code])
at moduleEvaluation
at promiseReactionJob\n`
							);
						});

						it("console.time(timeEnd) statement", () => {
							logDataForiOS(
								`2019-08-23 17:08:45.219341+0300  localhost appTestLogs[21053]: (NativeScript) file:///app/bundle.js:291:24: CONSOLE INFO console.time: 6285.199ms`
							);
							assertData(
								logger.output,
								"file: app/main-view-model.js:41:0: CONSOLE INFO console.time: 6285.199ms\n"
							);
						});

						it("when an error is thrown, correct callstack is printed", async () => {
							logDataForiOS(`2019-08-23 17:08:45.228221+0300  localhost appTestLogs[21053]: (NativeScript) ***** Fatal JavaScript exception - application has been terminated. *****
2019-08-23 17:08:45.228890+0300  localhost appTestLogs[21053]: (NativeScript) Native stack trace:
2019-08-23 17:08:45.230408+0300  localhost appTestLogs[21053]: (NativeScript) 1   0x10b18b62a NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
2019-08-23 17:08:45.230894+0300  localhost appTestLogs[21053]: (NativeScript) 2   0x10b1c6028 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
2019-08-23 17:08:45.231317+0300  localhost appTestLogs[21053]: (NativeScript) 3   0x10bb6c9a6 ffi_closure_unix64_inner
2019-08-23 17:08:45.231794+0300  localhost appTestLogs[21053]: (NativeScript) 4   0x10bb6d3ca ffi_closure_unix64
2019-08-23 17:08:45.232848+0300  localhost appTestLogs[21053]: (NativeScript) 5   0x10f3a3c19 -[UIControl sendAction:to:forEvent:]
2019-08-23 17:08:45.233138+0300  localhost appTestLogs[21053]: (NativeScript) 6   0x10f3a3f36 -[UIControl _sendActionsForEvents:withEvent:]
2019-08-23 17:08:45.211461+0300  localhost SpringBoard[20455]: (UIKitCore) Created Activity ID: 0x338298b, Description: send gesture actions
2019-08-23 17:08:45.233534+0300  localhost appTestLogs[21053]: (NativeScript) 7   0x10f3a2eec -[UIControl touchesEnded:withEvent:]
2019-08-23 17:08:45.234000+0300  localhost appTestLogs[21053]: (NativeScript) 8   0x10f986eee -[UIWindow _sendTouchesForEvent:]
2019-08-23 17:08:45.234233+0300  localhost appTestLogs[21053]: (NativeScript) 9   0x10f9885d2 -[UIWindow sendEvent:]
2019-08-23 17:08:45.234523+0300  localhost appTestLogs[21053]: (NativeScript) 10  0x10f966d16 -[UIApplication sendEvent:]
2019-08-23 17:08:45.234775+0300  localhost appTestLogs[21053]: (NativeScript) 11  0x10fa37293 __dispatchPreprocessedEventFromEventQueue
2019-08-23 17:08:45.235168+0300  localhost appTestLogs[21053]: (NativeScript) 12  0x10fa39bb9 __handleEventQueueInternal
2019-08-23 17:08:45.235517+0300  localhost appTestLogs[21053]: (NativeScript) 13  0x10e46dbe1 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
2019-08-23 17:08:45.235960+0300  localhost appTestLogs[21053]: (NativeScript) 14  0x10e46d463 __CFRunLoopDoSources0
2019-08-23 17:08:45.236588+0300  localhost appTestLogs[21053]: (NativeScript) 15  0x10e467b1f __CFRunLoopRun
2019-08-23 17:08:45.236906+0300  localhost appTestLogs[21053]: (NativeScript) 16  0x10e467302 CFRunLoopRunSpecific
2019-08-23 17:08:45.237172+0300  localhost appTestLogs[21053]: (NativeScript) 17  0x1154f02fe GSEventRunModal
2019-08-23 17:08:45.237629+0300  localhost appTestLogs[21053]: (NativeScript) 18  0x10f94cba2 UIApplicationMain
2019-08-23 17:08:45.237754+0300  localhost appTestLogs[21053]: (NativeScript) 19  0x10bb6d20d ffi_call_unix64
2019-08-23 17:08:45.237985+0300  localhost appTestLogs[21053]: (NativeScript) 20  0x12278db10
2019-08-23 17:08:45.238245+0300  localhost appTestLogs[21053]: (NativeScript) JavaScript stack trace:
2019-08-23 17:08:45.238576+0300  localhost appTestLogs[21053]: (NativeScript) onTap(file:///app/bundle.js:293:42)
at notify(file:///app/vendor.js:3756:37)
at _emit(file:///app/vendor.js:3776:24)
at tap(file:///app/vendor.js:15438:24)
at UIApplicationMain([native code])
at _start(file:///app/vendor.js:789:26)
at run(file:///app/vendor.js:817:11)
at file:///app/bundle.js:155:16
at ./app.js(file:///app/bundle.js:172:34)
at __webpack_require__(file:///app/runtime.js:751:34)
at checkDeferredModules(file:///app/runtime.js:44:42)
at webpackJsonpCallback(file:///app/runtime.js:31:39)
at anonymous(file:///app/bundle.js:2:61)
at evaluate([native code])
at moduleEvaluation([native code])
at promiseReactionJob([native code])
2019-08-23 17:08:45.238805+0300  localhost appTestLogs[21053]: (NativeScript) JavaScript error:
2019-08-23 17:08:45.239125+0300  localhost appTestLogs[21053]: (NativeScript) file:///app/bundle.js:293:42: JS ERROR Error: Error in onTap
2019-08-23 17:08:45.240277+0300  localhost appTestLogs[21053]: (NativeScript) NativeScript caught signal 11.
2019-08-23 17:08:45.240579+0300  localhost appTestLogs[21053]: (NativeScript) Native Stack:
2019-08-23 17:08:45.241145+0300  localhost appTestLogs[21053]: (NativeScript) 1   0x10b1d41df sig_handler(int)
2019-08-23 17:08:45.242472+0300  localhost appTestLogs[21053]: (NativeScript) 2   0x10ee1eb5d _sigtramp
2019-08-23 17:08:45.242720+0300  localhost appTestLogs[21053]: (NativeScript) 3   0xffffffffffffffff
2019-08-23 17:08:45.242986+0300  localhost appTestLogs[21053]: (NativeScript) 4   0x10ed64b4d libunwind::UnwindCursor<libunwind::LocalAddressSpace, libunwind::Registers_x86_64>::step()
2019-08-23 17:08:45.243116+0300  localhost appTestLogs[21053]: (NativeScript) 5   0x10ed68e4c _Unwind_RaiseException
2019-08-23 17:08:45.243298+0300  localhost appTestLogs[21053]: (NativeScript) 6   0x10e9424aa __cxa_throw
2019-08-23 17:08:45.243472+0300  localhost appTestLogs[21053]: (NativeScript) 7   0x10d35bbfa _objc_exception_destructor(void*)
2019-08-23 17:08:45.243921+0300  localhost appTestLogs[21053]: (NativeScript) 8   0x10b18ba08 NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
2019-08-23 17:08:45.244441+0300  localhost appTestLogs[21053]: (NativeScript) 9   0x10b1c6028 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
2019-08-23 17:08:45.245956+0300  localhost appTestLogs[21053]: (NativeScript) 10  0x10bb6c9a6 ffi_closure_unix64_inner
2019-08-23 17:08:45.246066+0300  localhost appTestLogs[21053]: (NativeScript) 11  0x10bb6d3ca ffi_closure_unix64
2019-08-23 17:08:45.246350+0300  localhost appTestLogs[21053]: (NativeScript) 12  0x10f3a3c19 -[UIControl sendAction:to:forEvent:]
2019-08-23 17:08:45.246598+0300  localhost appTestLogs[21053]: (NativeScript) 13  0x10f3a3f36 -[UIControl _sendActionsForEvents:withEvent:]
2019-08-23 17:08:45.246834+0300  localhost appTestLogs[21053]: (NativeScript) 14  0x10f3a2eec -[UIControl touchesEnded:withEvent:]
2019-08-23 17:08:45.247061+0300  localhost appTestLogs[21053]: (NativeScript) 15  0x10f986eee -[UIWindow _sendTouchesForEvent:]
2019-08-23 17:08:45.247511+0300  localhost appTestLogs[21053]: (NativeScript) 16  0x10f9885d2 -[UIWindow sendEvent:]
2019-08-23 17:08:45.248103+0300  localhost appTestLogs[21053]: (NativeScript) 17  0x10f966d16 -[UIApplication sendEvent:]
2019-08-23 17:08:45.248574+0300  localhost appTestLogs[21053]: (NativeScript) 18  0x10fa37293 __dispatchPreprocessedEventFromEventQueue
2019-08-23 17:08:45.248870+0300  localhost appTestLogs[21053]: (NativeScript) 19  0x10fa39bb9 __handleEventQueueInternal
2019-08-23 17:08:45.249128+0300  localhost appTestLogs[21053]: (NativeScript) 20  0x10e46dbe1 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
2019-08-23 17:08:45.249411+0300  localhost appTestLogs[21053]: (NativeScript) 21  0x10e46d463 __CFRunLoopDoSources0
2019-08-23 17:08:45.249668+0300  localhost appTestLogs[21053]: (NativeScript) 22  0x10e467b1f __CFRunLoopRun
2019-08-23 17:08:45.249931+0300  localhost appTestLogs[21053]: (NativeScript) 23  0x10e467302 CFRunLoopRunSpecific
2019-08-23 17:08:45.250182+0300  localhost appTestLogs[21053]: (NativeScript) 24  0x1154f02fe GSEventRunModal
2019-08-23 17:08:45.251573+0300  localhost appTestLogs[21053]: (NativeScript) 25  0x10f94cba2 UIApplicationMain
2019-08-23 17:08:45.252714+0300  localhost appTestLogs[21053]: (NativeScript) 26  0x10bb6d20d ffi_call_unix64
2019-08-23 17:08:45.254906+0300  localhost appTestLogs[21053]: (NativeScript) 27  0x12278db10
2019-08-23 17:08:45.254999+0300  localhost appTestLogs[21053]: (NativeScript) JS Stack:
2019-08-23 17:08:45.255399+0300  localhost appTestLogs[21053]: (NativeScript) UIApplicationMain([native code])
at _start(file:///app/vendor.js:789:26)
at run(file:///app/vendor.js:817:11)
at file:///app/bundle.js:155:16
at ./app.js(file:///app/bundle.js:172:34)
at __webpack_require__(file:///app/runtime.js:751:34)
at checkDeferredModules(file:///app/runtime.js:44:42)
at webpackJsonpCallback(file:///app/runtime.js:31:39)
at anonymous(file:///app/bundle.js:2:61)
at evaluate([native code])
at moduleEvaluation
at promiseReactionJob`);

							assertData(
								logger.output,
								`***** Fatal JavaScript exception - application has been terminated. *****
Native stack trace:
1   0x10b18b62a NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
2   0x10b1c6028 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
3   0x10bb6c9a6 ffi_closure_unix64_inner
4   0x10bb6d3ca ffi_closure_unix64
5   0x10f3a3c19 -[UIControl sendAction:to:forEvent:]
6   0x10f3a3f36 -[UIControl _sendActionsForEvents:withEvent:]
7   0x10f3a2eec -[UIControl touchesEnded:withEvent:]
8   0x10f986eee -[UIWindow _sendTouchesForEvent:]
9   0x10f9885d2 -[UIWindow sendEvent:]
10  0x10f966d16 -[UIApplication sendEvent:]
11  0x10fa37293 __dispatchPreprocessedEventFromEventQueue
12  0x10fa39bb9 __handleEventQueueInternal
13  0x10e46dbe1 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
14  0x10e46d463 __CFRunLoopDoSources0
15  0x10e467b1f __CFRunLoopRun
16  0x10e467302 CFRunLoopRunSpecific
17  0x1154f02fe GSEventRunModal
18  0x10f94cba2 UIApplicationMain
19  0x10bb6d20d ffi_call_unix64
20  0x12278db10
JavaScript stack trace:
onTap(file: app/main-view-model.js:43:0)
at notify(file: node_modules/tns-core-modules/data/observable/observable.js:107:0)
at _emit(file: node_modules/tns-core-modules/data/observable/observable.js:127:0)
at tap(file: node_modules/tns-core-modules/ui/button/button.js:216:0)
at UIApplicationMain([native code])
at _start(file: node_modules/tns-core-modules/application/application.js:277:0)
at run(file: node_modules/tns-core-modules/application/application.js:305:0)
at file: app/app.js:46:0
at ./app.js(file:///app/bundle.js:172:34)
at __webpack_require__(file: app/webpack/bootstrap:750:0)
at checkDeferredModules(file: app/webpack/bootstrap:43:0)
at webpackJsonpCallback(file: app/webpack/bootstrap:30:0)
at anonymous(file:///app/bundle.js:2:61)
at evaluate([native code])
at moduleEvaluation([native code])
at promiseReactionJob([native code])
JavaScript error:
file: app/main-view-model.js:43:0: JS ERROR Error: Error in onTap
NativeScript caught signal 11.
Native Stack:
1   0x10b1d41df sig_handler(int)
2   0x10ee1eb5d _sigtramp
3   0xffffffffffffffff
4   0x10ed64b4d libunwind::UnwindCursor<libunwind::LocalAddressSpace, libunwind::Registers_x86_64>::step()
5   0x10ed68e4c _Unwind_RaiseException
6   0x10e9424aa __cxa_throw
7   0x10d35bbfa _objc_exception_destructor(void*)
8   0x10b18ba08 NativeScript::reportFatalErrorBeforeShutdown(JSC::ExecState*, JSC::Exception*, bool)
9   0x10b1c6028 NativeScript::FFICallback<NativeScript::ObjCMethodCallback>::ffiClosureCallback(ffi_cif*, void*, void**, void*)
10  0x10bb6c9a6 ffi_closure_unix64_inner
11  0x10bb6d3ca ffi_closure_unix64
12  0x10f3a3c19 -[UIControl sendAction:to:forEvent:]
13  0x10f3a3f36 -[UIControl _sendActionsForEvents:withEvent:]
14  0x10f3a2eec -[UIControl touchesEnded:withEvent:]
15  0x10f986eee -[UIWindow _sendTouchesForEvent:]
16  0x10f9885d2 -[UIWindow sendEvent:]
17  0x10f966d16 -[UIApplication sendEvent:]
18  0x10fa37293 __dispatchPreprocessedEventFromEventQueue
19  0x10fa39bb9 __handleEventQueueInternal
20  0x10e46dbe1 __CFRUNLOOP_IS_CALLING_OUT_TO_A_SOURCE0_PERFORM_FUNCTION__
21  0x10e46d463 __CFRunLoopDoSources0
22  0x10e467b1f __CFRunLoopRun
23  0x10e467302 CFRunLoopRunSpecific
24  0x1154f02fe GSEventRunModal
25  0x10f94cba2 UIApplicationMain
26  0x10bb6d20d ffi_call_unix64
27  0x12278db10
JS Stack:
UIApplicationMain([native code])
at _start(file: node_modules/tns-core-modules/application/application.js:277:0)
at run(file: node_modules/tns-core-modules/application/application.js:305:0)
at file: app/app.js:46:0
at ./app.js(file:///app/bundle.js:172:34)
at __webpack_require__(file: app/webpack/bootstrap:750:0)
at checkDeferredModules(file: app/webpack/bootstrap:43:0)
at webpackJsonpCallback(file: app/webpack/bootstrap:30:0)
at anonymous(file:///app/bundle.js:2:61)
at evaluate([native code])
at moduleEvaluation
at promiseReactionJob\n`
							);
						});
					});
				});
			});
		});
	});
});
