import * as path from "path";
import { doesCurrentNpmCommandMatch, isInteractive } from "../helpers";
import {
	TrackActionNames,
	AnalyticsEventLabelDelimiter,
} from "../../constants";
import { IPackageInstallationManager } from "../../declarations";
import {
	IAnalyticsService,
	IFileSystem,
	ISettingsService,
} from "../declarations";
import { defineCommand } from "../define-command";
import { inject } from "../di";
import { IExtensibilityService } from "../definitions/extensibility";

// disabled for now (6/24/2020)
// const FEEDBACK_FORM_URL = "https://www.nativescript.org/uninstall-feedback";

async function handleFeedbackForm(): Promise<void> {
	// disabled for now (6/24/2020)
	// if (isInteractive()) {
	// 	$opener.open(FEEDBACK_FORM_URL);
	// }
	return Promise.resolve();
}

async function handleIntentionalUninstall(
	$extensibilityService: IExtensibilityService,
	$packageInstallationManager: IPackageInstallationManager,
): Promise<void> {
	$extensibilityService.removeAllExtensions();
	$packageInstallationManager.clearInspectorCache();
	await handleFeedbackForm();
}

export const preUninstallCommandDefinition = defineCommand({
	name: "dev-preuninstall",
	description: "Runs the CLI's own uninstall bookkeeping.",
	arguments: "none",
	async run(): Promise<void> {
		const $analyticsService = inject<IAnalyticsService>("analyticsService");
		const $extensibilityService = inject<IExtensibilityService>(
			"extensibilityService",
		);
		const $fs = inject<IFileSystem>("fs");
		const $packageInstallationManager = inject<IPackageInstallationManager>(
			"packageInstallationManager",
		);
		const $settingsService = inject<ISettingsService>("settingsService");

		const isIntentionalUninstall = doesCurrentNpmCommandMatch([
			/^uninstall$/,
			/^remove$/,
			/^rm$/,
			/^r$/,
			/^un$/,
			/^unlink$/,
		]);

		await $analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.UninstallCLI,
			additionalData: `isIntentionalUninstall${AnalyticsEventLabelDelimiter}${isIntentionalUninstall}${AnalyticsEventLabelDelimiter}isInteractive${AnalyticsEventLabelDelimiter}${!!isInteractive()}`,
		});

		if (isIntentionalUninstall) {
			await handleIntentionalUninstall(
				$extensibilityService,
				$packageInstallationManager,
			);
		}

		$fs.deleteFile(
			path.join($settingsService.getProfileDir(), "KillSwitches", "cli"),
		);
		await $analyticsService.finishTracking();
	},
});
