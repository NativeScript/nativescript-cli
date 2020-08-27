import { EventEmitter } from "events";
import { getPropertyName } from "../helpers";
import { IDictionary } from "../declarations";

export abstract class DeviceLogProviderBase
	extends EventEmitter
	implements Mobile.IDeviceLogProvider {
	protected devicesLogOptions: IDictionary<Mobile.IDeviceLogOptions> = {};

	constructor(
		protected $logFilter: Mobile.ILogFilter,
		protected $logger: ILogger,
		protected $logSourceMapService: Mobile.ILogSourceMapService
	) {
		super();
	}

	public async setSourceFileLocation(
		pathToOriginalFile: string
	): Promise<void> {
		try {
			await this.$logSourceMapService.setSourceMapConsumerForFile(
				pathToOriginalFile
			);
		} catch (err) {
			this.$logger.trace("Error while trying to set source map file", err);
		}
	}

	public abstract logData(
		lineText: string,
		platform: string,
		deviceIdentifier: string
	): void;

	public abstract setLogLevel(
		logLevel: string,
		deviceIdentifier?: string
	): void;

	public setApplicationPidForDevice(
		deviceIdentifier: string,
		pid: string
	): void {
		this.setDeviceLogOptionsProperty(
			deviceIdentifier,
			(deviceLogOptions: Mobile.IDeviceLogOptions) =>
				deviceLogOptions.applicationPid,
			pid
		);
	}

	public setProjectNameForDevice(
		deviceIdentifier: string,
		projectName: string
	): void {
		this.setDeviceLogOptionsProperty(
			deviceIdentifier,
			(deviceLogOptions: Mobile.IDeviceLogOptions) =>
				deviceLogOptions.projectName,
			projectName
		);
	}

	public setProjectDirForDevice(
		deviceIdentifier: string,
		projectDir: string
	): void {
		this.setDeviceLogOptionsProperty(
			deviceIdentifier,
			(deviceLogOptions: Mobile.IDeviceLogOptions) =>
				deviceLogOptions.projectDir,
			projectDir
		);
	}

	protected setDefaultLogLevelForDevice(deviceIdentifier: string): void {
		const logLevel =
			(this.devicesLogOptions[deviceIdentifier] &&
				this.devicesLogOptions[deviceIdentifier].logLevel) ||
			this.$logFilter.loggingLevel;
		this.setLogLevel(logLevel, deviceIdentifier);
	}

	protected getApplicationPidForDevice(deviceIdentifier: string): string {
		return (
			this.devicesLogOptions[deviceIdentifier] &&
			this.devicesLogOptions[deviceIdentifier].applicationPid
		);
	}

	protected getDeviceLogOptionsForDevice(
		deviceIdentifier: string
	): Mobile.IDeviceLogOptions {
		const loggingOptions = this.devicesLogOptions[deviceIdentifier];
		if (!loggingOptions) {
			this.setDefaultLogLevelForDevice(deviceIdentifier);
		}

		return this.devicesLogOptions[deviceIdentifier];
	}

	protected setDeviceLogOptionsProperty(
		deviceIdentifier: string,
		propNameFunction: Function,
		propertyValue: string | boolean
	): void {
		const propertyName = getPropertyName(propNameFunction);

		if (propertyName) {
			this.devicesLogOptions[deviceIdentifier] =
				this.devicesLogOptions[deviceIdentifier] ||
				<Mobile.IDeviceLogOptions>{};
			this.devicesLogOptions[deviceIdentifier][propertyName] = propertyValue;
		}
	}
}
