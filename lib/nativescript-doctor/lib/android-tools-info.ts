import { ChildProcess } from "./wrappers/child-process";
import { FileSystem } from "./wrappers/file-system";
import { HostInfo } from "./host-info";
import { Constants } from "./constants";
import { Helpers } from './helpers';
import { EOL } from "os";
import * as semver from "semver";
import * as path from "path";

export class AndroidToolsInfo implements NativeScriptDoctor.IAndroidToolsInfo {
	private static ANDROID_TARGET_PREFIX = "android";
	private static SUPPORTED_TARGETS = [
		"android-17",
		"android-18",
		"android-19",
		"android-21",
		"android-22",
		"android-23",
		"android-24",
		"android-25",
		"android-26",
		"android-27",
		"android-28",
	];
	private static MIN_REQUIRED_COMPILE_TARGET = 28;
	private static REQUIRED_BUILD_TOOLS_RANGE_PREFIX = ">=23";
	private static VERSION_REGEX = /((\d+\.){2}\d+)/;
	private static MIN_JAVA_VERSION = "1.8.0";

	private toolsInfo: NativeScriptDoctor.IAndroidToolsInfoData;
	private androidHome = process.env["ANDROID_HOME"];
	private pathToEmulatorExecutable: string;

	constructor(private childProcess: ChildProcess,
		private fs: FileSystem,
		private hostInfo: HostInfo,
		private helpers: Helpers) { }

	public getToolsInfo(): NativeScriptDoctor.IAndroidToolsInfoData {
		if (!this.toolsInfo) {
			const infoData: NativeScriptDoctor.IAndroidToolsInfoData = Object.create(null);
			infoData.androidHomeEnvVar = this.androidHome;
			infoData.compileSdkVersion = this.getCompileSdk();
			infoData.buildToolsVersion = this.getBuildToolsVersion();

			this.toolsInfo = infoData;
		}

		return this.toolsInfo;
	}

	public validateInfo(): NativeScriptDoctor.IWarning[] {
		const errors: NativeScriptDoctor.IWarning[] = [];
		const toolsInfoData = this.getToolsInfo();
		const isAndroidHomeValid = this.isAndroidHomeValid();
		if (!toolsInfoData.compileSdkVersion) {
			errors.push({
				warning: `Cannot find a compatible Android SDK for compilation. To be able to build for Android, install Android SDK ${AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET} or later.`,
				additionalInformation: `Run \`\$ ${this.getPathToSdkManagementTool()}\` to manage your Android SDK versions.`,
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			});
		}

		if (!toolsInfoData.buildToolsVersion) {
			const buildToolsRange = this.getBuildToolsRange();
			const versionRangeMatches = buildToolsRange.match(/^.*?([\d\.]+)\s+.*?([\d\.]+)$/);
			let message = `You can install any version in the following range: '${buildToolsRange}'.`;

			// Improve message in case buildToolsRange is something like: ">=22.0.0 <=22.0.0" - same numbers on both sides
			if (versionRangeMatches && versionRangeMatches[1] && versionRangeMatches[2] && versionRangeMatches[1] === versionRangeMatches[2]) {
				message = `You have to install version ${versionRangeMatches[1]}.`;
			}

			let invalidBuildToolsAdditionalMsg = `Run \`\$ ${this.getPathToSdkManagementTool()}\` from your command-line to install required \`Android Build Tools\`.`;
			if (!isAndroidHomeValid) {
				invalidBuildToolsAdditionalMsg += ' In case you already have them installed, make sure `ANDROID_HOME` environment variable is set correctly.';
			}

			errors.push({
				warning: "You need to have the Android SDK Build-tools installed on your system. " + message,
				additionalInformation: invalidBuildToolsAdditionalMsg,
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			});
		}

		return errors;
	}

	public validateJavacVersion(installedJavaCompilerVersion: string, projectDir?: string, runtimeVersion?: string): NativeScriptDoctor.IWarning[] {
		const errors: NativeScriptDoctor.IWarning[] = [];

		let additionalMessage = "You will not be able to build your projects for Android." + EOL
			+ "To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" + EOL +
			" described in " + this.getSystemRequirementsLink();

		const matchingVersion = this.helpers.appendZeroesToVersion(installedJavaCompilerVersion || "", 3).match(AndroidToolsInfo.VERSION_REGEX);
		const installedJavaCompilerSemverVersion = matchingVersion && matchingVersion[1];
		if (installedJavaCompilerSemverVersion) {
			let warning: string = null;

			const supportedVersions: IDictionary<string> = {
				"^10.0.0": "4.1.0-2018.5.18.1"
			};

			if (semver.lt(installedJavaCompilerSemverVersion, AndroidToolsInfo.MIN_JAVA_VERSION)) {
				warning = `Javac version ${installedJavaCompilerVersion} is not supported. You have to install at least ${AndroidToolsInfo.MIN_JAVA_VERSION}.`;
			} else {
				runtimeVersion = this.getRealRuntimeVersion(runtimeVersion || this.getAndroidRuntimeVersionFromProjectDir(projectDir));
				if (runtimeVersion) {
					// get the item from the dictionary that corresponds to our current Javac version:
					let runtimeMinVersion: string = null;
					Object.keys(supportedVersions)
						.forEach(javacRange => {
							if (semver.satisfies(installedJavaCompilerSemverVersion, javacRange)) {
								runtimeMinVersion = supportedVersions[javacRange];
							}
						});

					if (runtimeMinVersion && semver.lt(runtimeVersion, runtimeMinVersion)) {
						warning = `The Java compiler version ${installedJavaCompilerVersion} is not compatible with the current Android runtime version ${runtimeVersion}. ` +
							`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`;
						additionalMessage = "You will not be able to build your projects for Android." + EOL +
							"To be able to build for Android, downgrade your Java compiler version or update your Android runtime.";
					}
				}
			}

			if (warning) {
				errors.push({
					warning,
					additionalInformation: additionalMessage,
					platforms: [Constants.ANDROID_PLATFORM_NAME]
				});
			}
		} else {
			errors.push({
				warning: "Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable.",
				additionalInformation: additionalMessage,
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			});
		}

		return errors;
	}

	public async getPathToAdbFromAndroidHome(): Promise<string> {
		if (this.androidHome) {
			let pathToAdb = path.join(this.androidHome, "platform-tools", "adb");
			try {
				await this.childProcess.execFile(pathToAdb, ["help"]);
				return pathToAdb;
			} catch (err) {
				return null;
			}
		}

		return null;
	}

	public validateAndroidHomeEnvVariable(): NativeScriptDoctor.IWarning[] {
		const errors: NativeScriptDoctor.IWarning[] = [];
		const expectedDirectoriesInAndroidHome = ["build-tools", "tools", "platform-tools", "extras"];

		if (!this.androidHome || !this.fs.exists(this.androidHome)) {
			errors.push({
				warning: "The ANDROID_HOME environment variable is not set or it points to a non-existent directory. You will not be able to perform any build-related operations for Android.",
				additionalInformation: "To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory.",
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			});
		} else if (expectedDirectoriesInAndroidHome.map(dir => this.fs.exists(path.join(this.androidHome, dir))).length === 0) {
			errors.push({
				warning: "The ANDROID_HOME environment variable points to incorrect directory. You will not be able to perform any build-related operations for Android.",
				additionalInformation: "To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory, " +
					"where you will find `tools` and `platform-tools` directories.",
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			});
		}

		return errors;
	}

	public getPathToEmulatorExecutable(): string {
		if (!this.pathToEmulatorExecutable) {
			const emulatorExecutableName = "emulator";

			this.pathToEmulatorExecutable = emulatorExecutableName;

			if (this.androidHome) {
				// Check https://developer.android.com/studio/releases/sdk-tools.html (25.3.0)
				// Since this version of SDK tools, the emulator is a separate package.
				// However the emulator executable still exists in the "tools" dir.
				const pathToEmulatorFromAndroidStudio = path.join(this.androidHome, emulatorExecutableName, emulatorExecutableName);
				const realFilePath = this.hostInfo.isWindows ? `${pathToEmulatorFromAndroidStudio}.exe` : pathToEmulatorFromAndroidStudio;

				if (this.fs.exists(realFilePath)) {
					this.pathToEmulatorExecutable = pathToEmulatorFromAndroidStudio;
				} else {
					this.pathToEmulatorExecutable = path.join(this.androidHome, "tools", emulatorExecutableName);
				}
			}
		}

		return this.pathToEmulatorExecutable;
	}

	private getPathToSdkManagementTool(): string {
		const sdkmanagerName = "sdkmanager";
		let sdkManagementToolPath = sdkmanagerName;

		const isAndroidHomeValid = this.isAndroidHomeValid();

		if (isAndroidHomeValid) {
			// In case ANDROID_HOME is correct, check if sdkmanager exists and if not it means the SDK has not been updated.
			// In this case user shoud use `android` from the command-line instead of sdkmanager.
			const pathToSdkmanager = path.join(this.androidHome, "tools", "bin", sdkmanagerName);
			const pathToAndroidExecutable = path.join(this.androidHome, "tools", "android");
			const pathToExecutable = this.fs.exists(pathToSdkmanager) ? pathToSdkmanager : pathToAndroidExecutable;

			sdkManagementToolPath = pathToExecutable.replace(this.androidHome, this.hostInfo.isWindows ? "%ANDROID_HOME%" : "$ANDROID_HOME");
		}

		return sdkManagementToolPath;
	}

	private getCompileSdk(): number {
		let latestValidAndroidTarget = this.getLatestValidAndroidTarget();
		if (latestValidAndroidTarget) {
			let integerVersion = this.parseAndroidSdkString(latestValidAndroidTarget);

			if (integerVersion && integerVersion >= AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET) {
				return integerVersion;
			}
		}
	}

	private getMatchingDir(pathToDir: string, versionRange: string): string {
		let selectedVersion: string;
		if (this.fs.exists(pathToDir)) {
			let subDirs = this.fs.readDirectory(pathToDir);

			let subDirsVersions = subDirs
				.map(dirName => {
					let dirNameGroups = dirName.match(AndroidToolsInfo.VERSION_REGEX);
					if (dirNameGroups) {
						return dirNameGroups[1];
					}

					return null;
				})
				.filter(dirName => !!dirName);

			let version = semver.maxSatisfying(subDirsVersions, versionRange);
			if (version) {
				selectedVersion = subDirs.find(dir => dir.indexOf(version) !== -1);
			}
		}

		return selectedVersion;
	}

	private getBuildToolsRange(): string {
		return `${AndroidToolsInfo.REQUIRED_BUILD_TOOLS_RANGE_PREFIX} <=${this.getMaxSupportedVersion()}`;
	}

	private getBuildToolsVersion(): string {
		let buildToolsVersion: string;
		if (this.androidHome) {
			let pathToBuildTools = path.join(this.androidHome, "build-tools");
			let buildToolsRange = this.getBuildToolsRange();
			buildToolsVersion = this.getMatchingDir(pathToBuildTools, buildToolsRange);
		}

		return buildToolsVersion;
	}

	private getLatestValidAndroidTarget(): string {
		const installedTargets = this.getInstalledTargets();
		let latestValidAndroidTarget: string;
		const sortedAndroidToolsInfo = AndroidToolsInfo.SUPPORTED_TARGETS.sort();

		sortedAndroidToolsInfo.forEach(s => {
			if (installedTargets.indexOf(s) >= 0) {
				latestValidAndroidTarget = s;
			}
		});

		return latestValidAndroidTarget;
	}

	private parseAndroidSdkString(androidSdkString: string): number {
		return parseInt(androidSdkString.replace(`${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-`, ""));
	}

	private getInstalledTargets(): string[] {
		try {
			const pathToInstalledTargets = path.join(this.androidHome, "platforms");
			if (!this.fs.exists(pathToInstalledTargets)) {
				throw new Error("No Android Targets installed.");
			}

			return this.fs.readDirectory(pathToInstalledTargets);
		} catch (err) {
			return [];
		}
	}

	private getMaxSupportedVersion(): number {
		return this.parseAndroidSdkString(AndroidToolsInfo.SUPPORTED_TARGETS.sort()[AndroidToolsInfo.SUPPORTED_TARGETS.length - 1]);
	}

	private getSystemRequirementsLink(): string {
		return Constants.SYSTEM_REQUIREMENTS_LINKS[process.platform] || "";
	}

	private isAndroidHomeValid(): boolean {
		const errors = this.validateAndroidHomeEnvVariable();
		return !errors && !errors.length;
	}

	private getAndroidRuntimeVersionFromProjectDir(projectDir: string): string {
		let runtimeVersion: string = null;
		if (projectDir && this.fs.exists(projectDir)) {
			const pathToPackageJson = path.join(projectDir, Constants.PACKAGE_JSON);

			if (this.fs.exists(pathToPackageJson)) {
				const content = this.fs.readJson<INativeScriptProjectPackageJson>(pathToPackageJson);
				runtimeVersion = content && content.nativescript && content.nativescript["tns-android"] && content.nativescript["tns-android"].version;
			}
		}

		return runtimeVersion;
	}

	private getRealRuntimeVersion(runtimeVersion: string): string {
		if (runtimeVersion) {
			// Check if the version is not "next" or "rc", i.e. tag from npm
			if (!semver.valid(runtimeVersion)) {
				try {
					const npmViewOutput = this.childProcess.execSync(`npm view ${Constants.ANDROID_RUNTIME} dist-tags --json`);
					const jsonNpmViewOutput = JSON.parse(npmViewOutput);
					runtimeVersion = jsonNpmViewOutput[runtimeVersion] || runtimeVersion;
				} catch (err) {
					// Maybe there's no npm here
				}
			}
		}

		if (runtimeVersion && !semver.valid(runtimeVersion)) {
			// If we got here, something terribly wrong happened.
			throw new Error(`The determined Android runtime version ${runtimeVersion} is not valid. Unable to verify if the current system is setup for Android development.`);
		}

		return runtimeVersion;
	}
}
