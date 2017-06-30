import { sleep } from "../common/helpers";
import { ChildProcess } from "child_process";
import { DebugServiceBase } from "./debug-service-base";

class AndroidDebugService extends DebugServiceBase implements IPlatformDebugService {
	private _device: Mobile.IAndroidDevice = null;
	private _debuggerClientProcess: ChildProcess;

	public get platform() {
		return "android";
	}

	private get device(): Mobile.IAndroidDevice {
		return this._device;
	}

	private set device(newDevice) {
		this._device = newDevice;
	}

	constructor(protected $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $config: IConfiguration,
		private $androidDeviceDiscovery: Mobile.IDeviceDiscovery,
		private $androidProcessService: Mobile.IAndroidProcessService,
		private $net: INet) {
		super($devicesService);
	}

	public async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		return debugOptions.emulator
			? this.debugOnEmulator(debugData, debugOptions)
			: this.debugOnDevice(debugData, debugOptions);
	}

	public async debugStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });
		let action = (device: Mobile.IAndroidDevice): Promise<void> => {
			this.device = device;
			return this.debugStartCore(debugData.applicationIdentifier, debugOptions);
		};

		await this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
	}

	public async debugStop(): Promise<void> {
		this.stopDebuggerClient();
		return;
	}

	private async debugOnEmulator(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		// Assure we've detected the emulator as device
		// For example in case deployOnEmulator had stated new emulator instance
		// we need some time to detect it. Let's force detection.
		await this.$androidDeviceDiscovery.startLookingForDevices();
		return this.debugOnDevice(debugData, debugOptions);
	}

	private async getForwardedLocalDebugPortForPackageName(deviceId: string, packageName: string): Promise<number> {
		let port = -1;
		let forwardsResult = await this.device.adb.executeCommand(["forward", "--list"]);

		let unixSocketName = `${packageName}-inspectorServer`;

		//matches 123a188909e6czzc tcp:40001 localabstract:org.nativescript.testUnixSockets-debug
		let regexp = new RegExp(`(?:${deviceId} tcp:)([\\d]+)(?= localabstract:${unixSocketName})`, "g");
		let match = regexp.exec(forwardsResult);

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

	private async debugOnDevice(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		let packageFile = "";

		if (!debugOptions.start && !debugOptions.emulator) {
			packageFile = debugData.pathToAppPackage;
			this.$logger.out("Using ", packageFile);
		}

		await this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });

		let action = (device: Mobile.IAndroidDevice): Promise<string> => this.debugCore(device, packageFile, debugData.applicationIdentifier, debugOptions);

		const deviceActionResult = await this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
		return deviceActionResult[0].result;
	}

	private async debugCore(device: Mobile.IAndroidDevice, packageFile: string, packageName: string, debugOptions: IDebugOptions): Promise<string> {
		this.device = device;

		await this.printDebugPort(device.deviceInfo.identifier, packageName);

		if (debugOptions.start) {
			return await this.attachDebugger(device.deviceInfo.identifier, packageName, debugOptions);
		} else if (debugOptions.stop) {
			await this.detachDebugger(packageName);
			return null;
		} else {
			await this.startAppWithDebugger(packageFile, packageName, debugOptions);
			return await this.attachDebugger(device.deviceInfo.identifier, packageName, debugOptions);
		}
	}

	private async printDebugPort(deviceId: string, packageName: string): Promise<void> {
		let port = await this.getForwardedLocalDebugPortForPackageName(deviceId, packageName);
		this.$logger.info("device: " + deviceId + " debug port: " + port + "\n");
	}

	private async attachDebugger(deviceId: string, packageName: string, debugOptions: IDebugOptions): Promise<string> {
		if (!(await this.isAppRunning(packageName, deviceId))) {
			this.$errors.failWithoutHelp(`The application ${packageName} does not appear to be running on ${deviceId} or is not built with debugging enabled.`);
		}

		let startDebuggerCommand = ["am", "broadcast", "-a", `\"${packageName}-debug\"`, "--ez", "enable", "true"];
		await this.device.adb.executeShellCommand(startDebuggerCommand);

		let port = await this.getForwardedLocalDebugPortForPackageName(deviceId, packageName);
		return `chrome-devtools://devtools/bundled/inspector.html?experiments=true&ws=localhost:${port}`;
	}

	private detachDebugger(packageName: string): Promise<void> {
		return this.device.adb.executeShellCommand(["am", "broadcast", "-a", `${packageName}-debug`, "--ez", "enable", "false"]);
	}

	private async startAppWithDebugger(packageFile: string, packageName: string, debugOptions: IDebugOptions): Promise<void> {
		if (!debugOptions.emulator && !this.$config.debugLivesync) {
			await this.device.applicationManager.uninstallApplication(packageName);
			await this.device.applicationManager.installApplication(packageFile);
		}
		await this.debugStartCore(packageName, debugOptions);
	}

	private async debugStartCore(packageName: string, debugOptions: IDebugOptions): Promise<void> {
		// Arguments passed to executeShellCommand must be in array ([]), but it turned out adb shell "arg with intervals" still works correctly.
		// As we need to redirect output of a command on the device, keep using only one argument.
		// We could rewrite this with two calls - touch and rm -f , but -f flag is not available on old Android, so rm call will fail when file does not exist.

		await this.device.applicationManager.stopApplication(packageName);

		if (debugOptions.debugBrk) {
			await this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugbreak`]);
		}

		await this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugger-started`]);

		await this.device.applicationManager.startApplication(packageName);

		await this.waitForDebugger(packageName);
	}

	private async waitForDebugger(packageName: String): Promise<void> {
		let waitText: string = `0 /data/local/tmp/${packageName}-debugger-started`;
		let maxWait = 12;
		let debuggerStarted: boolean = false;
		while (maxWait > 0 && !debuggerStarted) {
			let forwardsResult = await this.device.adb.executeShellCommand(["ls", "-s", `/data/local/tmp/${packageName}-debugger-started`]);

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

	private stopDebuggerClient(): void {
		if (this._debuggerClientProcess) {
			this._debuggerClientProcess.kill();
			this._debuggerClientProcess = null;
		}
	}
}

$injector.register("androidDebugService", AndroidDebugService);
