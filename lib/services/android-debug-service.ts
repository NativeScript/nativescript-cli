import * as net from "net";
import * as os from "os";
import Future = require("fibers/future");
import { sleep } from "../common/helpers";
import {ChildProcess} from "child_process";

class AndroidDebugService implements IDebugService {
	private _device: Mobile.IAndroidDevice = null;
	private _debuggerClientProcess: ChildProcess;

	constructor(private $devicesService: Mobile.IDevicesService,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $logger: ILogger,
		private $options: IOptions,
		private $childProcess: IChildProcess,
		private $hostInfo: IHostInfo,
		private $errors: IErrors,
		private $opener: IOpener,
		private $config: IConfiguration,
		private $processService: IProcessService,
		private $androidDeviceDiscovery: Mobile.IDeviceDiscovery) { }

	public get platform() { return "android"; }

	private get device(): Mobile.IAndroidDevice {
		return this._device;
	}

	private set device(newDevice) {
		this._device = newDevice;
	}

	public debug(): IFuture<void> {
		return this.$options.emulator
			? this.debugOnEmulator()
			: this.debugOnDevice();
	}

	private debugOnEmulator(): IFuture<void> {
		return (() => {
			// Assure we've detected the emulator as device
			// For example in case deployOnEmulator had stated new emulator instance
			// we need some time to detect it. Let's force detection.
			this.$androidDeviceDiscovery.startLookingForDevices().wait();
			this.debugOnDevice().wait();
		}).future<void>()();
	}

	private isPortAvailable(candidatePort: number): IFuture<boolean> {
		let future = new Future<boolean>();
		let server = net.createServer();
		server.on("error", (err: Error) => {
			future.return(false);
		});
		server.once("close", () => {
			if (!future.isResolved()) { // "close" will be emitted right after "error"
				future.return(true);
			}
		});
		server.on("listening", (err: Error) => {
			if (err) {
				future.return(false);
			}
			server.close();
		});
		server.listen(candidatePort, "localhost");

		return future;
	}

	private getForwardedLocalDebugPortForPackageName(deviceId: string, packageName: string): IFuture<number> {
		return (() => {
			let port = -1;
			let forwardsResult = this.device.adb.executeCommand(["forward", "--list"]).wait();

			let unixSocketName = `${packageName}-inspectorServer`;

			//matches 123a188909e6czzc tcp:40001 localabstract:org.nativescript.testUnixSockets-debug
			let regexp = new RegExp(`(?:${deviceId} tcp:)([\\d]+)(?= localabstract:${unixSocketName})`, "g");
			let match = regexp.exec(forwardsResult);
			if (match) {
				port = parseInt(match[1]);
			} else {
				let candidatePort = 40000;
				for (; !this.isPortAvailable(candidatePort).wait(); ++candidatePort) {
					if (candidatePort > 65534) {
						this.$errors.failWithoutHelp("Unable to find free local port.");
					}
				}
				port = candidatePort;

				this.unixSocketForward(port, `${unixSocketName}`).wait();
			}

			return port;
		}).future<number>()();
	}

	private unixSocketForward(local: number, remote: string): IFuture<void> {
		return this.device.adb.executeCommand(["forward", `tcp:${local}`, `localabstract:${remote}`]);
	}

	private debugOnDevice(): IFuture<void> {
		return (() => {
			let packageFile = "";

			if (!this.$options.start && !this.$options.emulator) {
				let cachedDeviceOption = this.$options.forDevice;
				this.$options.forDevice = true;
				this.$options.forDevice = !!cachedDeviceOption;

				let platformData = this.$platformsData.getPlatformData(this.platform);
				packageFile = this.$platformService.getLatestApplicationPackageForDevice(platformData).packageName;
				this.$logger.out("Using ", packageFile);
			}

			this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
			let action = (device: Mobile.IAndroidDevice): IFuture<void> => { return this.debugCore(device, packageFile, this.$projectData.projectId); };
			this.$devicesService.execute(action).wait();

		}).future<void>()();
	}

	private debugCore(device: Mobile.IAndroidDevice, packageFile: string, packageName: string): IFuture<void> {
		return (() => {
			this.device = device;

			this.printDebugPort(device.deviceInfo.identifier, packageName).wait();

			if (this.$options.start) {
				this.attachDebugger(device.deviceInfo.identifier, packageName).wait();
			} else if (this.$options.stop) {
				this.detachDebugger(packageName).wait();
			} else {
				this.startAppWithDebugger(packageFile, packageName).wait();
				this.attachDebugger(device.deviceInfo.identifier, packageName).wait();
			}
		}).future<void>()();
	}

	private printDebugPort(deviceId: string, packageName: string): IFuture<void> {
		return (() => {
			let port = this.getForwardedLocalDebugPortForPackageName(deviceId, packageName).wait();
			this.$logger.info("device: " + deviceId + " debug port: " + port + "\n");
		}).future<void>()();
	}

	private attachDebugger(deviceId: string, packageName: string): IFuture<void> {
		return (() => {
			let startDebuggerCommand = ["am", "broadcast", "-a", `\"${packageName}-debug\"`, "--ez", "enable", "true"];
			this.device.adb.executeShellCommand(startDebuggerCommand).wait();

			if (this.$options.client) {
				let port = this.getForwardedLocalDebugPortForPackageName(deviceId, packageName).wait();
				this.startDebuggerClient(port).wait();
			}
		}).future<void>()();
	}

	private detachDebugger(packageName: string): IFuture<void> {
		return this.device.adb.executeShellCommand(["am", "broadcast", "-a", `${packageName}-debug`, "--ez", "enable", "false"]);
	}

	private startAppWithDebugger(packageFile: string, packageName: string): IFuture<void> {
		return (() => {
			if (!this.$options.emulator && !this.$config.debugLivesync) {
				this.device.applicationManager.uninstallApplication(packageName).wait();
				this.device.applicationManager.installApplication(packageFile).wait();
			}
			this.debugStartCore().wait();
		}).future<void>()();
	}

	public debugStart(): IFuture<void> {
		return (() => {
			this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
			let action = (device: Mobile.IAndroidDevice): IFuture<void> => {
				this.device = device;
				return this.debugStartCore();
			};
			this.$devicesService.execute(action).wait();
		}).future<void>()();
	}

	public debugStop(): IFuture<void> {
		this.stopDebuggerClient();
		return Future.fromResult();
	}

	private debugStartCore(): IFuture<void> {
		return (() => {
			let packageName = this.$projectData.projectId;

			// Arguments passed to executeShellCommand must be in array ([]), but it turned out adb shell "arg with intervals" still works correctly.
			// As we need to redirect output of a command on the device, keep using only one argument.
			// We could rewrite this with two calls - touch and rm -f , but -f flag is not available on old Android, so rm call will fail when file does not exist.

			this.device.applicationManager.stopApplication(packageName).wait();

			if(this.$options.debugBrk) {
				this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugbreak`]).wait();
			}
			this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugger-started`]).wait();

			this.device.applicationManager.startApplication(packageName).wait();

			this.waitForDebugger(packageName);

		}).future<void>()();
	}

	private waitForDebugger(packageName: String) {
		let waitText: string = `0 /data/local/tmp/${packageName}-debugger-started`;
		let maxWait = 12;
		let debugerStarted: boolean = false;
		while (maxWait > 0 && !debugerStarted) {
			let forwardsResult = this.device.adb.executeShellCommand(["ls", "-s", `/data/local/tmp/${packageName}-debugger-started`]).wait();
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

	private startDebuggerClient(port: Number): IFuture<void> {
		return (() => {
			this.$logger.info(`To start debugging, open the following URL in Chrome:${os.EOL}chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=localhost:${port}${os.EOL}`.cyan);
		}).future<void>()();
	}

	private stopDebuggerClient(): void {
		if (this._debuggerClientProcess) {
			this._debuggerClientProcess.kill();
			this._debuggerClientProcess = null;
		}
	}

}
$injector.register("androidDebugService", AndroidDebugService);
