import { ChildProcess } from "./wrappers/child-process";
import { FileSystem } from "./wrappers/file-system";
import { HostInfo } from "./host-info";
import { Constants } from "./constants";
import { Helpers } from "./helpers";
import { EOL } from "os";
import * as semver from "semver";
import * as path from "path";
import * as _ from "lodash";

export class AndroidToolsInfo implements NativeScriptDoctor.IAndroidToolsInfo {
	public readonly ANDROID_TARGET_PREFIX = "android";
	public getSupportedTargets(projectDir: string) {
		const runtimeVersion = this.getRuntimeVersion({ projectDir });
		let baseTargets = [
			"android-17",
			"android-18",
			"android-19",
			"android-20",
			"android-21",
			"android-22",
			"android-23",
			"android-24",
			"android-25",
			"android-26",
			"android-27",
			"android-28",
			"android-29",
			"android-30",
			"android-31",
			"android-32",
			"android-33",
			"android-34",
			"android-35",
			"android-36",
		];

		const isRuntimeVersionLessThan = (targetVersion: string) => {
			return (
				runtimeVersion &&
				semver.lt(semver.coerce(runtimeVersion), targetVersion)
			);
		};

		if (isRuntimeVersionLessThan("6.1.0")) {
			// limit baseTargets to android-17 - android-28 if the runtime is < 6.1.0
			baseTargets = baseTargets.slice(0, baseTargets.indexOf("android-29"));
		} else if (isRuntimeVersionLessThan("8.2.0")) {
			// limit baseTargets to android-17 - android-30 if the runtime is < 8.2.0
			baseTargets = baseTargets.slice(0, baseTargets.indexOf("android-31"));
		}

		return baseTargets;
	}
	private static MIN_REQUIRED_COMPILE_TARGET = 28;
	private static REQUIRED_BUILD_TOOLS_RANGE_PREFIX = ">=23";
	private static VERSION_REGEX = /((\d+\.){2}\d+)/;
	private static MIN_JAVA_VERSION = "1.8.0";
	// If some java release breaks the code then set this version to the breaking release (e.g. "13.0.0")
	private static MAX_JAVA_VERSION = null as string;

	private toolsInfo: NativeScriptDoctor.IAndroidToolsInfoData;
	public get androidHome(): string {
		return process.env["ANDROID_HOME"];
	}
	private pathToEmulatorExecutable: string;

	private _cachedRuntimeVersion: string;

	constructor(
		private childProcess: ChildProcess,
		private fs: FileSystem,
		private hostInfo: HostInfo,
		private helpers: Helpers,
	) {}

	public getToolsInfo(
		config: Partial<NativeScriptDoctor.IProjectDir> = {},
	): NativeScriptDoctor.IAndroidToolsInfoData {
		if (!this.toolsInfo) {
			const infoData: NativeScriptDoctor.IAndroidToolsInfoData =
				Object.create(null);
			infoData.androidHomeEnvVar = this.androidHome;
			infoData.installedTargets = this.getInstalledTargets();
			infoData.compileSdkVersion = this.getCompileSdk(
				infoData.installedTargets,
				config.projectDir,
			);
			infoData.buildToolsVersion = this.getBuildToolsVersion(config.projectDir);

			this.toolsInfo = infoData;
		}

		return this.toolsInfo;
	}

	public validateInfo(
		config: Partial<NativeScriptDoctor.IProjectDir> = {},
	): NativeScriptDoctor.IWarning[] {
		const errors: NativeScriptDoctor.IWarning[] = [];
		const toolsInfoData = this.getToolsInfo(config);
		const isAndroidHomeValid = this.isAndroidHomeValid();
		if (!toolsInfoData.compileSdkVersion) {
			const supportedTargetsForAndroidRuntime = this.getSupportedTargets(
				config.projectDir,
			);
			errors.push({
				warning: [
					`Cannot find a compatible Android SDK for compilation.`,
					`To be able to build for Android with your current android runtime, install one of the following supported Android SDK targets:`,
					...supportedTargetsForAndroidRuntime.map((target) => `  ${target}`),
					`Supported targets vary based on what android runtime you have installed. Currently your app uses @nativescript/android ${this.getRuntimeVersion(
						{ projectDir: config.projectDir },
					)}`,
				].join("\n"),
				additionalInformation: `Run \`\$ ${this.getPathToSdkManagementTool()}\` to manage your Android SDK versions.`,
				platforms: [Constants.ANDROID_PLATFORM_NAME],
			});
		}

		if (!toolsInfoData.buildToolsVersion) {
			const buildToolsRange = this.getBuildToolsRange(config.projectDir);
			const versionRangeMatches = buildToolsRange.match(
				/^.*?([\d\.]+)\s+.*?([\d\.]+)$/,
			);
			let message = `You can install any version in the following range: '${buildToolsRange}'.`;

			// Improve message in case buildToolsRange is something like: ">=22.0.0 <=22.0.0" - same numbers on both sides
			if (
				versionRangeMatches &&
				versionRangeMatches[1] &&
				versionRangeMatches[2] &&
				versionRangeMatches[1] === versionRangeMatches[2]
			) {
				message = `You have to install version ${versionRangeMatches[1]}.`;
			}

			// let invalidBuildToolsAdditionalMsg = `Run \`\$ ${this.getPathToSdkManagementTool()}\` from your command-line to install required \`Android Build Tools\`.`;
			let invalidBuildToolsAdditionalMsg = `Install the required build-tools through Android Studio.`;
			if (!isAndroidHomeValid) {
				invalidBuildToolsAdditionalMsg +=
					" In case you already have them installed, make sure the `ANDROID_HOME` environment variable is set correctly.";
			}

			errors.push({
				warning:
					"No compatible version of the Android SDK Build-tools are installed on your system. " +
					message,
				additionalInformation: invalidBuildToolsAdditionalMsg,
				platforms: [Constants.ANDROID_PLATFORM_NAME],
			});
		}

		return errors;
	}

	public static unsupportedJavaMessage(
		installedJavaCompilerVersion: string,
	): string {
		return `Javac version ${installedJavaCompilerVersion} is not supported. You must install a java version greater than ${
			AndroidToolsInfo.MIN_JAVA_VERSION
		}${
			AndroidToolsInfo.MAX_JAVA_VERSION
				? ` and less than ${AndroidToolsInfo.MAX_JAVA_VERSION}`
				: ""
		}.`;
	}

	public validateJavacVersion(
		installedJavaCompilerVersion: string,
		projectDir?: string,
		runtimeVersion?: string,
	): NativeScriptDoctor.IWarning[] {
		const errors: NativeScriptDoctor.IWarning[] = [];

		let additionalMessage =
			"You will not be able to build your projects for Android." +
			EOL +
			"To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" +
			EOL +
			" described in " +
			this.getSystemRequirementsLink();

		const matchingVersion = this.helpers
			.appendZeroesToVersion(installedJavaCompilerVersion || "", 3)
			.match(AndroidToolsInfo.VERSION_REGEX);
		const installedJavaCompilerSemverVersion =
			matchingVersion && matchingVersion[1];
		if (installedJavaCompilerSemverVersion) {
			let warning: string = null;

			const supportedVersions: IDictionary<string> = {
				"^10.0.0": "4.1.0-2018.5.18.1",
			};

			if (
				semver.lt(
					installedJavaCompilerSemverVersion,
					AndroidToolsInfo.MIN_JAVA_VERSION,
				) ||
				(AndroidToolsInfo.MAX_JAVA_VERSION
					? semver.gte(
							installedJavaCompilerSemverVersion,
							AndroidToolsInfo.MAX_JAVA_VERSION,
						)
					: false)
			) {
				warning = AndroidToolsInfo.unsupportedJavaMessage(
					installedJavaCompilerVersion,
				);
			} else {
				runtimeVersion = this.getRuntimeVersion({ runtimeVersion, projectDir });
				if (runtimeVersion) {
					// get the item from the dictionary that corresponds to our current Javac version:
					let runtimeMinVersion: string = null;
					Object.keys(supportedVersions).forEach((javacRange) => {
						if (
							semver.satisfies(installedJavaCompilerSemverVersion, javacRange)
						) {
							runtimeMinVersion = supportedVersions[javacRange];
						}
					});

					if (
						runtimeMinVersion &&
						semver.lt(runtimeVersion, runtimeMinVersion)
					) {
						warning =
							`The Java compiler version ${installedJavaCompilerVersion} is not compatible with the current Android runtime version ${runtimeVersion}. ` +
							`In order to use this Javac version, you need to update your Android runtime or downgrade your Java compiler version.`;
						additionalMessage =
							"You will not be able to build your projects for Android." +
							EOL +
							"To be able to build for Android, downgrade your Java compiler version or update your Android runtime.";
					}
				}
			}

			if (warning) {
				errors.push({
					warning,
					additionalInformation: additionalMessage,
					platforms: [Constants.ANDROID_PLATFORM_NAME],
				});
			}
		} else {
			errors.push({
				warning:
					"Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable.",
				additionalInformation: additionalMessage,
				platforms: [Constants.ANDROID_PLATFORM_NAME],
			});
		}

		return errors;
	}

	public async getPathToAdbFromAndroidHome(): Promise<string> {
		if (this.androidHome) {
			const pathToAdb = path.join(this.androidHome, "platform-tools", "adb");
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
		const expectedDirectoriesInAndroidHome = [
			"build-tools",
			"tools",
			"platform-tools",
			"extras",
		];

		if (!this.androidHome || !this.fs.exists(this.androidHome)) {
			errors.push({
				warning:
					"The ANDROID_HOME environment variable is not set or it points to a non-existent directory. You will not be able to perform any build-related operations for Android.",
				additionalInformation:
					"To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory.",
				platforms: [Constants.ANDROID_PLATFORM_NAME],
			});
		} else if (
			expectedDirectoriesInAndroidHome.map((dir) =>
				this.fs.exists(path.join(this.androidHome, dir)),
			).length === 0
		) {
			errors.push({
				warning:
					"The ANDROID_HOME environment variable points to incorrect directory. You will not be able to perform any build-related operations for Android.",
				additionalInformation:
					"To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory, " +
					"where you will find `tools` and `platform-tools` directories.",
				platforms: [Constants.ANDROID_PLATFORM_NAME],
			});
		}

		return errors;
	}

	public validateMinSupportedTargetSdk({
		targetSdk,
		projectDir,
	}: NativeScriptDoctor.ITargetValidationOptions): NativeScriptDoctor.IWarning[] {
		const errors: NativeScriptDoctor.IWarning[] = [];
		const newTarget = `${this.ANDROID_TARGET_PREFIX}-${targetSdk}`;
		const supportedTargets = this.getSupportedTargets(projectDir);
		const targetSupported = _.includes(supportedTargets, newTarget);

		if (!_.includes(supportedTargets, newTarget)) {
			const supportedVersions = supportedTargets.sort();
			const minSupportedVersion = this.parseAndroidSdkString(
				_.first(supportedVersions),
			);

			if (!targetSupported && targetSdk && targetSdk < minSupportedVersion) {
				errors.push({
					warning: `The selected Android target SDK ${newTarget} is not supported. You must target ${minSupportedVersion} or later.`,
					additionalInformation: "",
					platforms: [Constants.ANDROID_PLATFORM_NAME],
				});
			}
		}

		return errors;
	}

	public validataMaxSupportedTargetSdk({
		targetSdk,
		projectDir,
	}: NativeScriptDoctor.ITargetValidationOptions): NativeScriptDoctor.IWarning[] {
		const errors: NativeScriptDoctor.IWarning[] = [];
		const newTarget = `${this.ANDROID_TARGET_PREFIX}-${targetSdk}`;
		const targetSupported = _.includes(
			this.getSupportedTargets(projectDir),
			newTarget,
		);

		if (
			(!targetSupported && !targetSdk) ||
			targetSdk > this.getMaxSupportedVersion(projectDir)
		) {
			errors.push({
				warning: `Support for the selected Android target SDK ${newTarget} is not verified. Your Android app might not work as expected.`,
				additionalInformation: "",
				platforms: [Constants.ANDROID_PLATFORM_NAME],
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
				const pathToEmulatorFromAndroidStudio = path.join(
					this.androidHome,
					emulatorExecutableName,
					emulatorExecutableName,
				);
				const realFilePath = this.hostInfo.isWindows
					? `${pathToEmulatorFromAndroidStudio}.exe`
					: pathToEmulatorFromAndroidStudio;

				if (this.fs.exists(realFilePath)) {
					this.pathToEmulatorExecutable = pathToEmulatorFromAndroidStudio;
				} else {
					this.pathToEmulatorExecutable = path.join(
						this.androidHome,
						"tools",
						emulatorExecutableName,
					);
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
			const pathToSdkmanager = path.join(
				this.androidHome,
				"tools",
				"bin",
				sdkmanagerName,
			);
			const pathToAndroidExecutable = path.join(
				this.androidHome,
				"tools",
				"android",
			);
			const pathToExecutable = this.fs.exists(pathToSdkmanager)
				? pathToSdkmanager
				: pathToAndroidExecutable;

			sdkManagementToolPath = pathToExecutable.replace(
				this.androidHome,
				this.hostInfo.isWindows ? "%ANDROID_HOME%" : "$ANDROID_HOME",
			);
		}

		return sdkManagementToolPath;
	}

	private getCompileSdk(
		installedTargets: string[],
		projectDir: string,
	): number {
		const latestValidAndroidTarget = this.getLatestValidAndroidTarget(
			installedTargets,
			projectDir,
		);
		if (latestValidAndroidTarget) {
			const integerVersion = this.parseAndroidSdkString(
				latestValidAndroidTarget,
			);

			if (
				integerVersion &&
				integerVersion >= AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET
			) {
				return integerVersion;
			}
		}
	}

	private getMatchingDir(pathToDir: string, versionRange: string): string {
		let selectedVersion: string;
		if (this.fs.exists(pathToDir)) {
			const subDirs = this.fs.readDirectory(pathToDir);

			const subDirsVersions = subDirs
				.map((dirName) => {
					const dirNameGroups = dirName.match(AndroidToolsInfo.VERSION_REGEX);
					if (dirNameGroups) {
						return dirNameGroups[1];
					}

					return null;
				})
				.filter((dirName) => !!dirName);

			const version = semver.maxSatisfying(subDirsVersions, versionRange);
			if (version) {
				selectedVersion = subDirs.find((dir) => dir.indexOf(version) !== -1);
			}
		}

		return selectedVersion;
	}

	private getBuildToolsRange(projectDir: string): string {
		return `${
			AndroidToolsInfo.REQUIRED_BUILD_TOOLS_RANGE_PREFIX
		} <=${this.getMaxSupportedVersion(projectDir)}`;
	}

	private getBuildToolsVersion(projectDir: string): string {
		let buildToolsVersion: string;
		if (this.androidHome) {
			const pathToBuildTools = path.join(this.androidHome, "build-tools");
			const buildToolsRange = this.getBuildToolsRange(projectDir);
			buildToolsVersion = this.getMatchingDir(
				pathToBuildTools,
				buildToolsRange,
			);
		}

		return buildToolsVersion;
	}

	private getLatestValidAndroidTarget(
		installedTargets: string[],
		projectDir: string,
	): string {
		return _.findLast(
			this.getSupportedTargets(projectDir).sort(),
			(supportedTarget) => _.includes(installedTargets, supportedTarget),
		);
	}

	private parseAndroidSdkString(androidSdkString: string): number {
		return parseInt(
			androidSdkString.replace(`${this.ANDROID_TARGET_PREFIX}-`, ""),
		);
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

	private getMaxSupportedVersion(projectDir: string): number {
		const supportedTargets = this.getSupportedTargets(projectDir);

		return this.parseAndroidSdkString(
			supportedTargets.sort()[supportedTargets.length - 1],
		);
	}

	private getSystemRequirementsLink(): string {
		return Constants.SYSTEM_REQUIREMENTS_LINKS;
	}

	private isAndroidHomeValid(): boolean {
		const errors = this.validateAndroidHomeEnvVariable();
		return !errors && !errors.length;
	}

	private getAndroidRuntimePackageFromProjectDir(projectDir: string): {
		name: string;
		version: string;
	} {
		if (!projectDir || !this.fs.exists(projectDir)) {
			return null;
		}
		const pathToPackageJson = path.join(projectDir, Constants.PACKAGE_JSON);

		if (!this.fs.exists(pathToPackageJson)) {
			return null;
		}

		const content =
			this.fs.readJson<INativeScriptProjectPackageJson>(pathToPackageJson);

		if (!content) {
			return null;
		}

		// in case we have a nativescript key and a runtime with a version
		// we are dealing with a legacy project and should respect the values
		// in the nativescript key
		if (
			content &&
			content.nativescript &&
			content.nativescript["tns-android"] &&
			content.nativescript["tns-android"].version
		) {
			return {
				name: Constants.ANDROID_OLD_RUNTIME,
				version:
					content.nativescript &&
					content.nativescript["tns-android"] &&
					content.nativescript["tns-android"].version,
			};
		}

		if (content && content.devDependencies) {
			const foundRuntime = Object.keys(content.devDependencies).find(
				(depName) => {
					return (
						depName === Constants.ANDROID_SCOPED_RUNTIME ||
						depName === Constants.ANDROID_OLD_RUNTIME
					);
				},
			);

			if (foundRuntime) {
				let version = content.devDependencies[foundRuntime];

				if (version.includes("tgz")) {
					try {
						const packagePath = require.resolve(
							`${foundRuntime}/package.json`,
							{
								paths: [projectDir],
							},
						);
						version = require(packagePath).version;
					} catch (err) {
						version = "*";
					}
				}

				return {
					name: foundRuntime,
					version,
				};
			}
		}

		return null;
	}

	private getRuntimeVersion({
		runtimeVersion,
		projectDir,
	}: {
		runtimeVersion?: string;
		projectDir?: string;
	}): string {
		if (this._cachedRuntimeVersion) {
			return this._cachedRuntimeVersion;
		}

		let runtimePackage = {
			name: Constants.ANDROID_SCOPED_RUNTIME,
			version: runtimeVersion,
		};
		if (!runtimeVersion) {
			runtimePackage = this.getAndroidRuntimePackageFromProjectDir(projectDir);
			runtimeVersion = runtimePackage && runtimePackage.version;
		}

		if (runtimeVersion) {
			// Check if the version is not "next" or "rc", i.e. tag from npm
			if (!semver.validRange(runtimeVersion)) {
				try {
					const npmViewOutput = this.childProcess.execSync(
						`npm view ${runtimePackage.name} dist-tags --json`,
					);
					const jsonNpmViewOutput = JSON.parse(npmViewOutput);

					runtimeVersion = jsonNpmViewOutput[runtimeVersion] || runtimeVersion;
				} catch (err) {
					// Maybe there's no npm here
				}
			}
		}

		if (runtimeVersion && !semver.validRange(runtimeVersion)) {
			// If we got here, something terribly wrong happened.
			throw new Error(
				`The determined Android runtime version ${runtimeVersion} is not valid. Unable to verify if the current system is setup for Android development.`,
			);
		}

		this._cachedRuntimeVersion = runtimeVersion;
		return runtimeVersion;
	}

	private getMaxSupportedCompileVersion(
		config: Partial<NativeScriptDoctor.IProjectDir> & {
			runtimeVersion?: string;
		},
	): number {
		if (
			config.runtimeVersion &&
			semver.lt(semver.coerce(config.runtimeVersion), "6.1.0")
		) {
			return 28;
		}
		return this.parseAndroidSdkString(
			_.last(this.getSupportedTargets(config.projectDir).sort()),
		);
	}
}
