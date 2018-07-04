import { DEBUGGER_PORT_FOUND_EVENT_NAME, DEVICE_LOG_EVENT_NAME } from "../common/constants";
import { EventEmitter } from "events";

export class IOSLogParserService extends EventEmitter implements IIOSLogParserService {
	private static MESSAGE_REGEX = /NativeScript debugger has opened inspector socket on port (\d+?) for (.*)[.]/;

	private startedDeviceLogInstances: IDictionary<boolean> = {};

	constructor(private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider,
		private $logger: ILogger) {
		super();
	}

	public async startParsingLog(device: Mobile.IDevice, data: IProjectName): Promise<void> {
		this.$deviceLogProvider.setProjectNameForDevice(device.deviceInfo.identifier, data.projectName);

		if (!this.startedDeviceLogInstances[device.deviceInfo.identifier]) {
			this.startParsingLogCore(device);
			await this.startLogProcess(device);
			this.startedDeviceLogInstances[device.deviceInfo.identifier] = true;
		}
	}

	private startParsingLogCore(device: Mobile.IDevice): void {
		const logProvider = device.isEmulator ? this.$iOSSimulatorLogProvider : this.$iosDeviceOperations;
		logProvider.on(DEVICE_LOG_EVENT_NAME, (response: IOSDeviceLib.IDeviceLogData) => this.processDeviceLogResponse(response));
	}

	private processDeviceLogResponse(response: IOSDeviceLib.IDeviceLogData) {
		const matches = IOSLogParserService.MESSAGE_REGEX.exec(response.message);
		if (matches) {
			const data = {
				port: parseInt(matches[1]),
				appId: matches[2],
				deviceId: response.deviceId
			};
			this.$logger.trace(`Emitting ${DEBUGGER_PORT_FOUND_EVENT_NAME} event`, data);
			this.emit(DEBUGGER_PORT_FOUND_EVENT_NAME, data);
		}
	}

	private async startLogProcess(device: Mobile.IDevice): Promise<void> {
		if (device.isEmulator) {
			return this.$iOSSimulatorLogProvider.startNewMutedLogProcess(device.deviceInfo.identifier);
		}

		return this.$iosDeviceOperations.startDeviceLog(device.deviceInfo.identifier);
	}
}
$injector.register("iOSLogParserService", IOSLogParserService);
