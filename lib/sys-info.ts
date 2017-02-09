import { ChildProcess } from "./wrappers/child-process";
import { FileSystem } from "./wrappers/file-system";
import { HostInfo } from "./host-info";
import { ExecOptions } from "child_process";
import { WinReg } from "./winreg";
import { Helpers } from "./helpers";
import { platform } from "os";
import { ISysInfoData } from "../typings/nativescript-doctor";
import * as path from "path";
import * as osenv from "osenv";
import * as temp from "temp";

export class SysInfo {
	// Different java has different format for `java -version` command.
	private static JAVA_VERSION_REGEXP = /(?:openjdk|java) version \"((?:\d+\.)+(?:\d+))/i;

	private static JAVA_COMPILER_VERSION_REGEXP = /^javac (.*)/im;
	private static XCODE_VERSION_REGEXP = /Xcode (.*)/;
	private static VERSION_REGEXP = /(\d{1,})\.(\d{1,})\.*([\w-]{0,})/m;
	private static GIT_VERSION_REGEXP = /^git version (.*)/;
	private static GRADLE_VERSION_REGEXP = /Gradle (.*)/i;

	private monoVerRegExp = /version (\d+[.]\d+[.]\d+) /gm;

	private javaVerCache: string;
	private javaCompilerVerCache: string;
	private xCodeVerCache: string;
	private npmVerCache: string;
	private nodeGypVerCache: string;
	private xCodeprojGemLocationCache: string;
	private iTunesInstalledCache: boolean = null;
	private cocoaPodsVerCache: string;
	private osCache: string;
	private adbVerCache: string;
	private androidInstalledCache: boolean = null;
	private monoVerCache: string;
	private gitVerCache: string;
	private gradleVerCache: string;
	private sysInfoCache: ISysInfoData;
	private isCocoaPodsWorkingCorrectlyCache: boolean = null;
	private nativeScriptCliVersion: string;

	constructor(private childProcess: ChildProcess,
		private fileSystem: FileSystem,
		private helpers: Helpers,
		private hostInfo: HostInfo,
		private winreg: WinReg) { }

	public async getJavaVersion(): Promise<string> {
		if (!this.javaVerCache) {
			try {
				const spawnResult = await this.childProcess.spawnFromEvent("java", ["-version"], "exit");
				const matches = spawnResult && SysInfo.JAVA_VERSION_REGEXP.exec(spawnResult.stderr);
				this.javaVerCache = matches && matches[1];
			} catch (err) {
				this.javaVerCache = null;
			}
		}

		return this.javaVerCache;
	}

	public async getJavaCompilerVersion(): Promise<string> {
		if (!this.javaCompilerVerCache) {
			const javaCompileExecutableName = "javac";
			const javaHome = process.env.JAVA_HOME;
			const pathToJavaCompilerExecutable = javaHome ? path.join(javaHome, "bin", javaCompileExecutableName) : javaCompileExecutableName;
			try {
				const output = await this.childProcess.exec(`"${pathToJavaCompilerExecutable}" -version`);
				this.javaCompilerVerCache = SysInfo.JAVA_COMPILER_VERSION_REGEXP.exec(output.stderr)[1];
			} catch (err) {
				this.javaCompilerVerCache = null;
			}
		}

		return this.javaCompilerVerCache;
	}

	public async getXcodeVersion(): Promise<string> {
		if (!this.xCodeVerCache && this.hostInfo.isDarwin) {
			const output = await this.execCommand("xcodebuild -version");
			const xcodeVersionMatch = output && output.match(SysInfo.XCODE_VERSION_REGEXP);

			if (xcodeVersionMatch) {
				this.xCodeVerCache = this.getVersionFromString(output);
			}
		}

		return this.xCodeVerCache;
	}

	public async getNodeVersion(): Promise<string> {
		return this.getVersionFromString(process.version);
	}

	public async getNpmVersion(): Promise<string> {
		if (!this.npmVerCache) {
			const output = await this.execCommand("npm -v");
			this.npmVerCache = output ? output.split("\n")[0] : null;
		}

		return this.npmVerCache;
	}

	public async getNodeGypVersion(): Promise<string> {
		if (!this.nodeGypVerCache) {
			const output = await this.execCommand("node-gyp -v");
			this.nodeGypVerCache = output ? this.getVersionFromString(output) : null;
		}

		return this.nodeGypVerCache;
	}

	public async getXcodeprojGemLocation(): Promise<string> {
		if (!this.xCodeprojGemLocationCache && this.hostInfo.isDarwin) {
			const output = await this.execCommand("gem which xcodeproj");
			this.xCodeprojGemLocationCache = output ? output.trim() : null;
		}

		return this.xCodeprojGemLocationCache;
	}

	public async isITunesInstalled(): Promise<boolean> {
		if (this.iTunesInstalledCache === null && !this.hostInfo.isLinux) {
			let coreFoundationDir: string;
			let mobileDeviceDir: string;

			if (this.hostInfo.isWindows) {
				const commonProgramFiles = this.hostInfo.isWindows64 ? process.env["CommonProgramFiles(x86)"] : process.env.CommonProgramFiles;
				coreFoundationDir = path.join(commonProgramFiles, "Apple", "Apple Application Support");
				mobileDeviceDir = path.join(commonProgramFiles, "Apple", "Mobile Device Support");
			} else if (this.hostInfo.isDarwin) {
				coreFoundationDir = "/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation";
				mobileDeviceDir = "/System/Library/PrivateFrameworks/MobileDevice.framework/MobileDevice";
			}

			this.iTunesInstalledCache = await this.fileSystem.exists(coreFoundationDir) && await this.fileSystem.exists(mobileDeviceDir);
		}

		return !!this.iTunesInstalledCache;
	}

	public async getCocoaPodsVersion(): Promise<string> {
		if (!this.cocoaPodsVerCache && this.hostInfo.isDarwin) {
			if (this.hostInfo.isDarwin) {
				const output = await this.execCommand("pod --version");
				// Output of pod --version could contain some warnings. Find the version in it.
				const cocoaPodsVersionMatch = output && output.match(SysInfo.VERSION_REGEXP);
				if (cocoaPodsVersionMatch && cocoaPodsVersionMatch[0]) {
					this.cocoaPodsVerCache = cocoaPodsVersionMatch[0].trim();
				}
			}
		}

		return this.cocoaPodsVerCache;
	}

	public async getOs(): Promise<string> {
		if (!this.osCache) {
			this.osCache = await (this.hostInfo.isWindows ? this.winVer() : this.unixVer());
		}

		return this.osCache;
	}

	public async getAdbVersion(): Promise<string> {
		if (!this.adbVerCache) {
			const output = await this.execCommand("adb version");
			this.adbVerCache = output ? this.getVersionFromString(output) : null;
		}

		return this.adbVerCache;
	}

	// `android -h` returns exit code 1 on successful invocation (Mac OS X for now, possibly Linux).
	public async isAndroidInstalled(): Promise<boolean> {
		if (this.androidInstalledCache === null) {
			let pathToAndroid = "android";
			if (this.hostInfo.isWindows) {
				pathToAndroid = `${pathToAndroid}.bat`;
			}

			try {
				const output = await this.childProcess.spawnFromEvent(pathToAndroid, ["-h"], "close");
				if (output) {
					output.stdout = output.stdout || '';
					this.androidInstalledCache = output.stdout.indexOf("android") >= 0;
				}
			} catch (err) {
				this.androidInstalledCache = null;
			}
		}

		return !!this.androidInstalledCache;
	}

	public async getMonoVersion(): Promise<string> {
		if (!this.monoVerCache) {
			const output = await this.execCommand("mono --version");
			const match = this.monoVerRegExp.exec(output);
			this.monoVerCache = match ? match[1] : null;
		}

		return this.monoVerCache;
	}

	public async getGitVersion(): Promise<string> {
		if (!this.gitVerCache) {
			const output = await this.execCommand("git --version");
			const matches = SysInfo.GIT_VERSION_REGEXP.exec(output);
			this.gitVerCache = matches && matches[1];
		}

		return this.gitVerCache;
	}

	public async getGradleVersion(): Promise<string> {
		if (!this.gradleVerCache) {
			const output = await this.execCommand("gradle -v");
			const matches = SysInfo.GRADLE_VERSION_REGEXP.exec(output);

			this.gradleVerCache = matches && matches[1];
		}

		return this.gradleVerCache;
	}

	public async getSysInfo(): Promise<ISysInfoData> {
		if (!this.sysInfoCache) {
			const result: ISysInfoData = Object.create(null);

			// os stuff
			result.platform = platform();
			result.shell = osenv.shell();
			result.os = await this.getOs();

			// node stuff
			result.procArch = process.arch;
			result.nodeVer = await this.getNodeVersion();
			result.npmVer = await this.getNpmVersion();
			result.nodeGypVer = await this.getNodeGypVersion();

			result.dotNetVer = await this.hostInfo.dotNetVersion();
			result.javaVer = await this.getJavaVersion();
			result.javacVersion = await this.getJavaCompilerVersion();
			result.xcodeVer = await this.getXcodeVersion();
			result.xcodeprojGemLocation = await this.getXcodeprojGemLocation();
			result.itunesInstalled = await this.isITunesInstalled();
			result.cocoaPodsVer = await this.getCocoaPodsVersion();
			result.adbVer = await this.getAdbVersion();
			result.androidInstalled = await this.isAndroidInstalled();
			result.monoVer = await this.getMonoVersion();
			result.gitVer = await this.getGitVersion();
			result.gradleVer = await this.getGradleVersion();
			result.isCocoaPodsWorkingCorrectly = await this.isCocoaPodsWorkingCorrectly();
			result.nativeScriptCliVersion = await this.getNativeScriptCliVersion();

			this.sysInfoCache = result;
		}

		return this.sysInfoCache;
	}

	public async isCocoaPodsWorkingCorrectly(): Promise<boolean> {
		if (this.isCocoaPodsWorkingCorrectlyCache === null && this.hostInfo.isDarwin) {
			temp.track();
			const tempDirectory = temp.mkdirSync("nativescript-check-cocoapods");
			const pathToXCodeProjectZip = path.join(__dirname, "..", "resources", "cocoapods-verification", "cocoapods.zip");

			await this.fileSystem.extractZip(pathToXCodeProjectZip, tempDirectory);

			const xcodeProjectDir = path.join(tempDirectory, "cocoapods");

			try {
				let spawnResult = await this.childProcess.spawnFromEvent("pod", ["install"], "exit", { spawnOptions: { cwd: xcodeProjectDir } });
				if (spawnResult.exitCode) {
					this.isCocoaPodsWorkingCorrectlyCache = false;
				} else {
					this.isCocoaPodsWorkingCorrectlyCache = await this.fileSystem.exists(path.join(xcodeProjectDir, "cocoapods.xcworkspace"));
				}
			} catch (err) {
				this.isCocoaPodsWorkingCorrectlyCache = null;
			}
		}

		return !!this.isCocoaPodsWorkingCorrectlyCache;
	}

	public async getNativeScriptCliVersion(): Promise<string> {
		if (!this.nativeScriptCliVersion) {
			const output = await this.execCommand("tns --version");
			this.nativeScriptCliVersion = output.trim();
		}

		return this.nativeScriptCliVersion;
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

	private async winVer(): Promise<string> {
		let productName: string;
		let currentVersion: string;
		let currentBuild: string;
		const hive = this.winreg.registryKeys.HKLM;
		const key = "\\Software\\Microsoft\\Windows NT\\CurrentVersion";

		productName = await this.winreg.getRegistryValue("ProductName", hive, key);
		currentVersion = await this.winreg.getRegistryValue("CurrentVersion", hive, key);
		currentBuild = await this.winreg.getRegistryValue("CurrentBuild", hive, key);

		return `${productName} ${currentVersion}.${currentBuild}`;
	}

	private unixVer(): Promise<string> {
		return this.execCommand("uname -a");
	}
}
