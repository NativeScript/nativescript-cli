import * as os from "os";
import * as fs from "fs";
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

	private _logTailInterval: ReturnType<typeof setInterval> | null = null;

	constructor(
		$logger: ILogger,
		$hooksService: IHooksService,
		private $deviceLogProvider: Mobile.IDeviceLogProvider,
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
		if (this._logTailInterval) {
			clearInterval(this._logTailInterval);
			this._logTailInterval = null;
		}

		// For packaged UWP apps, GetTempPath() inside the app container resolves to
		// %LOCALAPPDATA%\Packages\<PFN>\TempState — not the system temp dir.
		// Ask the application manager for the correct path based on the known PFN.
		const manager = this.applicationManager as WindowsApplicationManager;
		const logPath = manager.getLogFilePath();
		const deviceId = this.deviceInfo.identifier;

		// Start from the current end of the file so stale output is not replayed.
		let offset = 0;
		try { offset = fs.statSync(logPath).size; } catch { /* file not yet created */ }

		// Rotate the log if it exceeds 10 MB to prevent unbounded disk growth.
		const MAX_LOG_BYTES = 10 * 1024 * 1024;

		this._logTailInterval = setInterval(() => {
			try {
				const stat = fs.statSync(logPath);
				if (stat.size <= offset) return;

				const toRead = stat.size - offset;
				const buf = Buffer.alloc(toRead);
				const fd = fs.openSync(logPath, "r");
				fs.readSync(fd, buf, 0, toRead, offset);
				fs.closeSync(fd);
				offset = stat.size;

				const lines = buf.toString("utf8").split(/\r?\n/);
				for (const line of lines) {
					if (line.trim()) {
						this.$deviceLogProvider.logData(line, "Windows", deviceId);
					}
				}

				if (stat.size > MAX_LOG_BYTES) {
					try { fs.writeFileSync(logPath, "", "utf8"); offset = 0; } catch { /* ignore */ }
				}
			} catch { /* ignore — file may not exist between app restarts */ }
		}, 250);
	}
}
