import { EOL } from "os";
import * as path from "path";
import * as helpers from "../common/helpers";
import { TrackActionNames } from "../constants";
import { doctor, constants } from "nativescript-doctor";

class DoctorService implements IDoctorService {
	private static DarwinSetupScriptLocation = path.join(__dirname, "..", "..", "setup", "mac-startup-shell-script.sh");
	private static WindowsSetupScriptExecutable = "powershell.exe";
	private static WindowsSetupScriptArguments = ["start-process", "-FilePath", "PowerShell.exe", "-NoNewWindow", "-Wait", "-ArgumentList", '"-NoProfile -ExecutionPolicy Bypass -Command iex ((new-object net.webclient).DownloadString(\'https://www.nativescript.org/setup/win\'))"'];

	constructor(private $analyticsService: IAnalyticsService,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $injector: IInjector,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $versionsService: IVersionsService) { }

	public async printWarnings(configOptions?: { trackResult: boolean , projectDir?: string, runtimeVersion?: string, options?: IOptions }): Promise<void> {
		const infos = await this.$terminalSpinnerService.execute<NativeScriptDoctor.IInfo[]>({
			text: `Getting environment information ${EOL}`
		}, () => doctor.getInfos({ projectDir: configOptions && configOptions.projectDir, androidRuntimeVersion: configOptions && configOptions.runtimeVersion }));

		const warnings = infos.filter(info => info.type === constants.WARNING_TYPE_NAME);
		const hasWarnings = warnings.length > 0;

		const hasAndroidWarnings = warnings.filter(warning => _.includes(warning.platforms, constants.ANDROID_PLATFORM_NAME)).length > 0;
		if (hasAndroidWarnings) {
			this.printPackageManagerTip();
		}

		if (!configOptions || configOptions.trackResult) {
			await this.$analyticsService.track("DoctorEnvironmentSetup", hasWarnings ? "incorrect" : "correct");
		}

		if (hasWarnings) {
			this.$logger.info("There seem to be issues with your configuration.");
		} else {
			this.$logger.out("No issues were detected.".bold);
			this.printInfosCore(infos);
		}

		try {
			await this.$versionsService.printVersionsInformation();
		} catch (err) {
			this.$logger.error("Cannot get the latest versions information from npm. Please try again later.");
		}

		await this.$injector.resolve<IPlatformEnvironmentRequirements>("platformEnvironmentRequirements").checkEnvironmentRequirements({
			platform: null,
			projectDir: configOptions && configOptions.projectDir,
			runtimeVersion: configOptions && configOptions.runtimeVersion,
			options: configOptions && configOptions.options
		});
	}

	public async runSetupScript(): Promise<ISpawnResult> {
		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.RunSetupScript,
			additionalData: "Starting",
		});

		if (this.$hostInfo.isLinux) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.RunSetupScript,
				additionalData: "Skipped as OS is Linux",
			});
			return;
		}

		this.$logger.out("Running the setup script to try and automatically configure your environment.");

		if (this.$hostInfo.isDarwin) {
			await this.runSetupScriptCore(DoctorService.DarwinSetupScriptLocation, []);
		}

		if (this.$hostInfo.isWindows) {
			await this.runSetupScriptCore(DoctorService.WindowsSetupScriptExecutable, DoctorService.WindowsSetupScriptArguments);
		}

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.RunSetupScript,
			additionalData: "Finished",
		});
	}

	public async canExecuteLocalBuild(platform?: string, projectDir?: string, runtimeVersion?: string): Promise<boolean> {
		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.CheckLocalBuildSetup,
			additionalData: "Starting",
		});
		const infos = await doctor.getInfos({ platform, projectDir, androidRuntimeVersion: runtimeVersion });

		const warnings = this.filterInfosByType(infos, constants.WARNING_TYPE_NAME);
		const hasWarnings = warnings.length > 0;
		if (hasWarnings) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.CheckLocalBuildSetup,
				additionalData: `Warnings:${warnings.map(w => w.message).join("__")}`,
			});
			this.printInfosCore(infos);
		} else {
			infos.map(info => this.$logger.trace(info.message));
		}

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.CheckLocalBuildSetup,
			additionalData: `Finished: Is setup correct: ${!hasWarnings}`,
		});

		return !hasWarnings;
	}

	private async runSetupScriptCore(executablePath: string, setupScriptArgs: string[]): Promise<ISpawnResult> {
		return this.$childProcess.spawnFromEvent(executablePath, setupScriptArgs, "close", { stdio: "inherit" });
	}

	private printPackageManagerTip() {
		if (this.$hostInfo.isWindows) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + EOL);
		} else if (this.$hostInfo.isDarwin) {
			this.$logger.out("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + EOL);
		}
	}

	private printInfosCore(infos: NativeScriptDoctor.IInfo[]): void {
		if (!helpers.isInteractive()) {
			infos.map(info => {
				let message = info.message;
				if (info.type === constants.WARNING_TYPE_NAME) {
					message = `WARNING: ${info.message.yellow} ${EOL} ${info.additionalInformation} ${EOL}`;
				}
				this.$logger.out(message);
			});
		}

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

	private filterInfosByType(infos: NativeScriptDoctor.IInfo[], type: string): NativeScriptDoctor.IInfo[] {
		return infos.filter(info => info.type === type);
	}
}
$injector.register("doctorService", DoctorService);
