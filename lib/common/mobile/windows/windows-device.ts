import * as os from "os";
import { DeviceConnectionType } from "../../../constants";
import { CONNECTED_STATUS, DeviceTypes } from "../../constants";
import { WindowsApplicationManager } from "./windows-application-manager";
import { WindowsDeviceFileSystem } from "./windows-device-file-system";
import { IHooksService, IChildProcess } from "../../declarations";

export class WindowsDevice implements Mobile.IDevice {
	public applicationManager: Mobile.IDeviceApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public readonly isEmulator = false;
	public readonly isOnlyWiFiConnected = false;

	public readonly deviceInfo: Mobile.IDeviceInfo = {
		identifier: os.hostname(),
		displayName: `${os.hostname()} (Windows ${os.release()})`,
		model: "PC",
		version: os.release(),
		vendor: "Microsoft",
		status: CONNECTED_STATUS,
		errorHelp: null,
		isTablet: false,
		type: DeviceTypes.Device,
		platform: "Windows",
		connectionTypes: [DeviceConnectionType.Local],
	};

	constructor(
		$logger: ILogger,
		$hooksService: IHooksService,
		$deviceLogProvider: Mobile.IDeviceLogProvider,
		$childProcess: IChildProcess,
	) {
		this.applicationManager = new WindowsApplicationManager(
			$logger,
			$hooksService,
			$deviceLogProvider,
			$childProcess,
		);
		this.fileSystem = new WindowsDeviceFileSystem();
	}

	public async openDeviceLogStream(): Promise<void> {
		// Windows runtime logs go to stdout/stderr of the process
		// DevTools console output is available on ws://localhost:9229
	}
}
