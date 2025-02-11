import { IOSLogFilter } from "../../lib/services/ios-log-filter";
import { Yok } from "../../lib/common/yok";
import { LoggingLevels } from "../../lib/common/mobile/logging-levels";
import { LoggerStub } from "../stubs";
import * as assert from "assert";
import { IInjector } from "../../lib/common/definitions/yok";

function createTestInjector(projectName: string): IInjector {
	const testInjector = new Yok();
	testInjector.register("loggingLevels", LoggingLevels);
	testInjector.register("fs", {
		exists: () => false
	});
	testInjector.register("projectData", {
		initializeProjectData: () => {
			/* empty */
		},
		projectDir: "test",
		projectName: projectName
	});

	testInjector.register("logger", LoggerStub);

	return testInjector;
}

describe("iOSLogFilter", () => {
	let testInjector: IInjector;
	let logFilter: Mobile.IPlatformLogFilter;
	const pid = "52946";
	const testData = [
		{
			version: 9,
			projectName: "NativeScript250",
			originalDataArr: [
				"May 24 15:54:38 Dragons-iPhone backboardd(BaseBoard)[62] <Error>: Unable to bootstrap_look_up port with name .gsEvents: unknown error code (1102)",
				"May 24 15:54:51 Dragons-iPhone locationd[67] <Notice>: Client com.apple.springboard disconnected",
				"May 24 14:44:59 iPad-90 NativeScript250[790] <Notice>: CONSOLE LOG file:///app/modules/homeView/homeView.component.js:13:24: CUSTOM CONSOLE LOG",
				"May 24 14:44:59 iPad-90 NativeScript250[790] <Notice>: CONSOLE LOG file:///app/modules/homeView/homeView.component.js:13:24: CUSTOM CONSOLE LOG",
				"May 24 14:44:59 iPad-90 mobile_installation_proxy[355] <Error>: 0x1f197000 LoadInfoPlist: Failed to create CFBundle from URL file:///private/var/mobile/Containers/Bundle/Application/EB4866CC-25D2-4A3B-AA6C-70FFA08B908E/NativeScript143.app",
				"May 24 14:44:59 iPad-90 mobile_installation_proxy[355] <Error>: 0x1f197000 LoadInfoPlist: Failed to create CFBundle from URL file:///private/var/mobile/Containers/Bundle/Application/0DA02818-DCAE-407C-979D-D55F4F36F8D2/NativeScript300.app",
				"  May 24 14:44:59 iPad-90 mobile_installation_proxy[355] <Error>: 0x1f197000 LoadInfoPlist: Failed to create CFBundle from URL file:///private/var/mobile/Containers/Bundle/Application/B0EE9362-7BDD-4FF2-868F-857B76D9D8D3/Cordova370.app",
				"  May 24 14:44:59 iPad-90 NativeScript250[790] <Notice>: CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3472:32: EXCEPTION: Uncaught (in promise): Error: CUSTOM EXCEPTION",
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[52946]: CONSOLE LOG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				""
			],
			infoExpectedArr: [
				null,
				null,
				"CONSOLE LOG file:///app/modules/homeView/homeView.component.js:13:24: CUSTOM CONSOLE LOG",
				"CONSOLE LOG file:///app/modules/homeView/homeView.component.js:13:24: CUSTOM CONSOLE LOG",
				null,
				null,
				null,
				"CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3472:32: EXCEPTION: Uncaught (in promise): Error: CUSTOM EXCEPTION",
				null,
				""
			],
			simProjectName: "TestApp",
			simulator: [
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[52946]: CONSOLE LOG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[52946]: CONSOLE DEBUG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[11111]: CONSOLE DEBUG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG"
			],
			simulatorExpectedArr: [
				"CONSOLE LOG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				"CONSOLE DEBUG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				""
			]
		},
		{
			version: 10,
			projectName: "NativeScript250",
			originalDataArr: [
				"May 24 15:54:52 Dragons-iPhone apsd(PersistentConnection)[90] <Notice>: 2017-05-24 15:54:52 +0300 apsd[90]: <PCDispatchTimer: 0x156ad240> performing call back",
				"May 24 15:54:52 Dragons-iPhone NativeScript250(NativeScript)[356] <Notice>: CONSOLE LOG file:///app/modules/homeView/homeView.component.js:13:24: CUSTOM CONSOLE LOG",
				"May 24 15:54:52 Dragons-iPhone NativeScript250(NativeScript)[356] <Notice>: CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3472:32: EXCEPTION: Uncaught (in promise): Error: CUSTOM EXCEPTION",
				" May 24 15:54:52 Dragons-iPhone NativeScript250(NativeScript)[356] <Notice>: CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3477:36: ORIGINAL STACKTRACE:",
				" May 24 15:54:52 Dragons-iPhone NativeScript250(NativeScript)[356] <Notice>: CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3478:36: resolvePromise@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:416:40",
				"resolvePromise@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:401:31",
				"file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:449:31",
				"invokeTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:223:42",
				"onInvokeTask@file:///app/tns_modules/@angular/core/bundles/core.umd.js:4382:51",
				"invokeTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:222:54",
				"runTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:123:57",
				"drainMicroTaskQueue@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:355:42",
				"promiseReactionJob@[native code]",
				"UIApplicationMain@[native code]",
				"start@file:///app/tns_modules/tns-core-modules/application/application.js:251:26",
				"bootstrapApp@file:///app/tns_module",
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[52946]: CONSOLE LOG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				""
			],
			infoExpectedArr: [
				null,
				"CONSOLE LOG file:///app/modules/homeView/homeView.component.js:13:24: CUSTOM CONSOLE LOG",
				"CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3472:32: EXCEPTION: Uncaught (in promise): Error: CUSTOM EXCEPTION",
				"CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3477:36: ORIGINAL STACKTRACE:",
				"CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3478:36: resolvePromise@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:416:40",
				"resolvePromise@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:401:31",
				"file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:449:31",
				"invokeTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:223:42",
				"onInvokeTask@file:///app/tns_modules/@angular/core/bundles/core.umd.js:4382:51",
				"invokeTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:222:54",
				"runTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:123:57",
				"drainMicroTaskQueue@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:355:42",
				"promiseReactionJob@[native code]",
				"UIApplicationMain@[native code]",
				"start@file:///app/tns_modules/tns-core-modules/application/application.js:251:26",
				"bootstrapApp@file:///app/tns_module",
				null,
				""
			],
			simProjectName: "TestApp",
			simulator: [
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[52946]: CONSOLE LOG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[52946]: CONSOLE DEBUG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[11111]: CONSOLE DEBUG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG"
			],
			simulatorExpectedArr: [
				"CONSOLE LOG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				"CONSOLE DEBUG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				""
			]
		},
		{
			version: 11,
			projectName: "NativeScript250",
			originalDataArr: [
				"May 24 15:54:52 Dragons-iPhone apsd(PersistentConnection)[90] <Notice>: 2017-05-24 15:54:52 +0300 apsd[90]: <PCDispatchTimer: 0x156ad240> performing call back",
				"May 24 15:54:52 Dragons-iPhone NativeScript250(NativeScript)[356] <Notice>: CONSOLE LOG file:///app/modules/homeView/homeView.component.js:13:24: CUSTOM CONSOLE LOG",
				"May 24 15:54:52 Dragons-iPhone NativeScript250(NativeScript)[356] <Notice>: CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3472:32: EXCEPTION: Uncaught (in promise): Error: CUSTOM EXCEPTION",
				" May 24 15:54:52 Dragons-iPhone NativeScript250(NativeScript)[356] <Notice>: CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3477:36: ORIGINAL STACKTRACE:",
				" May 24 15:54:52 Dragons-iPhone NativeScript250(NativeScript)[356] <Notice>: CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3478:36: resolvePromise@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:416:40",
				"resolvePromise@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:401:31",
				"file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:449:31",
				"invokeTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:223:42",
				"onInvokeTask@file:///app/tns_modules/@angular/core/bundles/core.umd.js:4382:51",
				"invokeTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:222:54",
				"runTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:123:57",
				"drainMicroTaskQueue@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:355:42",
				"promiseReactionJob@[native code]",
				"UIApplicationMain@[native code]",
				"start@file:///app/tns_modules/tns-core-modules/application/application.js:251:26",
				"bootstrapApp@file:///app/tns_module",
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[52946]: CONSOLE LOG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				""
			],
			infoExpectedArr: [
				null,
				"CONSOLE LOG file:///app/modules/homeView/homeView.component.js:13:24: CUSTOM CONSOLE LOG",
				"CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3472:32: EXCEPTION: Uncaught (in promise): Error: CUSTOM EXCEPTION",
				"CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3477:36: ORIGINAL STACKTRACE:",
				"CONSOLE ERROR file:///app/tns_modules/@angular/core/bundles/core.umd.js:3478:36: resolvePromise@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:416:40",
				"resolvePromise@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:401:31",
				"file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:449:31",
				"invokeTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:223:42",
				"onInvokeTask@file:///app/tns_modules/@angular/core/bundles/core.umd.js:4382:51",
				"invokeTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:222:54",
				"runTask@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:123:57",
				"drainMicroTaskQueue@file:///app/tns_modules/nativescript-angular/zone-js/dist/zone-nativescript.js:355:42",
				"promiseReactionJob@[native code]",
				"UIApplicationMain@[native code]",
				"start@file:///app/tns_modules/tns-core-modules/application/application.js:251:26",
				"bootstrapApp@file:///app/tns_module",
				null,
				""
			],
			simProjectName: "cliapp",
			simulator: [
				"2017-10-09 13:34:38.527844+0300  localhost cliapp[52946]: (NativeScript) CONSOLE LOG file:///app/main-view-model.js:18:20: Test Console",
				"2017-10-09 13:34:38.527844+0300  localhost cliapp[52946]: (NativeScript) CONSOLE DEBUG file:///app/main-view-model.js:18:20: Test Console",
				"Aug 22 10:59:20 MCSOFAPPBLD TestApp[11111]: CONSOLE DEBUG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG"
			],
			simulatorExpectedArr: [
				"CONSOLE LOG file:///app/main-view-model.js:18:20: Test Console",
				"CONSOLE DEBUG file:///app/main-view-model.js:18:20: Test Console",
				""
			]
		}
	];
	const infoLogLevel = "INFO";
	const fullLogLevel = "FULL";

	describe("filterData", () => {
		testData.forEach((data) => {
			it(`returns correct data on iOS ${data.version} when data comes in chunks`, () => {
				testInjector = createTestInjector(data.projectName);
				logFilter = testInjector.resolve(IOSLogFilter);

				let currentStart = 0;
				const maxRange = 50;
				let output = "";
				const input = data.originalDataArr.join("\n");
				while (true) {
					const currentRange = Math.floor(Math.random() * maxRange);
					const currentFilterInput = input.substr(currentStart, currentRange);
					const tempOutput = logFilter.filterData(currentFilterInput, {
						logLevel: infoLogLevel,
						projectName: data.projectName
					});
					if (tempOutput !== null) {
						output += tempOutput;
					}
					currentStart += currentRange;
					if (currentStart === input.length) {
						break;
					}
					currentStart = Math.min(currentStart, input.length);
				}

				assert.deepStrictEqual(
					output,
					data.infoExpectedArr.filter((item) => item !== null).join("\n")
				);
			});

			it(`returns correct data when logLevel is ${fullLogLevel} on iOS ${data.version} and all data is passed at once`, () => {
				testInjector = createTestInjector(data.projectName);
				logFilter = testInjector.resolve(IOSLogFilter);
				const actualData = logFilter.filterData(
					data.originalDataArr.join("\n"),
					{ logLevel: fullLogLevel, projectName: data.projectName }
				);
				const actualArr = actualData.split("\n").map((line) => line.trim());
				const expectedArr = data.originalDataArr
					.map((line) => line.trim())
					.filter((item) => item !== null);
				assert.deepStrictEqual(actualArr, expectedArr);
			});

			it(`returns correct data when logLevel is ${fullLogLevel} on iOS ${data.version} and data is passed one line at a time`, () => {
				data.originalDataArr.forEach((line) => {
					testInjector = createTestInjector(data.projectName);
					logFilter = testInjector.resolve(IOSLogFilter);
					const actualData = logFilter.filterData(line, {
						logLevel: fullLogLevel,
						projectName: data.projectName
					});
					assert.deepStrictEqual(actualData.trim(), line.trim());
				});
			});

			it(`parses data incorrectly when logLevel is ${infoLogLevel} on iOS ${data.version} and all data is passed at once with pid(simulator)`, () => {
				testInjector = createTestInjector(data.simProjectName);
				logFilter = testInjector.resolve(IOSLogFilter);
				const actualData = logFilter.filterData(data.simulator.join("\n"), {
					logLevel: infoLogLevel,
					projectName: data.simProjectName,
					applicationPid: pid
				});
				const actualArr = actualData.split("\n").map((line) => line.trim());
				assert.deepStrictEqual(
					actualArr,
					data.simulatorExpectedArr.filter((item) => item !== null)
				);
			});

			it(`parses data incorrectly when logLevel is ${infoLogLevel} on iOS ${data.version} and all data is passed at once and pid is available`, () => {
				testInjector = createTestInjector(data.projectName);
				logFilter = testInjector.resolve(IOSLogFilter);
				const actualData = logFilter.filterData(
					data.originalDataArr.join("\n"),
					{ logLevel: infoLogLevel, projectName: data.projectName }
				);
				const actualArr = actualData.split("\n").map((line) => line.trim());
				const expectedArr = data.infoExpectedArr.filter(
					(item) => item !== null
				);
				assert.deepStrictEqual(actualArr, expectedArr);
			});

			it(`returns correct data when logLevel is ${infoLogLevel} on iOS ${data.version} and data is passed one line at a time`, () => {
				testInjector = createTestInjector(data.projectName);
				logFilter = testInjector.resolve(IOSLogFilter);
				data.originalDataArr.forEach((line, index) => {
					if (line.length > 0) {
						line += "\n";
					}
					const actualData = logFilter.filterData(line, {
						logLevel: infoLogLevel,
						projectName: data.projectName
					});
					const expectedData = data.infoExpectedArr[index];
					assert.strictEqual(actualData && actualData.trim(), expectedData);
				});
			});
		});
	});
});
