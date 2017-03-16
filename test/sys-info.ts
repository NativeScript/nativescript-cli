import * as assert from "assert";
import * as path from "path";
import { SysInfo } from "../lib/sys-info";
import { Helpers } from "../lib/helpers";
import { ChildProcess } from "../lib/wrappers/child-process";

const JavaHomeName = "JAVA_HOME";
const AndroidHomeName = "ANDROID_HOME";
const helpers = new Helpers();

interface IChildProcessResultDescription {
	result?: any;
	shouldThrowError?: boolean;
}

interface IChildProcessResults {
	uname: IChildProcessResultDescription;
	npmV: IChildProcessResultDescription;
	javaVersion: IChildProcessResultDescription;
	javacVersion: IChildProcessResultDescription;
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
	}
};

function createChildProcessResults(childProcessResult: IChildProcessResults): IDictionary<IChildProcessResultDescription> {
	return {
		"uname -a": childProcessResult.uname,
		"npm -v": childProcessResult.npmV,
		"java": childProcessResult.javaVersion,
		'"javac" -version': childProcessResult.javacVersion,
		"node-gyp -v": childProcessResult.nodeGypVersion,
		"xcodebuild -version": childProcessResult.xCodeVersion,
		"pod --version": childProcessResult.podVersion,
		"pod": childProcessResult.pod,
		'adb version': childProcessResult.adbVersion,
		"'adb' version": childProcessResult.adbVersion, // for Mac and Linux
		'android': childProcessResult.androidInstalled,
		'android.bat': childProcessResult.androidInstalled, // for Windows
		"mono --version": childProcessResult.monoVersion,
		"git --version": childProcessResult.gitVersion,
		"gradle -v": childProcessResult.gradleVersion,
		"tns --version": childProcessResult.nativeScriptCliVersion,
		"emulator": { shouldThrowError: false }
	};
}

function getResultFromChildProcess(childProcessResultDescription: IChildProcessResultDescription, command: string): any {
	if (childProcessResultDescription.shouldThrowError) {
		throw new Error(`This one throws error. (${command})`);
	}

	return childProcessResultDescription.result;
}

function mockSysInfo(childProcessResult: IChildProcessResults, hostInfoOptions?: IHostInfoMockOptions, fileSystemOptions?: IFileSystemMockOptions): SysInfo {
	hostInfoOptions = hostInfoOptions || {};
	const winreg: any = {
		getRegistryValue: (valueName: string, hive?: IHiveId, key?: string, host?: string) => { return { value: "registryKey" }; },
		registryKeys: {
			HKLM: "HKLM"
		}
	};
	const hostInfo: any = {
		dotNetVersion: () => Promise.resolve(hostInfoOptions.dotNetVersion),
		isDarwin: hostInfoOptions.isDarwin,
		isWindows: hostInfoOptions.isWindows,
		isLinux: (!hostInfoOptions.isDarwin && !hostInfoOptions.isWindows),
		winreg
	};
	const childProcessResultDictionary = createChildProcessResults(childProcessResult);
	const childProcess = {
		exec: async (command: string) => {
			return getResultFromChildProcess(childProcessResultDictionary[command], command);
		},
		spawnFromEvent: async (command: string, args: string[], event: string) => {
			return getResultFromChildProcess(childProcessResultDictionary[command], command);
		},
		execFile: async () => {
			return undefined;
		}
	};

	const fileSystem: any = {
		exists: () => Promise.resolve((fileSystemOptions || {}).existsResult),
		extractZip: () => Promise.resolve()
	};

	return new SysInfo(childProcess, fileSystem, helpers, hostInfo, winreg, androidToolsInfo);
}

function setStdOut(value: string): { stdout: string } {
	return { stdout: value };
}
function setStdErr(value: string): { stderr: string } {
	return { stderr: value };
}

describe("SysInfo unit tests", () => {
	let sysInfo: SysInfo;

	beforeEach(() => {
		// We need to mock this because on Mac the tests in which the platform is mocked to Windows in the process there will be no CommonProgramFiles.
		process.env.CommonProgramFiles = process.env.CommonProgramFiles || "mocked on mac";
		process.env["CommonProgramFiles(x86)"] = process.env["CommonProgramFiles(x86)"] || "mocked on mac";
	});

	describe("Should execute correct commands to check for", () => {
		let spawnFromEventCommand: string;
		let execCommand: string;

		beforeEach(() => {
			const childProcess: ChildProcess = {
				spawnFromEvent: async (command: string, args: string[], event: string) => {
					spawnFromEventCommand = `${command} ${args.join(" ")}`;
					return { stdout: "", stderr: "" };
				},
				exec: async (command: string) => {
					execCommand = command;
					return { stdout: "", stderr: "" };
				},
				execFile: async () => {
					return undefined;
				}
			};

			sysInfo = new SysInfo(childProcess, null, helpers, null, null, androidToolsInfo);
		});

		it("java version.", async () => {
			await sysInfo.getJavaVersion();
			assert.deepEqual(spawnFromEventCommand, "java -version");
		});

		it("java compiler version when there is JAVA_HOME.", async () => {
			const originalJavaHome = process.env[JavaHomeName];
			process.env[JavaHomeName] = "mock";

			const pathToJavac = path.join(process.env[JavaHomeName], "bin", "javac");
			await sysInfo.getJavaCompilerVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommand, `"${pathToJavac}" -version`);
		});

		it("java compiler version when there is no JAVA_HOME.", async () => {
			const originalJavaHome = process.env[JavaHomeName];

			delete process.env[JavaHomeName];

			await sysInfo.getJavaCompilerVersion();

			process.env[JavaHomeName] = originalJavaHome;
			assert.deepEqual(execCommand, `"javac" -version`);
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
				javaVersion: { result: setStdErr('java version "1.8.0_60"') },
				javacVersion: { result: setStdErr("javac 1.8.0_60") },
				nodeGypVersion: { result: setStdOut("2.0.0") },
				xCodeVersion: { result: setStdOut("Xcode 6.4.0") },
				adbVersion: { result: setStdOut("Android Debug Bridge version 1.0.32") },
				androidInstalled: { result: setStdOut("android") },
				monoVersion: { result: setStdOut("version 1.0.6 ") },
				gradleVersion: { result: setStdOut("Gradle 2.8") },
				gitVersion: { result: setStdOut("git version 1.9.5") },
				podVersion: { result: setStdOut("0.38.2") },
				pod: { result: setStdOut("success") },
				nativeScriptCliVersion: { result: setStdOut("2.5.0") }
			};

			delete process.env[JavaHomeName];
			delete process.env[AndroidHomeName];
		});

		afterEach(() => {
			process.env[JavaHomeName] = originalJavaHome;
			process.env[AndroidHomeName] = originalAndroidHome;
		});

		describe("returns correct results when everything is installed", () => {
			let assertCommonValues = (result: NativeScriptDoctor.ISysInfoData) => {
				assert.deepEqual(result.npmVer, childProcessResult.npmV.result.stdout);
				assert.deepEqual(result.javaVer, "1.8.0");
				assert.deepEqual(result.javacVersion, "1.8.0_60");
				assert.deepEqual(result.nodeGypVer, childProcessResult.nodeGypVersion.result.stdout);
				assert.deepEqual(result.adbVer, "1.0.32");
				assert.deepEqual(result.androidInstalled, true);
				assert.deepEqual(result.monoVer, "1.0.6");
				assert.deepEqual(result.gradleVer, "2.8");
				assert.deepEqual(result.gitVer, "1.9.5");
				assert.deepEqual(result.nativeScriptCliVersion, childProcessResult.nativeScriptCliVersion.result.stdout);
			};

			beforeEach(() => {
				androidToolsInfo.validateAndroidHomeEnvVariable = (): any[] => [];
			});

			it("on Windows", async () => {
				sysInfo = mockSysInfo(childProcessResult, { isWindows: true, isDarwin: false, dotNetVersion: "4.5.1" });
				let result = await sysInfo.getSysInfo();
				assertCommonValues(result);
				assert.deepEqual(result.xcodeVer, null);
				assert.deepEqual(result.cocoaPodsVer, null);
			});

			it("on Mac", async () => {
				sysInfo = mockSysInfo(childProcessResult, { isWindows: false, isDarwin: true, dotNetVersion: "4.5.1" });
				let result = await sysInfo.getSysInfo();
				assertCommonValues(result);
				assert.deepEqual(result.xcodeVer, "6.4.0");
				assert.deepEqual(result.cocoaPodsVer, childProcessResult.podVersion.result.stdout);
			});

			it("on Linux", async () => {
				sysInfo = mockSysInfo(childProcessResult, { isWindows: false, isDarwin: false, dotNetVersion: "4.5.1" });
				let result = await sysInfo.getSysInfo();
				assertCommonValues(result);
				assert.deepEqual(result.xcodeVer, null);
				assert.deepEqual(result.cocoaPodsVer, null);
			});
		});

		describe("cocoapods version", () => {
			it("is null when cocoapods are not installed", async () => {
				// simulate error when pod --version command is executed
				childProcessResult.podVersion = { shouldThrowError: true };
				sysInfo = mockSysInfo(childProcessResult, { isWindows: false, isDarwin: true, dotNetVersion: "4.5.1" });
				let result = await sysInfo.getSysInfo();
				assert.deepEqual(result.cocoaPodsVer, null);
			});

			it("is null when OS is not Mac", async () => {
				sysInfo = mockSysInfo(childProcessResult, { isWindows: true, isDarwin: false, dotNetVersion: "4.5.1" });
				let result = await sysInfo.getSysInfo();
				assert.deepEqual(result.cocoaPodsVer, null);
			});

			it("is correct when cocoapods output has warning after version output", async () => {
				childProcessResult.podVersion = { result: setStdOut("0.38.2\nWARNING:\n") };
				sysInfo = mockSysInfo(childProcessResult, { isWindows: false, isDarwin: true, dotNetVersion: "4.5.1" });
				let result = await sysInfo.getSysInfo();
				assert.deepEqual(result.cocoaPodsVer, "0.38.2");
			});

			it("is correct when cocoapods output has warnings before version output", async () => {
				childProcessResult.podVersion = { result: setStdOut("WARNING\nWARNING2\n0.38.2") };
				sysInfo = mockSysInfo(childProcessResult, { isWindows: false, isDarwin: true, dotNetVersion: "4.5.1" });
				let result = await sysInfo.getSysInfo();
				assert.deepEqual(result.cocoaPodsVer, "0.38.2");
			});
		});

		describe("returns correct results when exceptions are raised during sysInfo data collection", () => {
			beforeEach(() => {
				childProcessResult = {
					uname: { shouldThrowError: true },
					npmV: { shouldThrowError: true },
					javaVersion: { shouldThrowError: true },
					javacVersion: { shouldThrowError: true },
					nodeGypVersion: { shouldThrowError: true },
					xCodeVersion: { shouldThrowError: true },
					adbVersion: { shouldThrowError: true },
					androidInstalled: { shouldThrowError: true },
					monoVersion: { shouldThrowError: true },
					gradleVersion: { shouldThrowError: true },
					gitVersion: { shouldThrowError: true },
					podVersion: { shouldThrowError: true },
					pod: { shouldThrowError: true },
					nativeScriptCliVersion: { shouldThrowError: true }
				};
				androidToolsInfo.validateAndroidHomeEnvVariable = (): any[] => [1];
			});

			describe("when all of calls throw", () => {
				let assertAllValuesAreNull = async () => {
					let result = await sysInfo.getSysInfo();
					assert.deepEqual(result.npmVer, null);
					assert.deepEqual(result.javaVer, null);
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
					sysInfo = mockSysInfo(childProcessResult, { isWindows: true, isDarwin: false, dotNetVersion: "4.5.1" });
					await assertAllValuesAreNull();
				});

				it("on Mac", async () => {
					sysInfo = mockSysInfo(childProcessResult, { isWindows: false, isDarwin: true, dotNetVersion: "4.5.1" });
					await assertAllValuesAreNull();
				});

				it("on Linux", async () => {
					sysInfo = mockSysInfo(childProcessResult, { isWindows: false, isDarwin: false, dotNetVersion: "4.5.1" });
					await assertAllValuesAreNull();
				});
			});
		});
	});
});
