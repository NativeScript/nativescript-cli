///<reference path="../.d.ts"/>
"use strict";
import {EOL} from "os";
import * as semver from "semver";
import * as path from "path";
let clui = require("clui");

class DoctorService implements IDoctorService {
	private static MIN_SUPPORTED_POD_VERSION = "0.38.2";

	constructor(private $androidToolsInfo: IAndroidToolsInfo,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $progressIndicator: IProgressIndicator,
		private $sysInfo: ISysInfo,
		private $childProcess: IChildProcess,
		private $config: IConfiguration,
		private $npm: INodePackageManager,
		private $fs: IFileSystem) {	}

	public printWarnings(): boolean {
		let result = false;
		let sysInfo = this.$sysInfo.getSysInfo(path.join(__dirname, "..", "..", "package.json")).wait();

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

			if(!sysInfo.cocoapodVer) {
				this.$logger.warn("WARNING: CocoaPods is not installed or is not configured properly.");
				this.$logger.out("You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
					+ "To be able to build such projects, verify that you have installed CocoaPods.");
				result = true;
			}

			if (sysInfo.xcodeVer && sysInfo.cocoapodVer) {
				let problemWithCocoaPods = this.verifyCocoaPods();
				if (problemWithCocoaPods) {
					this.$logger.warn("WARNING: There was a problem with CocoaPods");
					this.$logger.out("Verify that CocoaPods are configured properly.");
					result = true;
				}
			}

			if (sysInfo.cocoapodVer && semver.valid(sysInfo.cocoapodVer) === null) {
				this.$logger.warn(`WARNING: CocoaPods version is not a valid semver version.`);
				this.$logger.out("You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
					+ `To be able to build such projects, verify that you have at least ${DoctorService.MIN_SUPPORTED_POD_VERSION} version installed.`);
				result = true;
			}

			if (sysInfo.cocoapodVer && semver.valid(sysInfo.cocoapodVer) && semver.lt(sysInfo.cocoapodVer, DoctorService.MIN_SUPPORTED_POD_VERSION)) {
				this.$logger.warn(`WARNING: CocoaPods version is lower than ${DoctorService.MIN_SUPPORTED_POD_VERSION}.`);
				this.$logger.out("You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
					+ `To be able to build such projects, verify that you have at least ${DoctorService.MIN_SUPPORTED_POD_VERSION} version installed.`);
				result = true;
			}
		} else {
			this.$logger.out("NOTE: You can develop for iOS only on Mac OS X systems.");
			this.$logger.out("To be able to work with iOS devices and projects, you need Mac OS X Mavericks or later." + EOL);
		}

		let androidToolsIssues = this.$androidToolsInfo.validateInfo().wait();
		let javaVersionIssue = this.$androidToolsInfo.validateJava(sysInfo.javacVersion).wait();
		return result || androidToolsIssues || javaVersionIssue;
	}

	private printPackageManagerTip() {
		if (this.$hostInfo.isWindows) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + EOL);
		} else if (this.$hostInfo.isDarwin) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + EOL);
		}
	}

	private verifyCocoaPods(): boolean {
		this.$logger.out("Verifying CocoaPods. This may take more than a minute, please be patient.");

		let temp = require("temp");
		temp.track();
		let projDir = temp.mkdirSync("nativescript-check-cocoapods");

		let spinner = new clui.Spinner("Installing iOS runtime.");
		try {
			spinner.start();
			this.$npm.install("tns-ios", projDir, { "ignore-scripts": true, production: true }).wait();
			spinner.stop();
			let iosDir = path.join(projDir, "node_modules", "tns-ios", "framework");
			this.$fs.writeFile(
				path.join(iosDir, "Podfile"),
				"pod 'AFNetworking', '~> 1.0'\n"
			).wait();

			spinner.message("Verifying CocoaPods. This may take some time, please be patient.");
			spinner.start();
			let future = this.$childProcess.spawnFromEvent(
				this.$config.USE_POD_SANDBOX ? "sandbox-pod": "pod",
				["install"],
				"exit",
				{stdio: "inherit", cwd: iosDir},
				{ throwError: true }
				);

			this.$progressIndicator.showProgressIndicator(future, 5000).wait();

			return !(this.$fs.exists(path.join(iosDir, "__PROJECT_NAME__.xcworkspace")).wait());
		} catch(err) {
			this.$logger.trace(`verifyCocoaPods error: ${err}`);
			return true;
		} finally {
			spinner.stop();
		}
	}
}
$injector.register("doctorService", DoctorService);
