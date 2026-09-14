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

export interface IPreUninstallCommandServices {
	$analyticsService: IAnalyticsService;
	$extensibilityService: IExtensibilityService;
	$fs: IFileSystem;
	$packageInstallationManager: IPackageInstallationManager;
	$settingsService: ISettingsService;
}

export function setupPreUninstallCommand(): IPreUninstallCommandServices {
	return {
		$analyticsService: inject<IAnalyticsService>("analyticsService"),
		$extensibilityService: inject<IExtensibilityService>(
			"extensibilityService",
		),
		$fs: inject<IFileSystem>("fs"),
		$packageInstallationManager: inject<IPackageInstallationManager>(
			"packageInstallationManager",
		),
		$settingsService: inject<ISettingsService>("settingsService"),
	};
}

async function handleFeedbackForm(): Promise<void> {
	// disabled for now (6/24/2020)
	// if (isInteractive()) {
	// 	$opener.open(FEEDBACK_FORM_URL);
	// }
	return Promise.resolve();
}

async function handleIntentionalUninstall(
	services: IPreUninstallCommandServices,
): Promise<void> {
	services.$extensibilityService.removeAllExtensions();
	services.$packageInstallationManager.clearInspectorCache();
	await handleFeedbackForm();
}

export const preUninstallCommandDefinition = defineCommand({
	name: "dev-preuninstall",
	description: "Runs the CLI's own uninstall bookkeeping.",
	arguments: "none",
	setup: setupPreUninstallCommand,
	async run(context, services): Promise<void> {
		const isIntentionalUninstall = doesCurrentNpmCommandMatch([
			/^uninstall$/,
			/^remove$/,
			/^rm$/,
			/^r$/,
			/^un$/,
			/^unlink$/,
		]);

		await services.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.UninstallCLI,
			additionalData: `isIntentionalUninstall${AnalyticsEventLabelDelimiter}${isIntentionalUninstall}${AnalyticsEventLabelDelimiter}isInteractive${AnalyticsEventLabelDelimiter}${!!isInteractive()}`,
		});

		if (isIntentionalUninstall) {
			await handleIntentionalUninstall(services);
		}

		services.$fs.deleteFile(
			path.join(
				services.$settingsService.getProfileDir(),
				"KillSwitches",
				"cli",
			),
		);
		await services.$analyticsService.finishTracking();
	},
});
