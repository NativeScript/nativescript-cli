import * as applicationManagerPath from "./ios-application-manager";
import * as fileSystemPath from "./ios-device-file-system";
import * as commonConstants from "../../../constants";
import * as constants from "../../../../constants";
import * as net from "net";
import { cache } from "../../../decorators";
import * as helpers from "../../../../common/helpers";
import { IOSDeviceBase } from "../ios-device-base";

export class IOSDevice extends IOSDeviceBase {
	public applicationManager: Mobile.IDeviceApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public deviceInfo: Mobile.IDeviceInfo;
	private _deviceLogHandler: (...args: any[]) => void;

	constructor(private deviceActionInfo: IOSDeviceLib.IDeviceActionInfo,
		protected $errors: IErrors,
		private $injector: IInjector,
		protected $iOSDebuggerPortService: IIOSDebuggerPortService,
		protected $deviceLogProvider: Mobile.IDeviceLogProvider,
		protected $logger: ILogger,
		protected $lockService: ILockService,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $iOSDeviceProductNameMapper: Mobile.IiOSDeviceProductNameMapper,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper) {
		super();
		this.applicationManager = this.$injector.resolve(applicationManagerPath.IOSApplicationManager, { device: this, devicePointer: this.deviceActionInfo });
		this.fileSystem = this.$injector.resolve(fileSystemPath.IOSDeviceFileSystem, { device: this, devicePointer: this.deviceActionInfo });
		const productType = deviceActionInfo.productType;
		const isTablet = this.$mobileHelper.isiOSTablet(productType);
		const deviceStatus = deviceActionInfo.status || commonConstants.UNREACHABLE_STATUS;
		this.deviceInfo = {
			identifier: deviceActionInfo.deviceId,
			vendor: "Apple",
			platform: this.$devicePlatformsConstants.iOS,
			status: deviceStatus,
			errorHelp: deviceStatus === commonConstants.UNREACHABLE_STATUS ? `Device ${deviceActionInfo.deviceId} is ${commonConstants.UNREACHABLE_STATUS}` : null,
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

	@cache()
	public async openDeviceLogStream(): Promise<void> {
		if (this.deviceInfo.status !== commonConstants.UNREACHABLE_STATUS) {
			this._deviceLogHandler = this.actionOnDeviceLog.bind(this);
			this.$iosDeviceOperations.on(commonConstants.DEVICE_LOG_EVENT_NAME, this._deviceLogHandler);
			this.$iosDeviceOperations.startDeviceLog(this.deviceInfo.identifier);
		}
	}

	protected async getDebugSocketCore(appId: string): Promise<net.Socket> {
		await this.$iOSSocketRequestExecutor.executeAttachRequest(this, constants.AWAIT_NOTIFICATION_TIMEOUT_SECONDS, appId);
		const port = await super.getDebuggerPort(appId);
		const deviceId = this.deviceInfo.identifier;

		const socket = await helpers.connectEventuallyUntilTimeout(
			async () => {
				const deviceResponse = _.first((await this.$iosDeviceOperations.connectToPort([{ deviceId: deviceId, port: port }]))[deviceId]);
				const _socket = new net.Socket();
				_socket.connect(deviceResponse.port, deviceResponse.host);
				return _socket;
			},
			commonConstants.SOCKET_CONNECTION_TIMEOUT_MS);

		return socket;
	}

	private actionOnDeviceLog(response: IOSDeviceLib.IDeviceLogData): void {
		if (response.deviceId === this.deviceInfo.identifier) {
			this.$deviceLogProvider.logData(response.message, this.$devicePlatformsConstants.iOS, this.deviceInfo.identifier);
		}
	}

	public detach(): void {
		if (this._deviceLogHandler) {
			this.$iosDeviceOperations.removeListener(commonConstants.DEVICE_LOG_EVENT_NAME, this._deviceLogHandler);
		}
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
}

$injector.register("iOSDevice", IOSDevice);
