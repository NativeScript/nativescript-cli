import * as iOSDevice from "../common/mobile/ios/device/ios-device";
import * as net from "net";
import * as path from "path";
import * as log4js from "log4js";
import { ChildProcess } from "child_process";
import { DebugServiceBase } from "./debug-service-base";
import { CONNECTION_ERROR_EVENT_NAME, AWAIT_NOTIFICATION_TIMEOUT_SECONDS } from "../constants";
import { getPidFromiOSSimulatorLogs } from "../common/helpers";

import byline = require("byline");

const inspectorBackendPort = 18181;
const inspectorAppName = "NativeScript Inspector.app";
const inspectorNpmPackageName = "tns-ios-inspector";
const inspectorUiDir = "WebInspectorUI/";

export class IOSDebugService extends DebugServiceBase implements IPlatformDebugService {
	private _lldbProcess: ChildProcess;
	private _sockets: net.Socket[] = [];
	private _childProcess: ChildProcess;
	private _socketProxy: any;

	constructor(protected device: Mobile.IDevice,
		protected $devicesService: Mobile.IDevicesService,
		private $platformService: IPlatformService,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $childProcess: IChildProcess,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $errors: IErrors,
		private $npmInstallationManager: INpmInstallationManager,
		private $iOSNotification: IiOSNotification,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $processService: IProcessService,
		private $socketProxyFactory: ISocketProxyFactory,
		private $net: INet,
		private $projectDataService: IProjectDataService) {
		super(device, $devicesService);
		this.$processService.attachToProcessExitSignals(this, this.debugStop);
		this.$socketProxyFactory.on(CONNECTION_ERROR_EVENT_NAME, (e: Error) => this.emit(CONNECTION_ERROR_EVENT_NAME, e));
	}

	public get platform(): string {
		return "ios";
	}

	public debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		if (debugOptions.debugBrk && debugOptions.start) {
			this.$errors.failWithoutHelp("Expected exactly one of the --debug-brk or --start options.");
		}

		if (this.$devicesService.isOnlyiOSSimultorRunning() || this.$devicesService.deviceCount === 0) {
			debugOptions.emulator = true;
		}

		if (debugOptions.emulator) {
			if (debugOptions.start) {
				return this.emulatorStart(debugData, debugOptions);
			} else {
				return this.emulatorDebugBrk(debugData, debugOptions);
			}
		} else {
			if (debugOptions.start) {
				return this.deviceStart(debugData, debugOptions);
			} else {
				return this.deviceDebugBrk(debugData, debugOptions);
			}
		}
	}

	public async debugStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });
		const action = async (device: Mobile.IiOSDevice) => device.isEmulator ? await this.emulatorDebugBrk(debugData, debugOptions) : await this.debugBrkCore(device, debugData, debugOptions);
		await this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
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

			await this.killProcess(this._lldbProcess);
			this._lldbProcess = undefined;
		}

		if (this._childProcess) {
			await this.killProcess(this._childProcess);
			this._childProcess = undefined;
		}
	}

	protected getChromeDebugUrl(debugOptions: IDebugOptions, port: number): string {
		const debugOpts = _.cloneDeep(debugOptions);
		debugOpts.useBundledDevTools = debugOpts.useBundledDevTools === undefined ? false : debugOpts.useBundledDevTools;

		const chromeDebugUrl = super.getChromeDebugUrl(debugOpts, port);
		return chromeDebugUrl;
	}

	private async killProcess(childProcess: ChildProcess): Promise<void> {
		if (childProcess) {
			return new Promise<void>((resolve, reject) => {
				childProcess.on("close", resolve);
				childProcess.kill();
			});
		}
	}

	private async emulatorDebugBrk(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		const args = debugOptions.debugBrk ? "--nativescript-debug-brk" : "--nativescript-debug-start";
		const child_process = await this.$iOSEmulatorServices.runApplicationOnEmulator(debugData.pathToAppPackage, {
			waitForDebugger: true,
			captureStdin: true,
			args: args,
			appId: debugData.applicationIdentifier,
			skipInstall: true
		});

		const lineStream = byline(child_process.stdout);
		this._childProcess = child_process;

		lineStream.on('data', (line: NodeBuffer) => {
			const lineText = line.toString();
			if (lineText && _.startsWith(lineText, debugData.applicationIdentifier)) {
				const pid = getPidFromiOSSimulatorLogs(debugData.applicationIdentifier, lineText);
				if (!pid) {
					this.$logger.trace(`Line ${lineText} does not contain PID of the application ${debugData.applicationIdentifier}.`);
					return;
				}

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

		await this.waitForBackendPortToBeOpened(debugData.deviceIdentifier);

		return this.wireDebuggerClient(debugData, debugOptions);
	}

	private async emulatorStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		const result = await this.wireDebuggerClient(debugData, debugOptions);

		const attachRequestMessage = this.$iOSNotification.getAttachRequest(debugData.applicationIdentifier);

		const iOSEmulatorService = <Mobile.IiOSSimulatorService>this.$iOSEmulatorServices;
		await iOSEmulatorService.postDarwinNotification(attachRequestMessage);
		await this.waitForBackendPortToBeOpened(debugData.deviceIdentifier);
		return result;
	}

	private async waitForBackendPortToBeOpened(deviceIdentifier: string): Promise<void> {
		const portListens = await this.$net.waitForPortToListen({ port: inspectorBackendPort, timeout: 10000, interval: 200 });
		if (!portListens) {
			const error = <Mobile.IDeviceError>new Error("Unable to connect to application. Ensure application is running on simulator.");
			error.deviceIdentifier = deviceIdentifier;
			throw error;
		}
	}

	private async deviceDebugBrk(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });
		const projectData = this.$projectDataService.getProjectData(debugData.projectDir);
		const action = async (device: iOSDevice.IOSDevice): Promise<string> => {
			if (device.isEmulator) {
				return await this.emulatorDebugBrk(debugData, debugOptions);
			}

			const runOptions: IRunPlatformOptions = {
				device: debugData.deviceIdentifier,
				emulator: debugOptions.emulator,
				justlaunch: debugOptions.justlaunch
			};

			const promisesResults = await Promise.all<any>([
				this.$platformService.startApplication(this.platform, runOptions, debugData.applicationIdentifier, projectData.projectName),
				this.debugBrkCore(device, debugData, debugOptions)
			]);

			return _.last(promisesResults);
		};

		const deviceActionResult = await this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
		return deviceActionResult[0].result;
	}

	private async debugBrkCore(device: Mobile.IiOSDevice, debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$iOSSocketRequestExecutor.executeLaunchRequest(device.deviceInfo.identifier, AWAIT_NOTIFICATION_TIMEOUT_SECONDS, AWAIT_NOTIFICATION_TIMEOUT_SECONDS, debugData.applicationIdentifier, debugOptions.debugBrk);
		return this.wireDebuggerClient(debugData, debugOptions, device);
	}

	private async deviceStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });
		const action = async (device: Mobile.IiOSDevice) => device.isEmulator ? await this.emulatorStart(debugData, debugOptions) : await this.deviceStartCore(device, debugData, debugOptions);
		const deviceActionResult = await this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
		return deviceActionResult[0].result;
	}

	private async deviceStartCore(device: Mobile.IiOSDevice, debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$iOSSocketRequestExecutor.executeAttachRequest(device, AWAIT_NOTIFICATION_TIMEOUT_SECONDS, debugData.applicationIdentifier);
		return this.wireDebuggerClient(debugData, debugOptions, device);
	}

	private async wireDebuggerClient(debugData: IDebugData, debugOptions: IDebugOptions, device?: Mobile.IiOSDevice): Promise<string> {
		// the VSCode Ext starts `tns debug ios --no-client` to start/attach to debug sessions
		// check if --no-client is passed - default to opening a tcp socket (versus Chrome DevTools (websocket))
		if ((debugOptions.inspector || !debugOptions.client) && this.$hostInfo.isDarwin) {
			this._socketProxy = await this.$socketProxyFactory.createTCPSocketProxy(this.getSocketFactory(device));
			await this.openAppInspector(this._socketProxy.address(), debugData, debugOptions);
			return null;
		} else {
			if (debugOptions.chrome) {
				this.$logger.info("'--chrome' is the default behavior. Use --inspector to debug iOS applications using the Safari Web Inspector.");
			}

			const deviceIdentifier = device ? device.deviceInfo.identifier : debugData.deviceIdentifier;
			this._socketProxy = await this.$socketProxyFactory.createWebSocketProxy(this.getSocketFactory(device), deviceIdentifier);
			return this.getChromeDebugUrl(debugOptions, this._socketProxy.options.port);
		}
	}

	private async openAppInspector(fileDescriptor: string, debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		if (debugOptions.client) {
			const inspectorPath = await this.$npmInstallationManager.getInspectorFromCache(inspectorNpmPackageName, debugData.projectDir);

			const inspectorSourceLocation = path.join(inspectorPath, inspectorUiDir, "Main.html");
			const inspectorApplicationPath = path.join(inspectorPath, inspectorAppName);

			const cmd = `open -a '${inspectorApplicationPath}' --args '${inspectorSourceLocation}' '${debugData.projectName}' '${fileDescriptor}'`;
			await this.$childProcess.exec(cmd);
		} else {
			this.$logger.info("Suppressing debugging client.");
		}
	}

	private getSocketFactory(device?: Mobile.IiOSDevice): () => Promise<net.Socket> {
		const factory = async () => {
			const socket = device ? await device.connectToPort(inspectorBackendPort) : net.connect(inspectorBackendPort);
			this._sockets.push(socket);
			return socket;
		};

		factory.bind(this);
		return factory;
	}
}

$injector.register("iOSDebugService", IOSDebugService, false);
