import { EOL } from "os";
import * as path from "path";
import * as helpers from "../common/helpers";
import { doctor, constants } from "nativescript-doctor";

class DoctorService implements IDoctorService {
	private static DarwinSetupScriptLocation = path.join(__dirname, "..", "..", "setup", "mac-startup-shell-script.sh");
	private static DarwinSetupDocsLink = "https://docs.nativescript.org/start/ns-setup-os-x";
	private static WindowsSetupScriptExecutable = "powershell.exe";
	private static WindowsSetupScriptArguments = ["start-process", "-FilePath", "PowerShell.exe", "-NoNewWindow", "-Wait", "-ArgumentList", '"-NoProfile -ExecutionPolicy Bypass -Command iex ((new-object net.webclient).DownloadString(\'https://www.nativescript.org/setup/win\'))"'];
	private static WindowsSetupDocsLink = "https://docs.nativescript.org/start/ns-setup-win";
	private static LinuxSetupDocsLink = "https://docs.nativescript.org/start/ns-setup-linux";

	constructor(private $analyticsService: IAnalyticsService,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $opener: IOpener,
		private $prompter: IPrompter,
		private $versionsService: IVersionsService) { }

	public async printWarnings(configOptions?: { trackResult: boolean }): Promise<boolean> {
		const warnings = await doctor.getWarnings();
		const hasWarnings = warnings.length > 0;

		const hasAndroidWarnings = warnings.filter(warning => _.includes(warning.platforms, constants.ANDROID_PLATFORM_NAME)).length > 0;
		if (hasAndroidWarnings) {
			this.printPackageManagerTip();
		}

		if (!configOptions || configOptions.trackResult) {
			await this.$analyticsService.track("DoctorEnvironmentSetup", hasWarnings ? "incorrect" : "correct");
		}

		if (hasWarnings) {
			warnings.map(warning => {
				this.$logger.warn(warning.warning);
				this.$logger.out(warning.additionalInformation);
			});

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

		return hasWarnings;
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
}
$injector.register("doctorService", DoctorService);
