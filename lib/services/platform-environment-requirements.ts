import { NATIVESCRIPT_CLOUD_EXTENSION_NAME, TrackActionNames } from "../constants";
import { isInteractive } from "../common/helpers";
import { EOL } from "os";
import { cache } from "../common/decorators";

export class PlatformEnvironmentRequirements implements IPlatformEnvironmentRequirements {
	constructor(private $commandsService: ICommandsService,
		private $doctorService: IDoctorService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $nativeScriptCloudExtensionService: INativeScriptCloudExtensionService,
		private $prompter: IPrompter,
		private $staticConfig: IStaticConfig,
		private $analyticsService: IAnalyticsService,
		private $injector: IInjector) { }

	@cache()
	private get $previewAppLiveSyncService(): IPreviewAppLiveSyncService {
		return this.$injector.resolve("previewAppLiveSyncService");
	}

	@cache()
	private get $previewCommandHelper(): IPreviewCommandHelper {
		return this.$injector.resolve("previewCommandHelper");
	}

	public static CLOUD_SETUP_OPTION_NAME = "Configure for Cloud Builds";
	public static LOCAL_SETUP_OPTION_NAME = "Configure for Local Builds";
	public static TRY_CLOUD_OPERATION_OPTION_NAME = "Try Cloud Operation";
	public static SYNC_TO_PREVIEW_APP_OPTION_NAME = "Sync to Playground";
	public static MANUALLY_SETUP_OPTION_NAME = "Skip Step and Configure Manually";
	private static BOTH_CLOUD_SETUP_AND_LOCAL_SETUP_OPTION_NAME = "Configure for Both Local and Cloud Builds";
	private static CHOOSE_OPTIONS_MESSAGE = "To continue, choose one of the following options: ";
	private static NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE = `The setup script was not able to configure your environment for local builds. To execute local builds, you have to set up your environment manually. In case you have any questions, you can check our forum: 'http://forum.nativescript.org' and our public Slack channel: 'https://nativescriptcommunity.slack.com/'.`;
	private static MISSING_LOCAL_SETUP_MESSAGE = "Your environment is not configured properly and you will not be able to execute local builds.";
	private static MISSING_LOCAL_AND_CLOUD_SETUP_MESSAGE = `You are missing the ${NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension and you will not be able to execute cloud builds. ${PlatformEnvironmentRequirements.MISSING_LOCAL_SETUP_MESSAGE} ${PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE} `;
	private static MISSING_LOCAL_BUT_CLOUD_SETUP_MESSAGE = `You have ${NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension installed, so you can execute cloud builds, but ${_.lowerFirst(PlatformEnvironmentRequirements.MISSING_LOCAL_SETUP_MESSAGE)}`;
	private static RUN_TNS_SETUP_MESSAGE = 'Run $ tns setup command to run the setup script to try to automatically configure your environment for local builds.';
	private static SYNC_TO_PREVIEW_APP_MESSAGE = `Select "Sync to Playground" to enjoy NativeScript without any local setup. All you need is a couple of companion apps installed on your devices.`;
	private static RUN_PREVIEW_COMMAND_MESSAGE = `Run $ tns preview command to enjoy NativeScript without any local setup.`;

	private cliCommandToCloudCommandName: IStringDictionary = {
		"build": "tns cloud build",
		"run": "tns cloud run",
		"deploy": "tns cloud deploy"
	};

	public async checkEnvironmentRequirements(input: ICheckEnvironmentRequirementsInput): Promise<ICheckEnvironmentRequirementsOutput> {
		const { platform, projectDir, runtimeVersion, hideSyncToPreviewAppOption } = input;
		const options = input.options || <IOptions>{ };

		let selectedOption = null;

		if (process.env.NS_SKIP_ENV_CHECK) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.CheckEnvironmentRequirements,
				additionalData: "Skipped: NS_SKIP_ENV_CHECK is set"
			});
			return {
				canExecute: true,
				selectedOption
			};
		}

		const canExecute = await this.$doctorService.canExecuteLocalBuild(platform, projectDir, runtimeVersion);
		if (!canExecute) {
			if (!isInteractive()) {
				await this.$analyticsService.trackEventActionInGoogleAnalytics({
					action: TrackActionNames.CheckEnvironmentRequirements,
					additionalData: "Non-interactive terminal, unable to execute local builds."
				});
				this.fail(this.getNonInteractiveConsoleMessage(platform));
			}

			const infoMessage = this.getInteractiveConsoleMessage({ hideSyncToPreviewAppOption });

			const choices = this.getChoices({ hideSyncToPreviewAppOption });

			selectedOption = await this.promptForChoice({ infoMessage, choices });

			await this.processCloudBuildsIfNeeded(selectedOption, platform);
			this.processManuallySetupIfNeeded(selectedOption, platform);
			await this.processSyncToPreviewAppIfNeeded(selectedOption, projectDir, options);

			if (selectedOption === PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME) {
				await this.$doctorService.runSetupScript();

				if (await this.$doctorService.canExecuteLocalBuild(platform, projectDir, runtimeVersion)) {
					return {
						canExecute: true,
						selectedOption
					};
				}

				if (this.$nativeScriptCloudExtensionService.isInstalled()) {
					const option = await this.promptForChoice({
						infoMessage: PlatformEnvironmentRequirements.NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE,
						choices: [
							PlatformEnvironmentRequirements.TRY_CLOUD_OPERATION_OPTION_NAME,
							PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME
						]
					});

					this.processTryCloudSetupIfNeeded(option, platform);
					this.processManuallySetupIfNeeded(option, platform);
				} else {
					const option = await this.promptForChoice({
						infoMessage: PlatformEnvironmentRequirements.NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE,
						choices: [
							PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME,
							PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME
						]
					});

					await this.processCloudBuildsIfNeeded(option, platform);
					this.processManuallySetupIfNeeded(option, platform);
				}
			}

			if (selectedOption === PlatformEnvironmentRequirements.BOTH_CLOUD_SETUP_AND_LOCAL_SETUP_OPTION_NAME) {
				await this.processBothCloudBuildsAndSetupScript();
				if (await this.$doctorService.canExecuteLocalBuild(platform, projectDir, runtimeVersion)) {
					return {
						canExecute: true,
						selectedOption
					};
				}

				this.processManuallySetup(platform);
			}

			this.processTryCloudSetupIfNeeded(selectedOption, platform);
		}

		return {
			canExecute,
			selectedOption
		};
	}

	private async processCloudBuildsIfNeeded(selectedOption: string, platform?: string): Promise<void> {
		if (selectedOption === PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME) {
			await this.processCloudBuilds(platform);
		}
	}

	private async processCloudBuilds(platform: string): Promise<void> {
		await this.processCloudBuildsCore();
		this.fail(this.getCloudBuildsMessage(platform));
	}

	private processCloudBuildsCore(): Promise<IExtensionData> {
		return this.$nativeScriptCloudExtensionService.install();
	}

	private getCloudBuildsMessage(platform?: string): string {
		const cloudCommandName = this.cliCommandToCloudCommandName[this.$commandsService.currentCommandData.commandName];
		if (!cloudCommandName) {
			return `In order to test your application use the $ tns login command to log in with your account and then $ tns cloud build command to build your app in the cloud.`;
		}

		if (!platform) {
			return `Use the $ tns login command to log in with your account and then $ ${cloudCommandName.toLowerCase()} command.`;
		}

		return `Use the $ tns login command to log in with your account and then $ ${cloudCommandName.toLowerCase()} ${platform.toLowerCase()} command.`;
	}

	private processTryCloudSetupIfNeeded(selectedOption: string, platform?: string) {
		if (selectedOption === PlatformEnvironmentRequirements.TRY_CLOUD_OPERATION_OPTION_NAME) {
			this.fail(this.getCloudBuildsMessage(platform));
		}
	}

	private processManuallySetupIfNeeded(selectedOption: string, platform?: string) {
		if (selectedOption === PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME) {
			this.processManuallySetup(platform);
		}
	}

	private async processSyncToPreviewAppIfNeeded(selectedOption: string, projectDir: string, options: IOptions) {
		if (selectedOption === PlatformEnvironmentRequirements.SYNC_TO_PREVIEW_APP_OPTION_NAME) {
			if (!projectDir) {
				this.$errors.failWithoutHelp(`No project found. In order to sync to playground you need to go to project directory or specify --path option.`);
			}

			this.$previewCommandHelper.run();
			await this.$previewAppLiveSyncService.initialSync({
				projectDir,
				appFilesUpdaterOptions: {
					bundle: !!options.bundle,
					release: options.release
				},
				env: options.env
			});
		}
	}

	private processManuallySetup(platform?: string): void {
		this.fail(`To be able to ${platform ? `build for ${platform}` : 'build'}, verify that your environment is configured according to the system requirements described at ${this.$staticConfig.SYS_REQUIREMENTS_LINK}. In case you have any questions, you can check our forum: 'http://forum.nativescript.org' and our public Slack channel: 'https://nativescriptcommunity.slack.com/'.`);
	}

	private async processBothCloudBuildsAndSetupScript(): Promise<void> {
		try {
			await this.processCloudBuildsCore();
		} catch (e) {
			this.$logger.trace(`Error while installing ${NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension. ${e.message}.`);
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
				PlatformEnvironmentRequirements.RUN_PREVIEW_COMMAND_MESSAGE,
				PlatformEnvironmentRequirements.RUN_TNS_SETUP_MESSAGE,
				this.getCloudBuildsMessage(platform),
				this.getEnvVerificationMessage()
			]) :
			this.buildMultilineMessage([
				PlatformEnvironmentRequirements.MISSING_LOCAL_AND_CLOUD_SETUP_MESSAGE,
				PlatformEnvironmentRequirements.RUN_PREVIEW_COMMAND_MESSAGE,
				PlatformEnvironmentRequirements.RUN_TNS_SETUP_MESSAGE,
				`Run $ tns cloud setup command to install the ${NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension to configure your environment for cloud builds.`,
				this.getEnvVerificationMessage()
			]);
	}

	private getInteractiveConsoleMessage(options: { hideSyncToPreviewAppOption: boolean }) {
		const isNativeScriptCloudExtensionInstalled = this.$nativeScriptCloudExtensionService.isInstalled();
		const message = isNativeScriptCloudExtensionInstalled ?
			`${PlatformEnvironmentRequirements.MISSING_LOCAL_BUT_CLOUD_SETUP_MESSAGE} ${PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE}` :
			PlatformEnvironmentRequirements.MISSING_LOCAL_AND_CLOUD_SETUP_MESSAGE;
		const choices = isNativeScriptCloudExtensionInstalled ? [
			`Select "Configure for Local Builds" to run the setup script and automatically configure your environment for local builds.`,
			`Select "Skip Step and Configure Manually" to disregard this option and install any required components manually.`
		] : [
			`Select "Configure for Cloud Builds" to install the ${NATIVESCRIPT_CLOUD_EXTENSION_NAME} extension and automatically configure your environment for cloud builds.`,
			`Select "Configure for Local Builds" to run the setup script and automatically configure your environment for local builds.`,
			`Select "Configure for Both Local and Cloud Builds" to automatically configure your environment for both options.`,
			`Select "Configure for Both Local and Cloud Builds" to automatically configure your environment for both options.`
		];

		if (!options.hideSyncToPreviewAppOption) {
			choices.unshift(PlatformEnvironmentRequirements.SYNC_TO_PREVIEW_APP_MESSAGE);
		}

		const lines = [message].concat(choices);
		const result = this.buildMultilineMessage(lines);
		return result;
	}

	private async promptForChoice(opts: { infoMessage: string, choices: string[],  }): Promise<string> {
		this.$logger.info(opts.infoMessage);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.CheckEnvironmentRequirements,
			additionalData: `User should select: ${opts.infoMessage}`
		});

		const selection = await this.$prompter.promptForChoice(PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE, opts.choices);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.CheckEnvironmentRequirements,
			additionalData: `User selected: ${selection}`
		});

		return selection;
	}

	private getEnvVerificationMessage() {
		return `Verify that your environment is configured according to the system requirements described at ${this.$staticConfig.SYS_REQUIREMENTS_LINK}.`;
	}

	private buildMultilineMessage(parts: string[]): string {
		return parts.join(EOL);
	}

	private getChoices(options: { hideSyncToPreviewAppOption: boolean }): string[] {
		const choices = this.$nativeScriptCloudExtensionService.isInstalled() ? [
			PlatformEnvironmentRequirements.TRY_CLOUD_OPERATION_OPTION_NAME,
			PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME,
			PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME,
		] : [
				PlatformEnvironmentRequirements.CLOUD_SETUP_OPTION_NAME,
				PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME,
				PlatformEnvironmentRequirements.BOTH_CLOUD_SETUP_AND_LOCAL_SETUP_OPTION_NAME,
				PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME,
			];

		if (!options.hideSyncToPreviewAppOption) {
			choices.unshift(PlatformEnvironmentRequirements.SYNC_TO_PREVIEW_APP_OPTION_NAME);
		}

		return choices;
	}
}
$injector.register("platformEnvironmentRequirements", PlatformEnvironmentRequirements);
