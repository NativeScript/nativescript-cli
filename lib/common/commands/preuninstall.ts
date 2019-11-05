import * as path from "path";
import { doesCurrentNpmCommandMatch, isInteractive } from "../helpers";
import { TrackActionNames, AnalyticsEventLabelDelimiter } from "../../constants";
import { killServer } from "nativescript-cli-server";

export class PreUninstallCommand implements ICommand {
	private static FEEDBACK_FORM_URL = "https://www.nativescript.org/uninstall-feedback";

	public allowedParameters: ICommandParameter[] = [];

	constructor(private $analyticsService: IAnalyticsService,
		private $extensibilityService: IExtensibilityService,
		private $fs: IFileSystem,
		private $opener: IOpener,
		private $packageInstallationManager: IPackageInstallationManager,
		private $settingsService: ISettingsService) { }

	public async execute(args: string[]): Promise<void> {
		const isIntentionalUninstall = doesCurrentNpmCommandMatch([/^uninstall$/, /^remove$/, /^rm$/, /^r$/, /^un$/, /^unlink$/]);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.UninstallCLI,
			additionalData: `isIntentionalUninstall${AnalyticsEventLabelDelimiter}${isIntentionalUninstall}${AnalyticsEventLabelDelimiter}isInteractive${AnalyticsEventLabelDelimiter}${!!isInteractive()}`
		});

		if (isIntentionalUninstall) {
			await this.handleIntentionalUninstall();
		}

		await killServer();
		this.$fs.deleteFile(path.join(this.$settingsService.getProfileDir(), "KillSwitches", "cli"));
		await this.$analyticsService.finishTracking();
	}

	private async handleIntentionalUninstall(): Promise<void> {
		this.$extensibilityService.removeAllExtensions();
		this.$packageInstallationManager.clearInspectorCache();
		await this.handleFeedbackForm();
	}

	private async handleFeedbackForm(): Promise<void> {
		if (isInteractive()) {
			this.$opener.open(PreUninstallCommand.FEEDBACK_FORM_URL);
		}
	}
}

$injector.registerCommand("dev-preuninstall", PreUninstallCommand);
