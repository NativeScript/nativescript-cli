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
	private _crashLogTailInterval: ReturnType<typeof setInterval> | null = null;

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
			() => this.openDeviceLogStream(),
		);
		this.fileSystem = new WindowsDeviceFileSystem();
	}

	public async openDeviceLogStream(): Promise<void> {
		if (this._logTailInterval) {
			clearInterval(this._logTailInterval);
			this._logTailInterval = null;
		}
		if (this._crashLogTailInterval) {
			clearInterval(this._crashLogTailInterval);
			this._crashLogTailInterval = null;
		}

		// For packaged UWP apps, GetTempPath() inside the app container resolves to
		// %LOCALAPPDATA%\Packages\<PFN>\TempState — not the system temp dir.
		// Ask the application manager for the correct path based on the known PFN.
		const manager = this.applicationManager as WindowsApplicationManager;
		const logPath = manager.getLogFilePath();
		const crashLogPath = manager.getCrashLogPath();
		const deviceId = this.deviceInfo.identifier;

		// startApplication() truncates the trace log before calling this method, so the
		// file is either empty (size 0) or absent. Start from 0 to capture all
		// output from the new process. The initial call from DeviceEmitter (before
		// any app starts) also starts at 0; the truncation in startApplication()
		// is what prevents stale output from being replayed.
		let offset = 0;

		// Rotate the log if it exceeds 10 MB to prevent unbounded disk growth.
		const MAX_LOG_BYTES = 10 * 1024 * 1024;

		// Internal Rust runtime diagnostics written via debug_output() — useful in
		// VS Output / DebugView but noisy in the CLI. Suppress them; errors/exceptions
		// are kept because their prefix contains "error", "exception", or "PANIC".
		const INTERNAL_PREFIXES = [
			"[NativeScript] init_console:",
			"[NativeScript] log file:",
			"[NativeScript] delegate ctor:",
		];
		const isInternalTrace = (line: string) =>
			INTERNAL_PREFIXES.some((p) => line.startsWith(p));

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
					if (line.trim() && !isInternalTrace(line)) {
						this.$deviceLogProvider.logData(line, "Windows", deviceId);
					}
				}

				if (stat.size > MAX_LOG_BYTES) {
					try { fs.writeFileSync(logPath, "", "utf8"); offset = 0; } catch { /* ignore */ }
				}
			} catch { /* ignore — file may not exist between app restarts */ }
		}, 50);

		// Also tail nativescript-crash.log from LocalState so C# exception reports
		// and JS errors caught by the host surface in the CLI — same as Android/iOS
		// crash log streaming. Truncate on each run so only errors from this session appear.
		if (crashLogPath) {
			try { fs.writeFileSync(crashLogPath, "", "utf8"); } catch { /* may not exist yet */ }
			let crashOffset = 0;

			this._crashLogTailInterval = setInterval(() => {
				try {
					const stat = fs.statSync(crashLogPath);
					if (stat.size <= crashOffset) return;

					const toRead = stat.size - crashOffset;
					const buf = Buffer.alloc(toRead);
					const fd = fs.openSync(crashLogPath, "r");
					fs.readSync(fd, buf, 0, toRead, crashOffset);
					fs.closeSync(fd);
					crashOffset = stat.size;

					const lines = buf.toString("utf8").split(/\r?\n/);
					for (const line of lines) {
						if (line.trim()) {
							this.$deviceLogProvider.logData(`[crash] ${line}`, "Windows", deviceId);
						}
					}
				} catch { /* ignore — file may not exist until first crash */ }
			}, 50);
		}
	}
}
