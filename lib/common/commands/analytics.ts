import { IAnalyticsService } from "../declarations";
import {
	booleanOption,
	CommandContext,
	CommandName,
	CommandOptionsSchema,
	defineCommand,
} from "../define-command";
import { inject } from "../di";

/** Which reporting a command configures. */
interface IAnalyticsSetting {
	/** The static config property naming the setting the CLI stores it under. */
	staticConfigKey: keyof Pick<
		Config.IStaticConfig,
		"TRACK_FEATURE_USAGE_SETTING_NAME" | "ERROR_REPORT_SETTING_NAME"
	>;
	humanReadableSettingName: string;
}

export const analyticsCommandOptions = {
	json: booleanOption(),
} satisfies CommandOptionsSchema;

export type AnalyticsCommandContext = CommandContext<
	typeof analyticsCommandOptions
>;

export function setupAnalyticsCommand(setting: IAnalyticsSetting) {
	const $staticConfig = inject<Config.IStaticConfig>("staticConfig");

	return {
		settingName: $staticConfig[setting.staticConfigKey],
		humanReadableSettingName: setting.humanReadableSettingName,
		$analyticsService: inject<IAnalyticsService>("analyticsService"),
		$logger: inject<ILogger>("logger"),
	};
}

export type IAnalyticsCommandServices = ReturnType<
	typeof setupAnalyticsCommand
>;

export function validateAnalyticsState(value: string): boolean | string {
	switch ((value || "").toLowerCase()) {
		case "enable":
		case "disable":
		case "status":
		case "":
			return true;
		default:
			return `The value '${value}' is not valid. Valid values are 'enable', 'disable' and 'status'.`;
	}
}

export async function runAnalyticsCommand(
	context: AnalyticsCommandContext,
	services: IAnalyticsCommandServices,
): Promise<void> {
	const arg = context.args[0] || "";
	switch (arg.toLowerCase()) {
		case "enable":
			await services.$analyticsService.setStatus(services.settingName, true);
			// TODO(Analytics): await this.$analyticsService.track(this.settingName, "enabled");
			services.$logger.info(
				`${services.humanReadableSettingName} is now enabled.`,
			);
			break;
		case "disable":
			// TODO(Analytics): await this.$analyticsService.track(this.settingName, "disabled");
			await services.$analyticsService.setStatus(services.settingName, false);
			services.$logger.info(
				`${services.humanReadableSettingName} is now disabled.`,
			);
			break;
		case "status":
		case "":
			services.$logger.info(
				await services.$analyticsService.getStatusMessage(
					services.settingName,
					context.options.json,
					services.humanReadableSettingName,
				),
			);
			break;
	}
}

const defineAnalyticsCommand = <const TName extends CommandName>(
	name: TName,
	setting: IAnalyticsSetting,
) =>
	defineCommand({
		name,
		description: "Configures anonymous reporting for the CLI.",
		options: analyticsCommandOptions,
		arguments: [{ name: "state", validate: validateAnalyticsState }],
		disableAnalytics: true,
		setup: () => setupAnalyticsCommand(setting),
		run: runAnalyticsCommand,
	});

export const usageReportingCommand = defineAnalyticsCommand("usage-reporting", {
	staticConfigKey: "TRACK_FEATURE_USAGE_SETTING_NAME",
	humanReadableSettingName: "Usage reporting",
});

export const errorReportingCommand = defineAnalyticsCommand("error-reporting", {
	staticConfigKey: "ERROR_REPORT_SETTING_NAME",
	humanReadableSettingName: "Error reporting",
});
