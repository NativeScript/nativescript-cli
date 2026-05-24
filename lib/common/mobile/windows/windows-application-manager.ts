import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawn } from "child_process";
import { ApplicationManagerBase } from "../application-manager-base";
import { IHooksService, IChildProcess, IDictionary } from "../../declarations";
import { IBuildData } from "../../../definitions/build";

export class WindowsApplicationManager extends ApplicationManagerBase {
	private _runningPid: number | null = null;
	// Keyed by appId so multiple UWP apps don't stomp each other's cached PFN.
	private _packageFamilyNames: Map<string, string> = new Map();
	// Populated by installApplication for .exe builds; keyed by both appIdentifier
	// and exe-basename so the two lookup paths in startApplication both work.
	private _installedExePaths: IDictionary<string> = {};

	constructor(
		$logger: ILogger,
		$hooksService: IHooksService,
		$deviceLogProvider: Mobile.IDeviceLogProvider,
		private $childProcess: IChildProcess,
		private _restartLogStream?: () => Promise<void>,
	) {
		super($logger, $hooksService, $deviceLogProvider);
	}

	public async getInstalledApplications(): Promise<string[]> {
		try {
			const result = await this.$childProcess.spawnFromEvent(
				"powershell.exe",
				[
					"-NoProfile",
					"-Command",
					"Get-AppxPackage | Select-Object -ExpandProperty PackageFamilyName",
				],
				"close",
				{},
				{ throwError: false },
			);
			return (result.stdout || "")
				.split(/\r?\n/)
				.map((s: string) => s.trim())
				.filter(Boolean);
		} catch {
			return [];
		}
	}

	// The base class checks getInstalledApplications(), which only knows about UWP
	// packages. Override so that EXE-based apps registered via installApplication()
	// are also considered "installed" without a PowerShell round-trip.
	public async isApplicationInstalled(appIdentifier: string): Promise<boolean> {
		if (
			appIdentifier &&
			Object.prototype.hasOwnProperty.call(
				this._installedExePaths,
				appIdentifier,
			)
		) {
			return true;
		}
		return super.isApplicationInstalled(appIdentifier);
	}

	public async installApplication(
		packageFilePath: string,
		appIdentifier?: string,
		_buildData?: IBuildData,
	): Promise<void> {
		if (packageFilePath?.toLowerCase().endsWith(".exe")) {
			this.$logger.info(`[Windows] Registering EXE: ${packageFilePath}`);
			const exeBase = path.basename(
				packageFilePath,
				path.extname(packageFilePath),
			);
			if (appIdentifier) {
				this._installedExePaths[appIdentifier] = packageFilePath;
			}
			// Secondary key so the projectName-based lookup in startApplication works
			// even when appIdentifier differs from the exe filename.
			this._installedExePaths[exeBase] = packageFilePath;
			return;
		}

		this.$logger.info(`[Windows] Installing MSIX/APPX from: ${packageFilePath}`);
		// If we have an app identifier, try to remove any existing package first to
		// avoid the "package is already installed" HRESULT (0x80073CFB) which
		// blocks re-registration in development flows.
		if (appIdentifier) {
			try {
				this.$logger.info(`[Windows] Attempting to remove existing package: ${appIdentifier}`);
				// uninstallApplication handles EXE cleanup and runs the Remove-AppxPackage
				// command for UWP packages. Ignore errors and proceed to install.
				await this.uninstallApplication(appIdentifier);
			} catch (err) {
				this.$logger.warn(`[Windows] Pre-install uninstall failed: ${err}`);
			}
		}
		await this.$childProcess.spawnFromEvent(
			"powershell.exe",
			[
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-Command",
				`Add-AppxPackage -ForceApplicationShutdown -Register -Path "${packageFilePath}"`,
			],
			"close",
			{},
			{ throwError: true },
		);
		// Pre-warm the PFN cache so startApplication does not need to resolve it.
		if (appIdentifier) {
			await this._resolvePackageFamilyName(appIdentifier);
		}
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> {
		// Clean up EXE registration so isApplicationInstalled returns false.
		delete this._installedExePaths[appIdentifier];
		this._packageFamilyNames.delete(appIdentifier);

		await this.$childProcess.spawnFromEvent(
			"powershell.exe",
			[
				"-NoProfile",
				"-Command",
				`Get-AppxPackage -Name "${appIdentifier}" | Remove-AppxPackage`,
			],
			"close",
			{},
			{ throwError: false },
		);
	}

	// Explicit override matching the interface contract (IStartApplicationData)
	// rather than relying on the base-class forwarding appData typed as the
	// narrower IApplicationData, which would silently drop waitForDebugger.
	public async restartApplication(
		appData: Mobile.IStartApplicationData,
	): Promise<void> {
		await this.stopApplication(appData);
		await this.startApplication(appData);
	}

	/**
	 * Returns the path of the runtime's trace log for the most recently started app.
	 * Inside a UWP process, Win32 GetTempPathW() virtualises
	 * to AC\Temp (the app container's isolated temp folder). Rust's
	 * std::env::temp_dir() calls GetTempPathW(), so the DLL writes to AC\Temp.
	 * Falls back to the system temp path when no PFN is known (unpackaged EXE).
	 */
	public getLogFilePath(): string {
		const systemConsoleLog = path.join(os.tmpdir(), "console.log");
		const systemLegacyLog = path.join(os.tmpdir(), "ns_trace.log");

		if (this._packageFamilyNames.size > 0) {
			const pfn = this._packageFamilyNames.values().next().value as string;
			const localAppData = process.env.LOCALAPPDATA;
			if (localAppData && pfn) {
				const consolePath = path.join(localAppData, "Packages", pfn, "AC", "Temp", "console.log");
				const legacyPath = path.join(localAppData, "Packages", pfn, "AC", "Temp", "ns_trace.log");
				if (fs.existsSync(consolePath)) return consolePath;
				if (fs.existsSync(legacyPath)) return legacyPath;
				return consolePath;
			}
		}

		if (fs.existsSync(systemConsoleLog)) return systemConsoleLog;
		if (fs.existsSync(systemLegacyLog)) return systemLegacyLog;
		return systemConsoleLog;
	}

	/**
	 * Returns the path of the C# crash/exception log written by CrashDiagnostics.
	 * Lives in LocalState (persistent app data).
	 * Returns null when no PFN is known (e.g. unpackaged EXE targets).
	 */
	public getCrashLogPath(): string | null {
		if (this._packageFamilyNames.size > 0) {
			const pfn = this._packageFamilyNames.values().next().value as string;
			const localAppData = process.env.LOCALAPPDATA;
			if (localAppData && pfn) {
				return path.join(localAppData, "Packages", pfn, "LocalState", "nativescript-crash.log");
			}
		}
		return null;
	}

	public async startApplication(
		appData: Mobile.IStartApplicationData,
	): Promise<void> {
		const exeCandidate =
			(appData.appId && this._installedExePaths[appData.appId]) ||
			(appData.projectName && this._installedExePaths[appData.projectName]);
		const isExe = !!(exeCandidate && fs.existsSync(exeCandidate));

		// For UWP, pre-populate the PFN cache before calling getLogFilePath() so
		// that the truncation and the subsequent log stream restart both target the
		// correct container TempState path instead of the system temp fallback.
		if (!isExe) {
			await this._resolvePackageFamilyName(appData.appId);
		}

		// Truncate the trace log so the streamer starts from a clean state each run.
		try {
			fs.writeFileSync(this.getLogFilePath(), "", "utf8");
		} catch { /* ignore — log dir may not exist yet */ }

		if (isExe) {
			if (appData.waitForDebugger) {
				this.$logger.info(
					`[Windows] --debug-brk is not supported for EXE targets.`,
				);
			}
			this.$logger.info(`[Windows] Launching EXE: ${exeCandidate}`);
			const proc = spawn(exeCandidate as string, [], { detached: true, stdio: "ignore" });
			proc.unref();
			this._runningPid = proc.pid ?? null;
			// Clear stale PID when the process exits so stopApplication falls back to
			// the Stop-Process path on the next restart instead of killing a reused PID.
			proc.on("exit", () => {
				if (this._runningPid === proc.pid) {
					this._runningPid = null;
				}
			});
		} else {
			// PFN already cached from the pre-resolve above; no extra round-trip.
			const pfn = this._packageFamilyNames.get(appData.appId) ?? appData.appId;
			if (appData.waitForDebugger) {
				this._writeDebugBreakMarker(pfn);
			}
			// UWP apps are launched via shell:AppsFolder\<PFN>!<ApplicationId>.
			// The ApplicationId comes from the <Application Id="..."> attribute in the manifest.
			const appId = "App";
			this.$logger.info(`[Windows] Launching UWP: ${pfn}!${appId}`);
			const proc = spawn("explorer.exe", [`shell:AppsFolder\\${pfn}!${appId}`], {
				detached: true,
				stdio: "ignore",
			});
			proc.unref();
		}

		// Restart the log stream so the tailer picks up the correct path (UWP
		// container TempState vs. system temp) and resets its offset to 0. Without
		// this the tailer keeps the stale offset from device-discovery time and
		// skips every log line written after the file was truncated above.
		if (this._restartLogStream) {
			await this._restartLogStream();
		}
	}

	public async stopApplication(
		appData: Mobile.IApplicationData,
	): Promise<void> {
		if (this._runningPid) {
			try {
				process.kill(this._runningPid);
			} catch {
				/* already gone */
			}
			this._runningPid = null;
		} else {
			await this.$childProcess.spawnFromEvent(
				"powershell.exe",
				[
					"-NoProfile",
					"-Command",
					`Stop-Process -Name "${appData.projectName}" -ErrorAction SilentlyContinue`,
				],
				"close",
				{},
				{ throwError: false },
			);
		}
	}

	public async tryStartApplication(
		appData: Mobile.IApplicationData,
	): Promise<void> {
		try {
			await this.startApplication(appData as Mobile.IStartApplicationData);
		} catch {
			/* ignore */
		}
	}

	public async getDebuggableApps(): Promise<
		Mobile.IDeviceApplicationInformation[]
	> {
		return [];
	}

	public async getDebuggableAppViews(
		_appIdentifiers: string[],
	): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> {
		return {} as IDictionary<Mobile.IDebugWebViewInfo[]>;
	}

	private async _resolvePackageFamilyName(appId: string): Promise<string> {
		const cached = this._packageFamilyNames.get(appId);
		if (cached) return cached;

		try {
			const result = await this.$childProcess.spawnFromEvent(
				"powershell.exe",
				[
					"-NoProfile",
					"-Command",
					`(Get-AppxPackage | Where-Object { $_.Name -eq "${appId}" -or $_.PackageFullName -like "*${appId}*" } | Select-Object -First 1).PackageFamilyName`,
				],
				"close",
				{},
				{ throwError: false },
			);
			const pfn = (result.stdout || "").trim();
			if (pfn) {
				this._packageFamilyNames.set(appId, pfn);
			}
		} catch {
			/* fall back to appId as the protocol target */
		}
		return this._packageFamilyNames.get(appId) ?? appId;
	}

	private _writeDebugBreakMarker(pfn: string): void {
		const localAppData = process.env.LOCALAPPDATA;
		if (!localAppData) return;
		const markerPath = path.join(
			localAppData,
			"Packages",
			pfn,
			"LocalState",
			"ns-debugbreak",
		);
		try {
			fs.mkdirSync(path.dirname(markerPath), { recursive: true });
			fs.writeFileSync(markerPath, "", "utf8");
			this.$logger.info(`[Windows] Debug break marker: ${markerPath}`);
		} catch (e) {
			this.$logger.warn(`[Windows] Could not write debug break marker: ${e}`);
		}
	}
}
