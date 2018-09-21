import { DeviceLogProviderBase } from "./device-log-provider-base";

export class DeviceLogProvider extends DeviceLogProviderBase {
	constructor(protected $logFilter: Mobile.ILogFilter,
		protected $logger: ILogger) {
		super($logFilter, $logger);
	}

	public logData(lineText: string, platform: string, deviceIdentifier: string): void {
		const loggingOptions = this.getDeviceLogOptionsForDevice(deviceIdentifier);
		const data = this.$logFilter.filterData(platform, lineText, loggingOptions);
		if (data) {
			this.$logger.write(data);
		}
	}

	public setLogLevel(logLevel: string, deviceIdentifier?: string): void {
		this.$logFilter.loggingLevel = logLevel.toUpperCase();
	}
}
$injector.register("deviceLogProvider", DeviceLogProvider);
