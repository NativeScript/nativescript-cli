import * as assert from "assert";
import * as path from "path";
import { EOL } from "os";
import { SysInfo } from "../src/sys-info";
import { Helpers } from "../src/helpers";
import { ChildProcess } from "../src/wrappers/child-process";

const JavaHomeName = "JAVA_HOME";
const AndroidHomeName = "ANDROID_HOME";
const PROGRAM_FILES = "ProgramFiles";
const PROGRAM_FILES_X86 = "ProgramFiles(x86)";
const LOCAL_APP_DATA = "LOCALAPPDATA";
const PROGRAM_FILES_ENV_PATH = "C:\\Program Files";
const PROGRAM_FILEX_X86_ENV_PATH = "C:\\Program Files(x86)";
const LOCAL_APP_DATA_ENV_PATH = "C:\\username\\localappdata";

interface IChildProcessResultDescription {
	result?: any;
	shouldThrowError?: boolean;
	errorCode?: number;
}

interface ICLIOutputVersionTestCase {
	testedProperty: string;
	method: (sysInfo: SysInfo) => Promise<string>;
}

interface IChildProcessResults {
	[property: string]: IChildProcessResultDescription;
	uname: IChildProcessResultDescription;
	npmV: IChildProcessResultDescription;
	nodeV: IChildProcessResultDescription;
	javacVersion: IChildProcessResultDescription;
	javaVersion: IChildProcessResultDescription;
	nodeGypVersion: IChildProcessResultDescription;
	xCodeVersion: IChildProcessResultDescription;
	adbVersion: IChildProcessResultDescription;
	androidInstalled: IChildProcessResultDescription;
	monoVersion: IChildProcessResultDescription;
	gradleVersion: IChildProcessResultDescription;
	gitVersion: IChildProcessResultDescription;
	podVersion: IChildProcessResultDescription;
	pod: IChildProcessResultDescription;
	nativeScriptCliVersion: IChildProcessResultDescription;
	git: IChildProcessResultDescription;
	pythonInfo?: IChildProcessResultDescription;
}

interface IHostInfoMockOptions {
	isWindows?: boolean;
	dotNetVersion?: string;
	isDarwin?: boolean;
}

interface IFileSystemMockOptions {
	existsResult?: boolean;
}

const androidToolsInfo: NativeScriptDoctor.IAndroidToolsInfo = {
	ANDROID_TARGET_PREFIX: "",
	androidHome: "",
	getPathToAdbFromAndroidHome: async () => {
		return "adb";
	},
	getPathToEmulatorExecutable: () => {
		return "emulator";
	},
	getToolsInfo: () => {
		return Object.create(null);
	},
	validateAndroidHomeEnvVariable: (): any[] => {
		return [];
	},
	validateInfo: (): any[] => {
		return [];
	},
	validateJavacVersion: (): any[] => {
		return [];
	},
	validateMinSupportedTargetSdk: (): NativeScriptDoctor.IWarning[] => [],
	validataMaxSupportedTargetSdk: (): NativeScriptDoctor.IWarning[] => [],
};

function createChildProcessResults(
	childProcessResult: IChildProcessResults,
): IDictionary<IChildProcessResultDescription> {
	return {
		"uname -a": childProcessResult.uname,
		"npm -v": childProcessResult.npmV,
		"node -v": childProcessResult.nodeV,
		'"javac" -version': childProcessResult.javacVersion,
		'"java" -version': childProcessResult.javaVersion,
		"which javac": { result: "" },
		"where javac": { result: "" },
		"which java": { result: "" },
		"where java": { result: "" },
		"node-gyp -v": childProcessResult.nodeGypVersion,
		"xcodebuild -version": childProcessResult.xCodeVersion,
		"pod --version": childProcessResult.podVersion,
		pod: childProcessResult.pod,
		adb: childProcessResult.adbVersion,
		"adb version": childProcessResult.adbVersion,
		"'adb' version": childProcessResult.adbVersion, // for Mac and Linux
		android: childProcessResult.androidInstalled,
		"android.bat": childProcessResult.androidInstalled, // for Windows
		"mono --version": childProcessResult.monoVersion,
		"'git' --version": childProcessResult.gitVersion, // for Mac and Linux
		'"C:\\Program Files\\Git\\cmd\\git.exe" --version':
			childProcessResult.gitVersion, // for Windows
		'"C:\\Program Files/Git/cmd/git.exe" --version':
			childProcessResult.gitVersion, // When running Windows test on the Non-Windows platform
		"gradle -v": childProcessResult.gradleVersion,
		"ns --version": childProcessResult.nativeScriptCliVersion,
		emulator: { shouldThrowError: false },
		"which git": childProcessResult.git,
		"python3 --version": childProcessResult.pythonInfo,
	};
}

function getResultFromChildProcess(
	childProcessResultDescription: IChildProcessResultDescription,
	command: string,
	options?: ISpawnFromEventOptions,
): any {
	if (childProcessResultDescription.shouldThrowError) {
		if (options && options.ignoreError) {
			return null;
		} else {
			const error = new Error(`This one throws error. (${command})`);
			if (childProcessResultDescription.errorCode) {
				(<any>error).code = childProcessResultDescription.errorCode;
			}

			throw error;
		}
	}

	return childProcessResultDescription.result;
}

function mockSysInfo(
	childProcessResult: IChildProcessResults,
	hostInfoOptions?: IHostInfoMockOptions,
	fileSystemOptions?: IFileSystemMockOptions,
): SysInfo {
	hostInfoOptions = hostInfoOptions || {};
	const winreg: any = {
		getRegistryValue: (
			valueName: string,
			hive?: IHiveId,
			key?: string,
			host?: string,
		) => {
			return { value: "registryKey" };
		},
		registryKeys: {
			HKLM: "HKLM",
		},
	};
	const hostInfo: any = {
		dotNetVersion: () => Promise.resolve(hostInfoOptions.dotNetVersion),
		isDarwin: hostInfoOptions.isDarwin,
		isWindows: hostInfoOptions.isWindows,
		isLinux: !hostInfoOptions.isDarwin && !hostInfoOptions.isWindows,
		winreg,
	};
	const childProcessResultDictionary =
		createChildProcessResults(childProcessResult);
	const childProcess = {
		exec: async (command: string) => {
			return getResultFromChildProcess(
				childProcessResultDictionary[command],
				command,
			);
		},
		spawnFromEvent: async (
			command: string,
			args: string[],
			event: string,
			options: ISpawnFromEventOptions,
		) => {
			return getResultFromChildProcess(
				childProcessResultDictionary[command],
				command,
				options,
			);
		},
		execFile: async (): Promise<any> => {
			return undefined;
		},
		execSync: (command: string): string => null,
	};

	const fileSystem: any = {
		exists: () => (fileSystemOptions || {}).existsResult,
		extractZip: () => Promise.resolve(),
		readDirectory: () => Promise.resolve([]),
	};

	const helpers = new Helpers(hostInfo);
	return new SysInfo(
		childProcess,
		fileSystem,
		helpers,
		hostInfo,
		winreg,
		androidToolsInfo,
	);
}

function setStdOut(value: string): { stdout: string } {
	return { stdout: value };
}
function setStdErr(value: string): { stderr: string } {
	return { stderr: value };
}

describe("SysInfo unit tests", () => {
	let sysInfo: SysInfo;
	const dotNetVersion = "4.5.1";

	beforeEach(() => {
		// We need to mock this because on Mac the tests in which the platform is mocked to Windows in the process there will be no CommonProgramFiles.
		process.env["CommonProgramFiles"] =
			process.env["CommonProgramFiles"] || "mocked on mac";
		process.env["CommonProgramFiles(x86)"] =
			process.env["CommonProgramFiles(x86)"] || "mocked on mac";
	});

	describe("Should execute correct commands to check for", () => {
		let spawnFromEventCommand: string;
		let execCommands: string[] = [];
		let fileSystem: any;
		let hostInfo: any;

		beforeEach(() => {
			execCommands = [];
			const childProcess: ChildProcess = {
				spawnFromEvent: async (
					command: string,
					args: string[],
					event: string,
				) => {
					spawnFromEventCommand = `${command} ${args.join(" ")}`;
					return { stdout: "", stderr: "" };
				},
				exec: async (command: string) => {
					execCommands.push(command);
					return { stdout: "", stderr: "" };
				},
				execFile: async () => {
					return undefined;
				},
				execSync: (command: string): string => null,
			};

			const helpers = new Helpers(null);
			fileSystem = {
				exists: () => false,
				extractZip: () => Promise.resolve(),
				readDirectory: () => Promise.resolve([]),
			};

			hostInfo = {
				isWindows: false,
			};

			sysInfo = new SysInfo(
				childProcess,
				fileSystem,
				helpers,
				hostInfo,
				null,
				androidToolsInfo,
			);
		});

		it("java compiler version when there is JAVA_HOME.", async () => {
			const originalJavaHome = process.env[JavaHomeName];
			process.env[JavaHomeName] = "mock";

			const pathToJavac = path.join(process.env[JavaHomeName], "bin", "javac");
			fileSystem.exists = () => true;
			await sysInfo.getJavaCompilerVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommands[0], `"${pathToJavac}" -version`);
		});

		it("java compiler version when there is no JAVA_HOME on non-Windows OS", async () => {
			const originalJavaHome = process.env[JavaHomeName];

			delete process.env[JavaHomeName];
			await sysInfo.getJavaCompilerVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommands, ["which javac", '"javac" -version']);
		});

		it("null when there is incorrect JAVA_HOME on non-Windows OS", async () => {
			const originalJavaHome = process.env[JavaHomeName];
			process.env[JavaHomeName] =
				"/some/invalid/dir/name/where/java/does/not/exist";

			const result = await sysInfo.getJavaCompilerVersion();

			process.env[JavaHomeName] = originalJavaHome;

			assert.deepEqual(result, null);
			assert.deepEqual(execCommands, []);
		});

		it("null when there is incorrect JAVA_HOME on Window OS", async () => {
			const originalJavaHome = process.env[JavaHomeName];
			hostInfo.isWindows = true;
			process.env[JavaHomeName] = "C:\\Program Files\\Not existing dir";

			const result = await sysInfo.getJavaCompilerVersion();

			process.env[JavaHomeName] = originalJavaHome;

			assert.deepEqual(result, null);
			assert.deepEqual(execCommands, []);
		});

		it("java compiler version when there is no JAVA_HOME on Window OS", async () => {
			const originalJavaHome = process.env[JavaHomeName];
			hostInfo.isWindows = true;
			delete process.env[JavaHomeName];
			await sysInfo.getJavaCompilerVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommands, ["where javac", '"javac" -version']);
		});

		it("java version when there is JAVA_HOME.", async () => {
			const originalJavaHome = process.env[JavaHomeName];
			process.env[JavaHomeName] = "mock";

			const pathToJava = path.join(process.env[JavaHomeName], "bin", "java");
			fileSystem.exists = () => true;
			await sysInfo.getJavaVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommands[0], `"${pathToJava}" -version`);
		});

		it("java version when there is no JAVA_HOME on non-Windows OS", async () => {
			const originalJavaHome = process.env[JavaHomeName];

			delete process.env[JavaHomeName];
			await sysInfo.getJavaVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommands, ["which java", '"java" -version']);
		});

		it("java version when there is no JAVA_HOME on Window OS", async () => {
			const originalJavaHome = process.env[JavaHomeName];
			hostInfo.isWindows = true;
			delete process.env[JavaHomeName];
			await sysInfo.getJavaVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommands, ["where java", '"java" -version']);
		});
	});

	describe("getSysInfo", () => {
		let childProcessResult: IChildProcessResults;
		const originalJavaHome = process.env[JavaHomeName];
		const originalAndroidHome = process.env[AndroidHomeName];

		beforeEach(() => {
			childProcessResult = {
				uname: { result: setStdOut("name") },
				npmV: { result: setStdOut("2.14.1") },
				nodeV: { result: setStdOut("v6.0.0") },
				javacVersion: { result: setStdErr("javac 1.8.0_60") },
				javaVersion: {
					result: setStdErr(`java version "1.8.0_202"
Java(TM) SE Runtime Environment (build 1.8.0_202-b08)
Java HotSpot(TM) 64-Bit Server VM (build 25.202-b08, mixed mode)`),
				},
				nodeGypVersion: { result: setStdOut("2.0.0") },
				xCodeVersion: { result: setStdOut("Xcode 6.4.0") },
				adbVersion: {
					result: setStdOut("Android Debug Bridge version 1.0.32"),
				},
				androidInstalled: { result: setStdOut("android") },
				monoVersion: { result: setStdOut("version 1.0.6 ") },
				gradleVersion: { result: setStdOut("Gradle 2.8") },
				gitVersion: { result: setStdOut("git version 1.9.5") },
				podVersion: { result: setStdOut("0.38.2") },
				pod: { result: setStdOut("success") },
				nativeScriptCliVersion: { result: setStdOut("2.5.0") },
				git: { result: setStdOut("git") },
			};

			delete process.env[JavaHomeName];
			delete process.env[AndroidHomeName];
		});

		afterEach(() => {
			process.env[JavaHomeName] = originalJavaHome;
			process.env[AndroidHomeName] = originalAndroidHome;
		});

		describe("returns correct results when everything is installed", () => {
			const assertCommonValues = (result: NativeScriptDoctor.ISysInfoData) => {
				assert.deepEqual(result.npmVer, childProcessResult.npmV.result.stdout);
				assert.deepEqual(result.nodeVer, "6.0.0");
				assert.deepEqual(result.javacVersion, "1.8.0_60");
				assert.deepEqual(result.javaVersion, "1.8.0_202");
				assert.deepEqual(
					result.nodeGypVer,
					childProcessResult.nodeGypVersion.result.stdout,
				);
				assert.deepEqual(result.adbVer, "1.0.32");
				assert.deepEqual(result.androidInstalled, true);
				assert.deepEqual(result.monoVer, "1.0.6");
				assert.deepEqual(result.gradleVer, "2.8");
				assert.deepEqual(result.gitVer, "1.9.5");
				assert.deepEqual(
					result.nativeScriptCliVersion,
					childProcessResult.nativeScriptCliVersion.result.stdout,
				);
			};

			beforeEach(() => {
				androidToolsInfo.validateAndroidHomeEnvVariable = (): any[] => [];
			});

			it("on Windows", async () => {
				const originalProgramFiles = process.env[PROGRAM_FILES];
				process.env[PROGRAM_FILES] = PROGRAM_FILES_ENV_PATH;
				process.env[PROGRAM_FILES_X86] = PROGRAM_FILEX_X86_ENV_PATH;
				process.env[LOCAL_APP_DATA] = LOCAL_APP_DATA_ENV_PATH;
				sysInfo = mockSysInfo(
					childProcessResult,
					{ isWindows: true, isDarwin: false, dotNetVersion },
					{ existsResult: true },
				);
				const result = await sysInfo.getSysInfo();
				process.env[PROGRAM_FILES] = originalProgramFiles;
				assertCommonValues(result);
				assert.deepEqual(result.xcodeVer, null);
				assert.deepEqual(result.cocoaPodsVer, null);
			});

			it("on Mac", async () => {
				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: true,
					dotNetVersion,
				});
				const result = await sysInfo.getSysInfo();
				assertCommonValues(result);
				assert.deepEqual(result.xcodeVer, "6.4.0");
				assert.deepEqual(
					result.cocoaPodsVer,
					childProcessResult.podVersion.result.stdout,
				);
			});

			it("on Linux", async () => {
				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: false,
					dotNetVersion,
				});
				const result = await sysInfo.getSysInfo();
				assertCommonValues(result);
				assert.deepEqual(result.xcodeVer, null);
				assert.deepEqual(result.cocoaPodsVer, null);
			});
		});

		describe("cocoapods version", () => {
			it("is null when cocoapods are not installed", async () => {
				// simulate error when pod --version command is executed
				childProcessResult.podVersion = { shouldThrowError: true };
				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: true,
					dotNetVersion,
				});
				const result = await sysInfo.getSysInfo();
				assert.deepEqual(result.cocoaPodsVer, null);
			});

			it("is null when OS is not Mac", async () => {
				const originalProgramFiles = process.env[PROGRAM_FILES];
				process.env[PROGRAM_FILES] = PROGRAM_FILES_ENV_PATH;
				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: true,
					isDarwin: false,
					dotNetVersion,
				});
				const result = await sysInfo.getSysInfo();
				process.env[PROGRAM_FILES] = originalProgramFiles;
				assert.deepEqual(result.cocoaPodsVer, null);
			});

			it("is correct when cocoapods output has warning after version output", async () => {
				childProcessResult.podVersion = {
					result: setStdOut("0.38.2\nWARNING:\n"),
				};
				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: true,
					dotNetVersion,
				});
				const result = await sysInfo.getSysInfo();
				assert.deepEqual(result.cocoaPodsVer, "0.38.2");
			});

			it("is correct when cocoapods output has warnings before version output", async () => {
				childProcessResult.podVersion = {
					result: setStdOut("WARNING\nWARNING2\n0.38.2"),
				};
				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: true,
					dotNetVersion,
				});
				const result = await sysInfo.getSysInfo();
				assert.deepEqual(result.cocoaPodsVer, "0.38.2");
			});
		});

		describe("getXcprojInfo", () => {
			it("does not fail when cocoapods version is below 1.0.0 and Xcode version contains only two digits", async () => {
				childProcessResult.podVersion = { result: setStdOut("0.39.0") };
				childProcessResult.xCodeVersion = { result: setStdOut("Xcode 8.3") };
				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: true,
					dotNetVersion,
				});
				const result = await sysInfo.getXcprojInfo();
				assert.deepEqual(result, {
					shouldUseXcproj: true,
					xcprojAvailable: false,
				});
			});
		});

		describe("when android info is incorrect", () => {
			it("pathToAdb is null", async () => {
				childProcessResult.adbVersion = {
					result: null,
				};
				sysInfo = mockSysInfo(
					childProcessResult,
					{ isWindows: false, isDarwin: false, dotNetVersion: "4.5.1" },
					null,
				);
				const adbVersion = await sysInfo.getAdbVersion();
				const isAndroidSdkConfiguredCorrectly =
					await sysInfo.isAndroidSdkConfiguredCorrectly();
				assert.deepEqual(adbVersion, null);
				assert.deepEqual(isAndroidSdkConfiguredCorrectly, undefined);
			});
		});

		describe("pythonInfo", () => {
			it("should return null when platform is windows", async () => {
				sysInfo = mockSysInfo(
					childProcessResult,
					{ isWindows: true, isDarwin: false, dotNetVersion: "4.5.1" },
					null,
				);
				const pythonInfo = await sysInfo.getPythonInfo();
				assert.deepEqual(pythonInfo, null);
			});
			it("should return null when platform is linux", async () => {
				sysInfo = mockSysInfo(
					childProcessResult,
					{ isWindows: false, isDarwin: false, dotNetVersion: "4.5.1" },
					null,
				);
				const pythonInfo = await sysInfo.getPythonInfo();
				assert.deepEqual(pythonInfo, null);
			});
			it("should return {isInstalled: true} when python is correctly installed on Mac", async () => {
				childProcessResult.pythonInfo = { result: "" };
				sysInfo = mockSysInfo(
					childProcessResult,
					{ isWindows: false, isDarwin: true, dotNetVersion: "4.5.1" },
					null,
				);
				const pythonInfo = await sysInfo.getPythonInfo();
				assert.deepEqual(pythonInfo, {
					isInstalled: true,
				});
			});
			it("should return {isInstalled: false} when python check throws an error", async () => {
				childProcessResult.pythonInfo = { shouldThrowError: true };
				sysInfo = mockSysInfo(
					childProcessResult,
					{ isWindows: false, isDarwin: true, dotNetVersion: "4.5.1" },
					null,
				);
				const pythonInfo = await sysInfo.getPythonInfo();
				assert.deepEqual(pythonInfo, {
					isInstalled: false,
					installationErrorMessage:
						"This one throws error. (python3 --version)",
				});
			});
			// it("should return {isInstalled: true} when python is installed but six package is not", async () => {
			// 	childProcessResult.pythonInfo = {
			// 		shouldThrowError: true,
			// 		errorCode: 1,
			// 	};
			// 	sysInfo = mockSysInfo(
			// 		childProcessResult,
			// 		{ isWindows: false, isDarwin: true, dotNetVersion: "4.5.1" },
			// 		null
			// 	);
			// 	const pythonInfo = await sysInfo.getPythonInfo();
			// 	assert.deepEqual(pythonInfo, {
			// 		isInstalled: true,
			// 	});
			// });
		});

		const testData: ICLIOutputVersionTestCase[] = [
			{
				testedProperty: "nativeScriptCliVersion",
				method: (currentSysInfo: SysInfo) =>
					currentSysInfo.getNativeScriptCliVersion(),
			},
		];

		testData.forEach((testCase) => {
			describe(testCase.testedProperty, () => {
				it("is null when ns is not installed", async () => {
					childProcessResult[testCase.testedProperty] = {
						shouldThrowError: true,
					};
					sysInfo = mockSysInfo(childProcessResult, {
						isWindows: false,
						isDarwin: true,
						dotNetVersion,
					});
					const result = await testCase.method(sysInfo);
					assert.deepEqual(result, null);
				});

				it("is correct when the version is the only row in command output", async () => {
					childProcessResult[testCase.testedProperty] = {
						result: setStdOut("3.0.0"),
					};
					sysInfo = mockSysInfo(childProcessResult, {
						isWindows: false,
						isDarwin: true,
						dotNetVersion,
					});
					const result = await testCase.method(sysInfo);
					assert.deepEqual(result, "3.0.0");
				});

				it("is correct when there are warnings in the command's output", async () => {
					childProcessResult[testCase.testedProperty] = {
						result: setStdOut(
							`Some warning due to invalid extensions${EOL}3.0.0`,
						),
					};
					sysInfo = mockSysInfo(childProcessResult, {
						isWindows: false,
						isDarwin: true,
						dotNetVersion,
					});
					const result = await testCase.method(sysInfo);
					assert.deepEqual(result, "3.0.0");
				});

				it("is correct when there are warnings with version in them in the command's output", async () => {
					const cliOutput = `
Support for Node.js 7.6.0 is not verified. This CLI might not install or run properly.

3.0.0`;
					childProcessResult[testCase.testedProperty] = {
						result: setStdOut(cliOutput),
					};
					sysInfo = mockSysInfo(childProcessResult, {
						isWindows: false,
						isDarwin: true,
						dotNetVersion,
					});
					const result = await testCase.method(sysInfo);
					assert.deepEqual(result, "3.0.0");
				});

				it("is correct when there are warnings in the command's output and searched version is a prerelease", async () => {
					const expectedCliVersion = "3.2.0-2017-07-21-9480";
					const cliOutput = `
Support for Node.js 7.6.0 is not verified. This CLI might not install or run properly.

${expectedCliVersion}`;
					childProcessResult[testCase.testedProperty] = {
						result: setStdOut(cliOutput),
					};
					sysInfo = mockSysInfo(childProcessResult, {
						isWindows: false,
						isDarwin: true,
						dotNetVersion,
					});
					const result = await testCase.method(sysInfo);
					assert.deepEqual(result, expectedCliVersion);
				});
			});
		});

		describe("returns correct results when exceptions are raised during sysInfo data collection", () => {
			beforeEach(() => {
				childProcessResult = {
					uname: { shouldThrowError: true },
					npmV: { shouldThrowError: true },
					nodeV: { shouldThrowError: true },
					javacVersion: { shouldThrowError: true },
					javaVersion: { shouldThrowError: true },
					nodeGypVersion: { shouldThrowError: true },
					xCodeVersion: { shouldThrowError: true },
					adbVersion: { shouldThrowError: true },
					androidInstalled: { shouldThrowError: true },
					monoVersion: { shouldThrowError: true },
					gradleVersion: { shouldThrowError: true },
					gitVersion: { shouldThrowError: true },
					podVersion: { shouldThrowError: true },
					pod: { shouldThrowError: true },
					nativeScriptCliVersion: { shouldThrowError: true },
					git: { shouldThrowError: false },
				};
				androidToolsInfo.validateAndroidHomeEnvVariable = (): any[] => [1];
			});

			describe("when all of calls throw", () => {
				const assertAllValuesAreNull = async () => {
					const result = await sysInfo.getSysInfo();
					assert.deepEqual(result.npmVer, null);
					assert.deepEqual(result.javacVersion, null);
					assert.deepEqual(result.nodeGypVer, null);
					assert.deepEqual(result.xcodeVer, null);
					assert.deepEqual(result.adbVer, null);
					assert.deepEqual(result.androidInstalled, false);
					assert.deepEqual(result.monoVer, null);
					assert.deepEqual(result.gradleVer, null);
					assert.deepEqual(result.gitVer, null);
					assert.deepEqual(result.cocoaPodsVer, null);
				};

				it("on Windows", async () => {
					const originalProgramFiles = process.env[PROGRAM_FILES];
					process.env[PROGRAM_FILES] = PROGRAM_FILES_ENV_PATH;
					sysInfo = mockSysInfo(childProcessResult, {
						isWindows: true,
						isDarwin: false,
						dotNetVersion,
					});
					process.env[PROGRAM_FILES] = originalProgramFiles;
					await assertAllValuesAreNull();
				});

				it("on Mac", async () => {
					sysInfo = mockSysInfo(childProcessResult, {
						isWindows: false,
						isDarwin: true,
						dotNetVersion,
					});
					await assertAllValuesAreNull();
				});

				it("on Linux", async () => {
					sysInfo = mockSysInfo(childProcessResult, {
						isWindows: false,
						isDarwin: false,
						dotNetVersion,
					});
					await assertAllValuesAreNull();
				});
			});
		});

		describe("returns correct sysInfo when", () => {
			const assertCommonSysInfo = (result: NativeScriptDoctor.ISysInfoData) => {
				assert.deepEqual(result.npmVer, childProcessResult.npmV.result.stdout);
				assert.deepEqual(result.nodeVer, "6.0.0");
				assert.deepEqual(
					result.nodeGypVer,
					childProcessResult.nodeGypVersion.result.stdout,
				);
				assert.deepEqual(result.gitVer, "1.9.5");
				assert.deepEqual(
					result.nativeScriptCliVersion,
					childProcessResult.nativeScriptCliVersion.result.stdout,
				);
			};

			const assertAndroidSysInfo = (
				result: NativeScriptDoctor.IAndroidSysInfoData,
			) => {
				assert.deepEqual(result.adbVer, "1.0.32");
				assert.deepEqual(result.androidInstalled, false);
				assert.deepEqual(result.monoVer, "1.0.6");
				assert.deepEqual(result.gradleVer, "2.8");
				assert.deepEqual(result.javacVersion, "1.8.0_60");
				assert.deepEqual(result.isAndroidSdkConfiguredCorrectly, undefined);
			};

			const assertiOSSysInfo = (result: NativeScriptDoctor.IiOSSysInfoData) => {
				assert.deepEqual(result.xcodeVer, "6.4.0");
				assert.deepEqual(result.itunesInstalled, undefined);
				assert.deepEqual(result.cocoaPodsVer, "0.38.2");
				assert.deepEqual(result.xcodeprojLocation, null);
				assert.deepEqual(result.isCocoaPodsWorkingCorrectly, true);
				assert.deepEqual(result.xcprojInfo, undefined);
				assert.deepEqual(result.isCocoaPodsUpdateRequired, false);
				assert.deepEqual(result.pythonInfo, {
					isInstalled: false,
					installationErrorMessage:
						"Cannot read properties of undefined (reading 'shouldThrowError')",
				});
			};

			it("iOS platform is specified", async () => {
				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: true,
					dotNetVersion,
				});
				const result = await sysInfo.getSysInfo({ platform: "iOS" });

				assertCommonSysInfo(result);
				assertiOSSysInfo(result);
				// Android specific properties should be undefined
				assert.deepEqual(result.adbVer, undefined);
				assert.deepEqual(result.androidInstalled, undefined);
				assert.deepEqual(result.monoVer, undefined);
				assert.deepEqual(result.gradleVer, undefined);
				assert.deepEqual(result.javacVersion, undefined);
				assert.deepEqual(result.isAndroidSdkConfiguredCorrectly, undefined);
			});
			it("Android platform is specified", async () => {
				sysInfo = mockSysInfo(
					childProcessResult,
					{ isWindows: false, isDarwin: true, dotNetVersion },
					{ existsResult: true },
				);
				const result = await sysInfo.getSysInfo({ platform: "Android" });

				assertCommonSysInfo(result);
				assertAndroidSysInfo(result);
				// iOS specific properties should be undefined
				assert.deepEqual(result.xcodeVer, undefined);
				assert.deepEqual(result.itunesInstalled, undefined);
				assert.deepEqual(result.cocoaPodsVer, undefined);
				assert.deepEqual(result.xcodeprojLocation, undefined);
				assert.deepEqual(result.isCocoaPodsWorkingCorrectly, undefined);
				assert.deepEqual(result.xcprojInfo, undefined);
				assert.deepEqual(result.isCocoaPodsUpdateRequired, undefined);
				assert.deepEqual(result.pythonInfo, undefined);
			});
			it("no platform is specified", async () => {
				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: true,
					dotNetVersion,
				});
				const result = await sysInfo.getSysInfo();
				assertCommonSysInfo(result);
				assertAndroidSysInfo(result);
				assertiOSSysInfo(result);
			});
		});

		describe("getJavaVersion", () => {
			it("parses correctly OpenJDK output", async () => {
				childProcessResult.javaVersion = {
					result: setStdOut(`openjdk version "1.8.0_64"
OpenJDK Runtime Environment (AdoptOpenJDK)(build 1.8.0_64-b08)
OpenJDK 64-Bit Server VM (build 25.202-b08, mixed mode)`),
				};

				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: true,
					dotNetVersion,
				});
				const result = await sysInfo.getJavaVersion();
				assert.equal(result, "1.8.0_64");
			});

			it("parses correctly OpenJDK output", async () => {
				childProcessResult.javaVersion = {
					result: setStdOut(`java version "1.8.0_25"
Java(TM) SE Runtime Environment (build 1.8.0_25-b08)
Java HotSpot(TM) 64-Bit Server VM (build 25.202-b08, mixed mode)`),
				};

				sysInfo = mockSysInfo(childProcessResult, {
					isWindows: false,
					isDarwin: true,
					dotNetVersion,
				});
				const result = await sysInfo.getJavaVersion();
				assert.equal(result, "1.8.0_25");
			});
		});
	});
});
