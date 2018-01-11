import { Constants } from "./constants";
import { EOL } from "os";
import { HostInfo } from "./host-info";
import { AndroidLocalBuildRequirements } from "./local-build-requirements/android-local-build-requirements";
import { IosLocalBuildRequirements } from "./local-build-requirements/ios-local-build-requirements";
import { Helpers } from "./helpers";
import * as semver from "semver";

export class Doctor implements NativeScriptDoctor.IDoctor {
	private static MIN_SUPPORTED_POD_VERSION = "0.38.2";

	constructor(private androidLocalBuildRequirements: AndroidLocalBuildRequirements,
		private helpers: Helpers,
		private hostInfo: HostInfo,
		private iOSLocalBuildRequirements: IosLocalBuildRequirements,
		private sysInfo: NativeScriptDoctor.ISysInfo,
		private androidToolsInfo: NativeScriptDoctor.IAndroidToolsInfo) { }

	public async canExecuteLocalBuild(platform: string): Promise<boolean> {
		this.validatePlatform(platform);

		if (platform.toLowerCase() === Constants.ANDROID_PLATFORM_NAME.toLowerCase()) {
			return await this.androidLocalBuildRequirements.checkRequirements();
		} else if (platform.toLowerCase() === Constants.IOS_PLATFORM_NAME.toLowerCase()) {
			return await this.iOSLocalBuildRequirements.checkRequirements();
		}

		return false;
	}

	public async getWarnings(): Promise<NativeScriptDoctor.IWarning[]> {
		let result: NativeScriptDoctor.IWarning[] = [];
		const sysInfoData = await this.sysInfo.getSysInfo();

		const androidHomeValidationErrors = this.androidToolsInfo.validateAndroidHomeEnvVariable();
		if (androidHomeValidationErrors.length > 0) {
			result = result.concat(androidHomeValidationErrors);
		}

		if (!sysInfoData.adbVer) {
			result.push({
				warning: "WARNING: adb from the Android SDK is not installed or is not configured properly. ",
				additionalInformation: "For Android-related operations, the NativeScript CLI will use a built-in version of adb." + EOL
				+ "To avoid possible issues with the native Android emulator, Genymotion or connected" + EOL
				+ "Android devices, verify that you have installed the latest Android SDK and" + EOL
				+ "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + EOL,
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			});
		}

		if (!sysInfoData.isAndroidSdkConfiguredCorrectly) {
			result.push({
				warning: "WARNING: The Android SDK is not installed or is not configured properly.",
				additionalInformation: "You will not be able to run your apps in the native emulator. To be able to run apps" + EOL
				+ "in the native Android emulator, verify that you have installed the latest Android SDK " + EOL
				+ "and its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + EOL,
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			});
		}

		const androidToolsInfoValidationErrors = this.androidToolsInfo.validateInfo();
		if (androidToolsInfoValidationErrors.length > 0) {
			result = result.concat(androidToolsInfoValidationErrors);
		}

		const javacValidationErrors = this.androidToolsInfo.validateJavacVersion(sysInfoData.javacVersion);
		if (javacValidationErrors.length > 0) {
			result = result.concat(javacValidationErrors);
		}

		if (this.hostInfo.isDarwin) {
			if (!sysInfoData.xcodeVer) {
				result.push({
					warning: "WARNING: Xcode is not installed or is not configured properly.",
					additionalInformation: "You will not be able to build your projects for iOS or run them in the iOS Simulator." + EOL
					+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed Xcode." + EOL,
					platforms: [Constants.IOS_PLATFORM_NAME]
				});
			}

			if (!sysInfoData.xcodeprojGemLocation) {
				result.push({
					warning: "WARNING: xcodeproj gem is not installed or is not configured properly.",
					additionalInformation: "You will not be able to build your projects for iOS." + EOL
					+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed xcodeproj." + EOL,
					platforms: [Constants.IOS_PLATFORM_NAME]
				});
			}

			if (!sysInfoData.cocoaPodsVer) {
				result.push({
					warning: "WARNING: CocoaPods is not installed or is not configured properly.",
					additionalInformation: "You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
					+ "To be able to build such projects, verify that you have installed CocoaPods.",
					platforms: [Constants.IOS_PLATFORM_NAME]
				});
			}

			if (sysInfoData.cocoaPodsVer && sysInfoData.isCocoaPodsUpdateRequired) {
				result.push({
					warning: "WARNING: CocoaPods update required.",
					additionalInformation: `You are using CocoaPods version ${sysInfoData.cocoaPodsVer} which does not support Xcode ${sysInfoData.xcodeVer} yet.${EOL}${EOL}You can update your cocoapods by running $sudo gem install cocoapods from a terminal.${EOL}${EOL}In order for the NativeScript CLI to be able to work correctly with this setup you need to install xcproj command line tool and add it to your PATH.Xcproj can be installed with homebrew by running $ brew install xcproj from the terminal`,
					platforms: [Constants.IOS_PLATFORM_NAME]
				});
			}

			if (sysInfoData.xcodeVer && sysInfoData.cocoaPodsVer) {
				let isCocoaPodsWorkingCorrectly = await this.sysInfo.isCocoaPodsWorkingCorrectly();
				if (!isCocoaPodsWorkingCorrectly) {
					result.push({
						warning: "WARNING: There was a problem with CocoaPods",
						additionalInformation: "Verify that CocoaPods are configured properly.",
						platforms: [Constants.IOS_PLATFORM_NAME]
					});
				}
			}

			if (sysInfoData.cocoaPodsVer && semver.valid(sysInfoData.cocoaPodsVer) && semver.lt(sysInfoData.cocoaPodsVer, Doctor.MIN_SUPPORTED_POD_VERSION)) {
				result.push({
					warning: `WARNING: Your current CocoaPods version is earlier than ${Doctor.MIN_SUPPORTED_POD_VERSION}.`,
					additionalInformation: "You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
					+ `To be able to build such projects, verify that you have at least ${Doctor.MIN_SUPPORTED_POD_VERSION} version installed.`,
					platforms: [Constants.IOS_PLATFORM_NAME]
				});
			}
		} else {
			result.push({
				warning: "NOTE: You can develop for iOS only on Mac OS X systems.",
				additionalInformation: "To be able to work with iOS devices and projects, you need Mac OS X Mavericks or later." + EOL,
				platforms: [Constants.IOS_PLATFORM_NAME]
			});
		}

		if (!sysInfoData.javacVersion) {
			result.push({
				warning: "WARNING: The Java Development Kit (JDK) is not installed or is not configured properly.",
				additionalInformation: "You will not be able to work with the Android SDK and you might not be able" + EOL
				+ "to perform some Android-related operations. To ensure that you can develop and" + EOL
				+ "test your apps for Android, verify that you have installed the JDK as" + EOL
				+ "described in http://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html (for JDK 8)." + EOL,
				platforms: [Constants.ANDROID_PLATFORM_NAME]
			});
		}

		if (!sysInfoData.gitVer) {
			result.push({
				warning: "WARNING: Git is not installed or not configured properly.",
				additionalInformation: "You will not be able to create and work with Screen Builder projects." + EOL
				+ "To be able to work with Screen Builder projects, download and install Git as described" + EOL
				+ "in https://git-scm.com/downloads and add the git executable to your PATH." + EOL,
				platforms: Constants.SUPPORTED_PLATFORMS
			});
		}

		return result;
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
