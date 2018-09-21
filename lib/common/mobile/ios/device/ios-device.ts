import * as applicationManagerPath from "./ios-application-manager";
import * as fileSystemPath from "./ios-device-file-system";
import * as constants from "../../../constants";
import * as net from "net";
import { cache } from "../../../decorators";

export class IOSDevice implements Mobile.IiOSDevice {
	public applicationManager: Mobile.IDeviceApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public deviceInfo: Mobile.IDeviceInfo;

	private _socket: net.Socket;
	private _deviceLogHandler: Function;

	constructor(private deviceActionInfo: IOSDeviceLib.IDeviceActionInfo,
		private $injector: IInjector,
		private $processService: IProcessService,
		private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $iOSDeviceProductNameMapper: Mobile.IiOSDeviceProductNameMapper,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper) {

		this.applicationManager = this.$injector.resolve(applicationManagerPath.IOSApplicationManager, { device: this, devicePointer: this.deviceActionInfo });
		this.fileSystem = this.$injector.resolve(fileSystemPath.IOSDeviceFileSystem, { device: this, devicePointer: this.deviceActionInfo });

		const productType = deviceActionInfo.productType;
		const isTablet = this.$mobileHelper.isiOSTablet(productType);
		const deviceStatus = deviceActionInfo.status || constants.UNREACHABLE_STATUS;
		this.deviceInfo = {
			identifier: deviceActionInfo.deviceId,
			vendor: "Apple",
			platform: this.$devicePlatformsConstants.iOS,
			status: deviceStatus,
			errorHelp: deviceStatus === constants.UNREACHABLE_STATUS ? `Device ${deviceActionInfo.deviceId} is ${constants.UNREACHABLE_STATUS}` : null,
			type: "Device",
			isTablet: isTablet,
			displayName: this.$iOSDeviceProductNameMapper.resolveProductName(deviceActionInfo.deviceName) || deviceActionInfo.deviceName,
			model: this.$iOSDeviceProductNameMapper.resolveProductName(productType),
			version: deviceActionInfo.productVersion,
			color: deviceActionInfo.deviceColor,
			activeArchitecture: this.getActiveArchitecture(productType)
		};
	}

	public get isEmulator(): boolean {
		return false;
	}

	public getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		return this.applicationManager.getApplicationInfo(applicationIdentifier);
	}

	private actionOnDeviceLog(response: IOSDeviceLib.IDeviceLogData): void {
		if (response.deviceId === this.deviceInfo.identifier) {
			this.$deviceLogProvider.logData(response.message, this.$devicePlatformsConstants.iOS, this.deviceInfo.identifier);
		}
	}

	@cache()
	public async openDeviceLogStream(): Promise<void> {
		if (this.deviceInfo.status !== constants.UNREACHABLE_STATUS) {
			this._deviceLogHandler = this.actionOnDeviceLog.bind(this);
			this.$iosDeviceOperations.on(constants.DEVICE_LOG_EVENT_NAME, this._deviceLogHandler);
			this.$iosDeviceOperations.startDeviceLog(this.deviceInfo.identifier);
		}
	}

	public detach(): void {
		if (this._deviceLogHandler) {
			this.$iosDeviceOperations.removeListener(constants.DEVICE_LOG_EVENT_NAME, this._deviceLogHandler);
		}
	}

	// This function works only on OSX
	public async connectToPort(port: number): Promise<net.Socket> {
		const deviceId = this.deviceInfo.identifier;
		const deviceResponse = _.first((await this.$iosDeviceOperations.connectToPort([{ deviceId: deviceId, port: port }]))[deviceId]);

		const socket = new net.Socket();
		socket.connect(deviceResponse.port, deviceResponse.host);
		this._socket = socket;

		this.$processService.attachToProcessExitSignals(this, this.destroySocket);
		return this._socket;
	}

	private getActiveArchitecture(productType: string): string {
		let activeArchitecture = "";
		if (productType) {
			productType = productType.toLowerCase().trim();
			const majorVersionAsString = productType.match(/.*?(\d+)\,(\d+)/)[1];
			const majorVersion = parseInt(majorVersionAsString);
			let isArm64Architecture = false;
			//https://en.wikipedia.org/wiki/List_of_iOS_devices
			if (_.startsWith(productType, "iphone")) {
				isArm64Architecture = majorVersion >= 6;
			} else if (_.startsWith(productType, "ipad")) {
				isArm64Architecture = majorVersion >= 4;
			} else if (_.startsWith(productType, "ipod")) {
				isArm64Architecture = majorVersion >= 7;
			}

			activeArchitecture = isArm64Architecture ? "arm64" : "armv7";
		}

		return activeArchitecture;
	}

	private destroySocket() {
		if (this._socket) {
			this._socket.destroy();
			this._socket = null;
		}
	}
}

$injector.register("iOSDevice", IOSDevice);
