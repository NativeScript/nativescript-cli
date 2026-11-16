import * as path from "path";
import { ApplicationManagerBase } from "../../application-manager-base";
import { hook, sleep } from "../../../helpers";
import { cache } from "../../../decorators";
import { IOS_LOG_PREDICATE } from "../../../constants";
import {
	IChildProcess,
	IDictionary,
	IFileSystem,
	IHooksService,
	IPlistParser,
} from "../../../declarations";
import { IOptions } from "../../../../declarations";

interface IIOSMacApplicationHost extends Mobile.IiOSDevice {
	readonly wrapperPath: string;
	readonly applicationBundlePath: string;
	readonly executableName: string;
}

export class IOSMacApplicationManager extends ApplicationManagerBase {
	constructor(
		private device: IIOSMacApplicationHost,
		private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $plistParser: IPlistParser,
		protected $deviceLogProvider: Mobile.IDeviceLogProvider,
		$logger: ILogger,
		$hooksService: IHooksService,
	) {
		super($logger, $hooksService, $deviceLogProvider);
	}

	public async getInstalledApplications(): Promise<string[]> {
		const infoPlistPath = path.join(
			this.device.applicationBundlePath,
			"Info.plist",
		);
		if (!this.$fs.exists(infoPlistPath)) {
			return [];
		}

		const infoPlist = await this.$plistParser.parseFile(infoPlistPath);
		return infoPlist?.CFBundleIdentifier ? [infoPlist.CFBundleIdentifier] : [];
	}

	@hook("install")
	public async installApplication(packageFilePath: string): Promise<void> {
		const wrapperPath = this.device.wrapperPath;
		this.$fs.deleteDirectory(wrapperPath);
		this.$fs.ensureDirectoryExists(path.join(wrapperPath, "Wrapper"));
		// ditto keeps the bundle's symlinks and extended attributes, which its
		// code signature covers.
		await this.$childProcess.spawnFromEvent(
			"ditto",
			[packageFilePath, this.device.applicationBundlePath],
			"close",
		);
		this.$fs.symlink(
			path.join("Wrapper", path.basename(this.device.applicationBundlePath)),
			path.join(wrapperPath, "WrappedBundle"),
		);
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> {
		await this.stopApplication({
			appId: appIdentifier,
			projectName: null,
			projectDir: null,
		});
		this.$fs.deleteDirectory(this.device.wrapperPath);
	}

	public async startApplication(
		appData: Mobile.IStartApplicationData,
	): Promise<void> {
		await this.setDeviceLogData(appData);

		const args = ["-n", this.device.wrapperPath];
		if (appData.waitForDebugger) {
			args.push("--args", "--nativescript-debug-brk");
		}
		await this.$childProcess.spawnFromEvent("open", args, "close");

		const [pid] = await this.getRunningPids();
		if (pid) {
			this.$deviceLogProvider.setApplicationPidForDevice(
				this.device.deviceInfo.identifier,
				pid,
			);
		}
	}

	public async stopApplication(
		appData: Mobile.IApplicationData,
	): Promise<void> {
		await this.device.destroyDebugSocket(appData.appId);

		for (const signal of ["TERM", "KILL"]) {
			const pids = await this.getRunningPids();
			if (!pids.length) {
				return;
			}

			await this.$childProcess
				.spawnFromEvent("kill", [`-${signal}`, ...pids], "close")
				.catch((err) => this.$logger.trace(err));

			// `open -n` while the old instance is still exiting starts a second copy.
			for (let attempt = 0; attempt < 40; attempt++) {
				if (!(await this.getRunningPids()).length) {
					return;
				}
				await sleep(50);
			}
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

	/**
	 * macOS runs the app from a copy of the wrapper under /private/var/folders,
	 * so match the bundle layout rather than the path the CLI installed to.
	 */
	private async getRunningPids(): Promise<string[]> {
		const name = this.device.executableName.replace(
			/[.*+?^${}()|[\]\\]/g,
			"\\$&",
		);
		try {
			const result = await this.$childProcess.spawnFromEvent(
				"pgrep",
				["-f", `/Wrapper/${name}\\.app/${name}( |$)`],
				"close",
			);
			return result.stdout.split(/\s+/).filter(Boolean);
		} catch (err) {
			// pgrep exits with 1 when nothing matches.
			return [];
		}
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
			await this.startDeviceLog();
		}
	}

	@cache()
	private startDeviceLog(): Promise<void> {
		return this.device.openDeviceLogStream({ predicate: IOS_LOG_PREDICATE });
	}
}
