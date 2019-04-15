import { sleep } from "../common/helpers";
import { DebugServiceBase } from "./debug-service-base";
import { LiveSyncPaths } from "../common/constants";
import { performanceLog } from "../common/decorators";

export class AndroidDeviceDebugService extends DebugServiceBase implements IDeviceDebugService {
	private _packageName: string;
	private deviceIdentifier: string;

	public get platform() {
		return "android";
	}

	constructor(protected device: Mobile.IAndroidDevice,
		protected $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $androidProcessService: Mobile.IAndroidProcessService,
		private $net: INet,
		private $cleanupService: ICleanupService,
		private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $staticConfig: IStaticConfig) {

		super(device, $devicesService);
		this.deviceIdentifier = device.deviceInfo.identifier;
	}

	@performanceLog()
	public async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<IDebugResultInfo> {
		this._packageName = debugData.applicationIdentifier;
		const result = await this.debugCore(debugData.applicationIdentifier, debugOptions);

		// TODO: extract this logic outside the debug service
		if (debugOptions.start && !debugOptions.justlaunch) {
			const pid = await this.$androidProcessService.getAppProcessId(this.deviceIdentifier, debugData.applicationIdentifier);
			if (pid) {
				this.$deviceLogProvider.setApplicationPidForDevice(this.deviceIdentifier, pid);
				const device = await this.$devicesService.getDevice(this.deviceIdentifier);
				await device.openDeviceLogStream();
			}
		}

		return result;
	}

	public debugStop(): Promise<void> {
		return this.removePortForwarding();
	}

	private async removePortForwarding(packageName?: string): Promise<void> {
		const port = await this.getForwardedDebugPort(this.device.deviceInfo.identifier, packageName || this._packageName);
		return this.device.adb.executeCommand(["forward", "--remove", `tcp:${port}`]);
	}

	// TODO: Remove this method and reuse logic from androidProcessService
	private async getForwardedDebugPort(deviceId: string, packageName: string): Promise<number> {
		let port = -1;
		const forwardsResult = await this.device.adb.executeCommand(["forward", "--list"]);

		const unixSocketName = `${packageName}-inspectorServer`;

		//matches 123a188909e6czzc tcp:40001 localabstract:org.nativescript.testUnixSockets-debug
		const regexp = new RegExp(`(?:${deviceId} tcp:)([\\d]+)(?= localabstract:${unixSocketName})`, "g");
		const match = regexp.exec(forwardsResult);

		if (match) {
			port = parseInt(match[1]);
		} else {
			port = await this.$net.getAvailablePortInRange(40000);

			await this.unixSocketForward(port, `${unixSocketName}`);
		}

		await this.$cleanupService.addCleanupCommand({ command: await this.$staticConfig.getAdbFilePath(), args: ["-s", deviceId, "forward", "--remove", `tcp:${port}`] });

		return port;
	}

	// TODO: Remove this method and reuse logic from androidProcessService
	private async unixSocketForward(local: number, remote: string): Promise<void> {
		await this.device.adb.executeCommand(["forward", `tcp:${local}`, `localabstract:${remote}`]);
	}

	@performanceLog()
	private async debugCore(appId: string, debugOptions: IDebugOptions): Promise<IDebugResultInfo> {
		const result: IDebugResultInfo = { debugUrl: null };
		if (debugOptions.stop) {
			await this.removePortForwarding();
			return result;
		}

		await this.validateRunningApp(this.deviceIdentifier, appId);
		if (debugOptions.debugBrk) {
			await this.waitForDebugServer(appId);
		}

		const debugPort = await this.getForwardedDebugPort(this.deviceIdentifier, appId);
		await this.printDebugPort(this.deviceIdentifier, debugPort);

		result.debugUrl = this.getChromeDebugUrl(debugOptions, debugPort);

		return result;
	}

	private async printDebugPort(deviceId: string, port: number): Promise<void> {
		this.$logger.info("device: " + deviceId + " debug port: " + port + "\n");
	}

	// TODO: extract this logic outside the debug service
	private async validateRunningApp(deviceId: string, packageName: string): Promise<void> {
		if (!(await this.isAppRunning(packageName, deviceId))) {
			this.$errors.failWithoutHelp(`The application ${packageName} does not appear to be running on ${deviceId} or is not built with debugging enabled. Try starting the application manually.`);
		}
	}

	private async waitForDebugServer(appId: String): Promise<void> {
		const debuggerStartedFilePath = `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${appId}-debugger-started`;
		const waitText: string = `0 ${debuggerStartedFilePath}`;
		let maxWait = 12;
		let debuggerStarted: boolean = false;
		while (maxWait > 0 && !debuggerStarted) {
			const forwardsResult = await this.device.adb.executeShellCommand(["ls", "-s", debuggerStartedFilePath]);

			maxWait--;

			debuggerStarted = forwardsResult.indexOf(waitText) === -1;

			if (!debuggerStarted) {
				await sleep(500);
			}
		}

		if (debuggerStarted) {
			this.$logger.info("# NativeScript Debugger started #");
		} else {
			this.$logger.warn("# NativeScript Debugger did not start in time #");
		}
	}

	private async isAppRunning(appIdentifier: string, deviceIdentifier: string): Promise<boolean> {
		const debuggableApps = await this.$androidProcessService.getDebuggableApps(deviceIdentifier);

		return !!_.find(debuggableApps, a => a.appIdentifier === appIdentifier);
	}
}

$injector.register("androidDeviceDebugService", AndroidDeviceDebugService, false);
