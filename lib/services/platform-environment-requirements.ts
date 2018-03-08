import { isInteractive } from "../common/helpers";
import { EOL } from "os";

export class PlatformEnvironmentRequirements implements IPlatformEnvironmentRequirements {
	constructor(private $doctorService: IDoctorService,
		private $errors: IErrors,
		private $extensibilityService: IExtensibilityService,
		private $logger: ILogger,
		private $prompter: IPrompter,
		private $staticConfig: IStaticConfig) { }

	public static CLOUD_BUILDS_OPTION_NAME = "Install the nativescript-cloud extension to configure your environment for cloud builds";
	public static SETUP_SCRIPT_OPTION_NAME = "Run the setup script to try to automatically configure your environment for local builds";
	public static MANUALLY_SETUP_OPTION_NAME = "Manually setup your environment for local builds";
	public static BOTH_CLOUD_BUILDS_AND_SETUP_SCRIPT_OPTION_NAME = "Install the nativescript-cloud extension and run the setup script to try to automatically configure your environment";
	public static NOT_CONFIGURED_ENV_MESSAGE = "Your environment is not configured properly and you will not be able to execute local builds. You are missing the nativescript-cloud extension and you will not be able to execute cloud builds. To continue, choose one of the following options: ";
	public static NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE = "The setup script was not able to configure your environment for local builds. To execute local builds, you have to set up your environment manually. To continue, choose one of the following options:";

	public async checkEnvironmentRequirements(data: ICheckEnvironmentRequirementsInput): Promise<boolean> {
		const canExecute = await this.$doctorService.canExecuteLocalBuild(data.platform);
		if (!canExecute) {
			if (!isInteractive()) {
				this.fail("Your environment is not configured properly and you will not be able to execute local builds. You are missing the nativescript-cloud extension and you will not be able to execute cloud builds. To continue, choose one of the following options: " + EOL
					+ "Run $ tns setup command to run the setup script to try to automatically configure your environment for local builds." + EOL
					+ "Run $ tns cloud setup command to install the nativescript-cloud extension to configure your environment for cloud builds." + EOL
					+ `Verify that your environment is configured according to the system requirements described at ${this.$staticConfig.SYS_REQUIREMENTS_LINK}`);
			}

			const selectedOption = await this.$prompter.promptForChoice(PlatformEnvironmentRequirements.NOT_CONFIGURED_ENV_MESSAGE, [
				PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME,
				PlatformEnvironmentRequirements.SETUP_SCRIPT_OPTION_NAME,
				PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME,
				PlatformEnvironmentRequirements.BOTH_CLOUD_BUILDS_AND_SETUP_SCRIPT_OPTION_NAME
			]);

			if (selectedOption === PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME) {
				await this.processCloudBuilds(data);
			}

			if (selectedOption === PlatformEnvironmentRequirements.SETUP_SCRIPT_OPTION_NAME) {
				await this.$doctorService.runSetupScript();

				if (await this.$doctorService.canExecuteLocalBuild(data.platform)) {
					return true;
				}

				const option = await this.$prompter.promptForChoice(PlatformEnvironmentRequirements.NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE, [
					PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME,
					PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME
				]);

				if (option === PlatformEnvironmentRequirements.CLOUD_BUILDS_OPTION_NAME) {
					await this.processCloudBuilds(data);
				}

				if (option === PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME) {
					this.processManuallySetup(data);
				}
			}

			if (selectedOption === PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME) {
				this.processManuallySetup(data);
			}

			if (selectedOption === PlatformEnvironmentRequirements.BOTH_CLOUD_BUILDS_AND_SETUP_SCRIPT_OPTION_NAME) {
				await this.processBothCloudBuildsAndSetupScript(data);
				if (await this.$doctorService.canExecuteLocalBuild(data.platform)) {
					return true;
				}

				this.processManuallySetup(data);
			}
		}

		return true;
	}

	private async processCloudBuilds(data: ICheckEnvironmentRequirementsInput): Promise<void> {
		await this.processCloudBuildsCore(data);
		const cloudCommandName = data.platform ? `$ tns cloud ${data.cloudCommandName.toLowerCase()} ${data.platform.toLowerCase()}` : `$ tns cloud ${data.cloudCommandName.toLowerCase()}`;
		this.fail(`Use the $ tns login command to log in with your account and then ${cloudCommandName} command to build your app in the cloud.`);
	}

	private async processCloudBuildsCore(data: ICheckEnvironmentRequirementsInput): Promise<IExtensionData> {
		return this.$extensibilityService.installExtension("nativescript-cloud");
	}

	private processManuallySetup(data: ICheckEnvironmentRequirementsInput): void {
		this.fail(`To be able to build for ${data.platform}, verify that your environment is configured according to the system requirements described at ${this.$staticConfig.SYS_REQUIREMENTS_LINK}`);
	}

	private async processBothCloudBuildsAndSetupScript(data: ICheckEnvironmentRequirementsInput): Promise<void> {
		try {
			await this.processCloudBuildsCore(data);
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
