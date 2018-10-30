import * as applicationManagerPath from "./ios-simulator-application-manager";
import * as fileSystemPath from "./ios-simulator-file-system";
import * as constants from "../../../constants";
import * as net from "net";
import { cache } from "../../../decorators";

export class IOSSimulator implements Mobile.IiOSDevice {
	private _applicationManager: Mobile.IDeviceApplicationManager;
	private _fileSystem: Mobile.IDeviceFileSystem;
	private socket: net.Socket;

	// private static sockets: { [id: string]: net.Socket; } = {};

	// get socket(): net.Socket {
	// 	return IOSSimulator.sockets[this.deviceInfo.identifier];
	// }
	// set socket(newSocket: net.Socket) {
	// 	IOSSimulator.sockets[this.deviceInfo.identifier] = newSocket;
	// }

	constructor(private simulator: Mobile.IiSimDevice,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $injector: IInjector,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider,
		private $logger: ILogger) { }

	public async connectToPort(port: number): Promise<net.Socket> {
		console.log("connectToPort");
		this.socket = await this.$iOSEmulatorServices.connectToPort({ port });
		this.socket.on("close", () => {
			this.socket = null;
			this.$logger.info("iOS Simulator socket closed!");
		});

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
