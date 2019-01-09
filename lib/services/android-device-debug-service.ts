import { sleep } from "../common/helpers";
import { DebugServiceBase } from "./debug-service-base";
import { LiveSyncPaths } from "../common/constants";

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
		private $androidDeviceDiscovery: Mobile.IDeviceDiscovery,
		private $androidProcessService: Mobile.IAndroidProcessService,
		private $net: INet,
		private $projectDataService: IProjectDataService,
		private $deviceLogProvider: Mobile.IDeviceLogProvider) {

		super(device, $devicesService);
		this.deviceIdentifier = device.deviceInfo.identifier;
	}

	public async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<IDebugResultInfo> {
		this._packageName = debugData.applicationIdentifier;
		const result = this.device.isEmulator
			? await this.debugOnEmulator(debugData, debugOptions)
			: await this.debugOnDevice(debugData, debugOptions);

		if (!debugOptions.justlaunch) {
			const pid = await this.$androidProcessService.getAppProcessId(this.deviceIdentifier, debugData.applicationIdentifier);
			if (pid) {
				this.$deviceLogProvider.setApplicationPidForDevice(this.deviceIdentifier, pid);
				const device = await this.$devicesService.getDevice(this.deviceIdentifier);
				await device.openDeviceLogStream();
			}
		}

		return result;
	}

	public async debugStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: this.deviceIdentifier });
		const projectData = this.$projectDataService.getProjectData(debugData.projectDir);
		const appData: Mobile.IApplicationData = {
			appId: debugData.applicationIdentifier,
			projectName: projectData.projectName
		};

		const action = (device: Mobile.IAndroidDevice): Promise<void> => this.debugStartCore(appData, debugOptions);

		await this.$devicesService.execute(action, this.getCanExecuteAction(this.deviceIdentifier));
	}

	public debugStop(): Promise<void> {
		return this.removePortForwarding();
	}

	private async debugOnEmulator(debugData: IDebugData, debugOptions: IDebugOptions): Promise<IDebugResultInfo> {
		// Assure we've detected the emulator as device
		// For example in case deployOnEmulator had stated new emulator instance
		// we need some time to detect it. Let's force detection.
		await this.$androidDeviceDiscovery.startLookingForDevices();
		return this.debugOnDevice(debugData, debugOptions);
	}

	private async removePortForwarding(packageName?: string): Promise<void> {
		const port = await this.getForwardedDebugPort(this.device.deviceInfo.identifier, packageName || this._packageName);
		return this.device.adb.executeCommand(["forward", "--remove", `tcp:${port}`]);
	}

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

		return port;
	}

	private async unixSocketForward(local: number, remote: string): Promise<void> {
		return this.device.adb.executeCommand(["forward", `tcp:${local}`, `localabstract:${remote}`]);
	}

	private async debugOnDevice(debugData: IDebugData, debugOptions: IDebugOptions): Promise<IDebugResultInfo> {
		let packageFile = "";

		if (!debugOptions.start && !this.device.isEmulator) {
			packageFile = debugData.pathToAppPackage;
			this.$logger.out("Using ", packageFile);
		}

		await this.$devicesService.initialize({ platform: this.platform, deviceId: this.deviceIdentifier });

		const projectName = this.$projectDataService.getProjectData(debugData.projectDir).projectName;
		const appData: Mobile.IApplicationData = {
			appId: debugData.applicationIdentifier,
			projectName
		};

		const action = (device: Mobile.IAndroidDevice): Promise<IDebugResultInfo> => this.debugCore(device, packageFile, appData, debugOptions);

		const deviceActionResult = await this.$devicesService.execute(action, this.getCanExecuteAction(this.deviceIdentifier));
		return deviceActionResult[0].result;
	}

	private async debugCore(device: Mobile.IAndroidDevice, packageFile: string, appData: Mobile.IApplicationData, debugOptions: IDebugOptions): Promise<IDebugResultInfo> {
		const result: IDebugResultInfo = { hasReconnected: false, debugUrl: null };

		if (debugOptions.stop) {
			await this.removePortForwarding();
			return result;
		}

		if (!debugOptions.start) {
			await this.debugStartCore(appData, debugOptions);
			result.hasReconnected = true;
		}

		await this.validateRunningApp(device.deviceInfo.identifier, appData.appId);
		const debugPort = await this.getForwardedDebugPort(device.deviceInfo.identifier, appData.appId);
		await this.printDebugPort(device.deviceInfo.identifier, debugPort);

		result.debugUrl = this.getChromeDebugUrl(debugOptions, debugPort);

		return result;
	}

	private async printDebugPort(deviceId: string, port: number): Promise<void> {
		this.$logger.info("device: " + deviceId + " debug port: " + port + "\n");
	}

	private async validateRunningApp(deviceId: string, packageName: string): Promise<void> {
		if (!(await this.isAppRunning(packageName, deviceId))) {
			this.$errors.failWithoutHelp(`The application ${packageName} does not appear to be running on ${deviceId} or is not built with debugging enabled.`);
		}
	}

	private async debugStartCore(appData: Mobile.IApplicationData, debugOptions: IDebugOptions): Promise<void> {
		await this.device.applicationManager.stopApplication(appData);

		if (debugOptions.debugBrk) {
			await this.device.adb.executeShellCommand([`cat /dev/null > ${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${appData.appId}-debugbreak`]);
		}

		await this.device.adb.executeShellCommand([`cat /dev/null > ${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${appData.appId}-debugger-started`]);

		await this.device.applicationManager.startApplication(appData);

		await this.waitForDebugger(appData.appId);
	}

	private async waitForDebugger(packageName: String): Promise<void> {
		const debuggerStartedFilePath = `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${packageName}-debugger-started`;
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
