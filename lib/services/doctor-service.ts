///<reference path="../.d.ts"/>
"use strict";
import {EOL} from "os";
import * as semver from "semver";

class DoctorService implements IDoctorService {
	private static MIN_SUPPORTED_POD_VERSION = "0.38.2";

	constructor(private $androidToolsInfo: IAndroidToolsInfo,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $sysInfo: ISysInfo) {	}

	public printWarnings(): boolean {
		let result = false;
		let androidToolsInfo = {
			pathToAdb: this.$androidToolsInfo.getPathToAdbFromAndroidHome().wait(),
			pathToAndroid: this.$androidToolsInfo.getPathToAndroidExecutable().wait()
		};
		let sysInfo = this.$sysInfo.getSysInfo(androidToolsInfo);

		if (!sysInfo.adbVer) {
			this.$logger.warn("WARNING: adb from the Android SDK is not installed or is not configured properly.");
			this.$logger.out("For Android-related operations, the NativeScript CLI will use a built-in version of adb." + EOL
			+ "To avoid possible issues with the native Android emulator, Genymotion or connected" + EOL
			+ "Android devices, verify that you have installed the latest Android SDK and" + EOL
			+ "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + EOL);

			this.printPackageManagerTip();
			result = true;
		}

		if (!sysInfo.androidInstalled) {
			this.$logger.warn("WARNING: The Android SDK is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for Android and run them in the native emulator." + EOL
				+ "To be able to build for Android and run apps in the native emulator, verify that you have" + EOL
				+ "installed the latest Android SDK and its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + EOL
			);

			this.printPackageManagerTip();
			result = true;
		}

		if (this.$hostInfo.isDarwin) {
			if(!sysInfo.xcodeVer) {
				this.$logger.warn("WARNING: Xcode is not installed or is not configured properly.");
				this.$logger.out("You will not be able to build your projects for iOS or run them in the iOS Simulator." + EOL
				+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed Xcode." + EOL);
				result = true;
			}

			if(!sysInfo.cocoapodVer ) {
				this.$logger.warn("WARNING: CocoaPod is not installed or is not configured properly.");
				this.$logger.out("You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
					+ "To be able to build such projects, verify that you have installed CocoaPod.");
				result = true;
			}

			if(sysInfo.cocoapodVer && semver.lt(sysInfo.cocoapodVer, DoctorService.MIN_SUPPORTED_POD_VERSION)) {
				this.$logger.warn(`WARNING: CocoaPods version is lower than ${DoctorService.MIN_SUPPORTED_POD_VERSION}`);
				this.$logger.out("You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
					+ `To be able to build such projects, verify that you have at least ${DoctorService.MIN_SUPPORTED_POD_VERSION} version installed.`);
				result = true;
			}
		} else {
			this.$logger.out("NOTE: You can develop for iOS only on Mac OS X systems.");
			this.$logger.out("To be able to work with iOS devices and projects, you need Mac OS X Mavericks or later." + EOL);
		}

		if(!sysInfo.javaVer) {
			this.$logger.warn("WARNING: The Java Development Kit (JDK) is not installed or is not configured properly.");
			this.$logger.out("You will not be able to work with the Android SDK and you might not be able" + EOL
				+ "to perform some Android-related operations. To ensure that you can develop and" + EOL
				+ "test your apps for Android, verify that you have installed the JDK as" + EOL
				+ "described in http://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html (for JDK 8)" + EOL
				+ "or http://docs.oracle.com/javase/7/docs/webnotes/install/ (for JDK 7)." + EOL);
			result = true;
		}

		let androidToolsIssues = this.$androidToolsInfo.validateInfo().wait();
		let javaVersionIssue = this.$androidToolsInfo.validateJavacVersion(sysInfo.javacVersion).wait();
		return result || androidToolsIssues || javaVersionIssue;
	}

	private printPackageManagerTip() {
		if (this.$hostInfo.isWindows) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + EOL);
		} else if (this.$hostInfo.isDarwin) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + EOL);
		}
	}
}
$injector.register("doctorService", DoctorService);
