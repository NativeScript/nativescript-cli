export class LogFilter implements Mobile.ILogFilter {
	private _loggingLevel: string = this.$loggingLevels.info;

	constructor(private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $injector: IInjector,
		private $loggingLevels: Mobile.ILoggingLevels) { }

	public get loggingLevel(): string {
		return this._loggingLevel;
	}

	public set loggingLevel(logLevel: string) {
		if (this.verifyLogLevel(logLevel)) {
			this._loggingLevel = logLevel;
		}
	}

	public filterData(platform: string, data: string, loggingOptions: Mobile.IDeviceLogOptions = <any>{}): string {
		loggingOptions = loggingOptions || <any>{};
		const deviceLogFilter = this.getDeviceLogFilterInstance(platform);
		loggingOptions.logLevel = loggingOptions.logLevel || this.loggingLevel;
		if (deviceLogFilter) {
			return deviceLogFilter.filterData(data, loggingOptions);
		}

		// In case the platform is not valid, just return the data without filtering.
		return data;
	}

	private getDeviceLogFilterInstance(platform: string): Mobile.IPlatformLogFilter {
		if (platform) {
			if (platform.toLowerCase() === this.$devicePlatformsConstants.iOS.toLowerCase()) {
				return this.$injector.resolve("iOSLogFilter");
			} else if (platform.toLowerCase() === this.$devicePlatformsConstants.Android.toLowerCase()) {
				return this.$injector.resolve("androidLogFilter");
			}
		}

		return null;
	}

	private verifyLogLevel(logLevel: string): boolean {
		const upperCaseLogLevel = (logLevel || '').toUpperCase();
		return upperCaseLogLevel === this.$loggingLevels.info.toUpperCase() || upperCaseLogLevel === this.$loggingLevels.full.toUpperCase();
	}

}
$injector.register("logFilter", LogFilter);
