import { DEBUGGER_PORT_FOUND_EVENT_NAME, DEVICE_LOG_EVENT_NAME } from "../common/constants";
import { cache } from "../common/decorators";
import { EventEmitter } from "events";

export class IOSLogParserService extends EventEmitter implements IIOSLogParserService {
	private static MESSAGE_REGEX = /NativeScript debugger has opened inspector socket on port (\d+?) for (.*)[.]/;

	constructor(private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider,
		private $logger: ILogger,
		private $projectData: IProjectData) {
			super();
		}

	public startLookingForDebuggerPort(device: Mobile.IDevice): void {
		this.$deviceLogProvider.setProjectNameForDevice(device.deviceInfo.identifier, this.$projectData.projectName);

		this.startLookingForDebuggerPortCore(device);
		this.startLogProcess(device);
	}

	@cache()
	private startLookingForDebuggerPortCore(device: Mobile.IDevice): void {
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

	private startLogProcess(device: Mobile.IDevice): void {
		if (device.isEmulator) {
			return this.$iOSSimulatorLogProvider.startNewMutedLogProcess(device.deviceInfo.identifier);
		}

		return this.$iosDeviceOperations.startDeviceLog(device.deviceInfo.identifier);
	}
}
$injector.register("iOSLogParserService", IOSLogParserService);
