import { IOSLogFilter } from "../../mobile/ios/ios-log-filter";
import { LoggingLevels } from "../../mobile/logging-levels";
import { Yok } from "../../yok";
import * as assert from "assert";

const iosTestData = [
	{
		input: 'Dec 29 08:46:04 Dragons-iPhone iaptransportd[65] <Warning>: CIapPortAppleIDBus: Auth timer timeout completed on pAIDBPort:0x135d09410, portID:01 downstream port',
		output: null,
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:46:06 Dragons-iPhone kernel[0] <Notice>: AppleARMPMUCharger: AppleUSBCableDetect 1',
		output: null,
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:47:24 Dragons-iPhone bird[131] <Error>: unable to determine evictable space: Error Domain=LibrarianErrorDomain Code=10 "The operation couldn’t be completed. (LibrarianErrorDomain error 10 - Unable to configure the collection.)" UserInfo=0x137528190 {NSDescription=Unable to configure the collection.}',
		output: null,
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:47:43 Dragons-iPhone syslog_relay[179] <Notice>: syslog_relay found the ASL prompt. Starting...',
		output: null,
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:48:47 Dragons-iPhone com.apple.xpc.launchd[1] (com.apple.WebKit.Networking.08B3A589-3D68-492A-BA8D-A812EC55FDEB[13306]) <Warning>: Service exited with abnormal code: 1',
		output: null,
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:48:47 Dragons-iPhone ReportCrash[13308] <Notice>: Saved report to /var/mobile/Library/Logs/CrashReporter/Cordova370_2015-12-29-084847_Dragons-iPhone.ips',
		output: null,
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:48:47 Dragons-iPhone com.apple.WebKit.Networking[13306] <Error>: Faild to obtain sandbox extension for path=/private/var/mobile/Containers/Data/Application/047BB8F2-B8C8-405F-A820-8719EE207E6F/Library/Caches/com.telerik.BlankJS. Errno:1',
		output: null,
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Warning>: Apache Cordova native platform version 3.7.0 is starting.',
		output: '<Warning>: Apache Cordova native platform version 3.7.0 is starting.',
		pid13309Output: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Warning>: Apache Cordova native platform version 3.7.0 is starting.'
	},
	{
		input: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Notice>: Multi-tasking -> Device: YES, App: YES',
		output: '<Notice>: Multi-tasking -> Device: YES, App: YES',
		pid13309Output: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Notice>: Multi-tasking -> Device: YES, App: YES'
	},
	{
		input: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Warning>: Unlimited access to network resources',
		output: '<Warning>: Unlimited access to network resources',
		pid13309Output: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Warning>: Unlimited access to network resources'
	},
	{
		input: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Warning>: Finished load of: file:///var/mobile/Containers/Data/Application/0746156D-3C83-402E-8B4E-2B3063F42F76/Documents/index.html',
		output: '<Warning>: Finished load of: file:///var/mobile/Containers/Data/Application/0746156D-3C83-402E-8B4E-2B3063F42F76/Documents/index.html',
		pid13309Output: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Warning>: Finished load of: file:///var/mobile/Containers/Data/Application/0746156D-3C83-402E-8B4E-2B3063F42F76/Documents/index.html',
	},
	{
		input: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Warning>: ---------------------------------- LOG FROM MY APP',
		output: '<Warning>: ---------------------------------- LOG FROM MY APP',
		pid13309Output: 'Dec 29 08:49:06 Dragons-iPhone Cordova370[13309] <Warning>: ---------------------------------- LOG FROM MY APP',
	},
	{
		input: 'Dec 29 08:50:31 Dragons-iPhone NativeScript143[13314] <Error>: assertion failed: 12F70: libxpc.dylib + 71768 [B870B51D-AA85-3686-A7D9-ACD48C5FE153]: 0x7d',
		output: '<Error>: assertion failed: 12F70: libxpc.dylib + 71768 [B870B51D-AA85-3686-A7D9-ACD48C5FE153]: 0x7d',
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:50:31 Dragons-iPhone Unknown[13314] <Error>:',
		output: null,
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:50:31 Dragons-iPhone locationd[57] <Notice>: Gesture EnabledForTopCLient: 0, EnabledInDaemonSettings: 0',
		output: null,
		pid13309Output: null
	},
	{
		input: 'Dec 29 08:55:24 Dragons-iPhone NativeScript143[13309] <Notice>: file:///app/main-view-model.js:11:14: CONSOLE LOG COUNTER: 41',
		output: '<Notice>: file:///app/main-view-model.js:11:14: CONSOLE LOG COUNTER: 41',
		pid13309Output: 'Dec 29 08:55:24 Dragons-iPhone NativeScript143[13309] <Notice>: file:///app/main-view-model.js:11:14: CONSOLE LOG COUNTER: 41'

	},
	{
		input: 'Dec 29 08:55:24 Dragons-iPhone NativeScript143[13309] <Notice>: file:///app/main-view-model.js:11:14: CONSOLE LOG COUNTER: 41\n',
		output: '<Notice>: file:///app/main-view-model.js:11:14: CONSOLE LOG COUNTER: 41',
		pid13309Output: 'Dec 29 08:55:24 Dragons-iPhone NativeScript143[13309] <Notice>: file:///app/main-view-model.js:11:14: CONSOLE LOG COUNTER: 41',
	},
	{
		input: 'Dec 29 08:55:24 Dragons-iPhone NativeScript143[13309]: <Notice>: file:///app/main-view-model.js:11:14: CONSOLE LOG COUNTER: 41\n',
		output: '<Notice>: file:///app/main-view-model.js:11:14: CONSOLE LOG COUNTER: 41',
		pid13309Output: 'Dec 29 08:55:24 Dragons-iPhone NativeScript143[13309]: <Notice>: file:///app/main-view-model.js:11:14: CONSOLE LOG COUNTER: 41'
	},
	{
		input: 'Oct  4 08:53:46 bd-airtestmac com.apple.CoreSimulator.SimDevice.3616FC55-9CAB-47D4-8C58-5E5F0BE99C8E.launchd_sim[30337] (UIKitApplication:org.nativescript.ap1[0x76c5][13309]): Service exited due to signal: Terminated: 15',
		output: null,
		pid13309Output: 'Oct  4 08:53:46 bd-airtestmac com.apple.CoreSimulator.SimDevice.3616FC55-9CAB-47D4-8C58-5E5F0BE99C8E.launchd_sim[30337] (UIKitApplication:org.nativescript.ap1[0x76c5][13309]): Service exited due to signal: Terminated: 15'
	},
	{
		input: 'Oct  4 08:52:44 bd-airtestmac assertiond[13309]: assertion failed: 15G31 13A344: assertiond + 12188 [93893311-6962-33A7-A734-E36F946D8EBA]: 0x1',
		output: null,
		pid13309Output: 'Oct  4 08:52:44 bd-airtestmac assertiond[13309]: assertion failed: 15G31 13A344: assertiond + 12188 [93893311-6962-33A7-A734-E36F946D8EBA]: 0x1'
	}
];

describe("iOSLogFilter", () => {

	const assertFiltering = (inputData: string, expectedOutput: string, logLevel?: string, pid?: string) => {
		const testInjector = new Yok();
		testInjector.register("loggingLevels", LoggingLevels);
		const iOSLogFilter = <Mobile.IPlatformLogFilter>testInjector.resolve(IOSLogFilter);
		const filteredData = iOSLogFilter.filterData(inputData, { logLevel, applicationPid: pid });
		assert.deepEqual(filteredData, expectedOutput, `The actual result '${filteredData}' did NOT match expected output '${expectedOutput}'.`);
	};

	let logLevel = "INFO";
	const pid = "13309";

	describe("filterData", () => {
		describe("when PID is not provided", () => {
			it("when log level is full returns full data", () => {
				logLevel = "FULL";
				_.each(iosTestData, testData => {
					assertFiltering(testData.input, testData.input, logLevel);
				});
			});

			it("when log level is INFO filters data", () => {
				logLevel = "INFO";
				_.each(iosTestData, testData => {
					assertFiltering(testData.input, testData.output, logLevel);
				});
			});

			it("when log level is not specified returns full data", () => {
				logLevel = null;
				_.each(iosTestData, testData => {
					assertFiltering(testData.input, testData.input);
				});
			});
		});

		describe("when PID is provided", () => {
			it("when log level is full returns full data", () => {
				logLevel = "FULL";
				_.each(iosTestData, testData => {
					assertFiltering(testData.input, testData.input, logLevel, pid);
				});
			});

			it("when log level is INFO filters data", () => {
				logLevel = "INFO";
				_.each(iosTestData, testData => {
					assertFiltering(testData.input, testData.pid13309Output, logLevel, pid);
				});
			});

			it("when log level is not specified returns full data", () => {
				logLevel = null;
				_.each(iosTestData, testData => {
					assertFiltering(testData.input, testData.input, logLevel, pid);
				});
			});
		});
	});
});
