import * as iOSDevice from "../common/mobile/ios/device/ios-device";
import * as net from "net";
import * as path from "path";
import * as log4js from "log4js";
import { ChildProcess } from "child_process";
import { DebugServiceBase } from "./debug-service-base";
import { IOS_LOG_PREDICATE } from "../common/constants";
import { CONNECTION_ERROR_EVENT_NAME, AWAIT_NOTIFICATION_TIMEOUT_SECONDS } from "../constants";
import { getPidFromiOSSimulatorLogs } from "../common/helpers";
const inspectorAppName = "NativeScript Inspector.app";
const inspectorNpmPackageName = "tns-ios-inspector";
const inspectorUiDir = "WebInspectorUI/";

export class IOSDebugService extends DebugServiceBase implements IPlatformDebugService {
	private _lldbProcess: ChildProcess;
	private _sockets: net.Socket[] = [];
	private _socketProxy: any;

	constructor(protected device: Mobile.IiOSDevice,
		protected $devicesService: Mobile.IDevicesService,
		private $platformService: IPlatformService,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $childProcess: IChildProcess,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $errors: IErrors,
		private $packageInstallationManager: IPackageInstallationManager,
		private $iOSDebuggerPortService: IIOSDebuggerPortService,
		private $iOSDeviceSocketService: Mobile.IiOSDeviceSocketsService,
		private $iOSNotification: IiOSNotification,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $processService: IProcessService,
		private $socketProxyFactory: ISocketProxyFactory,
		private $projectDataService: IProjectDataService,
		private $deviceLogProvider: Mobile.IDeviceLogProvider) {
		super(device, $devicesService);
		this.$processService.attachToProcessExitSignals(this, this.debugStop);
		this.$socketProxyFactory.on(CONNECTION_ERROR_EVENT_NAME, (e: Error) => this.emit(CONNECTION_ERROR_EVENT_NAME, e));
	}

	public get platform(): string {
		return "ios";
	}

	public async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {

		if (debugOptions.debugBrk && debugOptions.start) {
			this.$errors.failWithoutHelp("Expected exactly one of the --debug-brk or --start options.");
		}

		if (this.$devicesService.isOnlyiOSSimultorRunning() || this.$devicesService.deviceCount === 0) {
			debugOptions.emulator = true;
		}

		await this.startDeviceLogProcess(debugData, debugOptions);

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
		this.$socketProxyFactory.removeAllProxies();

		if (this._lldbProcess) {
			this._lldbProcess.stdin.write("process detach\n");

			await this.killProcess(this._lldbProcess);
			this._lldbProcess = undefined;
		}
	}

	protected getChromeDebugUrl(debugOptions: IDebugOptions, port: number): string {
		const debugOpts = _.cloneDeep(debugOptions);
		debugOpts.useBundledDevTools = debugOpts.useBundledDevTools === undefined ? false : debugOpts.useBundledDevTools;

		const chromeDebugUrl = super.getChromeDebugUrl(debugOpts, port);
		return chromeDebugUrl;
	}

	private async startDeviceLogProcess(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		if (debugOptions.justlaunch) {
			// No logs should be printed on console when `--justlaunch` option is passed.
			// On the other side we need to start log process in order to get debugger port from logs.
			this.$deviceLogProvider.muteLogsForDevice(debugData.deviceIdentifier);
		}

		let projectName = debugData.projectName;
		if (!projectName && debugData.projectDir) {
			const projectData = this.$projectDataService.getProjectData(debugData.projectDir);
			projectName = projectData.projectName;
		}

		if (projectName) {
			this.$deviceLogProvider.setProjectNameForDevice(debugData.deviceIdentifier, projectName);
		}

		await this.device.openDeviceLogStream({ predicate: IOS_LOG_PREDICATE });
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
		const launchResult = await this.$iOSEmulatorServices.runApplicationOnEmulator(debugData.pathToAppPackage, {
			waitForDebugger: true,
			captureStdin: true,
			args: args,
			appId: debugData.applicationIdentifier,
			skipInstall: true,
			device: debugData.deviceIdentifier,
			justlaunch: debugOptions.justlaunch,
			timeout: debugOptions.timeout,
			sdk: debugOptions.sdk
		});

		const pid = getPidFromiOSSimulatorLogs(debugData.applicationIdentifier, launchResult);
		this._lldbProcess = this.$childProcess.spawn("lldb", ["-p", pid]);
		if (log4js.levels.TRACE.isGreaterThanOrEqualTo(this.$logger.getLevel())) {
			this._lldbProcess.stdout.pipe(process.stdout);
		}
		this._lldbProcess.stderr.pipe(process.stderr);
		this._lldbProcess.stdin.write("process continue\n");

		const debugUrl = await this.wireDebuggerClient(debugData, debugOptions);
		return debugUrl;
	}

	private async emulatorStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		const isServerSocketConnected = !!this.$iOSDeviceSocketService.getSocket(debugData.deviceIdentifier);
		const debugUrl = await this.wireDebuggerClient(debugData, debugOptions);
		// tODO: !result.wasAlreadyRunning ||  ??
		if (!isServerSocketConnected) {
			console.log("attach debug socket on emulator");
			const attachRequestMessage = this.$iOSNotification.getAttachRequest(debugData.applicationIdentifier, debugData.deviceIdentifier);
			const iOSEmulatorService = <Mobile.IiOSSimulatorService>this.$iOSEmulatorServices;
			await iOSEmulatorService.postDarwinNotification(attachRequestMessage, debugData.deviceIdentifier);
		}
		return debugUrl;
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
				this.$platformService.startApplication(this.platform, runOptions, { appId: debugData.applicationIdentifier, projectName: projectData.projectName }),
				this.debugBrkCore(device, debugData, debugOptions)
			]);

			return _.last(promisesResults);
		};

		const deviceActionResult = await this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
		return deviceActionResult[0].result;
	}

	private async debugBrkCore(device: Mobile.IiOSDevice, debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$iOSSocketRequestExecutor.executeLaunchRequest(device.deviceInfo.identifier, AWAIT_NOTIFICATION_TIMEOUT_SECONDS, AWAIT_NOTIFICATION_TIMEOUT_SECONDS, debugData.applicationIdentifier, debugOptions);
		const debugUrl = await this.wireDebuggerClient(debugData, debugOptions, device);
		return debugUrl;
	}

	private async deviceStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });
		const action = async (device: Mobile.IiOSDevice) => device.isEmulator ? await this.emulatorStart(debugData, debugOptions) : await this.deviceStartCore(device, debugData, debugOptions);
		const deviceActionResult = await this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
		return deviceActionResult[0].result;
	}

	private async deviceStartCore(device: Mobile.IiOSDevice, debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		const deviceIdentifier = device ? device.deviceInfo.identifier : debugData.deviceIdentifier;
		if (!this.$iOSDeviceSocketService.getSocket(deviceIdentifier)) {
			console.log("attach debug socket on device");
			await this.$iOSSocketRequestExecutor.executeAttachRequest(device, AWAIT_NOTIFICATION_TIMEOUT_SECONDS, debugData.applicationIdentifier);
		}

		const debugUrl = await this.wireDebuggerClient(debugData, debugOptions, device);
		return debugUrl;
	}

	private async wireDebuggerClient(debugData: IDebugData, debugOptions: IDebugOptions, device?: Mobile.IiOSDevice): Promise<string> {
		// the VSCode Ext starts `tns debug ios --no-client` to start/attach to debug sessions
		// check if --no-client is passed - default to opening a tcp socket (versus Chrome DevTools (websocket))
		const deviceIdentifier = device ? device.deviceInfo.identifier : debugData.deviceIdentifier;
		if ((debugOptions.inspector || !debugOptions.client) && this.$hostInfo.isDarwin) {
			const existingProxy = this.$socketProxyFactory.getTCPSocketProxy(deviceIdentifier);
			this._socketProxy = existingProxy || await this.$socketProxyFactory.addTCPSocketProxy(this.getSocketFactory(device, debugData, debugOptions), deviceIdentifier);

			if (!existingProxy) {
				await this.openAppInspector(this._socketProxy.address(), debugData, debugOptions);
			}

			return null;
		} else {
			if (debugOptions.chrome) {
				this.$logger.info("'--chrome' is the default behavior. Use --inspector to debug iOS applications using the Safari Web Inspector.");
			}

			const existingProxy = this.$socketProxyFactory.getWebSocketProxy(deviceIdentifier);
			this._socketProxy = existingProxy || await this.$socketProxyFactory.addWebSocketProxy(this.getSocketFactory(device, debugData, debugOptions), deviceIdentifier);
			return this.getChromeDebugUrl(debugOptions, this._socketProxy.options.port);
		}
	}

	private async openAppInspector(fileDescriptor: string, debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		if (debugOptions.client) {
			const inspectorPath = await this.$packageInstallationManager.getInspectorFromCache(inspectorNpmPackageName, debugData.projectDir);

			const inspectorSourceLocation = path.join(inspectorPath, inspectorUiDir, "Main.html");
			const inspectorApplicationPath = path.join(inspectorPath, inspectorAppName);

			const cmd = `open -a '${inspectorApplicationPath}' --args '${inspectorSourceLocation}' '${debugData.projectName}' '${fileDescriptor}'`;
			await this.$childProcess.exec(cmd);
		} else {
			this.$logger.info("Suppressing debugging client.");
		}
	}

	private getSocketFactory(device: Mobile.IiOSDevice, debugData: IDebugData, debugOptions: IDebugOptions): () => Promise<net.Socket> {
		let pendingExecution: Promise<net.Socket> = null;
		const factory = async () => {
			if (!pendingExecution) {
				const func = async () => {
					const port = await this.$iOSDebuggerPortService.getPort({ projectDir: debugData.projectDir, deviceId: debugData.deviceIdentifier, appId: debugData.applicationIdentifier }, debugOptions);
					if (!port) {
						this.$errors.fail("NativeScript debugger was not able to get inspector socket port.");
					}

					const deviceIdentifier = device ? device.deviceInfo.identifier : debugData.deviceIdentifier;
					const socket = this.$iOSDeviceSocketService.getSocket(deviceIdentifier) ||
						(device ? await device.connectToPort(port) : net.connect(port));
					console.log("port", port);
					this._sockets.push(socket);
					pendingExecution = null;
					this.$iOSDeviceSocketService.addSocket(deviceIdentifier, socket);
					return socket;
				};
				pendingExecution = func();
			}

			return pendingExecution;
		};

		factory.bind(this);
		return factory;
	}
}

$injector.register("iOSDebugService", IOSDebugService, false);
