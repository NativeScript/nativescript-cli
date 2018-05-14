import { AndroidToolsInfo } from '../lib/android-tools-info';
import { EOL } from 'os';
import { assert } from "chai";
import { ChildProcess } from '../lib/wrappers/child-process';
import { FileSystem } from '../lib/wrappers/file-system';
import { HostInfo } from '../lib/host-info';
import { Helpers } from '../lib/helpers';
import { Constants } from '../lib/constants';

interface ITestData {
	javacVersion: string;
	warnings?: string[];
}

describe("androidToolsInfo", () => {
	const additionalInformation = "You will not be able to build your projects for Android." + EOL
	+ "To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" + EOL +
	" described in " + Constants.SYSTEM_REQUIREMENTS_LINKS[process.platform];

	const getAndroidToolsInfo = (): AndroidToolsInfo => {
		const childProcess: ChildProcess = <any>{};
		const fs: FileSystem = <any>{};
		const hostInfo: HostInfo = <any>{};
		const helpers: Helpers = new Helpers(<any>{});
		return new AndroidToolsInfo(childProcess, fs, hostInfo, helpers);
	};

	describe("validateJavacVersion", () => {
		const testData: ITestData[] = [
			{
				javacVersion: "1.8.0"
			},
			{
				javacVersion: "1.8.0_152"
			},
			{
				javacVersion: "9"
			},
			{
				javacVersion: "9.0.1"
			},
			{
				javacVersion: "10"
			},
			{
				javacVersion: "10.0.1"
			},
			{
				javacVersion: "1.7.0",
				warnings: ["Javac version 1.7.0 is not supported. You have to install at least 1.8.0."]
			},
			{
				javacVersion: "1.7.0_132",
				warnings: ["Javac version 1.7.0_132 is not supported. You have to install at least 1.8.0."]
			},
			{
				javacVersion: null,
				warnings: ["Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable."]
			}
		];

		testData.forEach(({ javacVersion, warnings }) => {
			it(`returns correct result when version is ${javacVersion}`, () => {
				const androidToolsInfo = getAndroidToolsInfo();
				const actualWarnings = androidToolsInfo.validateJavacVersion(javacVersion);
				let expectedWarnings: NativeScriptDoctor.IWarning[] = [];
				if (warnings && warnings.length) {
					expectedWarnings = warnings.map(warning => {
						return {
							platforms: [Constants.ANDROID_PLATFORM_NAME],
							warning,
							additionalInformation
						};
					});
				}

				assert.deepEqual(actualWarnings, expectedWarnings);
			});
		});
	});
});
