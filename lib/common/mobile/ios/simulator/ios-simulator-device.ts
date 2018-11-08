import * as applicationManagerPath from "./ios-simulator-application-manager";
import * as fileSystemPath from "./ios-simulator-file-system";
import * as constants from "../../../constants";
import * as net from "net";
import { cache } from "../../../decorators";
import * as helpers from "../../../../common/helpers";

export class IOSSimulator implements Mobile.IiOSDevice {
	private _applicationManager: Mobile.IDeviceApplicationManager;
	private _fileSystem: Mobile.IDeviceFileSystem;
	private socket: net.Socket;

	constructor(private simulator: Mobile.IiSimDevice,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $injector: IInjector,
		private $iOSDebuggerPortService: IIOSDebuggerPortService,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $iOSNotification: IiOSNotification,
		private $iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider,
		private $logger: ILogger) { }

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

		const attachRequestMessage = this.$iOSNotification.getAttachRequest(appId, this.deviceInfo.identifier);
		await this.$iOSEmulatorServices.postDarwinNotification(attachRequestMessage, this.deviceInfo.identifier);
		const port = await this.$iOSDebuggerPortService.getPort({ projectDir, deviceId: this.deviceInfo.identifier, appId });
		if (!port) {
			this.$errors.failWithoutHelp("Device socket port cannot be found.");
		}

		try {
			this.socket = await helpers.connectEventuallyUntilTimeout(
				async () => { return this.$iOSEmulatorServices.connectToPort({ port }) },
				constants.SOCKET_CONNECTION_TIMEOUT_MS);
		} catch (e) {
			this.$logger.warn(e);
		}

		if (this.socket) {
			this.socket.on("close", () => {
				this.socket = null;
			});
		}

		return this.socket;
	}

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
		options = options || {};
		options.predicate = options.hasOwnProperty("predicate") ? options.predicate : constants.IOS_LOG_PREDICATE;
		return this.$iOSSimulatorLogProvider.startLogProcess(this.simulator.id, options);
	}
}
