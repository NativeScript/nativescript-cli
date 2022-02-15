import { AndroidToolsInfo } from "../src/android-tools-info";
import { EOL } from "os";
import { assert } from "chai";
import { ChildProcess } from "../src/wrappers/child-process";
import { FileSystem } from "../src/wrappers/file-system";
import { HostInfo } from "../src/host-info";
import { Helpers } from "../src/helpers";
import { Constants } from "../src/constants";

interface ITestData {
	javacVersion: string;
	warnings?: string[];
	runtimeVersion?: string;
	additionalInformation?: string;
}

describe("androidToolsInfo", () => {
	const originalAndroidHome = process.env["ANDROID_HOME"];
	const defaultAdditionalInformation =
		"You will not be able to build your projects for Android." +
		EOL +
		"To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" +
		EOL +
		" described in " +
		Constants.SYSTEM_REQUIREMENTS_LINKS[process.platform];
	before(() => {
		process.env["ANDROID_HOME"] = "test";
	});
	const getAndroidToolsInfo = (runtimeVersion?: string): AndroidToolsInfo => {
		const childProcess: ChildProcess = <any>{};
		const fs: FileSystem = <any>{
			exists: () => true,
			execSync: (): string => null,
			readJson: (): any => {
				return runtimeVersion
					? {
							nativescript: {
								"tns-android": {
									version: runtimeVersion,
								},
							},
							devDependencies: {
								"@nativescript/android": runtimeVersion,
							},
					  }
					: null;
			},
			readDirectory: (path: string) => {
				if (path.indexOf("build-tools") >= 0) {
					return ["20.0.0", "27.0.3", "28.0.3", "29.0.1"];
				} else {
					return ["android-16", "android-27", "android-28", "android-29"];
				}
			},
		};
		const hostInfo: HostInfo = <any>{};
		const helpers: Helpers = new Helpers(<any>{});
		return new AndroidToolsInfo(childProcess, fs, hostInfo, helpers);
	};

	describe("getToolsInfo", () => {
		it("runtime 6.0.0", () => {
			const androidToolsInfo = getAndroidToolsInfo("6.0.0");
			const toolsInfo = androidToolsInfo.getToolsInfo({ projectDir: "test" });

			assert.equal(toolsInfo.compileSdkVersion, 28);
		});

		it("runtime 6.1.0", () => {
			const androidToolsInfo = getAndroidToolsInfo("6.1.0");
			const toolsInfo = androidToolsInfo.getToolsInfo({ projectDir: "test" });

			assert.equal(toolsInfo.compileSdkVersion, 29);
		});
	});

	describe("supportedAndroidSdks", () => {
		it("should support android-17 - android-32", () => {
			const min = 17;
			const max = 32;
			let cnt = 0;
			const androidToolsInfo = getAndroidToolsInfo("6.5.0");
			const supportedTargets = androidToolsInfo.getSupportedTargets("test");
			for (let i = 0; i < supportedTargets.length; i++) {
				assert.equal(supportedTargets[i], `android-${min + i}`);
				cnt = min + i;
			}
			assert.equal(cnt, max);
		});
	});

	describe("validateJavacVersion", () => {
		const testData: ITestData[] = [
			{
				javacVersion: "1.8.0",
			},
			{
				javacVersion: "1.8.0_152",
			},
			{
				javacVersion: "9",
			},
			{
				javacVersion: "9.0.1",
			},
			{
				javacVersion: "10",
			},
			{
				javacVersion: "10.0.1",
			},
			{
				javacVersion: "1.7.0",
				warnings: [AndroidToolsInfo.unsupportedJavaMessage("1.7.0")],
			},
			{
				javacVersion: "1.7.0_132",
				warnings: [AndroidToolsInfo.unsupportedJavaMessage("1.7.0_132")],
			},
			//
			// Reinstate this test if there is some future max java version found to be not supported.
			//
			// {
			// 	javacVersion: "14.1.0",
			// 	warnings: [AndroidToolsInfo.unsupportedJavaMessage("14.1.0")]
			// },
			{
				javacVersion: null,
				warnings: [
					"Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable.",
				],
			},
			{
				javacVersion: "10",
				runtimeVersion: "4.0.0",
				warnings: [
					`The Java compiler version 10 is not compatible with the current Android runtime version 4.0.0. ` +
						`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`,
				],
				additionalInformation:
					"You will not be able to build your projects for Android." +
					EOL +
					"To be able to build for Android, downgrade your Java compiler version or update your Android runtime.",
			},
			{
				javacVersion: "10",
				runtimeVersion: "4.2.0",
			},
		];

		testData.forEach(
			({ javacVersion, warnings, runtimeVersion, additionalInformation }) => {
				it(`returns correct result when version is ${javacVersion}`, () => {
					const androidToolsInfo = getAndroidToolsInfo(runtimeVersion);
					const actualWarnings = androidToolsInfo.validateJavacVersion(
						javacVersion,
						"/Users/username/projectDir"
					);

					let expectedWarnings: NativeScriptDoctor.IWarning[] = [];
					if (warnings && warnings.length) {
						expectedWarnings = warnings.map((warning) => {
							return {
								platforms: [Constants.ANDROID_PLATFORM_NAME],
								warning,
								additionalInformation:
									additionalInformation || defaultAdditionalInformation,
							};
						});
					}

					assert.deepEqual(actualWarnings, expectedWarnings);
				});
			}
		);

		const npmTagsTestData: ITestData[] = [
			{
				javacVersion: "1.8.0",
				runtimeVersion: "rc",
			},
			{
				javacVersion: "10",
				runtimeVersion: "rc",
			},
			{
				javacVersion: "10",
				runtimeVersion: "latest",
				warnings: [
					`The Java compiler version 10 is not compatible with the current Android runtime version 4.0.0. ` +
						`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`,
				],
				additionalInformation:
					"You will not be able to build your projects for Android." +
					EOL +
					"To be able to build for Android, downgrade your Java compiler version or update your Android runtime.",
			},
			{
				javacVersion: "10",
				runtimeVersion: "old",
				warnings: [
					`The Java compiler version 10 is not compatible with the current Android runtime version 4.1.0-2018.5.17.1. ` +
						`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`,
				],
				additionalInformation:
					"You will not be able to build your projects for Android." +
					EOL +
					"To be able to build for Android, downgrade your Java compiler version or update your Android runtime.",
			},
			{
				javacVersion: "10",
				runtimeVersion: "old",
				warnings: [
					`The Java compiler version 10 is not compatible with the current Android runtime version 4.1.0-2018.5.17.1. ` +
						`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`,
				],
				additionalInformation:
					"You will not be able to build your projects for Android." +
					EOL +
					"To be able to build for Android, downgrade your Java compiler version or update your Android runtime.",
			},
			{
				javacVersion: "1.8.0",
				runtimeVersion: "latest",
			},
			{
				javacVersion: "1.8.0",
				runtimeVersion: "old",
			},
		];

		npmTagsTestData.forEach(
			({ javacVersion, warnings, runtimeVersion, additionalInformation }) => {
				it(`returns correct result when javac version is ${javacVersion} and the runtime version is tag from npm: ${runtimeVersion}`, () => {
					let execSyncCommand: string = null;
					const childProcess: ChildProcess = <any>{
						execSync: (command: string) => {
							execSyncCommand = command;
							return JSON.stringify({
								latest: "4.0.0",
								rc: "4.1.0-rc-2018.5.21.1",
								next: "4.1.0-2018.5.23.2",
								old: "4.1.0-2018.5.17.1",
							});
						},
					};

					const fs: FileSystem = <any>{
						exists: (filePath: string): boolean => true,
						execSync: (): string => null,
						readJson: (): any => ({
							nativescript: {
								"tns-android": {
									version: runtimeVersion,
								},
							},
							devDependencies: {
								"@nativescript/android": runtimeVersion,
							},
						}),
					};

					const hostInfo: HostInfo = <any>{};
					const helpers: Helpers = new Helpers(<any>{});
					const androidToolsInfo = new AndroidToolsInfo(
						childProcess,
						fs,
						hostInfo,
						helpers
					);

					const actualWarnings = androidToolsInfo.validateJavacVersion(
						javacVersion,
						"/Users/username/projectDir"
					);
					let expectedWarnings: NativeScriptDoctor.IWarning[] = [];
					if (warnings && warnings.length) {
						expectedWarnings = warnings.map((warning) => {
							return {
								platforms: [Constants.ANDROID_PLATFORM_NAME],
								warning,
								additionalInformation:
									additionalInformation || defaultAdditionalInformation,
							};
						});
					}

					assert.deepEqual(actualWarnings, expectedWarnings);
					assert.equal(
						execSyncCommand,
						"npm view tns-android dist-tags --json"
					);
				});
			}
		);
	});

	after(() => {
		process.env["ANDROID_HOME"] = originalAndroidHome;
	});
});
