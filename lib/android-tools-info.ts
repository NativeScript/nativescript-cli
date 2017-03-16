import * as path from "path";
import * as semver from "semver";
import { EOL } from "os";

export class AndroidToolsInfo implements IAndroidToolsInfo {
	private static ANDROID_TARGET_PREFIX = "android";
	private static SUPPORTED_TARGETS = ["android-17", "android-18", "android-19", "android-21", "android-22", "android-23", "android-24", "android-25"];
	private static MIN_REQUIRED_COMPILE_TARGET = 22;
	private static REQUIRED_BUILD_TOOLS_RANGE_PREFIX = ">=25.0.2";
	private static VERSION_REGEX = /((\d+\.){2}\d+)/;
	private static MIN_JAVA_VERSION = "1.8.0";

	private showWarningsAsErrors: boolean;
	private toolsInfo: IAndroidToolsInfoData;
	private selectedCompileSdk: number;
	private installedTargetsCache: string[] = null;
	private androidHome = process.env["ANDROID_HOME"];

	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $options: IOptions,
		protected $staticConfig: Config.IStaticConfig) { }

	public getToolsInfo(): IFuture<IAndroidToolsInfoData> {
		return ((): IAndroidToolsInfoData => {
			if (!this.toolsInfo) {
				let infoData: IAndroidToolsInfoData = Object.create(null);
				infoData.androidHomeEnvVar = this.androidHome;
				infoData.compileSdkVersion = this.getCompileSdk().wait();
				infoData.buildToolsVersion = this.getBuildToolsVersion().wait();
				infoData.targetSdkVersion = this.getTargetSdk().wait();
				infoData.supportRepositoryVersion = this.getAndroidSupportRepositoryVersion().wait();
				infoData.generateTypings = this.shouldGenerateTypings();

				this.toolsInfo = infoData;
			}

			return this.toolsInfo;
		}).future<IAndroidToolsInfoData>()();
	}

	public validateInfo(options?: { showWarningsAsErrors: boolean, validateTargetSdk: boolean }): IFuture<boolean> {
		return ((): boolean => {
			let detectedErrors = false;
			this.showWarningsAsErrors = options && options.showWarningsAsErrors;
			let toolsInfoData = this.getToolsInfo().wait();
			let isAndroidHomeValid = this.validateAndroidHomeEnvVariable();
			if (!toolsInfoData.compileSdkVersion) {
				this.printMessage(`Cannot find a compatible Android SDK for compilation. To be able to build for Android, install Android SDK ${AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET} or later.`,
					`Run \`\$ ${this.getPathToSdkManagementTool()}\` to manage your Android SDK versions.`);
				detectedErrors = true;
			}

			if (!toolsInfoData.buildToolsVersion) {
				let buildToolsRange = this.getBuildToolsRange();
				let versionRangeMatches = buildToolsRange.match(/^.*?([\d\.]+)\s+.*?([\d\.]+)$/);
				let message = `You can install any version in the following range: '${buildToolsRange}'.`;

				// Improve message in case buildToolsRange is something like: ">=22.0.0 <=22.0.0" - same numbers on both sides
				if (versionRangeMatches && versionRangeMatches[1] && versionRangeMatches[2] && versionRangeMatches[1] === versionRangeMatches[2]) {
					message = `You have to install version ${versionRangeMatches[1]}.`;
				}

				let invalidBuildToolsAdditionalMsg = `Run \`\$ ${this.getPathToSdkManagementTool()}\` from your command-line to install required \`Android Build Tools\`.`;
				if (!isAndroidHomeValid) {
					invalidBuildToolsAdditionalMsg += ' In case you already have them installed, make sure `ANDROID_HOME` environment variable is set correctly.';
				}

				this.printMessage("You need to have the Android SDK Build-tools installed on your system. " + message, invalidBuildToolsAdditionalMsg);
				detectedErrors = true;
			}

			if (!toolsInfoData.supportRepositoryVersion) {
				let invalidSupportLibAdditionalMsg = `Run \`\$ ${this.getPathToSdkManagementTool()}\` to manage the Android Support Repository.`;
				if (!isAndroidHomeValid) {
					invalidSupportLibAdditionalMsg += ' In case you already have it installed, make sure `ANDROID_HOME` environment variable is set correctly.';
				}
				this.printMessage(`You need to have Android SDK ${AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET} or later and the latest Android Support Repository installed on your system.`, invalidSupportLibAdditionalMsg);
				detectedErrors = true;
			}

			if (options && options.validateTargetSdk) {
				let targetSdk = toolsInfoData.targetSdkVersion;
				let newTarget = `${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-${targetSdk}`;
				if (!_.includes(AndroidToolsInfo.SUPPORTED_TARGETS, newTarget)) {
					let supportedVersions = AndroidToolsInfo.SUPPORTED_TARGETS.sort();
					let minSupportedVersion = this.parseAndroidSdkString(_.first(supportedVersions));

					if (targetSdk && (targetSdk < minSupportedVersion)) {
						this.printMessage(`The selected Android target SDK ${newTarget} is not supported. You must target ${minSupportedVersion} or later.`);
						detectedErrors = true;
					} else if (!targetSdk || targetSdk > this.getMaxSupportedVersion()) {
						this.$logger.warn(`Support for the selected Android target SDK ${newTarget} is not verified. Your Android app might not work as expected.`);
					}
				}
			}

			return detectedErrors || !isAndroidHomeValid;
		}).future<boolean>()();
	}

	public validateJavacVersion(installedJavaVersion: string, options?: { showWarningsAsErrors: boolean }): IFuture<boolean> {
		return ((): boolean => {
			let hasProblemWithJavaVersion = false;
			if (options) {
				this.showWarningsAsErrors = options.showWarningsAsErrors;
			}
			let additionalMessage = "You will not be able to build your projects for Android." + EOL
				+ "To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" + EOL +
				" described in " + this.$staticConfig.SYS_REQUIREMENTS_LINK;
			let matchingVersion = (installedJavaVersion || "").match(AndroidToolsInfo.VERSION_REGEX);
			if (matchingVersion && matchingVersion[1]) {
				if (semver.lt(matchingVersion[1], AndroidToolsInfo.MIN_JAVA_VERSION)) {
					hasProblemWithJavaVersion = true;
					this.printMessage(`Javac version ${installedJavaVersion} is not supported. You have to install at least ${AndroidToolsInfo.MIN_JAVA_VERSION}.`, additionalMessage);
				}
			} else {
				hasProblemWithJavaVersion = true;
				this.printMessage("Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable.", additionalMessage);
			}

			return hasProblemWithJavaVersion;
		}).future<boolean>()();
	}

	public getPathToAdbFromAndroidHome(): IFuture<string> {
		return (() => {
			if (this.androidHome) {
				let pathToAdb = path.join(this.androidHome, "platform-tools", "adb");
				try {
					this.$childProcess.execFile(pathToAdb, ["help"]).wait();
					return pathToAdb;
				} catch (err) {
					// adb does not exist, so ANDROID_HOME is not set correctly
					// try getting default adb path (included in CLI package)
					this.$logger.trace(`Error while executing '${pathToAdb} help'. Error is: ${err.message}`);
				}
			}

			return null;
		}).future<string>()();
	}

	private _cachedAndroidHomeValidationResult: boolean = null;
	public validateAndroidHomeEnvVariable(options?: { showWarningsAsErrors: boolean }): boolean {
		if (this._cachedAndroidHomeValidationResult === null) {
			if (options) {
				this.showWarningsAsErrors = options.showWarningsAsErrors;
			}

			this._cachedAndroidHomeValidationResult = true;
			let expectedDirectoriesInAndroidHome = ["build-tools", "tools", "platform-tools", "extras"];
			if (!this.androidHome || !this.$fs.exists(this.androidHome)) {
				this.printMessage("The ANDROID_HOME environment variable is not set or it points to a non-existent directory. You will not be able to perform any build-related operations for Android.",
					"To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory.");
				this._cachedAndroidHomeValidationResult = false;
			} else if (!_.some(expectedDirectoriesInAndroidHome.map(dir => this.$fs.exists(path.join(this.androidHome, dir))))) {
				this.printMessage("The ANDROID_HOME environment variable points to incorrect directory. You will not be able to perform any build-related operations for Android.",
					"To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory, " +
					"where you will find `tools` and `platform-tools` directories.");
				this._cachedAndroidHomeValidationResult = false;
			}
		}

		return this._cachedAndroidHomeValidationResult;
	}

	private _cachedPathToSdkManagementTool: string;
	private getPathToSdkManagementTool(): string {
		if (!this._cachedPathToSdkManagementTool) {
			const sdkmanagerName = "sdkmanager";
			this._cachedPathToSdkManagementTool = sdkmanagerName;

			const isAndroidHomeValid = this.validateAndroidHomeEnvVariable();

			if (isAndroidHomeValid) {
				// In case ANDROID_HOME is correct, check if sdkmanager exists and if not it means the SDK has not been updated.
				// In this case user shoud use `android` from the command-line instead of sdkmanager.
				const pathToSdkmanager = path.join(this.androidHome, "tools", "bin", sdkmanagerName);
				const pathToAndroidExecutable = path.join(this.androidHome, "tools", "android");
				const pathToExecutable = this.$fs.exists(pathToSdkmanager) ? pathToSdkmanager : pathToAndroidExecutable;

				this.$logger.trace(`Path to Android SDK Management tool is: ${pathToExecutable}`);

				this._cachedPathToSdkManagementTool = pathToExecutable.replace(this.androidHome, this.$hostInfo.isWindows ? "%ANDROID_HOME%" : "$ANDROID_HOME");
			}
		}

		return this._cachedPathToSdkManagementTool;
	}

	private shouldGenerateTypings(): boolean {
		return this.$options.androidTypings;
	}

	/**
	 * Prints messages on the screen. In case the showWarningsAsErrors flag is set to true, warnings are shown, else - errors.
	 * Uses logger.warn for warnings and errors.failWithoutHelp when erros must be shown.
	 * In case additional details must be shown as info message, use the second parameter.
	 * NOTE: The additional information will not be printed when showWarningsAsErrors flag is set.
	 * @param  {string} msg The message that will be shown as warning or error.
	 * @param  {string} additionalMsg The additional message that will be shown as info message.
	 * @return {void}
	 */
	private printMessage(msg: string, additionalMsg?: string): void {
		if (this.showWarningsAsErrors) {
			this.$errors.failWithoutHelp(msg);
		} else {
			this.$logger.warn(msg);
		}

		if (additionalMsg) {
			this.$logger.printMarkdown(additionalMsg);
		}
	}

	private getCompileSdk(): IFuture<number> {
		return ((): number => {
			if (!this.selectedCompileSdk) {
				let userSpecifiedCompileSdk = this.$options.compileSdk;
				if (userSpecifiedCompileSdk) {
					let installedTargets = this.getInstalledTargets().wait();
					let androidCompileSdk = `${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-${userSpecifiedCompileSdk}`;
					if (!_.includes(installedTargets, androidCompileSdk)) {
						this.$errors.failWithoutHelp(`You have specified '${userSpecifiedCompileSdk}' for compile sdk, but it is not installed on your system.`);
					}

					this.selectedCompileSdk = userSpecifiedCompileSdk;
				} else {
					let latestValidAndroidTarget = this.getLatestValidAndroidTarget().wait();
					if (latestValidAndroidTarget) {
						let integerVersion = this.parseAndroidSdkString(latestValidAndroidTarget);

						if (integerVersion && integerVersion >= AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET) {
							this.selectedCompileSdk = integerVersion;
						}
					}
				}
			}

			return this.selectedCompileSdk;
		}).future<number>()();
	}

	private getTargetSdk(): IFuture<number> {
		return ((): number => {
			let targetSdk = this.$options.sdk ? parseInt(this.$options.sdk) : this.getCompileSdk().wait();
			this.$logger.trace(`Selected targetSdk is: ${targetSdk}`);
			return targetSdk;
		}).future<number>()();
	}

	private getMatchingDir(pathToDir: string, versionRange: string): string {
		let selectedVersion: string;
		if (this.$fs.exists(pathToDir)) {
			let subDirs = this.$fs.readDirectory(pathToDir);
			this.$logger.trace(`Directories found in ${pathToDir} are ${subDirs.join(", ")}`);

			let subDirsVersions = subDirs
				.map(dirName => {
					let dirNameGroups = dirName.match(AndroidToolsInfo.VERSION_REGEX);
					if (dirNameGroups) {
						return dirNameGroups[1];
					}

					return null;
				})
				.filter(dirName => !!dirName);
			this.$logger.trace(`Versions found in ${pathToDir} are ${subDirsVersions.join(", ")}`);
			let version = semver.maxSatisfying(subDirsVersions, versionRange);
			if (version) {
				selectedVersion = _.find(subDirs, dir => dir.indexOf(version) !== -1);
			}
		}
		this.$logger.trace("Selected version is: ", selectedVersion);
		return selectedVersion;
	}

	private getBuildToolsRange(): string {
		return `${AndroidToolsInfo.REQUIRED_BUILD_TOOLS_RANGE_PREFIX}`;
	}

	private getBuildToolsVersion(): IFuture<string> {
		return ((): string => {
			let buildToolsVersion: string;
			if (this.androidHome) {
				let pathToBuildTools = path.join(this.androidHome, "build-tools");
				let buildToolsRange = this.getBuildToolsRange();
				buildToolsVersion = this.getMatchingDir(pathToBuildTools, buildToolsRange);
			}

			return buildToolsVersion;
		}).future<string>()();
	}

	private getAppCompatRange(): IFuture<string> {
		return ((): string => {
			let compileSdkVersion = this.getCompileSdk().wait();
			let requiredAppCompatRange: string;
			if (compileSdkVersion) {
				requiredAppCompatRange = `>=${compileSdkVersion} <${compileSdkVersion + 1}`;
			}

			return requiredAppCompatRange;
		}).future<string>()();
	}

	private getAndroidSupportRepositoryVersion(): IFuture<string> {
		return ((): string => {
			let selectedAppCompatVersion: string;
			let requiredAppCompatRange = this.getAppCompatRange().wait();
			if (this.androidHome && requiredAppCompatRange) {
				let pathToAppCompat = path.join(this.androidHome, "extras", "android", "m2repository", "com", "android", "support", "appcompat-v7");
				selectedAppCompatVersion = this.getMatchingDir(pathToAppCompat, requiredAppCompatRange);
			}

			this.$logger.trace(`Selected AppCompat version is: ${selectedAppCompatVersion}`);
			return selectedAppCompatVersion;
		}).future<string>()();
	}

	private getLatestValidAndroidTarget(): IFuture<string> {
		return (() => {
			let installedTargets = this.getInstalledTargets().wait();
			return _.findLast(AndroidToolsInfo.SUPPORTED_TARGETS.sort(), supportedTarget => _.includes(installedTargets, supportedTarget));
		}).future<string>()();
	}

	private parseAndroidSdkString(androidSdkString: string): number {
		return parseInt(androidSdkString.replace(`${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-`, ""));
	}

	private getInstalledTargets(): IFuture<string[]> {
		return (() => {
			if (!this.installedTargetsCache) {
				try {
					this.installedTargetsCache = [];
					const pathToInstalledTargets = path.join(this.androidHome, "platforms");
					if (this.$fs.exists(pathToInstalledTargets)) {
						this.installedTargetsCache = this.$fs.readDirectory(pathToInstalledTargets);
						this.$logger.trace("Installed Android Targets are: ", this.installedTargetsCache);
					}

					this.$logger.trace("Installed Android Targets are: ", this.installedTargetsCache);
				} catch (err) {
					this.$logger.trace("Unable to get Android targets. Error is: " + err);
				}
			}

			return this.installedTargetsCache;
		}).future<string[]>()();
	}

	private getMaxSupportedVersion(): number {
		return this.parseAndroidSdkString(_.last(AndroidToolsInfo.SUPPORTED_TARGETS.sort()));
	}
}
$injector.register("androidToolsInfo", AndroidToolsInfo);
