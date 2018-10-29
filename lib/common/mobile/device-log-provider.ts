import { DeviceLogProviderBase } from "./device-log-provider-base";
import { DEVICE_LOG_EVENT_NAME } from "../constants";

export class DeviceLogProvider extends DeviceLogProviderBase {
	constructor(protected $logFilter: Mobile.ILogFilter,
		protected $logger: ILogger) {
		super($logFilter, $logger);
	}

	public logData(lineText: string, platform: string, deviceIdentifier: string): void {
		const loggingOptions = this.getDeviceLogOptionsForDevice(deviceIdentifier);
		const data = this.$logFilter.filterData(platform, lineText, loggingOptions);
		if (data) {
			this.logDataCore(data, loggingOptions);
			this.emit(DEVICE_LOG_EVENT_NAME, lineText, deviceIdentifier, platform);
		}
	}

	public setLogLevel(logLevel: string, deviceIdentifier?: string): void {
		this.$logFilter.loggingLevel = logLevel.toUpperCase();
	}

	private logDataCore(data: string, loggingOptions: Mobile.IDeviceLogOptions): void {
		if (!loggingOptions || (loggingOptions && !loggingOptions.muteLogs)) {
			this.$logger.write(data);
		}
	}
}
$injector.register("deviceLogProvider", DeviceLogProvider);
