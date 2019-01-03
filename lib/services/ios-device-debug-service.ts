import * as path from "path";
import * as log4js from "log4js";
import { ChildProcess } from "child_process";
import { DebugServiceBase } from "./debug-service-base";
import { IOS_LOG_PREDICATE } from "../common/constants";
import { CONNECTION_ERROR_EVENT_NAME } from "../constants";
import { getPidFromiOSSimulatorLogs } from "../common/helpers";
const inspectorAppName = "NativeScript Inspector.app";
const inspectorNpmPackageName = "tns-ios-inspector";
const inspectorUiDir = "WebInspectorUI/";

export class IOSDeviceDebugService extends DebugServiceBase implements IDeviceDebugService {
	private _lldbProcess: ChildProcess;
	private deviceIdentifier: string;

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
		private $processService: IProcessService,
		private $appDebugSocketProxyFactory: IAppDebugSocketProxyFactory,
		private $projectDataService: IProjectDataService,
		private $deviceLogProvider: Mobile.IDeviceLogProvider) {

		super(device, $devicesService);
		this.$processService.attachToProcessExitSignals(this, this.debugStop);
		this.$appDebugSocketProxyFactory.on(CONNECTION_ERROR_EVENT_NAME, (e: Error) => this.emit(CONNECTION_ERROR_EVENT_NAME, e));
		this.deviceIdentifier = this.device.deviceInfo.identifier;
	}

	public get platform(): string {
		return "ios";
	}

	public async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<IDebugResultInfo> {
		const result: IDebugResultInfo = { hasReconnected: false, debugUrl: null };
		this.validateOptions(debugOptions);

		await this.startDeviceLogProcess(debugData, debugOptions);
		await this.$iOSDebuggerPortService.attachToDebuggerPortFoundEvent(this.device, debugData, debugOptions);

		if (!debugOptions.start) {
			await this.startApp(debugData, debugOptions);
			result.hasReconnected = true;
		}

		result.debugUrl = await this.wireDebuggerClient(debugData, debugOptions);

		return result;
	}

	public async debugStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		await this.startApp(debugData, debugOptions);
		await this.wireDebuggerClient(debugData, debugOptions);
	}

	public async debugStop(): Promise<void> {
		this.$appDebugSocketProxyFactory.removeAllProxies();
		await this.stopAppDebuggerOnSimulator();
	}

	private async startApp(debugData: IDebugData, debugOptions: IDebugOptions) {
		if (this.device.isEmulator) {
			await this.startAppOnSimulator(debugData, debugOptions);
		} else {
			await this.startAppOnDevice(debugData, debugOptions);
		}
	}

	private validateOptions(debugOptions: IDebugOptions) {
		if (debugOptions.debugBrk && debugOptions.start) {
			this.$errors.failWithoutHelp("Expected exactly one of the --debug-brk or --start options.");
		}
	}

	private async startDeviceLogProcess(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		if (debugOptions.justlaunch) {
			// No logs should be printed on console when `--justlaunch` option is passed.
			// On the other side we need to start log process in order to get debugger port from logs.
			this.$deviceLogProvider.muteLogsForDevice(this.deviceIdentifier);
		}

		let projectName = debugData.projectName;
		if (!projectName && debugData.projectDir) {
			const projectData = this.$projectDataService.getProjectData(debugData.projectDir);
			projectName = projectData.projectName;
		}

		if (projectName) {
			this.$deviceLogProvider.setProjectNameForDevice(this.deviceIdentifier, projectName);
		}

		await this.device.openDeviceLogStream({ predicate: IOS_LOG_PREDICATE });
	}

	private async startAppOnSimulator(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		const args = debugOptions.debugBrk ? "--nativescript-debug-brk" : "--nativescript-debug-start";
		const launchResult = await this.$iOSEmulatorServices.runApplicationOnEmulator(debugData.pathToAppPackage, {
			waitForDebugger: true,
			captureStdin: true,
			args: args,
			appId: debugData.applicationIdentifier,
			skipInstall: true,
			device: this.deviceIdentifier,
			justlaunch: debugOptions.justlaunch,
			timeout: debugOptions.timeout,
			sdk: debugOptions.sdk
		});
		const pid = getPidFromiOSSimulatorLogs(debugData.applicationIdentifier, launchResult);
		this.startAppDebuggerOnSimulator(pid);
	}

	private async startAppOnDevice(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		const runOptions: IRunPlatformOptions = {
			device: this.deviceIdentifier,
			emulator: this.device.isEmulator,
			justlaunch: debugOptions.justlaunch
		};
		const projectData = this.$projectDataService.getProjectData(debugData.projectDir);
		await this.$platformService.startApplication(this.platform, runOptions, { appId: debugData.applicationIdentifier, projectName: projectData.projectName });
	}

	private startAppDebuggerOnSimulator(pid: string) {
		this._lldbProcess = this.$childProcess.spawn("lldb", ["-p", pid]);
		if (log4js.levels.TRACE.isGreaterThanOrEqualTo(this.$logger.getLevel())) {
			this._lldbProcess.stdout.pipe(process.stdout);
		}
		this._lldbProcess.stderr.pipe(process.stderr);
		this._lldbProcess.stdin.write("process continue\n");
	}

	private async stopAppDebuggerOnSimulator() {
		if (this._lldbProcess) {
			this._lldbProcess.stdin.write("process detach\n");
			await this.killProcess(this._lldbProcess);
			this._lldbProcess = undefined;
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

	private async wireDebuggerClient(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		if ((debugOptions.inspector || !debugOptions.client) && this.$hostInfo.isDarwin) {
			return await this.setupTcpAppDebugProxy(debugData, debugOptions);
		} else {
			return await this.setupWebAppDebugProxy(debugOptions, debugData);
		}
	}

	private async setupWebAppDebugProxy(debugOptions: IDebugOptions, debugData: IDebugData): Promise<string> {
		if (debugOptions.chrome) {
			this.$logger.info("'--chrome' is the default behavior. Use --inspector to debug iOS applications using the Safari Web Inspector.");
		}
		const existingWebProxy = this.$appDebugSocketProxyFactory.getWebSocketProxy(this.deviceIdentifier, debugData.applicationIdentifier);
		const webSocketProxy = existingWebProxy || await this.$appDebugSocketProxyFactory.addWebSocketProxy(this.device, debugData.applicationIdentifier);

		return this.getChromeDebugUrl(debugOptions, webSocketProxy.options.port);
	}

	private async setupTcpAppDebugProxy(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		const existingTcpProxy = this.$appDebugSocketProxyFactory.getTCPSocketProxy(this.deviceIdentifier, debugData.applicationIdentifier);
		const tcpSocketProxy = existingTcpProxy || await this.$appDebugSocketProxyFactory.addTCPSocketProxy(this.device, debugData.applicationIdentifier);
		if (!existingTcpProxy) {
			const inspectorProcess = await this.openAppInspector(tcpSocketProxy.address(), debugData, debugOptions);
			if (inspectorProcess) {
				tcpSocketProxy.on("close", async () => {
					await this.killProcess(inspectorProcess);
				});
			}
		}

		return null;
	}

	private async openAppInspector(fileDescriptor: string, debugData: IDebugData, debugOptions: IDebugOptions): Promise<ChildProcess> {
		if (debugOptions.client) {
			const inspectorPath = await this.$packageInstallationManager.getInspectorFromCache(inspectorNpmPackageName, debugData.projectDir);

			const inspectorSourceLocation = path.join(inspectorPath, inspectorUiDir, "Main.html");
			const inspectorApplicationPath = path.join(inspectorPath, inspectorAppName, "Contents", "MacOS", inspectorAppName, "Contents", "MacOS", "NativeScript Inspector");

			const inspectorProcess: ChildProcess = this.$childProcess.spawn(inspectorApplicationPath, [inspectorSourceLocation, debugData.projectName, fileDescriptor]);
			inspectorProcess.on("error", (e: Error) => this.$logger.trace(e));
			return inspectorProcess;
		} else {
			this.$logger.info("Suppressing debugging client.");
			return null;
		}
	}
}

$injector.register("iOSDeviceDebugService", IOSDeviceDebugService, false);
