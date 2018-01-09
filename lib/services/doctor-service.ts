import { EOL } from "os";
import * as semver from "semver";
import * as path from "path";
import * as helpers from "../common/helpers";
const clui = require("clui");

class DoctorService implements IDoctorService {
	private static PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";
	private static MIN_SUPPORTED_POD_VERSION = "1.0.0";
	private static DarwinSetupScriptLocation = path.join(__dirname, "..", "..", "setup", "mac-startup-shell-script.sh");
	private static DarwinSetupDocsLink = "https://docs.nativescript.org/start/ns-setup-os-x";
	private static WindowsSetupScriptExecutable = "powershell.exe";
	private static WindowsSetupScriptArguments = ["start-process", "-FilePath", "PowerShell.exe", "-NoNewWindow", "-Wait", "-ArgumentList", '"-NoProfile -ExecutionPolicy Bypass -Command iex ((new-object net.webclient).DownloadString(\'https://www.nativescript.org/setup/win\'))"'];
	private static WindowsSetupDocsLink = "https://docs.nativescript.org/start/ns-setup-win";
	private static LinuxSetupDocsLink = "https://docs.nativescript.org/start/ns-setup-linux";

	constructor(private $analyticsService: IAnalyticsService,
		private $androidToolsInfo: IAndroidToolsInfo,
		private $cocoapodsService: ICocoaPodsService,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $progressIndicator: IProgressIndicator,
		private $staticConfig: IStaticConfig,
		private $sysInfo: ISysInfo,
		private $childProcess: IChildProcess,
		private $config: IConfiguration,
		private $npm: INodePackageManager,
		private $opener: IOpener,
		private $prompter: IPrompter,
		private $fs: IFileSystem,
		private $versionsService: IVersionsService,
		private $xcprojService: IXcprojService) { }

	public async printWarnings(configOptions?: { trackResult: boolean }): Promise<boolean> {
		let result = false;
		const sysInfo = await this.$sysInfo.getSysInfo(this.$staticConfig.pathToPackageJson);

		if (!sysInfo.adbVer) {
			this.$logger.warn("WARNING: adb from the Android SDK is not installed or is not configured properly.");
			this.$logger.out("For Android-related operations, the NativeScript CLI will use a built-in version of adb." + EOL
				+ "To avoid possible issues with the native Android emulator, Genymotion or connected" + EOL
				+ "Android devices, verify that you have installed the latest Android SDK and" + EOL
				+ "its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + EOL);

			this.printPackageManagerTip();
			result = true;
		}

		if (!sysInfo.emulatorInstalled) {
			this.$logger.warn("WARNING: The Android SDK is not installed or is not configured properly.");
			this.$logger.out("You will not be able to build your projects for Android and run them in the native emulator." + EOL
				+ "To be able to build for Android and run apps in the native emulator, verify that you have" + EOL
				+ "installed the latest Android SDK and its dependencies as described in http://developer.android.com/sdk/index.html#Requirements" + EOL
			);

			this.printPackageManagerTip();
			result = true;
		}

		if (this.$hostInfo.isDarwin) {
			if (!sysInfo.xcodeVer) {
				this.$logger.warn("WARNING: Xcode is not installed or is not configured properly.");
				this.$logger.out("You will not be able to build your projects for iOS or run them in the iOS Simulator." + EOL
					+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed Xcode." + EOL);
				result = true;
			}

			if (!sysInfo.xcodeprojGemLocation) {
				this.$logger.warn("WARNING: xcodeproj gem is not installed or is not configured properly.");
				this.$logger.out("You will not be able to build your projects for iOS." + EOL
					+ "To be able to build for iOS and run apps in the native emulator, verify that you have installed xcodeproj." + EOL);
				result = true;
			}

			if (!sysInfo.cocoapodVer) {
				this.$logger.warn("WARNING: CocoaPods is not installed or is not configured properly.");
				this.$logger.out("You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
					+ "To be able to build such projects, verify that you have installed CocoaPods.");
				result = true;
			}

			if (sysInfo.xcodeVer && sysInfo.cocoapodVer) {
				const problemWithCocoaPods = await this.verifyCocoaPods();
				if (problemWithCocoaPods) {
					this.$logger.warn("WARNING: There was a problem with CocoaPods");
					this.$logger.out("Verify that CocoaPods are configured properly.");
					result = true;
				}
			}

			if (sysInfo.cocoapodVer && semver.valid(sysInfo.cocoapodVer) && semver.lt(sysInfo.cocoapodVer, DoctorService.MIN_SUPPORTED_POD_VERSION)) {
				this.$logger.warn(`WARNING: Your current CocoaPods version is earlier than ${DoctorService.MIN_SUPPORTED_POD_VERSION}.`);
				this.$logger.out("You will not be able to build your projects for iOS if they contain plugin with CocoaPod file." + EOL
					+ `To be able to build such projects, verify that you have at least ${DoctorService.MIN_SUPPORTED_POD_VERSION} version installed.`);
				result = true;
			}

			if (sysInfo.xcodeVer && sysInfo.cocoapodVer && await this.$xcprojService.verifyXcproj(false)) {
				result = true;
			}
		} else {
			this.$logger.out("NOTE: You can develop for iOS only on Mac OS X systems.");
			this.$logger.out("To be able to work with iOS devices and projects, you need Mac OS X Mavericks or later." + EOL);
		}

		const androidToolsIssues = this.$androidToolsInfo.validateInfo();
		const javaCompilerVersionIssue = this.$androidToolsInfo.validateJavacVersion(sysInfo.javacVersion);
		const pythonIssues = await this.validatePythonPackages();
		const doctorResult = result || androidToolsIssues || javaCompilerVersionIssue || pythonIssues;

		if (!configOptions || configOptions.trackResult) {
			await this.$analyticsService.track("DoctorEnvironmentSetup", doctorResult ? "incorrect" : "correct");
		}

		if (doctorResult) {
			this.$logger.info("There seem to be issues with your configuration.");
			if (this.$hostInfo.isDarwin) {
				await this.promptForHelp(DoctorService.DarwinSetupDocsLink, DoctorService.DarwinSetupScriptLocation, []);
			} else if (this.$hostInfo.isWindows) {
				await this.promptForHelp(DoctorService.WindowsSetupDocsLink, DoctorService.WindowsSetupScriptExecutable, DoctorService.WindowsSetupScriptArguments);
			} else {
				await this.promptForDocs(DoctorService.LinuxSetupDocsLink);
			}
		}

		try {
			await this.$versionsService.checkComponentsForUpdate();
		} catch (err) {
			this.$logger.error("Cannot get the latest versions information from npm. Please try again later.");
		}

		return doctorResult;
	}

	private async promptForDocs(link: string): Promise<void> {
		if (await this.$prompter.confirm("Do you want to visit the official documentation?", () => helpers.isInteractive())) {
			this.$opener.open(link);
		}
	}

	private async promptForHelp(link: string, commandName: string, commandArguments: string[]): Promise<void> {
		await this.promptForDocs(link);

		if (await this.$prompter.confirm("Do you want to run the setup script?", () => helpers.isInteractive())) {
			await this.$childProcess.spawnFromEvent(commandName, commandArguments, "close", { stdio: "inherit" });
		}
	}

	private printPackageManagerTip() {
		if (this.$hostInfo.isWindows) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + EOL);
		} else if (this.$hostInfo.isDarwin) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + EOL);
		}
	}

	private async verifyCocoaPods(): Promise<boolean> {
		this.$logger.out("Verifying CocoaPods. This may take more than a minute, please be patient.");

		const temp = require("temp");
		temp.track();
		const projDir = temp.mkdirSync("nativescript-check-cocoapods");
		const packageJsonData = {
			"name": "nativescript-check-cocoapods",
			"version": "0.0.1"
		};
		this.$fs.writeJson(path.join(projDir, "package.json"), packageJsonData);

		const spinner = new clui.Spinner("Installing iOS runtime.");
		try {
			spinner.start();
			await this.$npm.install("tns-ios", projDir, {
				global: false,
				production: true,
				save: true,
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts: true
			});
			spinner.stop();
			const iosDir = path.join(projDir, "node_modules", "tns-ios", "framework");
			this.$fs.writeFile(
				path.join(iosDir, "Podfile"),
				`${this.$cocoapodsService.getPodfileHeader(DoctorService.PROJECT_NAME_PLACEHOLDER)}pod 'AFNetworking', '~> 1.0'${this.$cocoapodsService.getPodfileFooter()}`
			);

			spinner.message("Verifying CocoaPods. This may take some time, please be patient.");
			spinner.start();
			const future = this.$childProcess.spawnFromEvent(
				this.$config.USE_POD_SANDBOX ? "sandbox-pod" : "pod",
				["install"],
				"exit",
				{ cwd: iosDir },
				{ throwError: false }
			);

			const result = await this.$progressIndicator.showProgressIndicator(future, 5000);
			if (result.exitCode) {
				this.$logger.out(result.stdout, result.stderr);
				return true;
			}

			return !(this.$fs.exists(path.join(iosDir, `${DoctorService.PROJECT_NAME_PLACEHOLDER}.xcworkspace`)));
		} catch (err) {
			this.$logger.trace(`verifyCocoaPods error: ${err}`);
			return true;
		} finally {
			spinner.stop();
		}
	}

	private async validatePythonPackages(): Promise<boolean> {
		let hasInvalidPackages = false;
		if (this.$hostInfo.isDarwin) {
			try {
				await this.$childProcess.exec(`python -c "import six"`);
			} catch (error) {
				// error.code = 1 so the Python is present, but we don't have six.
				if (error.code === 1) {
					hasInvalidPackages = true;
					this.$logger.warn("The Python 'six' package not found.");
					this.$logger.out("This package is required by the Debugger library (LLDB) for iOS. You can install it by running 'pip install six' from the terminal.");
				} else {
					this.$logger.warn("Couldn't retrieve installed python packages.");
					this.$logger.out("We cannot verify your python installation is setup correctly. Please, make sure you have both 'python' and 'pip' installed.");
					this.$logger.trace(`Error while validating Python packages. Error is: ${error.message}`);
				}
			}
		}
		return hasInvalidPackages;
	}
}
$injector.register("doctorService", DoctorService);
