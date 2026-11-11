import * as os from "os";
import { DeviceConnectionType } from "../../../constants";
import { CONNECTED_STATUS, DeviceTypes } from "../../constants";
import { LinuxApplicationManager } from "./linux-application-manager";
import { LinuxDeviceFileSystem } from "./linux-device-file-system";
import { IHooksService } from "../../declarations";

/** The local machine: apps run as a child process of the CLI. */
export class LinuxDevice implements Mobile.IDevice {
	public applicationManager: Mobile.IDeviceApplicationManager;
	public fileSystem: Mobile.IDeviceFileSystem;
	public readonly isEmulator = false;
	public readonly isOnlyWiFiConnected = false;

	public readonly deviceInfo: Mobile.IDeviceInfo = {
		identifier: os.hostname(),
		displayName: `${os.hostname()} (Linux ${os.release()})`,
		model: os.arch(),
		version: os.release(),
		vendor: "Linux",
		status: CONNECTED_STATUS,
		errorHelp: null,
		isTablet: false,
		type: DeviceTypes.Device,
		platform: "Linux",
		connectionTypes: [DeviceConnectionType.Local],
	};

	constructor(
		$logger: ILogger,
		$hooksService: IHooksService,
		$deviceLogProvider: Mobile.IDeviceLogProvider,
	) {
		this.applicationManager = new LinuxApplicationManager(
			$logger,
			$hooksService,
			$deviceLogProvider,
			this.deviceInfo.identifier,
		);
		this.fileSystem = new LinuxDeviceFileSystem();
	}

	public async openDeviceLogStream(): Promise<void> {
		// logs are forwarded from the app process by the application manager
	}

	public detach(): void {
		// nothing to release
	}
}
