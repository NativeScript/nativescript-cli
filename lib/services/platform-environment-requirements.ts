import { TrackActionNames } from "../constants";
import { isInteractive, hook } from "../common/helpers";
import { EOL } from "os";
import {
	IPlatformEnvironmentRequirements,
	ICheckEnvironmentRequirementsInput,
	ICheckEnvironmentRequirementsOutput,
} from "../definitions/platform";
import { IStaticConfig, IOptions } from "../declarations";
import {
	IDoctorService,
	IErrors,
	IAnalyticsService,
} from "../common/declarations";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { INotConfiguredEnvOptions } from "../common/definitions/commands";

export class PlatformEnvironmentRequirements
	implements IPlatformEnvironmentRequirements {
	constructor(
		private $doctorService: IDoctorService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $prompter: IPrompter,
		private $staticConfig: IStaticConfig,
		private $analyticsService: IAnalyticsService,
		private $injector: IInjector,
		private $previewQrCodeService: IPreviewQrCodeService
	) {}

	public get $previewAppController(): IPreviewAppController {
		return this.$injector.resolve("previewAppController");
	}

	public static LOCAL_SETUP_OPTION_NAME = "Configure for Local Builds";
	public static SYNC_TO_PREVIEW_APP_OPTION_NAME = "Sync to Playground";
	public static MANUALLY_SETUP_OPTION_NAME = "Skip Step and Configure Manually";
	private static CHOOSE_OPTIONS_MESSAGE =
		"To continue, choose one of the following options: ";
	private static NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE = `The setup script was not able to configure your environment for local builds. To execute local builds, you have to set up your environment manually. Please consult our setup instructions here 'https://docs.nativescript.org/start/quick-setup'.`;
	private static MISSING_LOCAL_SETUP_MESSAGE =
		"Your environment is not configured properly and you will not be able to execute local builds.";
	private static RUN_TNS_SETUP_MESSAGE =
		"Run $ tns setup command to run the setup script to try to automatically configure your environment for local builds.";
	private static SYNC_TO_PREVIEW_APP_MESSAGE = `Select "Sync to Playground" to enjoy NativeScript without any local setup. All you need is a couple of companion apps installed on your devices.`;
	private static RUN_PREVIEW_COMMAND_MESSAGE = `Run $ tns preview command to enjoy NativeScript without any local setup.`;

	@hook("checkEnvironment")
	public async checkEnvironmentRequirements(
		input: ICheckEnvironmentRequirementsInput
	): Promise<ICheckEnvironmentRequirementsOutput> {
		const { platform, projectDir, runtimeVersion } = input;
		const notConfiguredEnvOptions = input.notConfiguredEnvOptions || {};
		const options = input.options || <IOptions>{};

		let selectedOption = null;

		if (process.env.NS_SKIP_ENV_CHECK) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.CheckEnvironmentRequirements,
				additionalData: "Skipped: NS_SKIP_ENV_CHECK is set",
			});
			return {
				canExecute: true,
				selectedOption,
			};
		}

		const canExecute = await this.$doctorService.canExecuteLocalBuild({
			platform,
			projectDir,
			runtimeVersion,
			forceCheck: input.forceCheck,
		});

		if (!canExecute) {
			if (!isInteractive()) {
				await this.$analyticsService.trackEventActionInGoogleAnalytics({
					action: TrackActionNames.CheckEnvironmentRequirements,
					additionalData:
						"Non-interactive terminal, unable to execute local builds.",
				});
				this.fail(this.getNonInteractiveConsoleMessage(platform));
			}

			const infoMessage = this.getInteractiveConsoleMessage(
				notConfiguredEnvOptions
			);

			const choices = this.getChoices(notConfiguredEnvOptions);

			selectedOption = await this.promptForChoice({ infoMessage, choices });

			this.processManuallySetupIfNeeded(selectedOption, platform);
			await this.processSyncToPreviewAppIfNeeded(
				selectedOption,
				projectDir,
				options
			);

			if (
				selectedOption ===
				PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME
			) {
				await this.$doctorService.runSetupScript();

				if (
					await this.$doctorService.canExecuteLocalBuild({
						platform,
						projectDir,
						runtimeVersion,
						forceCheck: input.forceCheck,
					})
				) {
					return {
						canExecute: true,
						selectedOption,
					};
				}

				this.fail(
					PlatformEnvironmentRequirements.NOT_CONFIGURED_ENV_AFTER_SETUP_SCRIPT_MESSAGE
				);
			}
		}

		return {
			canExecute,
			selectedOption,
		};
	}

	private processManuallySetupIfNeeded(
		selectedOption: string,
		platform?: string
	) {
		if (
			selectedOption ===
			PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME
		) {
			this.processManuallySetup(platform);
		}
	}

	private async processSyncToPreviewAppIfNeeded(
		selectedOption: string,
		projectDir: string,
		options: IOptions
	) {
		if (
			selectedOption ===
			PlatformEnvironmentRequirements.SYNC_TO_PREVIEW_APP_OPTION_NAME
		) {
			if (!projectDir) {
				this.$errors.fail(
					`No project found. In order to sync to playground you need to go to project directory or specify --path option.`
				);
			}

			await this.$previewAppController.startPreview({
				projectDir,
				env: options.env,
				useHotModuleReload: options.hmr,
			});

			await this.$previewQrCodeService.printLiveSyncQrCode({
				projectDir,
				useHotModuleReload: options.hmr,
				link: options.link,
			});
		}
	}

	private processManuallySetup(platform?: string): void {
		this.fail(
			`To be able to ${
				platform ? `build for ${platform}` : "build"
			}, verify that your environment is configured according to the system requirements described at ${
				this.$staticConfig.SYS_REQUIREMENTS_LINK
			}. If you have any questions, check Stack Overflow: 'https://stackoverflow.com/questions/tagged/nativescript' and our public Discord channel: 'https://nativescript.org/discord/'`
		);
	}

	private fail(message: string): void {
		this.$errors.fail({ formatStr: message, printOnStdout: true });
	}

	private getNonInteractiveConsoleMessage(platform: string) {
		return this.buildMultilineMessage([
			`${PlatformEnvironmentRequirements.MISSING_LOCAL_SETUP_MESSAGE} ${PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE}`,
			PlatformEnvironmentRequirements.RUN_PREVIEW_COMMAND_MESSAGE,
			PlatformEnvironmentRequirements.RUN_TNS_SETUP_MESSAGE,
			this.getEnvVerificationMessage(),
		]);
	}

	private getInteractiveConsoleMessage(options: INotConfiguredEnvOptions) {
		const message = PlatformEnvironmentRequirements.MISSING_LOCAL_SETUP_MESSAGE;
		const choices = [
			`Select "Configure for Local Builds" to run the setup script and automatically configure your environment for local builds.`,
			`Select "Skip Step and Configure Manually" to disregard this option and install any required components manually.`,
		];

		if (!options.hideSyncToPreviewAppOption) {
			choices.unshift(
				PlatformEnvironmentRequirements.SYNC_TO_PREVIEW_APP_MESSAGE
			);
		}

		const lines = [message].concat(choices);
		const result = this.buildMultilineMessage(lines);
		return result;
	}

	private async promptForChoice(opts: {
		infoMessage: string;
		choices: string[];
	}): Promise<string> {
		this.$logger.info(opts.infoMessage);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.CheckEnvironmentRequirements,
			additionalData: `User should select: ${opts.infoMessage}`,
		});

		const selection = await this.$prompter.promptForChoice(
			PlatformEnvironmentRequirements.CHOOSE_OPTIONS_MESSAGE,
			opts.choices
		);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.CheckEnvironmentRequirements,
			additionalData: `User selected: ${selection}`,
		});

		return selection;
	}

	private getEnvVerificationMessage() {
		return `Verify that your environment is configured according to the system requirements described at ${this.$staticConfig.SYS_REQUIREMENTS_LINK}.`;
	}

	private buildMultilineMessage(parts: string[]): string {
		return parts.join(EOL);
	}

	private getChoices(options: INotConfiguredEnvOptions): string[] {
		const choices: string[] = [];

		choices.push(
			...[
				PlatformEnvironmentRequirements.LOCAL_SETUP_OPTION_NAME,
				PlatformEnvironmentRequirements.MANUALLY_SETUP_OPTION_NAME,
			]
		);

		if (!options.hideSyncToPreviewAppOption) {
			choices.unshift(
				PlatformEnvironmentRequirements.SYNC_TO_PREVIEW_APP_OPTION_NAME
			);
		}

		return choices;
	}
}
injector.register(
	"platformEnvironmentRequirements",
	PlatformEnvironmentRequirements
);
