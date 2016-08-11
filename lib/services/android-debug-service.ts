import * as path from "path";
import * as net from "net";
import Future = require("fibers/future");
import { sleep } from "../common/helpers";

class AndroidDebugService implements IDebugService {
	private static DEFAULT_NODE_INSPECTOR_URL = "http://127.0.0.1:8080/debug";

	private _device: Mobile.IAndroidDevice = null;

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
			this.$platformService.deployOnEmulator(this.platform).wait();
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

			//matches 123a188909e6czzc tcp:40001 localabstract:org.nativescript.testUnixSockets-debug
			let regexp = new RegExp(`(?:${deviceId} tcp:)([\\d]+)(?= localabstract:${packageName}-debug)`, "g");
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

				this.unixSocketForward(port, packageName + "-debug").wait();
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

			if (!this.$options.start && !this.$options.emulator && !this.$options.getPort) {
				let cachedDeviceOption = this.$options.forDevice;
				this.$options.forDevice = true;
				if (this.$options.rebuild) {
					this.$platformService.prepareAndExecute(this.platform, () => this.$platformService.buildPlatform(this.platform)).wait();
				}
				this.$options.forDevice = !!cachedDeviceOption;

				let platformData = this.$platformsData.getPlatformData(this.platform);
				packageFile = this.$platformService.getLatestApplicationPackageForDevice(platformData).wait().packageName;
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

			if (this.$options.getPort) {
				this.printDebugPort(device.deviceInfo.identifier, packageName).wait();
			} else if (this.$options.start) {
				this.attachDebugger(device.deviceInfo.identifier, packageName).wait();
			} else if (this.$options.stop) {
				this.detachDebugger(packageName).wait();
			} else if (this.$options.debugBrk) {
				this.startAppWithDebugger(packageFile, packageName).wait();
			} else {
				this.startAppWithDebugger(packageFile, packageName).wait();
				//TODO: Find different way to make sure that the app is started.
				sleep(500);
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
				this.openDebuggerClient(AndroidDebugService.DEFAULT_NODE_INSPECTOR_URL + "?port=" + port);
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
		return Future.fromResult();
	}

	private debugStartCore(): IFuture<void> {
		return (() => {
			let packageName = this.$projectData.projectId;

			// Arguments passed to executeShellCommand must be in array ([]), but it turned out adb shell "arg with intervals" still works correctly.
			// As we need to redirect output of a command on the device, keep using only one argument.
			// We could rewrite this with two calls - touch and rm -f , but -f flag is not available on old Android, so rm call will fail when file does not exist.

			if(this.$options.debugBrk) {
				this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugbreak`]).wait();
			}

			this.device.applicationManager.stopApplication(packageName).wait();
			this.device.applicationManager.startApplication(packageName).wait();

			if(this.$options.debugBrk) {
				let waitText: string = `0 /data/local/tmp/${packageName}-debugbreak`;
				let maxWait = 12;
				let debugerStarted: boolean = false;
				while (maxWait > 0 && !debugerStarted) {
					let forwardsResult = this.device.adb.executeShellCommand(["ls", "-s", `/data/local/tmp/${packageName}-debugbreak`]).wait();
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

				if (this.$options.client) {
					let localDebugPort = this.getForwardedLocalDebugPortForPackageName(this.device.deviceInfo.identifier, packageName).wait();
					this.startDebuggerClient(localDebugPort).wait();
					this.openDebuggerClient(AndroidDebugService.DEFAULT_NODE_INSPECTOR_URL + "?port=" + localDebugPort);
				}
			}
		}).future<void>()();
	}

	private startDebuggerClient(port: Number): IFuture<void> {
		return (() => {
			let nodeInspectorModuleFilePath = require.resolve("node-inspector");
			let nodeInspectorModuleDir = path.dirname(nodeInspectorModuleFilePath);
			let nodeInspectorFullPath = path.join(nodeInspectorModuleDir, "bin", "inspector");
			this.$childProcess.spawn(process.argv[0], [nodeInspectorFullPath, "--debug-port", port.toString()], { stdio: "ignore", detached: true });
		}).future<void>()();
	}

	private openDebuggerClient(url: string): void {
		let defaultDebugUI = "chrome";
		if (this.$hostInfo.isDarwin) {
			defaultDebugUI = "Google Chrome";
		}
		if (this.$hostInfo.isLinux) {
			defaultDebugUI = "google-chrome";
		}

		let debugUI = this.$config.ANDROID_DEBUG_UI || defaultDebugUI;
		let child = this.$opener.open(url, debugUI);
		if (!child) {
			this.$errors.failWithoutHelp(`Unable to open ${debugUI}.`);
		}
	}
}
$injector.register("androidDebugService", AndroidDebugService);
