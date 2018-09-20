export class IOSLogFilter implements Mobile.IPlatformLogFilter {
	protected infoFilterRegex = /^.*?(AppBuilder|Cordova|NativeScript).*?(<Notice>:.*?|<Warning>:.*?|<Error>:.*?)$/im;

	constructor(private $loggingLevels: Mobile.ILoggingLevels) { }

	public filterData(data: string, loggingOptions: Mobile.IDeviceLogOptions = <any>{}): string {
		const specifiedLogLevel = (loggingOptions.logLevel || '').toUpperCase();
		const pid = loggingOptions && loggingOptions.applicationPid;

		if (specifiedLogLevel === this.$loggingLevels.info && data) {
			if (pid) {
				return data.indexOf(`[${pid}]`) !== -1 ? data.trim() : null;
			}

			const matchingInfoMessage = data.match(this.infoFilterRegex);
			return matchingInfoMessage ? matchingInfoMessage[2] : null;
		}

		return data;
	}
}

$injector.register("iOSLogFilter", IOSLogFilter);
