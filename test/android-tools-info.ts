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
	runtimeVersion?: string;
	additionalInformation?: string;
}

describe("androidToolsInfo", () => {
	const defaultAdditionalInformation = "You will not be able to build your projects for Android." + EOL
		+ "To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" + EOL +
		" described in " + Constants.SYSTEM_REQUIREMENTS_LINKS[process.platform];

	const getAndroidToolsInfo = (runtimeVersion?: string): AndroidToolsInfo => {
		const childProcess: ChildProcess = <any>{};
		const fs: FileSystem = <any>{
			exists: () => true,
			execSync: (): string => null,
			readJson: (): any => {
				return runtimeVersion ? {
					nativescript: {
						"tns-android": {
							version: runtimeVersion
						}
					}
				} : null;
			}
		};
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
			},
			{
				javacVersion: "10",
				runtimeVersion: "4.0.0",
				warnings: [`The Java compiler version 10 is not compatible with the current Android runtime version 4.0.0. ` +
					`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`],
				additionalInformation: "You will not be able to build your projects for Android." + EOL +
					"To be able to build for Android, downgrade your Java compiler version or update your Android runtime."
			},
			{
				javacVersion: "10",
				runtimeVersion: "4.2.0"
			}
		];

		testData.forEach(({ javacVersion, warnings, runtimeVersion, additionalInformation }) => {
			it(`returns correct result when version is ${javacVersion}`, () => {
				const androidToolsInfo = getAndroidToolsInfo(runtimeVersion);
				const actualWarnings = androidToolsInfo.validateJavacVersion(javacVersion, "/Users/username/projectDir");

				let expectedWarnings: NativeScriptDoctor.IWarning[] = [];
				if (warnings && warnings.length) {
					expectedWarnings = warnings.map(warning => {
						return {
							platforms: [Constants.ANDROID_PLATFORM_NAME],
							warning,
							additionalInformation: additionalInformation || defaultAdditionalInformation
						};
					});
				}

				assert.deepEqual(actualWarnings, expectedWarnings);
			});
		});

		const npmTagsTestData: ITestData[] = [
			{
				javacVersion: "1.8.0",
				runtimeVersion: "rc"
			},
			{
				javacVersion: "10",
				runtimeVersion: "rc"
			},
			{
				javacVersion: "10",
				runtimeVersion: "latest",
				warnings: [`The Java compiler version 10 is not compatible with the current Android runtime version 4.0.0. ` +
					`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`],
				additionalInformation: "You will not be able to build your projects for Android." + EOL +
					"To be able to build for Android, downgrade your Java compiler version or update your Android runtime."
			},
			{
				javacVersion: "10",
				runtimeVersion: "old",
				warnings: [`The Java compiler version 10 is not compatible with the current Android runtime version 4.1.0-2018.5.17.1. ` +
					`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`],
				additionalInformation: "You will not be able to build your projects for Android." + EOL +
					"To be able to build for Android, downgrade your Java compiler version or update your Android runtime."
			},
			{
				javacVersion: "10",
				runtimeVersion: "old",
				warnings: [`The Java compiler version 10 is not compatible with the current Android runtime version 4.1.0-2018.5.17.1. ` +
					`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`],
				additionalInformation: "You will not be able to build your projects for Android." + EOL +
					"To be able to build for Android, downgrade your Java compiler version or update your Android runtime."
			},
			{
				javacVersion: "1.8.0",
				runtimeVersion: "latest"
			},
			{
				javacVersion: "1.8.0",
				runtimeVersion: "old"
			},
		];

		npmTagsTestData.forEach(({ javacVersion, warnings, runtimeVersion, additionalInformation }) => {
			it(`returns correct result when javac version is ${javacVersion} and the runtime version is tag from npm: ${runtimeVersion}`, () => {
				let execSyncCommand: string = null;
				const childProcess: ChildProcess = <any>{
					execSync: (command: string) => {
						execSyncCommand = command;
						return JSON.stringify({
							latest: '4.0.0',
							rc: '4.1.0-rc-2018.5.21.1',
							next: '4.1.0-2018.5.23.2',
							old: '4.1.0-2018.5.17.1'
						});
					}
				};

				const fs: FileSystem = <any>{
					exists: (filePath: string): boolean => true,
					execSync: (): string => null,
					readJson: (): any =>
						({
							nativescript: {
								"tns-android": {
									version: runtimeVersion
								}
							}
						})
				};

				const hostInfo: HostInfo = <any>{};
				const helpers: Helpers = new Helpers(<any>{});
				const androidToolsInfo = new AndroidToolsInfo(childProcess, fs, hostInfo, helpers);

				const actualWarnings = androidToolsInfo.validateJavacVersion(javacVersion, "/Users/username/projectDir");
				let expectedWarnings: NativeScriptDoctor.IWarning[] = [];
				if (warnings && warnings.length) {
					expectedWarnings = warnings.map(warning => {
						return {
							platforms: [Constants.ANDROID_PLATFORM_NAME],
							warning,
							additionalInformation: additionalInformation || defaultAdditionalInformation
						};
					});
				}

				assert.deepEqual(actualWarnings, expectedWarnings);
				assert.equal(execSyncCommand, "npm view tns-android dist-tags --json");
			});
		});
	});
});
