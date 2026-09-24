import { ChildProcess } from "child_process";
import * as path from "path";
import { ApplicationManagerBase } from "../application-manager-base";
import { hook, sleep } from "../../helpers";
import { cache } from "../../decorators";
import { IOS_LOG_PREDICATE } from "../../constants";
import {
	IChildProcess,
	IDictionary,
	IFileSystem,
	IHooksService,
} from "../../declarations";
import { IOptions } from "../../../declarations";

export class MacCatalystApplicationManager extends ApplicationManagerBase {
	private logProcess: ChildProcess = null;

	constructor(
		private device: Mobile.IMacCatalystDevice,
		private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $options: IOptions,
		protected $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$logger: ILogger,
		$hooksService: IHooksService,
	) {
		super($logger, $hooksService, $deviceLogProvider);
	}

	public async getInstalledApplications(): Promise<string[]> {
		// Installed only means the build produced the bundle in place.
		return this.$fs.exists(this.device.applicationBundlePath)
			? [this.device.deviceInfo.identifier]
			: [];
	}

	@hook("install")
	public async installApplication(packageFilePath: string): Promise<void> {
		// No install step: just record where the build put the bundle.
		this.device.applicationBundlePath = packageFilePath;
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> {
		await this.stopApplication({
			appId: appIdentifier,
			projectName: null,
			projectDir: null,
		});
	}

	public async startApplication(
		appData: Mobile.IStartApplicationData,
	): Promise<void> {
		await this.setDeviceLogData(appData);

		// -n forces a fresh instance instead of activating the running copy.
		await this.$childProcess.spawnFromEvent(
			"open",
			["-n", this.device.applicationBundlePath],
			"close",
		);
	}

	public async stopApplication(
		appData: Mobile.IApplicationData,
	): Promise<void> {
		const executablePath = this.getExecutablePath();
		await this.signalApplication(executablePath, "TERM", appData);
		if (await this.waitForApplicationExit(executablePath)) {
			return;
		}
		await this.signalApplication(executablePath, "KILL", appData);
		await this.waitForApplicationExit(executablePath);
	}

	private async signalApplication(
		executablePath: string,
		signal: string,
		appData: Mobile.IApplicationData,
	): Promise<void> {
		try {
			// Anchored so it never matches our own log stream process.
			await this.$childProcess.spawnFromEvent(
				"pkill",
				[`-${signal}`, "-f", `^${executablePath}$`],
				"close",
			);
		} catch (err) {
			// pkill exits non-zero when no process matched.
			this.$logger.trace(
				`Nothing to stop for ${appData.appId}. More info: ${err.message}`,
			);
		}
	}

	// Returning before the old instance dies makes open -n spawn a duplicate.
	private async waitForApplicationExit(
		executablePath: string,
	): Promise<boolean> {
		for (let attempt = 0; attempt < 40; attempt++) {
			if (!(await this.isApplicationRunning(executablePath))) {
				return true;
			}
			await sleep(50);
		}
		return false;
	}

	private async isApplicationRunning(executablePath: string): Promise<boolean> {
		try {
			await this.$childProcess.spawnFromEvent(
				"pgrep",
				["-f", `^${executablePath}$`],
				"close",
			);
			return true;
		} catch (err) {
			return false;
		}
	}

	public async getDebuggableApps(): Promise<
		Mobile.IDeviceApplicationInformation[]
	> {
		return [];
	}

	public async getDebuggableAppViews(
		appIdentifiers: string[],
	): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> {
		return null;
	}

	private getExecutablePath(): string {
		return path.join(
			this.device.applicationBundlePath,
			"Contents",
			"MacOS",
			path.basename(this.device.applicationBundlePath, ".app"),
		);
	}

	private async setDeviceLogData(
		appData: Mobile.IApplicationData,
	): Promise<void> {
		this.$deviceLogProvider.setProjectNameForDevice(
			this.device.deviceInfo.identifier,
			appData.projectName,
		);
		this.$deviceLogProvider.setProjectDirForDevice(
			this.device.deviceInfo.identifier,
			appData.projectDir,
		);

		if (!this.$options.justlaunch) {
			this.startDeviceLog();
		}
	}

	@cache()
	private startDeviceLog(): void {
		// Narrowed to this app and the runtime, else system noise floods.
		this.logProcess = this.$childProcess.spawn("/usr/bin/log", [
			"stream",
			"--style",
			"compact",
			"--level",
			"debug",
			"--predicate",
			`processImagePath == "${this.getExecutablePath()}" AND ${IOS_LOG_PREDICATE}`,
		]);

		const action = (data: Buffer | string) => {
			this.$deviceLogProvider.logData(
				data.toString(),
				this.$devicePlatformsConstants.Catalyst,
				this.device.deviceInfo.identifier,
			);
		};

		this.logProcess.stdout?.on("data", action);
		this.logProcess.stderr?.on("data", action);
	}
}
