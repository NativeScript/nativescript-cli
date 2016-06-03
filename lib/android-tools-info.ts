import * as path from "path";
import * as semver from "semver";
import {EOL} from "os";

export class AndroidToolsInfo implements IAndroidToolsInfo {
	private static ANDROID_TARGET_PREFIX = "android";
	private static SUPPORTED_TARGETS = ["android-17", "android-18", "android-19", "android-21", "android-22", "android-23"];
	private static MIN_REQUIRED_COMPILE_TARGET = 22;
	private static REQUIRED_BUILD_TOOLS_RANGE_PREFIX = ">=23";
	private static VERSION_REGEX = /((\d+\.){2}\d+)/;
	private static MIN_JAVA_VERSION = "1.7.0";

	private showWarningsAsErrors: boolean;
	private toolsInfo: IAndroidToolsInfoData;
	private selectedCompileSdk: number;
	private installedTargetsCache: string[] = null;
	private androidHome = process.env["ANDROID_HOME"];
	private pathToAndroidExecutable: string;
	private _androidExecutableName: string;
	private get androidExecutableName(): string {
		if (!this._androidExecutableName) {
			this._androidExecutableName = "android";
			if (this.$hostInfo.isWindows) {
				this._androidExecutableName += ".bat";
			}
		}

		return this._androidExecutableName;
	}

	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $options: IOptions,
		private $adb: Mobile.IAndroidDebugBridge) { }

	public getPathToAndroidExecutable(options?: { showWarningsAsErrors: boolean }): IFuture<string> {
		return ((): string => {
			if (options) {
				this.showWarningsAsErrors = options.showWarningsAsErrors;
			}
			if (!this.pathToAndroidExecutable) {
				if (this.validateAndroidHomeEnvVariable(this.androidHome).wait()) {
					let androidPath = path.join(this.androidHome, "tools", this.androidExecutableName);
					if (!this.trySetAndroidPath(androidPath).wait() && !this.trySetAndroidPath(this.androidExecutableName).wait()) {
						this.printMessage(`Unable to find "${this.androidExecutableName}" executable file. Make sure you have set ANDROID_HOME environment variable correctly.`);
					}
				} else {
					this.$logger.trace("ANDROID_HOME environment variable is not set correctly.");
				}
			}

			return this.pathToAndroidExecutable;
		}).future<string>()();
	}

	private trySetAndroidPath(androidPath: string): IFuture<boolean> {
		return ((): boolean => {
			let isAndroidPathCorrect = true;
			try {
				let result = this.$adb.executeCommand(["--help"], { returnChildProcess: true }).wait();
				if (result && result.stdout) {
					this.$logger.trace(result.stdout);
					this.pathToAndroidExecutable = androidPath;
				} else {
					this.$logger.trace(`Unable to find android executable from '${androidPath}'.`);
					isAndroidPathCorrect = false;
				}
			} catch (err) {
				this.$logger.trace(`Error occurred while checking androidExecutable from '${androidPath}'. ${err.message}`);
				isAndroidPathCorrect = false;
			}

			return isAndroidPathCorrect;
		}).future<boolean>()();
	}

	public getToolsInfo(): IFuture<IAndroidToolsInfoData> {
		return ((): IAndroidToolsInfoData => {
			if (!this.toolsInfo) {
				let infoData: IAndroidToolsInfoData = Object.create(null);
				infoData.androidHomeEnvVar = this.androidHome;
				infoData.compileSdkVersion = this.getCompileSdk().wait();
				infoData.buildToolsVersion = this.getBuildToolsVersion().wait();
				infoData.targetSdkVersion = this.getTargetSdk().wait();
				infoData.supportRepositoryVersion = this.getAndroidSupportRepositoryVersion().wait();

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
			let isAndroidHomeValid = this.validateAndroidHomeEnvVariable(toolsInfoData.androidHomeEnvVar).wait();
			if (!toolsInfoData.compileSdkVersion) {
				this.printMessage(`Cannot find a compatible Android SDK for compilation. To be able to build for Android, install Android SDK ${AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET} or later.`,
					"Run `$ android` to manage your Android SDK versions.");
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

				let invalidBuildToolsAdditionalMsg = 'Run `android` from your command-line to install required `Android Build Tools`.';
				if (!isAndroidHomeValid) {
					invalidBuildToolsAdditionalMsg += ' In case you already have them installed, make sure `ANDROID_HOME` environment variable is set correctly.';
				}

				this.printMessage("You need to have the Android SDK Build-tools installed on your system. " + message, invalidBuildToolsAdditionalMsg);
				detectedErrors = true;
			}

			if (!toolsInfoData.supportRepositoryVersion) {
				let invalidSupportLibAdditionalMsg = 'Run `$ android`  to manage the Local Maven repository for Support Libraries.';
				if (!isAndroidHomeValid) {
					invalidSupportLibAdditionalMsg += ' In case you already have it installed, make sure `ANDROID_HOME` environment variable is set correctly.';
				}
				this.printMessage(`You need to have Android SDK ${AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET} or later and the latest Local Maven repository for Support Libraries installed on your system.`, invalidSupportLibAdditionalMsg);
				detectedErrors = true;
			}

			if (options && options.validateTargetSdk) {
				let targetSdk = toolsInfoData.targetSdkVersion;
				let newTarget = `${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-${targetSdk}`;
				if (!_.contains(AndroidToolsInfo.SUPPORTED_TARGETS, newTarget)) {
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
				" described in https://github.com/NativeScript/nativescript-cli#system-requirements.";
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
					if (!_.contains(installedTargets, androidCompileSdk)) {
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

	private getMatchingDir(pathToDir: string, versionRange: string): IFuture<string> {
		return ((): string => {
			let selectedVersion: string;
			if (this.$fs.exists(pathToDir).wait()) {
				let subDirs = this.$fs.readDirectory(pathToDir).wait();
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
		}).future<string>()();
	}

	private getBuildToolsRange(): string {
		return `${AndroidToolsInfo.REQUIRED_BUILD_TOOLS_RANGE_PREFIX} <=${this.getMaxSupportedVersion()}`;
	}

	private getBuildToolsVersion(): IFuture<string> {
		return ((): string => {
			let buildToolsVersion: string;
			if (this.androidHome) {
				let pathToBuildTools = path.join(this.androidHome, "build-tools");
				let buildToolsRange = this.getBuildToolsRange();
				buildToolsVersion = this.getMatchingDir(pathToBuildTools, buildToolsRange).wait();
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
				selectedAppCompatVersion = this.getMatchingDir(pathToAppCompat, requiredAppCompatRange).wait();
			}

			this.$logger.trace(`Selected AppCompat version is: ${selectedAppCompatVersion}`);
			return selectedAppCompatVersion;
		}).future<string>()();
	}

	private getLatestValidAndroidTarget(): IFuture<string> {
		return (() => {
			let installedTargets = this.getInstalledTargets().wait();
			return _.findLast(AndroidToolsInfo.SUPPORTED_TARGETS.sort(), supportedTarget => _.contains(installedTargets, supportedTarget));
		}).future<string>()();
	}

	private parseAndroidSdkString(androidSdkString: string): number {
		return parseInt(androidSdkString.replace(`${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-`, ""));
	}

	private getInstalledTargets(): IFuture<string[]> {
		return (() => {
			if (!this.installedTargetsCache) {
				try {
					let pathToAndroidExecutable = this.getPathToAndroidExecutable().wait();
					if (pathToAndroidExecutable) {
						let result = this.$childProcess.spawnFromEvent(pathToAndroidExecutable, ["list", "targets"], "close", {}, { throwError: false }).wait();
						if (result && result.stdout) {
							this.$logger.trace(result.stdout);
							this.installedTargetsCache = [];
							result.stdout.replace(/id: \d+ or "(.+)"/g, (m: string, p1: string) => (this.installedTargetsCache.push(p1), m));
						}
					}
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

	private _cachedAndroidHomeValidationResult: boolean = null;
	private validateAndroidHomeEnvVariable(androidHomeEnvVar: string): IFuture<boolean> {
		return ((): boolean => {
			if (this._cachedAndroidHomeValidationResult === null) {
				this._cachedAndroidHomeValidationResult = true;
				let expectedDirectoriesInAndroidHome = ["build-tools", "tools", "platform-tools", "extras"];
				if (!androidHomeEnvVar || !this.$fs.exists(androidHomeEnvVar).wait()) {
					this.printMessage("The ANDROID_HOME environment variable is not set or it points to a non-existent directory. You will not be able to perform any build-related operations for Android.",
						"To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory.");
					this._cachedAndroidHomeValidationResult = false;
				} else if (!_.any(expectedDirectoriesInAndroidHome.map(dir => this.$fs.exists(path.join(androidHomeEnvVar, dir)).wait()))) {
					this.printMessage("The ANDROID_HOME environment variable points to incorrect directory. You will not be able to perform any build-related operations for Android.",
						"To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory, " +
						"where you will find `tools` and `platform-tools` directories.");
					this._cachedAndroidHomeValidationResult = false;
				}
			}

			return this._cachedAndroidHomeValidationResult;
		}).future<boolean>()();
	}
}
$injector.register("androidToolsInfo", AndroidToolsInfo);
