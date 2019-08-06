import * as path from "path";
import { cache } from "./common/decorators";
import { androidToolsInfo } from "nativescript-doctor";

export class AndroidToolsInfo implements IAndroidToolsInfo {
	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $options: IOptions,
		protected $staticConfig: Config.IStaticConfig) {
	}

	@cache()
	public getToolsInfo(config: IProjectDir): IAndroidToolsInfoData {
		const infoData: IAndroidToolsInfoData = <IAndroidToolsInfoData>(androidToolsInfo.getToolsInfo({projectDir: config.projectDir}));

		infoData.androidHomeEnvVar = androidToolsInfo.androidHome;
		infoData.compileSdkVersion = this.getCompileSdkVersion(infoData.installedTargets, infoData.compileSdkVersion);
		infoData.targetSdkVersion = this.getTargetSdk(infoData.compileSdkVersion);
		infoData.generateTypings = this.shouldGenerateTypings();

		this.$logger.trace("Installed Android Targets are: ", infoData.installedTargets);
		this.$logger.trace("Selected buildToolsVersion is:", infoData.buildToolsVersion);

		return infoData;
	}

	public validateInfo(options?: IAndroidToolsInfoValidateInput): boolean {
		let detectedErrors = false;
		const showWarningsAsErrors = options && options.showWarningsAsErrors;
		const isAndroidHomeValid = this.validateAndroidHomeEnvVariable(options);

		detectedErrors = androidToolsInfo.validateInfo({projectDir: options.projectDir}).map(warning => this.printMessage(warning.warning, showWarningsAsErrors)).length > 0;

		if (options && options.validateTargetSdk) {
			detectedErrors = this.validateTargetSdk(options);
		}

		return detectedErrors || !isAndroidHomeValid;
	}

	public validateTargetSdk(options: IAndroidToolsInfoOptions): boolean {
		let detectedErrors = false;

		const toolsInfoData = this.getToolsInfo({ projectDir: options.projectDir});
		const targetSdk = toolsInfoData.targetSdkVersion;

		detectedErrors = androidToolsInfo.validateMinSupportedTargetSdk({targetSdk, projectDir: options.projectDir}).map(warning => this.printMessage(warning.warning, options.showWarningsAsErrors)).length > 0;

		if (!detectedErrors) {
			androidToolsInfo.validataMaxSupportedTargetSdk({targetSdk, projectDir: options.projectDir}).map(warning => this.$logger.warn(warning.warning));
		}

		return detectedErrors;
	}

	public validateJavacVersion(installedJavacVersion: string, options?: IAndroidToolsInfoOptions): boolean {
		const showWarningsAsErrors = options && options.showWarningsAsErrors;

		return androidToolsInfo.validateJavacVersion(installedJavacVersion).map(warning => this.printMessage(warning.warning, showWarningsAsErrors)).length > 0;
	}

	public async getPathToAdbFromAndroidHome(): Promise<string> {
		try {
			return androidToolsInfo.getPathToAdbFromAndroidHome();
		} catch (err) {
			// adb does not exist, so ANDROID_HOME is not set correctly
			// try getting default adb path (included in CLI package)
			this.$logger.trace(`Error while executing '${path.join(androidToolsInfo.androidHome, "platform-tools", "adb")} help'. Error is: ${err.message}`);
		}

		return null;
	}

	@cache()
	public validateAndroidHomeEnvVariable(options?: IAndroidToolsInfoOptions): boolean {
		const showWarningsAsErrors = options && options.showWarningsAsErrors;

		return androidToolsInfo.validateAndroidHomeEnvVariable().map(warning => this.printMessage(warning.warning, showWarningsAsErrors)).length > 0;
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
	 * @return {void}
	 */
	private printMessage(msg: string, showWarningsAsErrors: boolean): void {
		if (showWarningsAsErrors) {
			this.$errors.failWithoutHelp(msg);
		} else {
			this.$logger.warn(msg);
		}
	}

	private getCompileSdkVersion(installedTargets: string[], latestCompileSdk: number): number {
		const userSpecifiedCompileSdk = this.$options.compileSdk;

		if (userSpecifiedCompileSdk) {
			const androidCompileSdk = `${androidToolsInfo.ANDROID_TARGET_PREFIX}-${userSpecifiedCompileSdk}`;
			if (!_.includes(installedTargets, androidCompileSdk)) {
				this.$errors.failWithoutHelp(`You have specified '${userSpecifiedCompileSdk}' for compile sdk, but it is not installed on your system.`);
			}

			return userSpecifiedCompileSdk;
		}

		return latestCompileSdk;
	}

	// TODO check if still needed
	private getTargetSdk(compileSdk: number): number {
		const targetSdk = this.$options.sdk ? parseInt(this.$options.sdk) : compileSdk;
		this.$logger.trace(`Selected targetSdk is: ${targetSdk}`);
		return targetSdk;
	}
}
$injector.register("androidToolsInfo", AndroidToolsInfo);
