import * as applicationManagerPath from "./ios-simulator-application-manager";
import * as fileSystemPath from "./ios-simulator-file-system";
import * as constants from "../../../constants";
import * as net from "net";
import { cache } from "../../../decorators";
import * as helpers from "../../../../common/helpers";
import { IOSDeviceBase } from "../ios-device-base";

export class IOSSimulator extends IOSDeviceBase implements Mobile.IiOSDevice {
	public applicationManager: Mobile.IDeviceApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public deviceInfo: Mobile.IDeviceInfo;

	constructor(private simulator: Mobile.IiSimDevice,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $deviceLogProvider: Mobile.IDeviceLogProvider,
		protected $errors: IErrors,
		protected $lockService: ILockService,
		private $injector: IInjector,
		protected $iOSDebuggerPortService: IIOSDebuggerPortService,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $iOSNotification: IiOSNotification,
		private $iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider,
		private $logger: ILogger) {
		super();
		this.applicationManager = this.$injector.resolve(applicationManagerPath.IOSSimulatorApplicationManager, { iosSim: this.$iOSSimResolver.iOSSim, device: this });
		this.fileSystem = this.$injector.resolve(fileSystemPath.IOSSimulatorFileSystem, { iosSim: this.$iOSSimResolver.iOSSim });
		this.deviceInfo = {
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

	@cache()
	public async openDeviceLogStream(options?: Mobile.IiOSLogStreamOptions): Promise<void> {
		options = options || {};
		options.predicate = options.hasOwnProperty("predicate") ? options.predicate : constants.IOS_LOG_PREDICATE;
		return this.$iOSSimulatorLogProvider.startLogProcess(this.simulator.id, options);
	}

	protected async getDebugSocketCore(appId: string): Promise<net.Socket> {
		let socket: net.Socket;
		const attachRequestMessage = this.$iOSNotification.getAttachRequest(appId, this.deviceInfo.identifier);
		await this.$iOSEmulatorServices.postDarwinNotification(attachRequestMessage, this.deviceInfo.identifier);
		const port = await super.getDebuggerPort(appId);
		try {
			socket = await helpers.connectEventuallyUntilTimeout(
				async () => { return this.$iOSEmulatorServices.connectToPort({ port }); },
				constants.SOCKET_CONNECTION_TIMEOUT_MS);
		} catch (e) {
			this.$logger.warn(e);
		}

		return socket;
	}
}
