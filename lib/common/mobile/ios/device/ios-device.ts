import * as applicationManagerPath from "./ios-application-manager";
import * as fileSystemPath from "./ios-device-file-system";
import * as commonConstants from "../../../constants";
import * as constants from "../../../../constants";
import * as net from "net";
import { cache } from "../../../decorators";
import * as helpers from "../../../../common/helpers";

export class IOSDevice implements Mobile.IiOSDevice {
	public applicationManager: Mobile.IDeviceApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public deviceInfo: Mobile.IDeviceInfo;
	private socket: net.Socket;

	private _deviceLogHandler: (...args: any[]) => void;

	constructor(private deviceActionInfo: IOSDeviceLib.IDeviceActionInfo,
		private $errors: IErrors,
		private $injector: IInjector,
		private $iOSDebuggerPortService: IIOSDebuggerPortService,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
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
		if (this.deviceInfo.status !== commonConstants.UNREACHABLE_STATUS) {
			this._deviceLogHandler = this.actionOnDeviceLog.bind(this);
			this.$iosDeviceOperations.on(commonConstants.DEVICE_LOG_EVENT_NAME, this._deviceLogHandler);
			this.$iosDeviceOperations.startDeviceLog(this.deviceInfo.identifier);
		}
	}

	public detach(): void {
		if (this._deviceLogHandler) {
			this.$iosDeviceOperations.removeListener(commonConstants.DEVICE_LOG_EVENT_NAME, this._deviceLogHandler);
		}
	}

	public async getLiveSyncSocket(appId: string, projectDir: string): Promise<net.Socket> {
		return this.getSocket(appId, projectDir);
	}

	public async getDebugSocket(appId: string, projectDir: string): Promise<net.Socket> {
		return this.getSocket(appId, projectDir);
	}

	private async getSocket(appId: string, projectDir: string): Promise<net.Socket> {
		if (this.socket) {
			return this.socket;
		}

		await this.$iOSSocketRequestExecutor.executeAttachRequest(this, constants.AWAIT_NOTIFICATION_TIMEOUT_SECONDS, appId);
		const port = await this.$iOSDebuggerPortService.getPort({ projectDir, deviceId: this.deviceInfo.identifier, appId });
		if (!port) {
			this.$errors.failWithoutHelp("Device socket port cannot be found.");
		}

		const deviceId = this.deviceInfo.identifier;
		this.socket = await helpers.connectEventuallyUntilTimeout(
			async () => {
				const deviceResponse = _.first((await this.$iosDeviceOperations.connectToPort([{ deviceId: deviceId, port: port }]))[deviceId]);
				const _socket = new net.Socket();
				_socket.connect(deviceResponse.port, deviceResponse.host);
				return _socket;
			},
			commonConstants.SOCKET_CONNECTION_TIMEOUT_MS);

		this.socket.on("close", () => {
			this.socket = null;
		});

		this.$processService.attachToProcessExitSignals(this, this.destroySocket);
		return this.socket;
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
		if (this.socket) {
			this.socket.destroy();
			this.socket = null;
		}
	}
}

$injector.register("iOSDevice", IOSDevice);
