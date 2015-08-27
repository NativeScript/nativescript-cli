///<reference path="../.d.ts"/>
"use strict";
import {EOL} from "os";
import * as helpers from "../common/helpers";

class DoctorService implements IDoctorService {
	private static MIN_SUPPORTED_GRADLE_VERSION = "2.3";

	constructor(
		private $hostInfo: IHostInfo,
		private $sysInfo: ISysInfo,
		private $logger: ILogger) {	}

	public printWarnings(): boolean {
		let result = false;
		let sysInfo = this.$sysInfo.getSysInfo();

		if (!sysInfo.adbVer) {
			this.$logger.warn("WARNING: adb from the Android SDK is not installed or is not configured properly.");
			this.$logger.out("For Android-related operations, the NativeScript CLI will use a built-in version of adb." + EOL
			+ "To avoid possible issues with the native Android emulator, Genymotion or connected" + EOL
			+ "Android devices, verify that you have installed the latest Android SDK and" + EOL
			+ "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + EOL);

			this.printPackageManagerTip();
			result = true;
		}
		if (!sysInfo.antVer) {
			this.$logger.warn("WARNING: Apache Ant is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for Android." + EOL
			+ "To be able to build for Android, download and install Apache Ant and" + EOL
			+ "its dependencies as described in http://ant.apache.org/manual/index.html" + EOL);

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
		if (this.$hostInfo.isDarwin && !sysInfo.xcodeVer) {
			this.$logger.warn("WARNING: Xcode is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for iOS or run them in the iOS Simulator." + EOL
			+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed Xcode." + EOL);
			result = true;
		}
		if (!this.$hostInfo.isDarwin) {
			this.$logger.warn("WARNING: You can work with iOS only on Mac OS X systems.");
			this.$logger.out("To be able to work with iOS devices and projects, you need Mac OS X Mavericks or later." + EOL);
			result = true;
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

		if(!sysInfo.gradleVer) {
			this.$logger.warn("WARNING: Gradle is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for Android or run them in the emulator or on a connected device." + EOL
				+ "To be able to build for Android and run apps in the emulator on on a connected device, verify that you have installed Gradle.");
		}
		
		if(sysInfo.gradleVer && helpers.versionCompare(sysInfo.gradleVer, DoctorService.MIN_SUPPORTED_GRADLE_VERSION) === -1) {
			this.$logger.warn(`WARNING: Gradle version is lower than ${DoctorService.MIN_SUPPORTED_GRADLE_VERSION}.`);
			this.$logger.out("You will not be able to build your projects for Android or run them in the emulator or on a connected device." + EOL
				+ `To be able to build for Android and run apps in the emulator on on a connected device, verify thqt you have at least ${DoctorService.MIN_SUPPORTED_GRADLE_VERSION} version installed.`);
		}

		if(!sysInfo.javacVersion) {
			this.$logger.warn("WARNING: Javac is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for Android." + EOL
				+ "To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" + EOL +
				" described in https://github.com/NativeScript/nativescript-cli#system-requirements.");
		}

		return result;
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
