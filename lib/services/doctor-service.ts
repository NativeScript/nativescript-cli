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
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $versionsService: IVersionsService) { }

	public async printWarnings(configOptions?: { trackResult: boolean }): Promise<boolean> {
		const infos = await this.$terminalSpinnerService.execute<NativeScriptDoctor.IInfo[]>({
			text: `Getting environment information ${EOL}`
		}, () => doctor.getInfos());

		const warnings = infos.filter(info => info.type === constants.WARNING_TYPE_NAME);
		const hasWarnings = warnings.length > 0;

		const hasAndroidWarnings = warnings.filter(warning => _.includes(warning.platforms, constants.ANDROID_PLATFORM_NAME)).length > 0;
		if (hasAndroidWarnings) {
			this.printPackageManagerTip();
		}

		if (!configOptions || configOptions.trackResult) {
			await this.$analyticsService.track("DoctorEnvironmentSetup", hasWarnings ? "incorrect" : "correct");
		}

		this.printInfosCore(infos);

		if (hasWarnings) {
			this.$logger.info("There seem to be issues with your configuration.");
			await this.promptForHelp();
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

	private async promptForHelpCore(link: string, commandName: string, commandArguments: string[]): Promise<void> {
		await this.promptForDocs(link);

		if (await this.$prompter.confirm("Do you want to run the setup script?", () => helpers.isInteractive())) {
			await this.$childProcess.spawnFromEvent(commandName, commandArguments, "close", { stdio: "inherit" });
		}
	}

	private async promptForHelp(): Promise<void> {
		if (this.$hostInfo.isDarwin) {
			await this.promptForHelpCore(DoctorService.DarwinSetupDocsLink, DoctorService.DarwinSetupScriptLocation, []);
		} else if (this.$hostInfo.isWindows) {
			await this.promptForHelpCore(DoctorService.WindowsSetupDocsLink, DoctorService.WindowsSetupScriptExecutable, DoctorService.WindowsSetupScriptArguments);
		} else {
			await this.promptForDocs(DoctorService.LinuxSetupDocsLink);
		}
	}

	private printPackageManagerTip() {
		if (this.$hostInfo.isWindows) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + EOL);
		} else if (this.$hostInfo.isDarwin) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + EOL);
		}
	}

	private printInfosCore(infos: NativeScriptDoctor.IInfo[]): void {
		infos.filter(info => info.type === constants.INFO_TYPE_NAME)
			.map(info => {
				const spinner = this.$terminalSpinnerService.createSpinner();
				spinner.text = info.message;
				spinner.succeed();
			});

		infos.filter(info => info.type === constants.WARNING_TYPE_NAME)
			.map(info => {
				const spinner = this.$terminalSpinnerService.createSpinner();
				spinner.text = `${info.message.yellow} ${EOL} ${info.additionalInformation} ${EOL}`;
				spinner.fail();
		});
	}
}
$injector.register("doctorService", DoctorService);
