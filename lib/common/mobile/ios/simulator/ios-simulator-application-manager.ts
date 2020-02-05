import { ApplicationManagerBase } from "../../application-manager-base";
import { ChildProcess } from "child_process";
import { hook, getPidFromiOSSimulatorLogs } from "../../../helpers";
import { cache } from "../../../decorators";
import { IOS_LOG_PREDICATE } from "../../../constants";
import * as path from "path";
import * as log4js from "log4js";

export class IOSSimulatorApplicationManager extends ApplicationManagerBase {
	private _lldbProcesses: IDictionary<ChildProcess> = {};

	constructor(private $childProcess: IChildProcess,
		private iosSim: any,
		private device: Mobile.IiOSDevice,
		private $options: IOptions,
		private $fs: IFileSystem,
		protected $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $tempService: ITempService,
		$logger: ILogger,
		$hooksService: IHooksService) {
		super($logger, $hooksService, $deviceLogProvider);
	}

	public async getInstalledApplications(): Promise<string[]> {
		return this.iosSim.getInstalledApplications(this.device.deviceInfo.identifier);
	}

	@hook('install')
	public async installApplication(packageFilePath: string): Promise<void> {
		if (this.$fs.exists(packageFilePath) && path.extname(packageFilePath) === ".zip") {
			const dir = await this.$tempService.mkdirSync("simulatorPackage");
			await this.$fs.unzip(packageFilePath, dir);
			const app = _.find(this.$fs.readDirectory(dir), directory => path.extname(directory) === ".app");
			if (app) {
				packageFilePath = path.join(dir, app);
			}
		}

		await this.iosSim.installApplication(this.device.deviceInfo.identifier, packageFilePath);
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> {
		await this.detachNativeDebugger(appIdentifier);
		return this.iosSim.uninstallApplication(this.device.deviceInfo.identifier, appIdentifier);
	}

	public async startApplication(appData: Mobile.IStartApplicationData): Promise<void> {
		const options = appData.waitForDebugger ? {
			waitForDebugger: true,
			args: "--nativescript-debug-brk",
		} : {};
		await this.setDeviceLogData(appData);
		const launchResult = await this.iosSim.startApplication(this.device.deviceInfo.identifier, appData.appId, options);
		const pid = getPidFromiOSSimulatorLogs(appData.appId, launchResult);
		this.$deviceLogProvider.setApplicationPidForDevice(this.device.deviceInfo.identifier, pid);
		if (appData.waitForDebugger) {
			this.attachNativeDebugger(appData.appId, pid);
		}
	}

	public async stopApplication(appData: Mobile.IApplicationData): Promise<void> {
		const { appId } = appData;

		await this.device.destroyDebugSocket(appId);
		await this.detachNativeDebugger(appId);

		await this.iosSim.stopApplication(this.device.deviceInfo.identifier, appData.appId, appData.projectName);
	}

	public async getDebuggableApps(): Promise<Mobile.IDeviceApplicationInformation[]> {
		return [];
	}

	public async getDebuggableAppViews(appIdentifiers: string[]): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> {
		// Implement when we can find debuggable applications for iOS.
		return Promise.resolve(null);
	}

	// iOS will kill the app if we freeze it in the NativeScript Runtime and wait for debug-brk.
	// In order to avoid that, we are attaching lldb and passing it "process continue".
	// In this way, iOS will not kill the app because it has a native debugger attached
	// and the users will be able to attach a debug session using the debug-brk flag.
	private attachNativeDebugger(appId: string, pid: string): void {
		this._lldbProcesses[appId] = this.$childProcess.spawn("lldb", ["-p", pid]);
		if (log4js.levels.TRACE.isGreaterThanOrEqualTo(this.$logger.getLevel())) {
			this._lldbProcesses[appId].stdout.pipe(process.stdout);
		}
		this._lldbProcesses[appId].stderr.pipe(process.stderr);
		this._lldbProcesses[appId].stdin.write("process continue\n");
	}

	private async detachNativeDebugger(appId: string) {
		if (this._lldbProcesses[appId]) {
			this._lldbProcesses[appId].stdin.write("process detach\n");
			await this.killProcess(this._lldbProcesses[appId]);
			this._lldbProcesses[appId] = undefined;
		}
	}

	private async killProcess(childProcess: ChildProcess): Promise<void> {
		if (childProcess) {
			return new Promise<void>((resolve, reject) => {
				childProcess.on("close", resolve);
				childProcess.kill();
			});
		}
	}

	private async setDeviceLogData(appData: Mobile.IApplicationData): Promise<void> {
		this.$deviceLogProvider.setProjectNameForDevice(this.device.deviceInfo.identifier, appData.projectName);
		this.$deviceLogProvider.setProjectDirForDevice(this.device.deviceInfo.identifier, appData.projectDir);

		if (!this.$options.justlaunch) {
			await this.startDeviceLog();
		}
	}

	@cache()
	private startDeviceLog(): Promise<void> {
		return this.device.openDeviceLogStream({ predicate: IOS_LOG_PREDICATE });
	}
}
