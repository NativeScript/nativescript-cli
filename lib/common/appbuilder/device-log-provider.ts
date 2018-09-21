import { DeviceLogProviderBase } from "../mobile/device-log-provider-base";

export class DeviceLogProvider extends DeviceLogProviderBase {
	constructor(protected $logFilter: Mobile.ILogFilter,
		$logger: ILogger,
		private $loggingLevels: Mobile.ILoggingLevels) {
		super($logFilter, $logger);
	}

	public logData(line: string, platform: string, deviceIdentifier: string): void {
		this.setDefaultLogLevelForDevice(deviceIdentifier);

		const loggingOptions = this.getDeviceLogOptionsForDevice(deviceIdentifier) || { logLevel: this.$loggingLevels.info };
		const data = this.$logFilter.filterData(platform, line, loggingOptions);

		if (data) {
			this.emit('data', deviceIdentifier, data);
		}
	}

	public setLogLevel(logLevel: string, deviceIdentifier?: string): void {
		if (deviceIdentifier) {
			this.setDeviceLogOptionsProperty(deviceIdentifier, (deviceLogOptions: Mobile.IDeviceLogOptions) => deviceLogOptions.logLevel, logLevel.toUpperCase());
		} else {
			this.$logFilter.loggingLevel = logLevel.toUpperCase();

			_.keys(this.devicesLogOptions).forEach(deviceId => {
				this.devicesLogOptions[deviceId] = this.devicesLogOptions[deviceId] || <Mobile.IDeviceLogOptions>{};
				this.devicesLogOptions[deviceId].logLevel = this.$logFilter.loggingLevel;
			});
		}
	}
}

$injector.register("deviceLogProvider", DeviceLogProvider);
