import { isInteractive } from "../common/helpers";
import { EOL } from "os";

export class PlatformEnvironmentRequirements implements IPlatformEnvironmentRequirements {
	constructor(private $commandsService: ICommandsService,
		private $doctorService: IDoctorService,
		private $errors: IErrors,
		private $extensibilityService: IExtensibilityService,
		private $logger: ILogger,
		private $prompter: IPrompter,
		private $staticConfig: IStaticConfig) { }

	public static CLOUD_BUILDS_OPTION_NAME = "Configure for Cloud Builds";
	public static SETUP_SCRIPT_OPTION_NAME = "Configure for Local Builds";
	public static MANUALLY_SETUP_OPTION_NAME = "Skip Step and Configure Manually";
	private static BOTH_CLOUD_BUILDS_AND_SETUP_SCRIPT_OPTION_NAME = "Configure for Both Local and Cloud Builds";
	private static NOT_CONFIGURED_ENV_MESSAGE = "To continue, choose one of the following options: ";
	private static NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE = "The setup script was not able to configure your environment for local builds. To execute local builds, you have to set up your environment manually. To continue, choose one of the following options:";
	private static NATIVESCRIPT_CLOUD_EXTENSION_NAME = "nativescript-cloud";

	private cliCommandToCloudCommandName: IStringDictionary = {
		"build": "tns cloud build",
		"run": "tns cloud run",
		"deploy": "tns cloud deploy"
	};

	public async checkEnvironmentRequirements(platform: string): Promise<boolean> {
		const canExecute = await this.$doctorService.canExecuteLocalBuild(platform);
		if (!canExecute) {
			if (!isInteractive()) {
				this.fail("You are missing the nativescript-cloud extension and you will not be able to execute cloud builds. Your environment is not configured properly and you will not be able to execute local builds. To continue, choose one of the following options: " + EOL
					+ "Run $ tns setup command to run the setup script to try to automatically configure your environment for local builds." + EOL
					+ "Run $ tns cloud setup command to install the nativescript-cloud extension to configure your environment for cloud builds." + EOL
					+ `Verify that your environment is configured according to the system requirements described at ${this.$staticConfig.SYS_REQUIREMENTS_LINK}`);
			}

			this.$logger.info("You are missing the nativescript-cloud extension and you will not be able to execute cloud builds. Your environment is not configured properly and you will not be able to execute local builds. " + EOL
				+ "Select “Configure for Cloud Builds” to install the nativescript-cloud extension and automatically configure your environment for cloud builds." + EOL
				+ "Select “Configure for Local Builds” to run the setup script and automatically configure your environment for local builds."
				+ "Select “Configure for Both Local and Cloud Builds” to automatically configure your environment for both options."
				+ "Select “Skip Step and Configure Manually” to disregard these options and install any required components manually.");

			const selectedOption = await this.$prompter.promptForChoice(PlatformEnvironmentRequirements.NOT_CONFIGURED_ENV_MESSAGE, [
				PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME,
				PlatformEnvironmentRequirements.SETUP_SCRIPT_OPTION_NAME,
				PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME,
				PlatformEnvironmentRequirements.BOTH_CLOUD_BUILDS_AND_SETUP_SCRIPT_OPTION_NAME
			]);

			if (selectedOption === PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME) {
				await this.processCloudBuilds(platform);
			}

			if (selectedOption === PlatformEnvironmentRequirements.SETUP_SCRIPT_OPTION_NAME) {
				await this.$doctorService.runSetupScript();

				if (await this.$doctorService.canExecuteLocalBuild(platform)) {
					return true;
				}

				const option = await this.$prompter.promptForChoice(PlatformEnvironmentRequirements.NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE, [
					PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME,
					PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME
				]);

				if (option === PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME) {
					await this.processCloudBuilds(platform);
				}

				if (option === PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME) {
					this.processManuallySetup(platform);
				}
			}

			if (selectedOption === PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME) {
				this.processManuallySetup(platform);
			}

			if (selectedOption === PlatformEnvironmentRequirements.BOTH_CLOUD_BUILDS_AND_SETUP_SCRIPT_OPTION_NAME) {
				await this.processBothCloudBuildsAndSetupScript(platform);
				if (await this.$doctorService.canExecuteLocalBuild(platform)) {
					return true;
				}

				this.processManuallySetup(platform);
			}
		}

		return true;
	}

	private async processCloudBuilds(platform: string): Promise<void> {
		await this.processCloudBuildsCore(platform);
		this.fail(this.getCloudBuildsMessage(platform));
	}

	private async processCloudBuildsCore(platform: string): Promise<IExtensionData> {
		const installedExtensions = this.$extensibilityService.getInstalledExtensions();
		if (!installedExtensions[PlatformEnvironmentRequirements.NATIVESCRIPT_CLOUD_EXTENSION_NAME]) {
			return this.$extensibilityService.installExtension(PlatformEnvironmentRequirements.NATIVESCRIPT_CLOUD_EXTENSION_NAME);
		}
	}

	private	getCloudBuildsMessage(platform: string): string {
		const cloudCommandName = this.cliCommandToCloudCommandName[this.$commandsService.currentCommandData.commandName];
		if (!cloudCommandName) {
			return `In order to test your application use the $ tns login command to log in with your account and then $ tns cloud build command to build your app in the cloud.`;
		}

		if (!platform) {
			return `Use the $ tns login command to log in with your account and then $ tns cloud ${cloudCommandName.toLowerCase()} command to build your app in the cloud.`;
		}

		return `Use the $ tns login command to log in with your account and then $ tns cloud ${cloudCommandName.toLowerCase()} ${platform.toLowerCase()} command to build your app in the cloud.`;
	}

	private processManuallySetup(platform: string): void {
		this.fail(`To be able to build for ${platform}, verify that your environment is configured according to the system requirements described at ${this.$staticConfig.SYS_REQUIREMENTS_LINK}`);
	}

	private async processBothCloudBuildsAndSetupScript(platform: string): Promise<void> {
		try {
			await this.processCloudBuildsCore(platform);
		} catch (e) {
			this.$logger.trace(`Error while installing nativescript-cloud extension. ${e.message}.`);
		}

		await this.$doctorService.runSetupScript();
	}

	private fail(message: string): void {
		this.$errors.fail({ formatStr: message, suppressCommandHelp: true, printOnStdout: true });
	}
}
$injector.register("platformEnvironmentRequirements", PlatformEnvironmentRequirements);
