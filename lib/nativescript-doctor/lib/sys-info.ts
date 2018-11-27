import { ChildProcess } from "./wrappers/child-process";
import { FileSystem } from "./wrappers/file-system";
import { HostInfo } from "./host-info";
import { ExecOptions } from "child_process";
import { WinReg } from "./winreg";
import { Helpers } from "./helpers";
import { platform, EOL } from "os";
import * as path from "path";
import * as osenv from "osenv";
import * as temp from "temp";
import * as semver from "semver";
import { Constants } from "./constants";

export class SysInfo implements NativeScriptDoctor.ISysInfo {
	private static JAVA_COMPILER_VERSION_REGEXP = /^javac (.*)/im;
	private static XCODE_VERSION_REGEXP = /Xcode (.*)/;
	private static VERSION_REGEXP = /(\d{1,})\.(\d{1,})\.*([\w-]{0,})/m;
	private static CLI_OUTPUT_VERSION_REGEXP = /^(?:\d+\.){2}\d+.*?$/m;
	private static GIT_VERSION_REGEXP = /^git version (.*)/;
	private static GRADLE_VERSION_REGEXP = /Gradle (.*)/i;

	private monoVerRegExp = /version (\d+[.]\d+[.]\d+) /gm;

	private javaCompilerVerCache: string;
	private xCodeVerCache: string;
	private npmVerCache: string;
	private nodeVerCache: string;
	private nodeGypVerCache: string;
	private xCodeprojLocationCache: string;
	private iTunesInstalledCache: boolean;
	private cocoaPodsVerCache: string;
	private osCache: string;
	private adbVerCache: string;
	private androidInstalledCache: boolean;
	private monoVerCache: string;
	private gitVerCache: string;
	private gradleVerCache: string;

	private commonSysInfoCache: NativeScriptDoctor.ICommonSysInfoData;
	private androidSysInfoCache: NativeScriptDoctor.IAndroidSysInfoData;
	private iOSSysInfoCache: NativeScriptDoctor.IiOSSysInfoData;

	private isCocoaPodsWorkingCorrectlyCache: boolean;
	private nativeScriptCliVersionCache: string;
	private xcprojInfoCache: NativeScriptDoctor.IXcprojInfo;
	private pythonInfoCache: NativeScriptDoctor.IPythonInfo;
	private isCocoaPodsUpdateRequiredCache: boolean;
	private shouldCache: boolean = true;
	private isAndroidSdkConfiguredCorrectlyCache: boolean;

	constructor(private childProcess: ChildProcess,
		private fileSystem: FileSystem,
		private helpers: Helpers,
		private hostInfo: HostInfo,
		private winReg: WinReg,
		private androidToolsInfo: NativeScriptDoctor.IAndroidToolsInfo) { }

	public getJavaCompilerVersion(): Promise<string> {
		return this.getValueForProperty(() => this.javaCompilerVerCache, async (): Promise<string> => {
			const javaCompileExecutableName = "javac";
			const javaHome = process.env["JAVA_HOME"];
			const pathToJavaCompilerExecutable = javaHome ? path.join(javaHome, "bin", javaCompileExecutableName) : javaCompileExecutableName;
			try {
				const output = await this.childProcess.exec(`"${pathToJavaCompilerExecutable}" -version`);
				return SysInfo.JAVA_COMPILER_VERSION_REGEXP.exec(`${output.stderr}${EOL}${output.stdout}`)[1];
			} catch (err) {
				return null;
			}
		});
	}

	public getXcodeVersion(): Promise<string> {
		return this.getValueForProperty(() => this.xCodeVerCache, async (): Promise<string> => {
			if (this.hostInfo.isDarwin) {
				const output = await this.execCommand("xcodebuild -version");
				const xcodeVersionMatch = output && output.match(SysInfo.XCODE_VERSION_REGEXP);

				if (xcodeVersionMatch) {
					return this.getVersionFromString(output);
				}
			}
		});
	}

	public async getNodeVersion(): Promise<string> {
		return this.getValueForProperty(() => this.nodeVerCache, async (): Promise<string> => {
			const output = await this.execCommand("node -v");
			if (output) {
				const version = this.getVersionFromString(output);
				return version || output;
			}

			return null;
		});
	}

	public getNpmVersion(): Promise<string> {
		return this.getValueForProperty(() => this.npmVerCache, async (): Promise<string> => {
			const output = await this.execCommand("npm -v");
			return output ? output.split("\n")[0] : null;
		});
	}

	public getNodeGypVersion(): Promise<string> {
		return this.getValueForProperty(() => this.nodeGypVerCache, async (): Promise<string> => {
			const output = await this.execCommand("node-gyp -v");
			return output ? this.getVersionFromString(output) : null;
		});
	}

	public getXcodeprojLocation(): Promise<string> {
		return this.getValueForProperty(() => this.xCodeprojLocationCache, async (): Promise<string> => {
			const output = await this.execCommand("which xcodeproj");
			return output ? output.trim() : null;
		});
	}

	public isITunesInstalled(): Promise<boolean> {
		return this.getValueForProperty(() => this.iTunesInstalledCache, async (): Promise<boolean> => {
			if (this.hostInfo.isLinux) {
				return false;
			}

			let coreFoundationDir: string;
			let mobileDeviceDir: string;

			if (this.hostInfo.isWindows) {
				const commonProgramFiles = this.hostInfo.isWindows64 ? process.env["CommonProgramFiles(x86)"] : process.env["CommonProgramFiles"];
				coreFoundationDir = path.join(commonProgramFiles, "Apple", "Apple Application Support");
				mobileDeviceDir = path.join(commonProgramFiles, "Apple", "Mobile Device Support");
			} else if (this.hostInfo.isDarwin) {
				coreFoundationDir = "/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation";
				mobileDeviceDir = "/System/Library/PrivateFrameworks/MobileDevice.framework/MobileDevice";
			}

			return await this.fileSystem.exists(coreFoundationDir) && await this.fileSystem.exists(mobileDeviceDir);
		});
	}

	public getCocoaPodsVersion(): Promise<string> {
		return this.getValueForProperty(() => this.cocoaPodsVerCache, async (): Promise<string> => {
			if (this.hostInfo.isDarwin) {
				if (this.hostInfo.isDarwin) {
					const output = await this.execCommand("pod --version");
					// Output of pod --version could contain some warnings. Find the version in it.
					const cocoaPodsVersionMatch = output && output.match(SysInfo.VERSION_REGEXP);
					if (cocoaPodsVersionMatch && cocoaPodsVersionMatch[0]) {
						return cocoaPodsVersionMatch[0].trim();
					}
				}
			}
		});
	}

	public getOs(): Promise<string> {
		return this.getValueForProperty(() => this.osCache, async (): Promise<string> => {
			return await (this.hostInfo.isWindows ? this.winVer() : this.unixVer());
		});
	}

	public getAdbVersion(pathToAdb?: string): Promise<string> {
		return this.getValueForProperty(() => this.adbVerCache, async (): Promise<string> => {
			let output: IProcessInfo = null;

			pathToAdb = pathToAdb || await this.androidToolsInfo.getPathToAdbFromAndroidHome();
			if (pathToAdb) {
				output = await this.childProcess.spawnFromEvent(pathToAdb, ["version"], "close", <any>{ ignoreError: true });
			}

			return output && output.stdout ? this.getVersionFromString(output.stdout) : null;
		});
	}

	public isAndroidInstalled(): Promise<boolean> {
		return this.getValueForProperty(() => this.androidInstalledCache, async (): Promise<boolean> => {
			try {
				const errors = this.androidToolsInfo.validateAndroidHomeEnvVariable();
				return errors.length === 0;
			} catch (err) {
				return false;
			}
		});
	}

	public async isAndroidSdkConfiguredCorrectly(): Promise<boolean> {
		return this.getValueForProperty(() => this.isAndroidSdkConfiguredCorrectlyCache, async (): Promise<boolean> => {
			const output = await this.childProcess.spawnFromEvent(this.androidToolsInfo.getPathToEmulatorExecutable(), ["-help"], "close", <any>{ ignoreError: true });

			return output && output.stdout.indexOf("usage: emulator") >= 0;
		});
	}

	public getMonoVersion(): Promise<string> {
		return this.getValueForProperty(() => this.monoVerCache, async (): Promise<string> => {
			const output = await this.execCommand("mono --version");
			const match = this.monoVerRegExp.exec(output);
			return match ? match[1] : null;
		});
	}

	public getGitVersion(): Promise<string> {
		return this.getValueForProperty(() => this.gitVerCache, async (): Promise<string> => {
			const gitPath = await this.getGitPath();
			if (!gitPath) {
				return null;
			}

			const output = await this.execCommand(`${this.helpers.quoteString(gitPath)} --version`);
			const matches = SysInfo.GIT_VERSION_REGEXP.exec(output);
			return matches && matches[1];
		});
	}

	public getGradleVersion(): Promise<string> {
		return this.getValueForProperty(() => this.gradleVerCache, async (): Promise<string> => {
			const output = await this.execCommand("gradle -v");
			const matches = SysInfo.GRADLE_VERSION_REGEXP.exec(output);

			return matches && matches[1];
		});
	}

	public async getSysInfo(config?: NativeScriptDoctor.ISysInfoConfig): Promise<NativeScriptDoctor.ISysInfoData> {
		if (config && config.platform && config.platform.toLowerCase() === Constants.ANDROID_PLATFORM_NAME.toLowerCase()) {
			return <NativeScriptDoctor.ISysInfoData>Object.assign(await this.getCommonSysInfo(), await this.getAndroidSysInfo(config));
		}

		if (config && config.platform && config.platform.toLowerCase() === Constants.IOS_PLATFORM_NAME.toLowerCase()) {
			return <NativeScriptDoctor.ISysInfoData>Object.assign(await this.getCommonSysInfo(), await this.getiOSSysInfo());
		}

		return Object.assign(await this.getCommonSysInfo(), await this.getAndroidSysInfo(), await this.getiOSSysInfo());
	}

	public isCocoaPodsWorkingCorrectly(): Promise<boolean> {
		return this.getValueForProperty(() => this.isCocoaPodsWorkingCorrectlyCache, async (): Promise<boolean> => {
			if (this.hostInfo.isDarwin) {
				if (!this.fileSystem.exists(path.join(osenv.home(), ".cocoapods"))) {
					return true;
				}
				temp.track();
				const tempDirectory = temp.mkdirSync("nativescript-check-cocoapods");
				const pathToXCodeProjectZip = path.join(__dirname, "..", "resources", "cocoapods-verification", "cocoapods.zip");

				await this.fileSystem.extractZip(pathToXCodeProjectZip, tempDirectory);

				const xcodeProjectDir = path.join(tempDirectory, "cocoapods");

				try {
					const spawnResult = await this.childProcess.spawnFromEvent("pod", ["install"], "exit", <any>{ spawnOptions: { cwd: xcodeProjectDir } });
					if (spawnResult.exitCode) {
						return false;
					} else {
						return this.fileSystem.exists(path.join(xcodeProjectDir, "cocoapods.xcworkspace"));
					}
				} catch (err) {
					return null;
				}
			} else {
				return false;
			}
		});
	}

	public getNativeScriptCliVersion(): Promise<string> {
		return this.getValueForProperty(() => this.nativeScriptCliVersionCache, async (): Promise<string> => {
			const output = await this.execCommand("tns --version");
			return output ? this.getVersionFromCLIOutput(output.trim()) : output;
		});
	}

	public getXcprojInfo(): Promise<NativeScriptDoctor.IXcprojInfo> {
		return this.getValueForProperty(() => this.xcprojInfoCache, async (): Promise<NativeScriptDoctor.IXcprojInfo> => {
			const cocoaPodsVersion = await this.getCocoaPodsVersion();
			let xcodeVersion = await this.getXcodeVersion();
			if (xcodeVersion) {
				xcodeVersion = this.helpers.appendZeroesToVersion(xcodeVersion, 3);
			}

			// CocoaPods with version lower than 1.0.0 don't support Xcode 7.3 yet
			// https://github.com/CocoaPods/CocoaPods/issues/2530#issuecomment-210470123
			// as a result of this all .pbxprojects touched by CocoaPods get converted to XML plist format
			const shouldUseXcproj = cocoaPodsVersion && !!(semver.lt(cocoaPodsVersion, "1.0.0") && semver.gte(xcodeVersion, "7.3.0"));
			let xcprojAvailable: boolean;

			if (shouldUseXcproj) {
				// If that's the case we can use xcproj gem to convert them back to ASCII plist format
				xcprojAvailable = !!(await this.exec("xcproj --version"));
			}

			return { shouldUseXcproj, xcprojAvailable };
		});
	}

	public getPythonInfo(): Promise<NativeScriptDoctor.IPythonInfo> {
		return this.getValueForProperty(() => this.pythonInfoCache, async (): Promise<NativeScriptDoctor.IPythonInfo> => {
			if (this.hostInfo.isDarwin) {
				try {
					await this.childProcess.exec(`python -c "import six"`);
				} catch (error) {
					// error.code = 1 so the Python is present, but we don't have six.
					if (error.code === 1) {
						return { isInstalled: true, isSixPackageInstalled: false };
					}

					return { isInstalled: false, isSixPackageInstalled: false, installationErrorMessage: error.message };
				}

				return { isInstalled: true, isSixPackageInstalled: true };
			}

			return null;
		});
	}

	public isCocoaPodsUpdateRequired(): Promise<boolean> {
		return this.getValueForProperty(() => this.isCocoaPodsUpdateRequiredCache, async (): Promise<boolean> => {
			const xcprojInfo = await this.getXcprojInfo();
			if (xcprojInfo.shouldUseXcproj && !xcprojInfo.xcprojAvailable) {
				return true;
			} else {
				return false;
			}
		});
	}

	public setShouldCacheSysInfo(shouldCache: boolean): void {
		this.shouldCache = shouldCache;
	}

	public getGitPath(): Promise<string> {
		return this.hostInfo.isWindows ? this.findGitWin32() : this.findGitUnix();
	}

	private async findGitWin32(): Promise<string> {
		let result: string;
		const win32Paths = [process.env["ProgramFiles"], process.env["ProgramFiles(x86)"]];
		for (const win32Path of win32Paths) {
			result = this.findSystemGitWin32(win32Path);
			if (result) {
				return result;
			}
		}

		result = this.findGitHubGitWin32();
		return result ? result : await this.findGitCore("where");
	}

	private findSystemGitWin32(base: string): string {
		if (!base) {
			return null;
		}

		return this.findSpecificGit(path.join(base, "Git", "cmd", "git.exe"));
	}

	private findGitHubGitWin32(): string {
		const github = path.join(process.env["LOCALAPPDATA"], "GitHub");
		if (!this.fileSystem.exists(github)) {
			return null;
		}

		const children = this.fileSystem.readDirectory(github);
		const git = children.filter(child => /^PortableGit/.test(child))[0];
		if (!this.fileSystem.exists(git)) {
			return null;
		}

		return this.findSpecificGit(path.join(github, git, "cmd", "git.exe"));
	}

	private findSpecificGit(gitPath: string): string {
		return this.fileSystem.exists(gitPath) ? gitPath : null;
	}

	private async findGitUnix(): Promise<string> {
		return await this.findGitCore("which");
	}

	private async findGitCore(command: string, options?: any): Promise<string> {
		const result = await this.execCommand(`${command} git`);

		return result && result.split("\n")[0].trim();
	}

	private async getValueForProperty<T>(property: Function, getValueMethod: () => Promise<T>): Promise<T> {
		if (this.shouldCache) {
			const propertyName = this.helpers.getPropertyName(property);
			const cachedValue: T = (<any>this)[propertyName];

			if (cachedValue === undefined) {
				const result = await getValueMethod();
				(<any>this)[propertyName] = result;
				return result;
			} else {
				return cachedValue;
			}
		} else {
			return await getValueMethod();
		}
	}

	private async exec(cmd: string, execOptions?: ExecOptions): Promise<IProcessInfo> {
		if (cmd) {
			try {
				return await this.childProcess.exec(cmd, execOptions);
			} catch (err) {
				return null;
			}
		}

		return null;
	}

	private async execCommand(cmd: string, execOptions?: ExecOptions): Promise<string> {
		const output = await this.exec(cmd, execOptions);
		return output && output.stdout;
	}

	private getVersionFromString(versionString: string): string {
		const matches = versionString.match(SysInfo.VERSION_REGEXP);
		if (matches) {
			return `${matches[1]}.${matches[2]}.${matches[3] || 0}`;
		}

		return null;
	}

	private getVersionFromCLIOutput(commandOutput: string): string {
		const matches = commandOutput.match(SysInfo.CLI_OUTPUT_VERSION_REGEXP);
		return matches && matches[0];
	}

	private async winVer(): Promise<string> {
		let productName: string;
		let currentVersion: string;
		let currentBuild: string;
		const hive = this.winReg.registryKeys.HKLM;
		const key = "\\Software\\Microsoft\\Windows NT\\CurrentVersion";

		productName = await this.winReg.getRegistryValue("ProductName", hive, key);
		currentVersion = await this.winReg.getRegistryValue("CurrentVersion", hive, key);
		currentBuild = await this.winReg.getRegistryValue("CurrentBuild", hive, key);

		return `${productName} ${currentVersion}.${currentBuild}`;
	}

	private unixVer(): Promise<string> {
		return this.execCommand("uname -a");
	}

	private getCommonSysInfo(): Promise<NativeScriptDoctor.ICommonSysInfoData> {
		return this.getValueForProperty(() => this.commonSysInfoCache, async (): Promise<NativeScriptDoctor.ICommonSysInfoData> => {
			const result: NativeScriptDoctor.ICommonSysInfoData = Object.create(null);

			// os stuff
			result.platform = platform();
			result.shell = osenv.shell();
			result.os = await this.getOs();
			result.procArch = process.arch;
			result.nodeVer = await this.getNodeVersion();
			result.npmVer = await this.getNpmVersion();
			result.nodeGypVer = await this.getNodeGypVersion();
			result.nativeScriptCliVersion = await this.getNativeScriptCliVersion();
			result.gitVer = await this.getGitVersion();

			return result;
		});
	}

	private async getiOSSysInfo(): Promise<NativeScriptDoctor.IiOSSysInfoData> {
		return this.getValueForProperty(() => this.iOSSysInfoCache, async (): Promise<NativeScriptDoctor.IiOSSysInfoData> => {
			const result: NativeScriptDoctor.IiOSSysInfoData = Object.create(null);

			result.xcodeVer = await this.getXcodeVersion();
			result.xcodeprojLocation = await this.getXcodeprojLocation();
			result.itunesInstalled = await this.isITunesInstalled();
			result.cocoaPodsVer = await this.getCocoaPodsVersion();
			result.isCocoaPodsWorkingCorrectly = await this.isCocoaPodsWorkingCorrectly();
			result.isCocoaPodsUpdateRequired = await this.isCocoaPodsUpdateRequired();
			result.pythonInfo = await this.getPythonInfo();

			return result;
		});
	}

	private async getAndroidSysInfo(config?: NativeScriptDoctor.ISysInfoConfig): Promise<NativeScriptDoctor.IAndroidSysInfoData> {
		return this.getValueForProperty(() => this.androidSysInfoCache, async (): Promise<NativeScriptDoctor.IAndroidSysInfoData> => {
			const result: NativeScriptDoctor.IAndroidSysInfoData = Object.create(null);

			result.dotNetVer = await this.hostInfo.dotNetVersion();
			result.javacVersion = await this.getJavaCompilerVersion();
			result.adbVer = await this.getAdbVersion(config && config.androidToolsInfo && config.androidToolsInfo.pathToAdb);
			result.androidInstalled = await this.isAndroidInstalled();
			result.monoVer = await this.getMonoVersion();
			result.gradleVer = await this.getGradleVersion();
			result.isAndroidSdkConfiguredCorrectly = await this.isAndroidSdkConfiguredCorrectly();

			return result;
		});
	}
}
