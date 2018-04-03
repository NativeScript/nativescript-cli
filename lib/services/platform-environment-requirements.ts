import * as constants from "../constants";
import { isInteractive } from "../common/helpers";
import { EOL } from "os";

export class PlatformEnvironmentRequirements implements IPlatformEnvironmentRequirements {
	constructor(private $commandsService: ICommandsService,
		private $doctorService: IDoctorService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $nativeScriptCloudExtensionService: INativeScriptCloudExtensionService,
		private $prompter: IPrompter,
		private $staticConfig: IStaticConfig) { }

	public static CLOUD_SETUP_OPTION_NAME = "Configure for Cloud Builds";
	public static LOCAL_SETUP_OPTION_NAME = "Configure for Local Builds";
	public static MANUALLY_SETUP_OPTION_NAME = "Skip Step and Configure Manually";
	private static BOTH_CLOUD_SETUP_AND_LOCAL_SETUP_OPTION_NAME = "Configure for Both Local and Cloud Builds";
	private static CHOOSE_OPTIONS_MESSAGE = "To continue, choose one of the following options: ";
	private static NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE = `The setup script was not able to configure your environment for local builds. To execute local builds, you have to set up your environment manually. In case you have any questions, you can check our forum: 'http://forum.nativescript.org' and our public Slack channel: 'https://nativescriptcommunity.slack.com/'. ${PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE}`;
	private static MISSING_LOCAL_SETUP_MESSAGE = "Your environment is not configured properly and you will not be able to execute local builds.";
	private static MISSING_LOCAL_AND_CLOUD_SETUP_MESSAGE = `You are missing the ${constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension and you will not be able to execute cloud builds. ${PlatformEnvironmentRequirements.MISSING_LOCAL_SETUP_MESSAGE} ${PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE} `;
	private static RUN_TNS_SETUP_MESSAGE = 'Run $ tns setup command to run the setup script to try to automatically configure your environment for local builds.';

	private cliCommandToCloudCommandName: IStringDictionary = {
		"build": "tns cloud build",
		"run": "tns cloud run",
		"deploy": "tns cloud deploy"
	};

	public async checkEnvironmentRequirements(platform: string): Promise<boolean> {
		if (process.env.NS_SKIP_ENV_CHECK) {
			return true;
		}

		const canExecute = await this.$doctorService.canExecuteLocalBuild(platform);
		if (!canExecute) {
			if (!isInteractive()) {
				this.fail(this.getNonInteractiveConsoleMessage(platform));
			}

			this.$logger.info(this.getInteractiveConsoleMessage(platform));

			const selectedOption = await this.promptForChoice();

			await this.processCloudBuildsIfNeeded(platform, selectedOption);
			this.processManuallySetupIfNeeded(platform, selectedOption);

			if (selectedOption === PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME) {
				await this.$doctorService.runSetupScript();

				if (await this.$doctorService.canExecuteLocalBuild(platform)) {
					return true;
				}

				if (this.$nativeScriptCloudExtensionService.isInstalled()) {
					this.processManuallySetup(platform);
				} else {
					const option = await this.$prompter.promptForChoice(PlatformEnvironmentRequirements.NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE, [
						PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME,
						PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME
					]);

					await this.processCloudBuildsIfNeeded(platform, option);

					this.processManuallySetupIfNeeded(platform, option);
				}
			}

			if (selectedOption === PlatformEnvironmentRequirements.BOTH_CLOUD_SETUP_AND_LOCAL_SETUP_OPTION_NAME) {
				await this.processBothCloudBuildsAndSetupScript(platform);
				if (await this.$doctorService.canExecuteLocalBuild(platform)) {
					return true;
				}

				this.processManuallySetup(platform);
			}
		}

		return true;
	}

	private async processCloudBuildsIfNeeded(platform: string, selectedOption: string): Promise<void> {
		if (selectedOption === PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME) {
			await this.processCloudBuilds(platform);
		}
	}

	private async processCloudBuilds(platform: string): Promise<void> {
		await this.processCloudBuildsCore(platform);
		this.fail(this.getCloudBuildsMessage(platform));
	}

	private processCloudBuildsCore(platform: string): Promise<IExtensionData> {
		return this.$nativeScriptCloudExtensionService.install();
	}

	private getCloudBuildsMessage(platform: string): string {
		const cloudCommandName = this.cliCommandToCloudCommandName[this.$commandsService.currentCommandData.commandName];
		if (!cloudCommandName) {
			return `In order to test your application use the $ tns login command to log in with your account and then $ tns cloud build command to build your app in the cloud.`;
		}

		if (!platform) {
			return `Use the $ tns login command to log in with your account and then $ ${cloudCommandName.toLowerCase()} command.`;
		}

		return `Use the $ tns login command to log in with your account and then $ ${cloudCommandName.toLowerCase()} ${platform.toLowerCase()} command.`;
	}

	private processManuallySetupIfNeeded(platform: string, selectedOption: string) {
		if (selectedOption === PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME) {
			this.processManuallySetup(platform);
		}
	}

	private processManuallySetup(platform: string): void {
		this.fail(`To be able to build for ${platform}, verify that your environment is configured according to the system requirements described at ${this.$staticConfig.SYS_REQUIREMENTS_LINK}`);
	}

	private async processBothCloudBuildsAndSetupScript(platform: string): Promise<void> {
		try {
			await this.processCloudBuildsCore(platform);
		} catch (e) {
			this.$logger.trace(`Error while installing ${constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension. ${e.message}.`);
		}

		await this.$doctorService.runSetupScript();
	}

	private fail(message: string): void {
		this.$errors.fail({ formatStr: message, suppressCommandHelp: true, printOnStdout: true });
	}

	private getNonInteractiveConsoleMessage(platform: string) {
		return this.$nativeScriptCloudExtensionService.isInstalled() ?
			this.buildMultilineMessage([
				`${PlatformEnvironmentRequirements.MISSING_LOCAL_SETUP_MESSAGE} ${PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE}`,
				PlatformEnvironmentRequirements.RUN_TNS_SETUP_MESSAGE,
				this.getCloudBuildsMessage(platform),
				this.getEnvVerificationMessage()
			]) :
			this.buildMultilineMessage([
				PlatformEnvironmentRequirements.MISSING_LOCAL_AND_CLOUD_SETUP_MESSAGE,
				PlatformEnvironmentRequirements.RUN_TNS_SETUP_MESSAGE,
				`Run $ tns cloud setup command to install the ${constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension to configure your environment for cloud builds.`,
				this.getEnvVerificationMessage()
			]);
	}

	private getInteractiveConsoleMessage(platform: string) {
		const message = `The ${constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension is installed and you can ${_.lowerFirst(this.getCloudBuildsMessage(platform))}`;

		return this.$nativeScriptCloudExtensionService.isInstalled() ?
			this.buildMultilineMessage([
				`${message.bold}`,
				`${PlatformEnvironmentRequirements.MISSING_LOCAL_SETUP_MESSAGE} ${PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE}`,
				`Select "Configure for Local Builds" to run the setup script and automatically configure your environment for local builds.`,
				`Select "Skip Step and Configure Manually" to disregard this option and install any required components manually.`
			]) :
			this.buildMultilineMessage([
				PlatformEnvironmentRequirements.MISSING_LOCAL_AND_CLOUD_SETUP_MESSAGE,
				`Select "Configure for Cloud Builds" to install the ${constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension and automatically configure your environment for cloud builds.`,
				`Select "Configure for Local Builds" to run the setup script and automatically configure your environment for local builds.`,
				`Select "Configure for Both Local and Cloud Builds" to automatically configure your environment for both options.`,
				`Select "Configure for Both Local and Cloud Builds" to automatically configure your environment for both options.`
			]);
	}

	private promptForChoice(): Promise<string> {
		const choices = this.$nativeScriptCloudExtensionService.isInstalled() ? [
			PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME,
			PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME,
		] : [
			PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME,
			PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME,
			PlatformEnvironmentRequirements.BOTH_CLOUD_SETUP_AND_LOCAL_SETUP_OPTION_NAME,
			PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME,
		];

		return this.$prompter.promptForChoice(PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE, choices);
	}

	private getEnvVerificationMessage() {
		return `Verify that your environment is configured according to the system requirements described at ${this.$staticConfig.SYS_REQUIREMENTS_LINK}.`;
	}

	private buildMultilineMessage(parts: string[]): string {
		return parts.join(EOL);
	}
}
$injector.register("platformEnvironmentRequirements", PlatformEnvironmentRequirements);
