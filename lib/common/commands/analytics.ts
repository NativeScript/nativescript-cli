export class AnalyticsCommandParameter implements ICommandParameter {
	constructor(private $errors: IErrors) { }
	mandatory = false;
	async validate(validationValue: string): Promise<boolean> {
		const val = validationValue || "";
		switch (val.toLowerCase()) {
			case "enable":
			case "disable":
			case "status":
			case "":
				return true;
			default:
				this.$errors.fail(`The value '${validationValue}' is not valid. Valid values are 'enable', 'disable' and 'status'.`);
		}
	}
}

class AnalyticsCommand implements ICommand {
	constructor(protected $analyticsService: IAnalyticsService,
		private $logger: ILogger,
		private $errors: IErrors,
		private $options: ICommonOptions,
		private settingName: string,
		private humanReadableSettingName: string) { }

	public allowedParameters = [new AnalyticsCommandParameter(this.$errors)];
	public disableAnalytics = true;

	public async execute(args: string[]): Promise<void> {
		const arg = args[0] || "";
		switch (arg.toLowerCase()) {
			case "enable":
				await this.$analyticsService.setStatus(this.settingName, true);
				await this.$analyticsService.track(this.settingName, "enabled");
				this.$logger.info(`${this.humanReadableSettingName} is now enabled.`);
				break;
			case "disable":
				await this.$analyticsService.track(this.settingName, "disabled");
				await this.$analyticsService.setStatus(this.settingName, false);
				this.$logger.info(`${this.humanReadableSettingName} is now disabled.`);
				break;
			case "status":
			case "":
				this.$logger.out(await this.$analyticsService.getStatusMessage(this.settingName, this.$options.json, this.humanReadableSettingName));
				break;
		}
	}
}

export class UsageReportingCommand extends AnalyticsCommand {
	constructor(protected $analyticsService: IAnalyticsService,
		$logger: ILogger,
		$errors: IErrors,
		$options: ICommonOptions,
		$staticConfig: Config.IStaticConfig) {
		super($analyticsService, $logger, $errors, $options, $staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, "Usage reporting");
	}
}
$injector.registerCommand("usage-reporting", UsageReportingCommand);

export class ErrorReportingCommand extends AnalyticsCommand {
	constructor(protected $analyticsService: IAnalyticsService,
		$logger: ILogger,
		$errors: IErrors,
		$options: ICommonOptions,
		$staticConfig: Config.IStaticConfig
	) {
		super($analyticsService, $logger, $errors, $options, $staticConfig.ERROR_REPORT_SETTING_NAME, "Error reporting");
	}
}
$injector.registerCommand("error-reporting", ErrorReportingCommand);
