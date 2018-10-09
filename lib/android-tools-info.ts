import * as path from "path";
import * as semver from "semver";
import { cache } from "./common/decorators";
import { androidToolsInfo } from "nativescript-doctor";

export class AndroidToolsInfo implements IAndroidToolsInfo {
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

	private showWarningsAsErrors: boolean;
	private toolsInfo: IAndroidToolsInfoData;
	private selectedCompileSdk: number;
	private get androidHome(): string {
		return process.env["ANDROID_HOME"];
	}

	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
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
			infoData.generateTypings = this.shouldGenerateTypings();

			this.toolsInfo = infoData;
		}

		return this.toolsInfo;
	}

	public validateInfo(options?: IAndroidToolsInfoValidateInput): boolean {
		let detectedErrors = false;
		this.showWarningsAsErrors = options && options.showWarningsAsErrors;
		const isAndroidHomeValid = this.validateAndroidHomeEnvVariable();

		detectedErrors = androidToolsInfo.validateInfo().map(warning => this.printMessage(warning.warning)).length > 0;

		if (options && options.validateTargetSdk) {
			detectedErrors = this.validateTargetSdk();
		}

		return detectedErrors || !isAndroidHomeValid;
	}

	public validateTargetSdk(options?: IAndroidToolsInfoOptions): boolean {
		this.showWarningsAsErrors = options && options.showWarningsAsErrors;

		const toolsInfoData = this.getToolsInfo();
		const targetSdk = toolsInfoData.targetSdkVersion;
		const newTarget = `${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-${targetSdk}`;

		if (!_.includes(AndroidToolsInfo.SUPPORTED_TARGETS, newTarget)) {
			const supportedVersions = AndroidToolsInfo.SUPPORTED_TARGETS.sort();
			const minSupportedVersion = this.parseAndroidSdkString(_.first(supportedVersions));

			if (targetSdk && (targetSdk < minSupportedVersion)) {
				this.printMessage(`The selected Android target SDK ${newTarget} is not supported. You must target ${minSupportedVersion} or later.`);
				return true;
			} else if (!targetSdk || targetSdk > this.getMaxSupportedVersion()) {
				this.$logger.warn(`Support for the selected Android target SDK ${newTarget} is not verified. Your Android app might not work as expected.`);
			}
		}

		return false;
	}

	public validateJavacVersion(installedJavacVersion: string, options?: IAndroidToolsInfoOptions): boolean {
		if (options) {
			this.showWarningsAsErrors = options.showWarningsAsErrors;
		}

		return androidToolsInfo.validateJavacVersion(installedJavacVersion).map(warning => this.printMessage(warning.warning)).length > 0;
	}

	public async getPathToAdbFromAndroidHome(): Promise<string> {
		try {
			return androidToolsInfo.getPathToAdbFromAndroidHome();
		} catch (err) {
			// adb does not exist, so ANDROID_HOME is not set correctly
			// try getting default adb path (included in CLI package)
			this.$logger.trace(`Error while executing '${path.join(this.androidHome, "platform-tools", "adb")} help'. Error is: ${err.message}`);
		}

		return null;
	}

	@cache()
	public validateAndroidHomeEnvVariable(options?: IAndroidToolsInfoOptions): boolean {
		if (options) {
			this.showWarningsAsErrors = options.showWarningsAsErrors;
		}

		return androidToolsInfo.validateAndroidHomeEnvVariable().map(warning => this.printMessage(warning.warning)).length > 0;
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
