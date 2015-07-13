///<reference path="../.d.ts"/>
"use strict";
import os = require("os");

class DoctorService implements IDoctorService {
	
	constructor(
		private $hostInfo: IHostInfo,
		private $sysInfo: ISysInfo,
		private $logger: ILogger) {	}
	
	public printWarnings(): boolean {
		let result = false;
		let sysInfo = this.$sysInfo.getSysInfo();
		
		if (!sysInfo.adbVer) {
			this.$logger.warn("WARNING: adb from the Android SDK is not installed or is not configured properly.");
			this.$logger.out("For Android-related operations, the NativeScript CLI will use a built-in version of adb." + os.EOL
			+ "To avoid possible issues with the native Android emulator, Genymotion or connected" + os.EOL
			+ "Android devices, verify that you have installed the latest Android SDK and" + os.EOL
			+ "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + os.EOL);

			this.printPackageManagerTip();
			result = true;
		}
		if (!sysInfo.antVer) {
			this.$logger.warn("WARNING: Apache Ant is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for Android." + os.EOL
			+ "To be able to build for Android, download and install Apache Ant and" + os.EOL
			+ "its dependencies as described in http://ant.apache.org/manual/index.html" + os.EOL);

			this.printPackageManagerTip();
			result = true;
		}
		if (!sysInfo.androidInstalled) {
			this.$logger.warn("WARNING: The Android SDK is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for Android and run them in the native emulator." + os.EOL
				+ "To be able to build for Android and run apps in the native emulator, verify that you have" + os.EOL
				+ "installed the latest Android SDK and its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + os.EOL
			);

			this.printPackageManagerTip();
			result = true;
		}
		if (this.$hostInfo.isDarwin && !sysInfo.xcodeVer) {
			this.$logger.warn("WARNING: Xcode is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for iOS or run them in the iOS Simulator." + os.EOL
			+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed Xcode." + os.EOL);
			result = true;
		}
		if (!this.$hostInfo.isDarwin) {
			this.$logger.warn("WARNING: You can work with iOS only on Mac OS X systems.");
			this.$logger.out("To be able to work with iOS devices and projects, you need Mac OS X Mavericks or later." + os.EOL);
			result = true;
		}
		if(!sysInfo.javaVer) {
			this.$logger.warn("WARNING: The Java Development Kit (JDK) is not installed or is not configured properly.");
			this.$logger.out("You will not be able to work with the Android SDK and you might not be able" + os.EOL
				+ "to perform some Android-related operations. To ensure that you can develop and" + os.EOL
				+ "test your apps for Android, verify that you have installed the JDK as" + os.EOL
				+ "described in http://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html (for JDK 8)" + os.EOL
				+ "or http://docs.oracle.com/javase/7/docs/webnotes/install/ (for JDK 7)." + os.EOL);
			result = true;
		}
		
		return result;
	}
	
	private printPackageManagerTip() {
		if (this.$hostInfo.isWindows) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + os.EOL);
		} else if (this.$hostInfo.isDarwin) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + os.EOL);
		}
	}
}
$injector.register("doctorService", DoctorService);
