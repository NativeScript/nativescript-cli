import * as net from "net";
import * as os from "os";
import { sleep } from "../common/helpers";
import { ChildProcess } from "child_process";

class AndroidDebugService implements IDebugService {
	private _device: Mobile.IAndroidDevice = null;
	private _debuggerClientProcess: ChildProcess;

	constructor(private $devicesService: Mobile.IDevicesService,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $logger: ILogger,
		private $options: IOptions,
		private $errors: IErrors,
		private $config: IConfiguration,
		private $androidDeviceDiscovery: Mobile.IDeviceDiscovery) { }

	public get platform() {
		return "android";
	}

	private get device(): Mobile.IAndroidDevice {
		return this._device;
	}

	private set device(newDevice) {
		this._device = newDevice;
	}

	public async debug(projectData: IProjectData, buildConfig: IBuildConfig): Promise<void> {
		return this.$options.emulator
			? this.debugOnEmulator(projectData, buildConfig)
			: this.debugOnDevice(projectData, buildConfig);
	}

	private async debugOnEmulator(projectData: IProjectData, buildConfig: IBuildConfig): Promise<void> {
		// Assure we've detected the emulator as device
		// For example in case deployOnEmulator had stated new emulator instance
		// we need some time to detect it. Let's force detection.
		await this.$androidDeviceDiscovery.startLookingForDevices();
		await this.debugOnDevice(projectData, buildConfig);
	}

	private isPortAvailable(candidatePort: number): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let isResolved = false;
			let server = net.createServer();

			server.on("error", (err: Error) => {
				if (!isResolved) {
					isResolved = true;
					resolve(false);
				}
			});

			server.once("close", () => {
				if (!isResolved) { // "close" will be emitted right after "error"
					isResolved = true;
					resolve(true);
				}
			});

			server.on("listening", (err: Error) => {
				if (err && !isResolved) {
					isResolved = true;
					resolve(false);
				}

				server.close();
			});

			server.listen(candidatePort, "localhost");

		});
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
			let candidatePort = 40000;

			for (; ! await this.isPortAvailable(candidatePort); ++candidatePort) {
				if (candidatePort > 65534) {
					this.$errors.failWithoutHelp("Unable to find free local port.");
				}
			}

			port = candidatePort;

			await this.unixSocketForward(port, `${unixSocketName}`);
		}

		return port;
	}

	private async unixSocketForward(local: number, remote: string): Promise<void> {
		return this.device.adb.executeCommand(["forward", `tcp:${local}`, `localabstract:${remote}`]);
	}

	private async debugOnDevice(projectData: IProjectData, buildConfig: IBuildConfig): Promise<void> {
		let packageFile = "";

		if (!this.$options.start && !this.$options.emulator) {
			let cachedDeviceOption = this.$options.forDevice;

			this.$options.forDevice = !!cachedDeviceOption;

			let platformData = this.$platformsData.getPlatformData(this.platform, projectData);
			packageFile = this.$platformService.getLatestApplicationPackageForDevice(platformData, buildConfig).packageName;
			this.$logger.out("Using ", packageFile);
		}

		await this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device });

		let action = (device: Mobile.IAndroidDevice): Promise<void> => this.debugCore(device, packageFile, projectData.projectId);

		await this.$devicesService.execute(action);
	}

	private async debugCore(device: Mobile.IAndroidDevice, packageFile: string, packageName: string): Promise<void> {
		this.device = device;

		await this.printDebugPort(device.deviceInfo.identifier, packageName);

		if (this.$options.start) {
			await this.attachDebugger(device.deviceInfo.identifier, packageName);
		} else if (this.$options.stop) {
			await this.detachDebugger(packageName);
		} else {
			await this.startAppWithDebugger(packageFile, packageName);
			await this.attachDebugger(device.deviceInfo.identifier, packageName);
		}
	}

	private async printDebugPort(deviceId: string, packageName: string): Promise<void> {
		let port = await this.getForwardedLocalDebugPortForPackageName(deviceId, packageName);
		this.$logger.info("device: " + deviceId + " debug port: " + port + "\n");
	}

	private async attachDebugger(deviceId: string, packageName: string): Promise<void> {
		let startDebuggerCommand = ["am", "broadcast", "-a", `\"${packageName}-debug\"`, "--ez", "enable", "true"];
		await this.device.adb.executeShellCommand(startDebuggerCommand);

		if (this.$options.client) {
			let port = await this.getForwardedLocalDebugPortForPackageName(deviceId, packageName);
			this.startDebuggerClient(port);
		}
	}

	private detachDebugger(packageName: string): Promise<void> {
		return this.device.adb.executeShellCommand(["am", "broadcast", "-a", `${packageName}-debug`, "--ez", "enable", "false"]);
	}

	private async startAppWithDebugger(packageFile: string, packageName: string): Promise<void> {
		if (!this.$options.emulator && !this.$config.debugLivesync) {
			await this.device.applicationManager.uninstallApplication(packageName);
			await this.device.applicationManager.installApplication(packageFile);
		}
		await this.debugStartCore(packageName);
	}

	public async debugStart(projectData: IProjectData, buildConfig: IBuildConfig): Promise<void> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device });
		let action = (device: Mobile.IAndroidDevice): Promise<void> => {
			this.device = device;
			return this.debugStartCore(projectData.projectId);
		};

		await this.$devicesService.execute(action);
	}

	public async debugStop(): Promise<void> {
		this.stopDebuggerClient();
		return;
	}

	private async debugStartCore(packageName: string): Promise<void> {
		// Arguments passed to executeShellCommand must be in array ([]), but it turned out adb shell "arg with intervals" still works correctly.
		// As we need to redirect output of a command on the device, keep using only one argument.
		// We could rewrite this with two calls - touch and rm -f , but -f flag is not available on old Android, so rm call will fail when file does not exist.

		await this.device.applicationManager.stopApplication(packageName);

		if (this.$options.debugBrk) {
			await this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugbreak`]);
		}

		await this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugger-started`]);

		await this.device.applicationManager.startApplication(packageName);

		await this.waitForDebugger(packageName);
	}

	private async waitForDebugger(packageName: String): Promise<void> {
		let waitText: string = `0 /data/local/tmp/${packageName}-debugger-started`;
		let maxWait = 12;
		let debugerStarted: boolean = false;
		while (maxWait > 0 && !debugerStarted) {
			let forwardsResult = await this.device.adb.executeShellCommand(["ls", "-s", `/data/local/tmp/${packageName}-debugger-started`]);

			maxWait--;

			debugerStarted = forwardsResult.indexOf(waitText) === -1;

			if (!debugerStarted) {
				sleep(500);
			}
		}

		if (debugerStarted) {
			this.$logger.info("# NativeScript Debugger started #");
		} else {
			this.$logger.warn("# NativeScript Debugger did not start in time #");
		}
	}

	private startDebuggerClient(port: Number): void {
		this.$logger.info(`To start debugging, open the following URL in Chrome:${os.EOL}chrome-devtools://devtools/bundled/inspector.html?experiments=true&ws=localhost:${port}${os.EOL}`.cyan);
	}

	private stopDebuggerClient(): void {
		if (this._debuggerClientProcess) {
			this._debuggerClientProcess.kill();
			this._debuggerClientProcess = null;
		}
	}

}
$injector.register("androidDebugService", AndroidDebugService);
