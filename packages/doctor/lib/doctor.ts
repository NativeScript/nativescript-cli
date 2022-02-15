import { Constants } from "./constants";
import { EOL } from "os";
import { HostInfo } from "./host-info";
import { AndroidLocalBuildRequirements } from "./local-build-requirements/android-local-build-requirements";
import { IosLocalBuildRequirements } from "./local-build-requirements/ios-local-build-requirements";
import { Helpers } from "./helpers";
import * as semver from "semver";

export class Doctor implements NativeScriptDoctor.IDoctor {
	private static MIN_SUPPORTED_POD_VERSION = "1.0.0";

	constructor(private androidLocalBuildRequirements: AndroidLocalBuildRequirements,
		private helpers: Helpers,
		private hostInfo: HostInfo,
		private iOSLocalBuildRequirements: IosLocalBuildRequirements,
		private sysInfo: NativeScriptDoctor.ISysInfo,
		private androidToolsInfo: NativeScriptDoctor.IAndroidToolsInfo) { }

	public async canExecuteLocalBuild(platform: string, projectDir?: string, runtimeVersion?: string): Promise<boolean> {
		this.validatePlatform(platform);

		if (platform.toLowerCase() === Constants.ANDROID_PLATFORM_NAME.toLowerCase()) {
			return await this.androidLocalBuildRequirements.checkRequirements(projectDir, runtimeVersion);
		} else if (platform.toLowerCase() === Constants.IOS_PLATFORM_NAME.toLowerCase()) {
			return await this.iOSLocalBuildRequirements.checkRequirements();
		}

		return false;
	}

	public async getInfos(config?: NativeScriptDoctor.ISysInfoConfig): Promise<NativeScriptDoctor.IInfo[]> {
		let result: NativeScriptDoctor.IInfo[] = [];
		const sysInfoData = await this.sysInfo.getSysInfo(config);

		if (!config || !config.platform || config.platform.toLowerCase() === Constants.ANDROID_PLATFORM_NAME.toLowerCase()) {
			result = result.concat(this.getAndroidInfos(sysInfoData, config && config.projectDir, config && config.androidRuntimeVersion));
		}

		if (!config || !config.platform || config.platform.toLowerCase() === Constants.IOS_PLATFORM_NAME.toLowerCase()) {
			result = result.concat(await this.getiOSInfos(sysInfoData));
		}

		if (!this.hostInfo.isDarwin) {
			result.push({
				message: "Local builds for iOS can be executed only on a macOS system. To build for iOS on a different operating system, you can use the NativeScript cloud infrastructure.",
				additionalInformation: "",
				platforms: [Constants.IOS_PLATFORM_NAME],
				type: Constants.INFO_TYPE_NAME
			});
		}

		return result;
	}

	public async getWarnings(config?: NativeScriptDoctor.ISysInfoConfig): Promise<NativeScriptDoctor.IWarning[]> {
		const info = await this.getInfos(config);
		return info.filter(item => item.type === Constants.WARNING_TYPE_NAME)
			.map(item => this.convertInfoToWarning(item));
	}

	private getAndroidInfos(sysInfoData: NativeScriptDoctor.ISysInfoData, projectDir?: string, runtimeVersion?: string): NativeScriptDoctor.IInfo[] {
		let result: NativeScriptDoctor.IInfo[] = [];

		result = result.concat(
			this.processValidationErrors({
				warnings: this.androidToolsInfo.validateAndroidHomeEnvVariable(),
				infoMessage: "Your ANDROID_HOME environment variable is set and points to correct directory.",
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			}),
			this.processSysInfoItem({
				item: sysInfoData.adbVer,
				infoMessage: "Your adb from the Android SDK is correctly installed.",
				warningMessage: "adb from the Android SDK is not installed or is not configured properly. ",
				additionalInformation: "For Android-related operations, the NativeScript CLI will use a built-in version of adb." + EOL
					+ "To avoid possible issues with the native Android emulator, Genymotion or connected" + EOL
					+ "Android devices, verify that you have installed the latest Android SDK and" + EOL
					+ "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements",
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			}),
			this.processSysInfoItem({
				item: sysInfoData.isAndroidSdkConfiguredCorrectly,
				infoMessage: "The Android SDK is installed.",
				warningMessage: "The Android SDK is not installed or is not configured properly.",
				additionalInformation: "You will not be able to run your apps in the native emulator. To be able to run apps" + EOL
					+ "in the native Android emulator, verify that you have installed the latest Android SDK " + EOL
					+ "and its dependencies as described in http://developer.android.com/sdk/index.html#Requirements",
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			}),
			this.processValidationErrors({
				warnings: this.androidToolsInfo.validateInfo({ projectDir }),
				infoMessage: "A compatible Android SDK for compilation is found.",
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			}),
			this.processValidationErrors({
				warnings: this.androidToolsInfo.validateJavacVersion(sysInfoData.javacVersion, projectDir, runtimeVersion),
				infoMessage: "Javac is installed and is configured properly.",
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			}),
			this.processSysInfoItem({
				item: sysInfoData.javacVersion,
				infoMessage: "The Java Development Kit (JDK) is installed and is configured properly.",
				warningMessage: "The Java Development Kit (JDK) is not installed or is not configured properly.",
				additionalInformation: "You will not be able to work with the Android SDK and you might not be able" + EOL
					+ "to perform some Android-related operations. To ensure that you can develop and" + EOL
					+ "test your apps for Android, verify that you have installed the JDK as" + EOL
					+ "described in http://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html (for JDK 8).",
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			})
		);

		return result;
	}

	private async getiOSInfos(sysInfoData: NativeScriptDoctor.ISysInfoData): Promise<NativeScriptDoctor.IInfo[]> {
		let result: NativeScriptDoctor.IInfo[] = [];
		if (this.hostInfo.isDarwin) {
			result = result.concat(
				this.processSysInfoItem({
					item: sysInfoData.xcodeVer,
					infoMessage: "Xcode is installed and is configured properly.",
					warningMessage: "Xcode is not installed or is not configured properly.",
					additionalInformation: "You will not be able to build your projects for iOS or run them in the iOS Simulator." + EOL
						+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed Xcode.",
					platforms: [Constants.IOS_PLATFORM_NAME]
				}),
				this.processSysInfoItem({
					item: sysInfoData.xcodeprojLocation,
					infoMessage: "xcodeproj is installed and is configured properly.",
					warningMessage: "xcodeproj is not installed or is not configured properly.",
					additionalInformation: "You will not be able to build your projects for iOS." + EOL
						+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed xcodeproj.",
					platforms: [Constants.IOS_PLATFORM_NAME]
				}),
				this.processSysInfoItem({
					item: sysInfoData.cocoaPodsVer,
					infoMessage: "CocoaPods are installed.",
					warningMessage: "CocoaPods is not installed or is not configured properly.",
					additionalInformation: "You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
						+ "To be able to build such projects, verify that you have installed CocoaPods (`sudo gem install cocoapods`).",
					platforms: [Constants.IOS_PLATFORM_NAME]
				}),
				this.processSysInfoItem({
					item: !sysInfoData.cocoaPodsVer || !sysInfoData.isCocoaPodsUpdateRequired,
					infoMessage: "CocoaPods update is not required.",
					warningMessage: "CocoaPods update required.",
					additionalInformation: `You are using CocoaPods version ${sysInfoData.cocoaPodsVer} which does not support Xcode ${sysInfoData.xcodeVer} yet.${EOL}${EOL}You can update your cocoapods by running $sudo gem install cocoapods from a terminal.${EOL}${EOL}In order for the NativeScript CLI to be able to work correctly with this setup you need to install xcproj command line tool and add it to your PATH.Xcproj can be installed with homebrew by running $ brew install xcproj from the terminal`,
					platforms: [Constants.IOS_PLATFORM_NAME]
				})
			);

			if (sysInfoData.xcodeVer && sysInfoData.cocoaPodsVer) {
				const isCocoaPodsWorkingCorrectly = await this.sysInfo.isCocoaPodsWorkingCorrectly();
				result = result.concat(
					this.processSysInfoItem({
						item: isCocoaPodsWorkingCorrectly,
						infoMessage: "CocoaPods are configured properly.",
						warningMessage: "There was a problem with CocoaPods",
						additionalInformation: "Verify that CocoaPods are configured properly.",
						platforms: [Constants.IOS_PLATFORM_NAME],
					})
				);
			}

			result = result.concat(
				this.processSysInfoItem({
					item: !sysInfoData.cocoaPodsVer || !semver.valid(sysInfoData.cocoaPodsVer) || !semver.lt(sysInfoData.cocoaPodsVer, Doctor.MIN_SUPPORTED_POD_VERSION),
					infoMessage: `Your current CocoaPods version is newer than ${Doctor.MIN_SUPPORTED_POD_VERSION}.`,
					warningMessage: `Your current CocoaPods version is earlier than ${Doctor.MIN_SUPPORTED_POD_VERSION}.`,
					additionalInformation: "You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
						+ `To be able to build such projects, verify that you have at least ${Doctor.MIN_SUPPORTED_POD_VERSION} version installed.`,
					platforms: [Constants.IOS_PLATFORM_NAME]
				}),
				this.processSysInfoItem({
					item: sysInfoData.pythonInfo.isInstalled,
					infoMessage: "Python installed and configured correctly.",
					warningMessage: `Couldn't retrieve installed python packages.`,
					additionalInformation: "We cannot verify your python installation is setup correctly. Please, make sure you have both 'python' and 'pip' installed." + EOL
						+ `Error while validating Python packages. Error is: ${sysInfoData.pythonInfo.installationErrorMessage}`,
					platforms: [Constants.IOS_PLATFORM_NAME]
				}),
				this.processSysInfoItem({
					item: sysInfoData.pythonInfo.isSixPackageInstalled,
					infoMessage: `The Python 'six' package is found.`,
					warningMessage: `The Python 'six' package not found.`,
					additionalInformation: "This package is required by the Debugger library (LLDB) for iOS. You can install it by first making sure you have pip installed and then running 'pip install six' from the terminal.",
					platforms: [Constants.IOS_PLATFORM_NAME]
				})
			);

			if (sysInfoData.xcodeVer) {
				result = result.concat(
					this.processSysInfoItem({
						item: await this.iOSLocalBuildRequirements.isXcodeVersionValid(),
						infoMessage: `Xcode version ${sysInfoData.xcodeVer} satisfies minimum required version ${Constants.XCODE_MIN_REQUIRED_VERSION}.`,
						warningMessage: `Xcode version ${sysInfoData.xcodeVer} is lower than minimum required version ${Constants.XCODE_MIN_REQUIRED_VERSION}.`,
						additionalInformation: "To build your application for iOS, update your Xcode.",
						platforms: [Constants.IOS_PLATFORM_NAME]
					})
				);
			}
		}

		return result;
	}

	private processSysInfoItem(data: { item: string | boolean, infoMessage: string, warningMessage: string, additionalInformation?: string, platforms: string[] }): NativeScriptDoctor.IInfo {
		if (!data.item) {
			return {
				message: `WARNING: ${data.warningMessage}`,
				additionalInformation: data.additionalInformation,
				platforms: data.platforms,
				type: Constants.WARNING_TYPE_NAME
			};
		}

		return {
			message: `${data.infoMessage}`,
			platforms: data.platforms,
			type: Constants.INFO_TYPE_NAME
		};
	}

	private processValidationErrors(data: { warnings: NativeScriptDoctor.IWarning[], infoMessage: string, platforms: string[] }): NativeScriptDoctor.IInfo[] {
		if (data.warnings.length > 0) {
			return data.warnings.map(warning => this.convertWarningToInfo(warning));
		}

		return [{
			message: data.infoMessage,
			platforms: data.platforms,
			type: Constants.INFO_TYPE_NAME
		}];
	}

	private convertWarningToInfo(warning: NativeScriptDoctor.IWarning): NativeScriptDoctor.IInfo {
		return {
			message: warning.warning,
			additionalInformation: warning.additionalInformation,
			platforms: warning.platforms,
			type: Constants.WARNING_TYPE_NAME
		};
	}

	private convertInfoToWarning(info: NativeScriptDoctor.IInfo): NativeScriptDoctor.IWarning {
		return {
			warning: info.message,
			additionalInformation: info.additionalInformation,
			platforms: info.platforms
		};
	}

	private isPlatformSupported(platform: string): boolean {
		return Constants.SUPPORTED_PLATFORMS.map(pl => pl.toLowerCase()).indexOf(platform.toLowerCase()) !== -1;
	}

	private validatePlatform(platform: string): void {
		if (!platform) {
			throw new Error("You must specify a platform.");
		}

		if (!this.isPlatformSupported(platform)) {
			throw new Error(`Platform ${platform} is not supported.The supported platforms are: ${Constants.SUPPORTED_PLATFORMS.join(", ")} `);
		}
	}
}
