///<reference path=".d.ts"/>
"use strict";

import * as path from "path";
import * as semver from "semver";

export class AndroidToolsInfo implements IAndroidToolsInfo {
	private static ANDROID_TARGET_PREFIX = "android";
	private static SUPPORTED_TARGETS = ["android-17", "android-18", "android-19", "android-21", "android-22"];
	private static MIN_REQUIRED_COMPILE_TARGET = 21;
	private static REQUIRED_BUILD_TOOLS_RANGE_PREFIX = ">=22";
	private static VERSION_REGEX = /^(\d+\.){2}\d+$/;
	private showWarningsAsErrors: boolean;
	private toolsInfo: IAndroidToolsInfoData;
	private selectedCompileSdk: number;
	private installedTargetsCache: string[] = null;
	private androidHome = process.env["ANDROID_HOME"];

	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $options: IOptions) {}

	public getToolsInfo(): IFuture<IAndroidToolsInfoData> {
		return ((): IAndroidToolsInfoData => {
			if(!this.toolsInfo) {
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

	public validateInfo(options?: {showWarningsAsErrors: boolean, validateTargetSdk: boolean}): IFuture<void> {
		return (() => {
			this.showWarningsAsErrors = options && options.showWarningsAsErrors;
			let toolsInfoData = this.getToolsInfo().wait();
			if(!toolsInfoData.androidHomeEnvVar || !this.$fs.exists(toolsInfoData.androidHomeEnvVar).wait()) {
				this.printMessage("The ANDROID_HOME environment variable is not set or it points to a non-existent directory. You will not be able to perform any build-related operations for Android.",
					"To be able to perform Android build-related operations, set the ANDROID_HOME variable to point to the root of your Android SDK installation directory.");
			}

			if(!toolsInfoData.compileSdkVersion) {
				this.printMessage(`Cannot find a compatible Android SDK for compilation. To be able to build for Android, install Android SDK ${AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET} or later.`,
							"Run `$ android` to manage your Android SDK versions.");
			}

			if(!toolsInfoData.buildToolsVersion) {
				let buildToolsRange = this.getBuildToolsRange();
				let versionRangeMatches = buildToolsRange.match(/^.*?([\d\.]+)\s+.*?([\d\.]+)$/);
				let message = `You can install any version in the following range: '${buildToolsRange}'.`;

				// Improve message in case buildToolsRange is something like: ">=22.0.0 <=22.0.0" - same numbers on both sides
				if(versionRangeMatches && versionRangeMatches[1] && versionRangeMatches[2] && versionRangeMatches[1] === versionRangeMatches[2]) {
					message = `You have to install version ${versionRangeMatches[1]}.`;
				}

				this.printMessage("You need to have the Android SDK Build-tools installed on your system. " + message,
					'Run "android" from your command-line to install required Android Build Tools.');
			}

			if(!toolsInfoData.supportRepositoryVersion) {
				this.printMessage(`You need to have the latest Android Support Repository installed on your system.`,
					'Run `$ android`  to manage the Android Support Repository.');
			}

			if(options && options.validateTargetSdk) {
				let targetSdk = toolsInfoData.targetSdkVersion;
				let newTarget = `${AndroidToolsInfo.ANDROID_TARGET_PREFIX}-${targetSdk}`;
				if(!_.contains(AndroidToolsInfo.SUPPORTED_TARGETS, newTarget)) {
					let supportedVersions = AndroidToolsInfo.SUPPORTED_TARGETS.sort();
					let minSupportedVersion = this.parseAndroidSdkString(_.first(supportedVersions));

					if(targetSdk && (targetSdk < minSupportedVersion)) {
						this.printMessage(`The selected Android target SDK ${newTarget} is not supported. You must target ${minSupportedVersion} or later.`);
					} else if(!targetSdk || targetSdk > this.getMaxSupportedVersion()) {
						this.$logger.warn(`Support for the selected Android target SDK ${newTarget} is not verified. Your Android app might not work as expected.`);
					}
				}
			}
		}).future<void>()();
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

		if(additionalMsg) {
			this.$logger.info(additionalMsg);
		}
	}

	private getCompileSdk(): IFuture<number> {
		return ((): number => {
			if(!this.selectedCompileSdk) {
				let latestValidAndroidTarget = this.getLatestValidAndroidTarget().wait();
				if(latestValidAndroidTarget) {
					let integerVersion = this.parseAndroidSdkString(latestValidAndroidTarget);

					if(integerVersion && integerVersion >= AndroidToolsInfo.MIN_REQUIRED_COMPILE_TARGET) {
						this.selectedCompileSdk = integerVersion;
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
			if(this.$fs.exists(pathToDir).wait()) {
				let subDirs = this.$fs.readDirectory(pathToDir).wait()
					.filter(buildTools => !!buildTools.match(AndroidToolsInfo.VERSION_REGEX));
				this.$logger.trace(`Versions found in ${pathToDir} are ${subDirs.join(", ")}`);
				selectedVersion = semver.maxSatisfying(subDirs, versionRange);
			}

			return selectedVersion;
		}).future<string>()();
	}

	private getBuildToolsRange(): string {
		return `${AndroidToolsInfo.REQUIRED_BUILD_TOOLS_RANGE_PREFIX} <=${this.getMaxSupportedVersion()}`;
	}

	private getBuildToolsVersion(): IFuture<string> {
		return ((): string => {
			let buildToolsVersion: string;
			if(this.androidHome) {
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
			if(compileSdkVersion) {
				requiredAppCompatRange = `>=${compileSdkVersion} <${compileSdkVersion + 1}`;
			}

			return requiredAppCompatRange;
		}).future<string>()();
	}

	private getAndroidSupportRepositoryVersion(): IFuture<string> {
		return ((): string => {
			let selectedAppCompatVersion: string;
			let requiredAppCompatRange = this.getAppCompatRange().wait();
			if(this.androidHome && requiredAppCompatRange) {
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
				this.installedTargetsCache = [];
				let output = this.$childProcess.exec('android list targets').wait();
				output.replace(/id: \d+ or "(.+)"/g, (m:string, p1:string) => (this.installedTargetsCache.push(p1), m));
			}
			return this.installedTargetsCache;
		}).future<string[]>()();
	}

	private getMaxSupportedVersion(): number {
		return this.parseAndroidSdkString(_.last(AndroidToolsInfo.SUPPORTED_TARGETS.sort()));
	}
}
$injector.register("androidToolsInfo", AndroidToolsInfo);
