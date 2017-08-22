import { IOSLogFilter } from "../../lib/services/ios-log-filter";
import { Yok } from "../../lib/common/yok";
import { LoggingLevels } from "../../lib/common/mobile/logging-levels";
import * as assert from "assert";

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("loggingLevels", LoggingLevels);
	testInjector.register("fs", {
		exists: () => false
	});
	testInjector.register("projectData", {
		initializeProjectData: () => { /* empty */ },
		projectDir: "test"
	});

	return testInjector;
}

describe("iOSLogFilter", () => {
	let testInjector: IInjector;
	let logFilter: Mobile.IPlatformLogFilter;
	const testData = [
		{
			version: 9,
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
				"CONSOLE LOG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				""
			]
		},
		{
			version: 10,
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
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				"CONSOLE LOG file:///app/home/home-view-model.js:6:20: CUSTOM CONSOLE LOG",
				""
			]
		}
	];
	const infoLogLevel = "INFO";
	const fullLogLevel = "FULL";

	beforeEach(() => {
		testInjector = createTestInjector();
		logFilter = testInjector.resolve(IOSLogFilter);
	});

	describe("filterData", () => {
		testData.forEach(data => {
			it(`returns correct data when logLevel is ${fullLogLevel} on iOS ${data.version} and all data is passed at once`, () => {
				const actualData = logFilter.filterData(data.originalDataArr.join("\n"), fullLogLevel, null);
				const actualArr = actualData.split("\n").map(line => line.trim());
				const expectedArr = data.originalDataArr.map(line => line.trim());
				assert.deepEqual(actualArr, expectedArr);
			});

			it(`returns correct data when logLevel is ${fullLogLevel} on iOS ${data.version} and data is passed one line at a time`, () => {
				data.originalDataArr.forEach(line => {
					const actualData = logFilter.filterData(line, fullLogLevel, null);
					assert.deepEqual(actualData.trim(), line.trim());
				});
			});

			it(`parses data incorrectly when logLevel is ${infoLogLevel} on iOS ${data.version} and all data is passed at once`, () => {
				const actualData = logFilter.filterData(data.originalDataArr.join("\n"), infoLogLevel, null);
				const actualArr = actualData.split("\n").map(line => line.trim());
				const expectedArr = ["CONSOLE LOG file:///app/modules/homeView/homeView.component.js:13:24: CUSTOM CONSOLE LOG", ""];
				assert.deepEqual(actualArr, expectedArr);
			});

			it(`returns correct data when logLevel is ${infoLogLevel} on iOS ${data.version} and data is passed one line at a time`, () => {
				data.originalDataArr.forEach((line, index) => {
					const actualData = logFilter.filterData(line, infoLogLevel, null);
					const expectedData = data.infoExpectedArr[index];
					assert.deepEqual(actualData && actualData.trim(), expectedData && expectedData);
				});
			});
		});
	});
});
