import * as applicationManagerPath from "./ios-simulator-application-manager";
import * as fileSystemPath from "./ios-simulator-file-system";
import * as constants from "../../../constants";
import { cache } from "../../../decorators";

export class IOSSimulator implements Mobile.IiOSSimulator {
	private _applicationManager: Mobile.IDeviceApplicationManager;
	private _fileSystem: Mobile.IDeviceFileSystem;
	private _deviceLogHandler: Function;

	constructor(private simulator: Mobile.IiSimDevice,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $injector: IInjector,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider) { }

	public get deviceInfo(): Mobile.IDeviceInfo {
		return {
			imageIdentifier: this.simulator.id,
			identifier: this.simulator.id,
			displayName: this.simulator.name,
			model: _.last(this.simulator.fullId.split(".")),
			version: this.simulator.runtimeVersion,
			vendor: "Apple",
			platform: this.$devicePlatformsConstants.iOS,
			status: constants.CONNECTED_STATUS,
			errorHelp: null,
			isTablet: this.simulator.fullId.toLowerCase().indexOf("ipad") !== -1,
			type: constants.DeviceTypes.Emulator
		};
	}

	public get isEmulator(): boolean {
		return true;
	}

	public async getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		return this.applicationManager.getApplicationInfo(applicationIdentifier);
	}

	public get applicationManager(): Mobile.IDeviceApplicationManager {
		if (!this._applicationManager) {
			this._applicationManager = this.$injector.resolve(applicationManagerPath.IOSSimulatorApplicationManager, { iosSim: this.$iOSSimResolver.iOSSim, device: this });
		}

		return this._applicationManager;
	}

	public get fileSystem(): Mobile.IDeviceFileSystem {
		if (!this._fileSystem) {
			this._fileSystem = this.$injector.resolve(fileSystemPath.IOSSimulatorFileSystem, { iosSim: this.$iOSSimResolver.iOSSim });
		}

		return this._fileSystem;
	}

	@cache()
	public async openDeviceLogStream(options?: Mobile.IiOSLogStreamOptions): Promise<void> {
		this._deviceLogHandler = this.onDeviceLog.bind(this, options);
		this.$iOSSimulatorLogProvider.on(constants.DEVICE_LOG_EVENT_NAME, this._deviceLogHandler);
		return this.$iOSSimulatorLogProvider.startLogProcess(this.simulator.id, options);
	}

	public detach(): void {
		if (this._deviceLogHandler) {
			this.$iOSSimulatorLogProvider.removeListener(constants.DEVICE_LOG_EVENT_NAME, this._deviceLogHandler);
		}
	}

	private onDeviceLog(options: Mobile.IiOSLogStreamOptions, response: IOSDeviceLib.IDeviceLogData): void {
		if (response.deviceId === this.deviceInfo.identifier && !(<any>response).muted) {
			this.$deviceLogProvider.logData(response.message, this.$devicePlatformsConstants.iOS, this.deviceInfo.identifier);
		}
	}
}
