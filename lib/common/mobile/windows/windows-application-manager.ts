import * as fs from "fs";
import * as path from "path";
import { ApplicationManagerBase } from "../application-manager-base";
import { IHooksService, IChildProcess, IDictionary } from "../../declarations";
import { IBuildData } from "../../../definitions/build";

export class WindowsApplicationManager extends ApplicationManagerBase {
	private _runningPid: number = null;
	private _packageFamilyName: string = null;

	constructor(
		$logger: ILogger,
		$hooksService: IHooksService,
		$deviceLogProvider: Mobile.IDeviceLogProvider,
		private $childProcess: IChildProcess,
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

	public async installApplication(
		packageFilePath: string,
		appIdentifier?: string,
		_buildData?: IBuildData,
	): Promise<void> {
		this.$logger.info(`[Windows] Installing from: ${packageFilePath}`);
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
		// Cache the PFN immediately after install so startApplication can use it.
		if (appIdentifier) {
			await this._resolvePackageFamilyName(appIdentifier);
		}
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> {
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
		this._packageFamilyName = null;
	}

	public async startApplication(
		appData: Mobile.IStartApplicationData,
	): Promise<void> {
		const pfn = await this._resolvePackageFamilyName(appData.appId);

		// Mirror the Android sentinel-file pattern: write ns-debugbreak to the
		// app's LocalFolder before launch so the runtime knows to open DevTools.
		if (appData.waitForDebugger) {
			this._writeDebugBreakMarker(pfn);
		}

		this.$logger.info(`[Windows] Launching: ${pfn}`);
		const proc = require("child_process").spawn(
			"explorer.exe",
			[`ms-windows-app://${pfn}`],
			{ detached: true, stdio: "ignore" },
		);
		proc.unref();
	}

	private async _resolvePackageFamilyName(appId: string): Promise<string> {
		if (this._packageFamilyName) return this._packageFamilyName;
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
			if (pfn) this._packageFamilyName = pfn;
		} catch {
			/* ignore, fall back to appId */
		}
		return this._packageFamilyName ?? appId;
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

	public async stopApplication(
		appData: Mobile.IApplicationData,
	): Promise<void> {
		if (this._runningPid) {
			try {
				process.kill(this._runningPid);
			} catch {
				/* already dead */
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
}
