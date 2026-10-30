import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawn } from "child_process";
import { ApplicationManagerBase } from "../application-manager-base";
import {
	IHooksService,
	IChildProcess,
	IDictionary,
	ISpawnResult,
} from "../../declarations";
import { IBuildData } from "../../../definitions/build";

// LocalState sentinel files shared with the app host (RuntimeHost.cs).
export const WINDOWS_INSPECTOR_MARKER = "ns-inspector";
export const WINDOWS_DEBUGBREAK_MARKER = "ns-debugbreak";
export const WINDOWS_DEBUGGER_STARTED_MARKER = "ns-debugger-started";
// Present while the app's debug host is watching for WINDOWS_LIVESYNC_MARKER.
export const WINDOWS_LIVESYNC_READY_MARKER = "ns-livesync-ready";
export const WINDOWS_LIVESYNC_MARKER = "ns-livesync";

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
					// Package Name is the app id (config `id` / `windows.id`).
					"Get-AppxPackage | Select-Object -ExpandProperty Name",
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
		// Two distinct artifact shapes reach here (see WindowsProjectService's
		// getValidBuildOutputData): a debug build resolves to the loose bin/ output's
		// AppxManifest.xml, meant for `-Register` (in-place dev registration; no signature
		// validation, matches "AppxManifest.xml triggers Add-AppxPackage -Register (dev flow)");
		// a release build resolves to the packaged .msix/.msixupload under AppPackages/, which
		// `-Register` rejects outright ("An invalid manifest file name was passed to this
		// function") and which instead needs a plain package install via `-Path`. Exactly what
		// the generated Install.ps1/Add-AppDevPackage.ps1 next to it do. A `-Path` install of an
		// unsigned release package still fails signature validation (0x800B0100); that's expected
		// pass `--certificate`/`--certificate-thumbprint` at build time for a sideloadable
		// release package, this isn't something the install step can paper over.
		const isLooseManifest = packageFilePath.toLowerCase().endsWith("appxmanifest.xml");
		// Thread through any Dependencies\<arch>\*.msix (e.g. the Windows App SDK runtime
		// framework package) the same way Add-AppDevPackage.ps1 does via `-DependencyPath`.
		// Needed on a machine that doesn't already have that framework package installed.
		const arch = process.arch === "arm64" ? "arm64" : "x64";
		const dependencyDir = path.join(path.dirname(packageFilePath), "Dependencies", arch);
		const addAppxCommand = isLooseManifest
			? "Add-AppxPackage -ForceApplicationShutdown -Register -Path $env:NS_APPX_PATH"
			: fs.existsSync(dependencyDir)
				? "$deps = Get-ChildItem -LiteralPath $env:NS_APPX_DEPS -Filter *.msix -ErrorAction SilentlyContinue; " +
					"if ($deps) { Add-AppxPackage -Path $env:NS_APPX_PATH -DependencyPath $deps.FullName -ForceApplicationShutdown } " +
					"else { Add-AppxPackage -Path $env:NS_APPX_PATH -ForceApplicationShutdown }"
				: "Add-AppxPackage -Path $env:NS_APPX_PATH -ForceApplicationShutdown";
		await this._powershell(
			addAppxCommand,
			{ NS_APPX_PATH: packageFilePath, NS_APPX_DEPS: dependencyDir },
			true,
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

		// -Name takes wildcards: escape the id so only this package is removed.
		await this._powershell(
			"Get-AppxPackage -Name ([WildcardPattern]::Escape($env:NS_APP_ID)) | Remove-AppxPackage",
			{ NS_APP_ID: appIdentifier },
			false,
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
	 * The runtime writes console.log to ApplicationData.LocalFolder (LocalState), alongside the
	 * crash/panic/lastcalls logs. NOTE: earlier builds assumed a UWP app's GetTempPathW() virtualises
	 * to AC\Temp, but the app is `runFullTrust` (not an app container), so GetTempPathW() resolves to
	 * the *system* temp, which is neither AC\Temp nor a path the CLI could reliably find. The runtime
	 * now targets LocalState explicitly (runtime_set_local_folder → set_log_dir), so pin that here.
	 * Falls back to the system temp path when no PFN is known (unpackaged EXE).
	 */
	public getLogFilePath(): string {
		if (this._packageFamilyNames.size > 0) {
			const pfn = this._packageFamilyNames.values().next().value as string;
			const localAppData = process.env.LOCALAPPDATA;
			if (localAppData && pfn) {
				return path.join(localAppData, "Packages", pfn, "LocalState", "console.log");
			}
		}

		const systemConsoleLog = path.join(os.tmpdir(), "console.log");
		const systemLegacyLog = path.join(os.tmpdir(), "ns_trace.log");
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
		} catch { /* ignore: log dir may not exist yet */ }

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
			// Any debug session starts the inspector; --debug-brk additionally signals break-on-start.
			// Clear the last session's port so the debug service waits.
			if (appData.debugMode || appData.waitForDebugger) {
				this._deleteMarker(pfn, WINDOWS_DEBUGGER_STARTED_MARKER);
			}
			if (appData.debugMode) {
				this._writeMarker(pfn, WINDOWS_INSPECTOR_MARKER);
			}
			if (appData.waitForDebugger) {
				this._writeMarker(pfn, WINDOWS_DEBUGBREAK_MARKER);
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
			await this._powershell(
				"Get-Process -Name ([WildcardPattern]::Escape($env:NS_PROCESS_NAME)) -ErrorAction SilentlyContinue | Stop-Process",
				{ NS_PROCESS_NAME: appData.projectName },
				false,
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
			const result = await this._powershell(
				"$id = $env:NS_APP_ID; $like = '*' + [WildcardPattern]::Escape($id) + '*'; " +
					"(Get-AppxPackage | Where-Object { $_.Name -eq $id -or $_.PackageFullName -like $like } | Select-Object -First 1).PackageFamilyName",
				{ NS_APP_ID: appId },
				false,
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

	/**
	 * Returns a path in the app's LocalState folder, or null without %LOCALAPPDATA%.
	 */
	public async getLocalStateFilePath(
		appId: string,
		fileName: string,
	): Promise<string | null> {
		const pfn = await this._resolvePackageFamilyName(appId);
		return this._localStatePath(pfn, fileName);
	}

	/**
	 * Asks the running app to apply the files just synced into bin\app: the debug host watches
	 * LocalState for the marker and calls global.__onLiveSync(), which runs webpack's hot update.
	 * Returns false when the app's host does not watch for it (EXE targets, older runtimes).
	 */
	public async signalLiveSync(appId: string): Promise<boolean> {
		const pfn = await this._resolvePackageFamilyName(appId);
		const readyPath = this._localStatePath(pfn, WINDOWS_LIVESYNC_READY_MARKER);
		const markerPath = this._localStatePath(pfn, WINDOWS_LIVESYNC_MARKER);
		if (!readyPath || !markerPath || !fs.existsSync(readyPath)) {
			return false;
		}
		try {
			// New content on every sync, so a marker the host has not consumed yet still changes.
			fs.writeFileSync(markerPath, String(Date.now()), "utf8");
			return true;
		} catch (e) {
			this.$logger.trace(`[Windows] Could not write ${WINDOWS_LIVESYNC_MARKER} marker: ${e}`);
			return false;
		}
	}

	private _localStatePath(pfn: string, fileName: string): string | null {
		const localAppData = process.env.LOCALAPPDATA;
		// An unresolved PFN falls back to the config's app id; never let it leave Packages\.
		if (!localAppData || !/^[\w.-]+$/.test(pfn) || pfn.includes("..")) return null;
		return path.join(localAppData, "Packages", pfn, "LocalState", fileName);
	}

	private _deleteMarker(pfn: string, name: string): void {
		const markerPath = this._localStatePath(pfn, name);
		if (!markerPath) return;
		try {
			fs.rmSync(markerPath, { force: true });
		} catch (e) {
			this.$logger.trace(`[Windows] Could not delete ${name} marker: ${e}`);
		}
	}

	// Writes a sentinel file into the packaged app's LocalState that the C# host consumes on launch
	// (RuntimeHost.ConsumeMarker). Used to signal the inspector ("ns-inspector") and break-on-start
	// ("ns-debugbreak") out-of-band, since a UWP app launched via shell:AppsFolder inherits no env.
	private _writeMarker(pfn: string, name: string): void {
		const markerPath = this._localStatePath(pfn, name);
		if (!markerPath) return;
		try {
			fs.mkdirSync(path.dirname(markerPath), { recursive: true });
			fs.writeFileSync(markerPath, "", "utf8");
			this.$logger.info(`[Windows] Wrote ${name} marker: ${markerPath}`);
		} catch (e) {
			this.$logger.warn(`[Windows] Could not write ${name} marker: ${e}`);
		}
	}

	// Values go in as $env:NS_* variables, never script text, so they can't change the command.
	private _powershell(
		script: string,
		values: Record<string, string>,
		throwError: boolean,
	): Promise<ISpawnResult> {
		return this.$childProcess.spawnFromEvent(
			"powershell.exe",
			["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
			"close",
			{ env: { ...process.env, ...values } },
			{ throwError },
		);
	}
}
