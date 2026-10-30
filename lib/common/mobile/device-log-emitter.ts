import { DeviceLogProviderBase } from "./device-log-provider-base";
import { DEVICE_LOG_EVENT_NAME } from "../constants";
import { injector } from "../yok";
import * as _ from "lodash";
import { getIOSLogEntryText, getIOSLogScope } from "./ios/ios-log-entry";

export class DeviceLogEmitter extends DeviceLogProviderBase {
	constructor(
		protected $logFilter: Mobile.ILogFilter,
		$logger: ILogger,
		private $loggingLevels: Mobile.ILoggingLevels,
		protected $logSourceMapService: Mobile.ILogSourceMapService,
	) {
		super($logFilter, $logger, $logSourceMapService);
	}

	public logData(
		line: string,
		platform: string,
		deviceIdentifier: string,
	): void {
		this.setDefaultLogLevelForDevice(deviceIdentifier);

		const loggingOptions = this.getDeviceLogOptionsForDevice(
			deviceIdentifier,
		) || { logLevel: this.$loggingLevels.info, projectDir: null };
		let data = this.$logFilter.filterData(platform, line, loggingOptions);
		data = this.$logSourceMapService.replaceWithOriginalFileLocations(
			platform,
			data,
			loggingOptions,
		);

		this.emitData(data, platform, deviceIdentifier);
	}

	public logEntry(
		entry: Mobile.IiOSLogEntry,
		platform: string,
		deviceIdentifier: string,
	): void {
		const loggingOptions = this.getDeviceLogOptionsForDevice(deviceIdentifier);
		const text = getIOSLogEntryText(entry, {
			processName: loggingOptions && loggingOptions.projectName,
			...getIOSLogScope(
				this.$logger.getLevel(),
				loggingOptions?.logLevel?.toUpperCase() === this.$loggingLevels.full,
			),
		});
		if (text) {
			this.stitchIOSLogEntry(entry, text, deviceIdentifier, (message) =>
				this.emitData(
					this.$logSourceMapService.replaceWithOriginalFileLocations(
						platform,
						message + "\n",
						loggingOptions,
					),
					platform,
					deviceIdentifier,
				),
			);
		}
	}

	private emitData(
		data: string,
		platform: string,
		deviceIdentifier: string,
	): void {
		if (data) {
			this.emit("data", deviceIdentifier, data);
			this.emit(DEVICE_LOG_EVENT_NAME, data, deviceIdentifier, platform);
		}
	}

	public setLogLevel(logLevel: string, deviceIdentifier?: string): void {
		if (deviceIdentifier) {
			this.setDeviceLogOptionsProperty(
				deviceIdentifier,
				(deviceLogOptions: Mobile.IDeviceLogOptions) =>
					deviceLogOptions.logLevel,
				logLevel.toUpperCase(),
			);
		} else {
			this.$logFilter.loggingLevel = logLevel.toUpperCase();

			_.keys(this.devicesLogOptions).forEach((deviceId) => {
				this.devicesLogOptions[deviceId] =
					this.devicesLogOptions[deviceId] || <Mobile.IDeviceLogOptions>{};
				this.devicesLogOptions[deviceId].logLevel =
					this.$logFilter.loggingLevel;
			});
		}
	}
}

injector.register("deviceLogProvider", DeviceLogEmitter);
