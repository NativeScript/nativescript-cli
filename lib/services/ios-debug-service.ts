import * as iOSDevice from "../common/mobile/ios/device/ios-device";
import * as net from "net";
import * as path from "path";
import * as log4js from "log4js";
import * as os from "os";
import { ChildProcess } from "child_process";
import byline = require("byline");

const inspectorBackendPort = 18181;
const inspectorAppName = "NativeScript Inspector.app";
const inspectorNpmPackageName = "tns-ios-inspector";
const inspectorUiDir = "WebInspectorUI/";
const TIMEOUT_SECONDS = 9;

class IOSDebugService implements IDebugService {
	private _lldbProcess: ChildProcess;
	private _sockets: net.Socket[] = [];
	private _childProcess: ChildProcess;
	private _socketProxy: any;

	constructor(private $platformService: IPlatformService,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $devicesService: Mobile.IDevicesService,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $errors: IErrors,
		private $npmInstallationManager: INpmInstallationManager,
		private $options: IOptions,
		private $utils: IUtils,
		private $iOSNotification: IiOSNotification,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $processService: IProcessService,
		private $socketProxyFactory: ISocketProxyFactory) {
		this.$processService.attachToProcessExitSignals(this, this.debugStop);
	}

	public get platform(): string {
		return "ios";
	}

	public async debug(): Promise<void> {
		if (this.$options.debugBrk && this.$options.start) {
			this.$errors.failWithoutHelp("Expected exactly one of the --debug-brk or --start options.");
		}

		if (this.$devicesService.isOnlyiOSSimultorRunning() || this.$devicesService.deviceCount === 0) {
			this.$options.emulator = true;
		}

		if (this.$options.emulator) {
			if (this.$options.debugBrk) {
				return this.emulatorDebugBrk(true);
			} else if (this.$options.start) {
				return this.emulatorStart();
			} else {
				return this.emulatorDebugBrk();
			}
		} else {
			if (this.$options.debugBrk) {
				return this.deviceDebugBrk(true);
			} else if (this.$options.start) {
				return this.deviceStart();
			} else {
				return this.deviceDebugBrk(false);
			}
		}
	}

	public async debugStart(): Promise<void> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device });
		this.$devicesService.execute(async (device: Mobile.IiOSDevice) => await device.isEmulator ? this.emulatorDebugBrk() : this.debugBrkCore(device));
	}

	public async debugStop(): Promise<void> {
		if (this._socketProxy) {
			this._socketProxy.close();
			this._socketProxy = null;
		}

		_.forEach(this._sockets, socket => socket.destroy());
		this._sockets = [];

		if (this._lldbProcess) {
			this._lldbProcess.stdin.write("process detach\n");
			this._lldbProcess.kill();
			this._lldbProcess = undefined;
		}

		if (this._childProcess) {
			this._childProcess.kill();
			this._childProcess = undefined;
		}
	}

	private async emulatorDebugBrk(shouldBreak?: boolean): Promise<void> {
		let platformData = this.$platformsData.getPlatformData(this.platform);

		let emulatorPackage = this.$platformService.getLatestApplicationPackageForEmulator(platformData);

		let args = shouldBreak ? "--nativescript-debug-brk" : "--nativescript-debug-start";
		let child_process = await this.$iOSEmulatorServices.runApplicationOnEmulator(emulatorPackage.packageName, {
			waitForDebugger: true, captureStdin: true,
			args: args, appId: this.$projectData.projectId,
			skipInstall: true
		});

		let lineStream = byline(child_process.stdout);
		this._childProcess = child_process;

		lineStream.on('data', (line: NodeBuffer) => {
			let lineText = line.toString();
			if (lineText && _.startsWith(lineText, this.$projectData.projectId)) {
				let pid = _.trimStart(lineText, this.$projectData.projectId + ": ");
				this._lldbProcess = this.$childProcess.spawn("lldb", ["-p", pid]);
				if (log4js.levels.TRACE.isGreaterThanOrEqualTo(this.$logger.getLevel())) {
					this._lldbProcess.stdout.pipe(process.stdout);
				}
				this._lldbProcess.stderr.pipe(process.stderr);
				this._lldbProcess.stdin.write("process continue\n");
			} else {
				process.stdout.write(line + "\n");
			}
		});

		await this.wireDebuggerClient();
	}

	private async emulatorStart(): Promise<void> {
		await this.wireDebuggerClient();

		let attachRequestMessage = this.$iOSNotification.attachRequest;

		let iOSEmulator = <Mobile.IiOSSimulatorService>this.$iOSEmulatorServices;
		await iOSEmulator.postDarwinNotification(attachRequestMessage);
	}

	private async deviceDebugBrk(shouldBreak?: boolean): Promise<void> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device });
		this.$devicesService.execute(async (device: iOSDevice.IOSDevice) => {
			if (device.isEmulator) {
				return await this.emulatorDebugBrk(shouldBreak);
			}

			// we intentionally do not wait on this here, because if we did, we'd miss the AppLaunching notification
			let action = this.$platformService.runPlatform(this.platform);

			await this.debugBrkCore(device, shouldBreak);

			await action;
		});
	}

	private async debugBrkCore(device: Mobile.IiOSDevice, shouldBreak?: boolean): Promise<void> {
		let timeout = this.$utils.getMilliSecondsTimeout(TIMEOUT_SECONDS);
		await this.$iOSSocketRequestExecutor.executeLaunchRequest(device, timeout, timeout, shouldBreak);
		await this.wireDebuggerClient(device);
	}

	private async deviceStart(): Promise<void> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device });
		this.$devicesService.execute(async (device: Mobile.IiOSDevice) => device.isEmulator ? await this.emulatorStart() : await this.deviceStartCore(device));
	}

	private async deviceStartCore(device: Mobile.IiOSDevice): Promise<void> {
		let timeout = this.$utils.getMilliSecondsTimeout(TIMEOUT_SECONDS);
		await this.$iOSSocketRequestExecutor.executeAttachRequest(device, timeout);
		await this.wireDebuggerClient(device);
	}

	private async wireDebuggerClient(device?: Mobile.IiOSDevice): Promise<void> {
		let factory = () => {
			let socket = device ? device.connectToPort(inspectorBackendPort) : net.connect(inspectorBackendPort);
			this._sockets.push(socket);
			return socket;
		};

		if (this.$options.chrome) {
			this._socketProxy = this.$socketProxyFactory.createWebSocketProxy(factory);

			const commitSHA = "02e6bde1bbe34e43b309d4ef774b1168d25fd024"; // corresponds to 55.0.2883 Chrome version
			this.$logger.info(`To start debugging, open the following URL in Chrome:${os.EOL}chrome-devtools://devtools/remote/serve_file/@${commitSHA}/inspector.html?experiments=true&ws=localhost:${this._socketProxy.options.port}${os.EOL}`.cyan);
		} else {
			this._socketProxy = this.$socketProxyFactory.createTCPSocketProxy(factory);
			await this.openAppInspector(this._socketProxy.address());
		}
	}

	private async openAppInspector(fileDescriptor: string): Promise<void> {
		if (this.$options.client) {
			let inspectorPath = await this.$npmInstallationManager.getInspectorFromCache(inspectorNpmPackageName, this.$projectData.projectDir);

			let inspectorSourceLocation = path.join(inspectorPath, inspectorUiDir, "Main.html");
			let inspectorApplicationPath = path.join(inspectorPath, inspectorAppName);

			let cmd = `open -a '${inspectorApplicationPath}' --args '${inspectorSourceLocation}' '${this.$projectData.projectName}' '${fileDescriptor}'`;
			await this.$childProcess.exec(cmd);
		} else {
			this.$logger.info("Suppressing debugging client.");
		}
	}
}
$injector.register("iOSDebugService", IOSDebugService);
