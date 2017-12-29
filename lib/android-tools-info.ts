import * as path from "path";
import * as semver from "semver";
import { EOL } from "os";
import { cache } from "./common/decorators";

export class AndroidToolsInfo implements IAndroidToolsInfo {
	private static ANDROID_TARGET_PREFIX = "android";
	private static SUPPORTED_TARGETS = ["android-17", "android-18", "android-19", "android-21", "android-22", "android-23", "android-24", "android-25", "android-26"];
	private static MIN_REQUIRED_COMPILE_TARGET = 22;
	private static REQUIRED_BUILD_TOOLS_RANGE_PREFIX = ">=23";
	private static VERSION_REGEX = /((\d+\.){2}\d+)/;
	private static MIN_JAVA_VERSION = "1.8.0";
	private static MAX_JAVA_VERSION = "1.9.0";

	private showWarningsAsErrors: boolean;
	private toolsInfo: IAndroidToolsInfoData;
	private selectedCompileSdk: number;
	private get androidHome(): string {
		return process.env["ANDROID_HOME"];
	}

	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $options: IOptions,
		protected $staticConfig: Config.IStaticConfig) { }

	@cache()
	public getToolsInfo(): IAndroidToolsInfoData {
		if (!this.toolsInfo) {
			const infoData: IAndroidToolsInfoData = Object.create(null);
			infoData.androidHomeEnvVar = this.androidHome;
			infoData.compileSdkVersion = this.getCompileSdkVersion();
			infoData.buildToolsVersion = this.getBuildToolsVersion();
			infoData.targetSdkVersion = this.getTargetSdk();
			infoData.supportRepositoryVersion = this.getAndroidSupportRepositoryVersion();
			infoData.generateTypings = this.shouldGenerateTypings();

			this.toolsInfo = infoData;
		}

		return this.toolsInfo;
	}

	public validateInfo(options?: { showWarningsAsErrors: boolean, validateTargetSdk: boolean }): boolean {
		let detectedErrors = false;
		this.showWarningsAsErrors = options && options.showWarningsAsErrors;
		const toolsInfoData = this.getToolsInfo();
		const isAndroidHomeValid = this.validateAndroidHomeEnvVariable();
		if (!toolsInfoData.compileSdkVersion) {
			this.printMessage(`Cannot find a compatible Android SDK for compilation. To be able to build for Android, install Android SDK ${AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET} or later.`,
				`Run \`\$ ${this.getPathToSdkManagementTool()}\` to manage your Android SDK versions.`);
			detectedErrors = true;
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
			const targetSdk = toolsInfoData.targetSdkVersion;
			const newTarget = `${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-${targetSdk}`;
			if (!_.includes(AndroidToolsInfo.SUPPORTED_TARGETS, newTarget)) {
				const supportedVersions = AndroidToolsInfo.SUPPORTED_TARGETS.sort();
				const minSupportedVersion = this.parseAndroidSdkString(_.first(supportedVersions));

				if (targetSdk && (targetSdk < minSupportedVersion)) {
					this.printMessage(`The selected Android target SDK ${newTarget} is not supported. You must target ${minSupportedVersion} or later.`);
					detectedErrors = true;
				} else if (!targetSdk || targetSdk > this.getMaxSupportedVersion()) {
					this.$logger.warn(`Support for the selected Android target SDK ${newTarget} is not verified. Your Android app might not work as expected.`);
				}
			}
		}

		return detectedErrors || !isAndroidHomeValid;
	}

	public async validateJavacVersion(installedJavaVersion: string, options?: { showWarningsAsErrors: boolean }): Promise<boolean> {
		let hasProblemWithJavaVersion = false;
		if (options) {
			this.showWarningsAsErrors = options.showWarningsAsErrors;
		}

		const additionalMessage = "You will not be able to build your projects for Android." + EOL
			+ "To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" + EOL +
			" described in " + this.$staticConfig.SYS_REQUIREMENTS_LINK;
		const matchingVersion = (installedJavaVersion || "").match(AndroidToolsInfo.VERSION_REGEX);
		const installedJavaCompilerVersion = matchingVersion && matchingVersion[1];
		if (installedJavaCompilerVersion) {
			if (semver.lt(installedJavaCompilerVersion, AndroidToolsInfo.MIN_JAVA_VERSION)) {
				hasProblemWithJavaVersion = true;
				this.printMessage(`Javac version ${installedJavaVersion} is not supported. You have to install at least ${AndroidToolsInfo.MIN_JAVA_VERSION}.`, additionalMessage);
			} else if (semver.gt(installedJavaCompilerVersion, AndroidToolsInfo.MAX_JAVA_VERSION)) {
				hasProblemWithJavaVersion = true;
				this.printMessage(`Javac version ${installedJavaVersion} is not supported. You have to install version ${AndroidToolsInfo.MIN_JAVA_VERSION}.`, additionalMessage);
			}
		} else {
			hasProblemWithJavaVersion = true;
			this.printMessage("Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable.", additionalMessage);
		}

		return hasProblemWithJavaVersion;
	}

	public async getPathToAdbFromAndroidHome(): Promise<string> {
		if (this.androidHome) {
			const pathToAdb = path.join(this.androidHome, "platform-tools", "adb");
			try {
				await this.$childProcess.execFile(pathToAdb, ["help"]);
				return pathToAdb;
			} catch (err) {
				// adb does not exist, so ANDROID_HOME is not set correctly
				// try getting default adb path (included in CLI package)
				this.$logger.trace(`Error while executing '${pathToAdb} help'. Error is: ${err.message}`);
			}
		}

		return null;
	}

	@cache()
	public validateAndroidHomeEnvVariable(options?: { showWarningsAsErrors: boolean }): boolean {
		if (options) {
			this.showWarningsAsErrors = options.showWarningsAsErrors;
		}

		const expectedDirectoriesInAndroidHome = ["build-tools", "tools", "platform-tools", "extras"];
		let androidHomeValidationResult = true;

		if (!this.androidHome || !this.$fs.exists(this.androidHome)) {
			this.printMessage("The ANDROID_HOME environment variable is not set or it points to a non-existent directory. You will not be able to perform any build-related operations for Android.",
				"To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory.");
			androidHomeValidationResult = false;
		} else if (!_.some(expectedDirectoriesInAndroidHome.map(dir => this.$fs.exists(path.join(this.androidHome, dir))))) {
			this.printMessage("The ANDROID_HOME environment variable points to incorrect directory. You will not be able to perform any build-related operations for Android.",
				"To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory, " +
				"where you will find `tools` and `platform-tools` directories.");
			androidHomeValidationResult = false;
		}

		return androidHomeValidationResult;
	}

	@cache()
	private getPathToSdkManagementTool(): string {
		const sdkManagerName = "sdkmanager";
		let sdkManagementToolPath = sdkManagerName;

		const isAndroidHomeValid = this.validateAndroidHomeEnvVariable();

		if (isAndroidHomeValid) {
			// In case ANDROID_HOME is correct, check if sdkmanager exists and if not it means the SDK has not been updated.
			// In this case user shoud use `android` from the command-line instead of sdkmanager.
			const pathToSdkManager = path.join(this.androidHome, "tools", "bin", sdkManagerName);
			const pathToAndroidExecutable = path.join(this.androidHome, "tools", "android");
			const pathToExecutable = this.$fs.exists(pathToSdkManager) ? pathToSdkManager : pathToAndroidExecutable;

			this.$logger.trace(`Path to Android SDK Management tool is: ${pathToExecutable}`);

			sdkManagementToolPath = pathToExecutable.replace(this.androidHome, this.$hostInfo.isWindows ? "%ANDROID_HOME%" : "$ANDROID_HOME");
		}

		return sdkManagementToolPath;
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

	private getCompileSdkVersion(): number {
		if (!this.selectedCompileSdk) {
			const userSpecifiedCompileSdk = this.$options.compileSdk;
			if (userSpecifiedCompileSdk) {
				const installedTargets = this.getInstalledTargets();
				const androidCompileSdk = `${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-${userSpecifiedCompileSdk}`;
				if (!_.includes(installedTargets, androidCompileSdk)) {
					this.$errors.failWithoutHelp(`You have specified '${userSpecifiedCompileSdk}' for compile sdk, but it is not installed on your system.`);
				}

				this.selectedCompileSdk = userSpecifiedCompileSdk;
			} else {
				const latestValidAndroidTarget = this.getLatestValidAndroidTarget();
				if (latestValidAndroidTarget) {
					const integerVersion = this.parseAndroidSdkString(latestValidAndroidTarget);

					if (integerVersion && integerVersion >= AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET) {
						this.selectedCompileSdk = integerVersion;
					}
				}
			}
		}

		return this.selectedCompileSdk;
	}

	private getTargetSdk(): number {
		const targetSdk = this.$options.sdk ? parseInt(this.$options.sdk) : this.getCompileSdkVersion();
		this.$logger.trace(`Selected targetSdk is: ${targetSdk}`);
		return targetSdk;
	}

	private getMatchingDir(pathToDir: string, versionRange: string): string {
		let selectedVersion: string;
		if (this.$fs.exists(pathToDir)) {
			const subDirs = this.$fs.readDirectory(pathToDir);
			this.$logger.trace(`Directories found in ${pathToDir} are ${subDirs.join(", ")}`);

			const subDirsVersions = subDirs
				.map(dirName => {
					const dirNameGroups = dirName.match(AndroidToolsInfo.VERSION_REGEX);
					if (dirNameGroups) {
						return dirNameGroups[1];
					}

					return null;
				})
				.filter(dirName => !!dirName);
			this.$logger.trace(`Versions found in ${pathToDir} are ${subDirsVersions.join(", ")}`);
			const version = semver.maxSatisfying(subDirsVersions, versionRange);
			if (version) {
				selectedVersion = _.find(subDirs, dir => dir.indexOf(version) !== -1);
			}
		}
		this.$logger.trace("Selected version is: ", selectedVersion);
		return selectedVersion;
	}

	private getBuildToolsRange(): string {
		return `${AndroidToolsInfo.REQUIRED_BUILD_TOOLS_RANGE_PREFIX} <=${this.getMaxSupportedVersion()}`;
	}

	private getBuildToolsVersion(): string {
		let buildToolsVersion: string;
		if (this.androidHome) {
			const pathToBuildTools = path.join(this.androidHome, "build-tools");
			const buildToolsRange = this.getBuildToolsRange();
			buildToolsVersion = this.getMatchingDir(pathToBuildTools, buildToolsRange);
		}

		return buildToolsVersion;
	}

	private getAppCompatRange(): string {
		const compileSdkVersion = this.getCompileSdkVersion();
		let requiredAppCompatRange: string;
		if (compileSdkVersion) {
			requiredAppCompatRange = `>=${compileSdkVersion} <${compileSdkVersion + 1}`;
		}

		return requiredAppCompatRange;
	}

	private getAndroidSupportRepositoryVersion(): string {
		let selectedAppCompatVersion: string;
		const requiredAppCompatRange = this.getAppCompatRange();
		if (this.androidHome && requiredAppCompatRange) {
			const pathToAppCompat = path.join(this.androidHome, "extras", "android", "m2repository", "com", "android", "support", "appcompat-v7");
			selectedAppCompatVersion = this.getMatchingDir(pathToAppCompat, requiredAppCompatRange);
		}

		this.$logger.trace(`Selected AppCompat version is: ${selectedAppCompatVersion}`);
		return selectedAppCompatVersion;
	}

	private getLatestValidAndroidTarget(): string {
		const installedTargets = this.getInstalledTargets();
		return _.findLast(AndroidToolsInfo.SUPPORTED_TARGETS.sort(), supportedTarget => _.includes(installedTargets, supportedTarget));
	}

	private parseAndroidSdkString(androidSdkString: string): number {
		return parseInt(androidSdkString.replace(`${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-`, ""));
	}

	@cache()
	private getInstalledTargets(): string[] {
		let installedTargets: string[] = [];
		if (this.androidHome) {
			const pathToInstalledTargets = path.join(this.androidHome, "platforms");
			if (this.$fs.exists(pathToInstalledTargets)) {
				installedTargets = this.$fs.readDirectory(pathToInstalledTargets);
			}
		}
		this.$logger.trace("Installed Android Targets are: ", installedTargets);

		return installedTargets;
	}

	private getMaxSupportedVersion(): number {
		return this.parseAndroidSdkString(_.last(AndroidToolsInfo.SUPPORTED_TARGETS.sort()));
	}
}
$injector.register("androidToolsInfo", AndroidToolsInfo);
