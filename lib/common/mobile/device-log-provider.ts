import { DeviceLogProviderBase } from "./device-log-provider-base";
import { DEVICE_LOG_EVENT_NAME } from "../constants";
import { LoggerConfigData } from "../../constants";
import colors = require("colors");

export class DeviceLogProvider extends DeviceLogProviderBase {
	constructor(protected $logFilter: Mobile.ILogFilter,
		protected $logger: ILogger,
		protected $logSourceMapService: Mobile.ILogSourceMapService) {
		super($logFilter, $logger, $logSourceMapService);
	}
	private colors = [
		"yellow",
		"blue",
		"magenta",
		"cyan",
		"gray"
	]
	private deviceColors: IDictionary<string> = {};

	public logData(lineText: string, platform: string, deviceIdentifier: string): void {
		const loggingOptions = this.getDeviceLogOptionsForDevice(deviceIdentifier);
		let data = this.$logFilter.filterData(platform, lineText, loggingOptions);
		data = this.$logSourceMapService.replaceWithOriginalFileLocations(platform, data, loggingOptions);
		if (data) {
			let color = this.deviceColors[deviceIdentifier];
			if(!color) {
				color = this. colors[Math.floor(Math.random() * Math.floor(4))];
				this.deviceColors[deviceIdentifier] = color;
			}
			//const device = this.$devicesService.getDeviceByIdentifier(deviceIdentifier);
			this.logDataCore(`[${colors[color](deviceIdentifier)}] ${data}`);
			this.emit(DEVICE_LOG_EVENT_NAME, lineText, deviceIdentifier, platform);
		}
	}

	public setLogLevel(logLevel: string, deviceIdentifier?: string): void {
		this.$logFilter.loggingLevel = logLevel.toUpperCase();
	}

	private logDataCore(data: string): void {
		this.$logger.info(data, { [LoggerConfigData.skipNewLine]: true });
	}
}
$injector.register("deviceLogProvider", DeviceLogProvider);
