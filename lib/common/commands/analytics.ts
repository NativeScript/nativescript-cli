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

const analyticsCommandOptions = {
	json: booleanOption(),
} satisfies CommandOptionsSchema;

type AnalyticsCommandContext = CommandContext<typeof analyticsCommandOptions>;

function validateAnalyticsState(value: string): boolean | string {
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

async function runAnalyticsCommand(
	context: AnalyticsCommandContext,
	setting: IAnalyticsSetting,
): Promise<void> {
	const $analyticsService = inject<IAnalyticsService>("analyticsService");
	const $logger = inject<ILogger>("logger");
	const $staticConfig = inject<Config.IStaticConfig>("staticConfig");
	const settingName = $staticConfig[setting.staticConfigKey];
	const { humanReadableSettingName } = setting;

	const arg = context.args[0] || "";
	switch (arg.toLowerCase()) {
		case "enable":
			await $analyticsService.setStatus(settingName, true);
			// TODO(Analytics): await this.$analyticsService.track(this.settingName, "enabled");
			$logger.info(`${humanReadableSettingName} is now enabled.`);
			break;
		case "disable":
			// TODO(Analytics): await this.$analyticsService.track(this.settingName, "disabled");
			await $analyticsService.setStatus(settingName, false);
			$logger.info(`${humanReadableSettingName} is now disabled.`);
			break;
		case "status":
		case "":
			$logger.info(
				await $analyticsService.getStatusMessage(
					settingName,
					context.options.json,
					humanReadableSettingName,
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
		params: [{ name: "state", validate: validateAnalyticsState }],
		disableAnalytics: true,
		run: (context) => runAnalyticsCommand(context, setting),
	});

export const usageReportingCommand = defineAnalyticsCommand("usage-reporting", {
	staticConfigKey: "TRACK_FEATURE_USAGE_SETTING_NAME",
	humanReadableSettingName: "Usage reporting",
});

export const errorReportingCommand = defineAnalyticsCommand("error-reporting", {
	staticConfigKey: "ERROR_REPORT_SETTING_NAME",
	humanReadableSettingName: "Error reporting",
});
