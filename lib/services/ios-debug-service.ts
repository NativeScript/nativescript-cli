import * as iOSDevice from "../common/mobile/ios/device/ios-device";
import * as net from "net";
import * as path from "path";
import * as log4js from "log4js";
import { ChildProcess } from "child_process";
import { DebugServiceBase } from "./debug-service-base";
import { CONNECTION_ERROR_EVENT_NAME } from "../constants";
import { getPidFromiOSSimulatorLogs } from "../common/helpers";

import byline = require("byline");

const inspectorBackendPort = 18181;
const inspectorAppName = "NativeScript Inspector.app";
const inspectorNpmPackageName = "tns-ios-inspector";
const inspectorUiDir = "WebInspectorUI/";
const TIMEOUT_SECONDS = 9;

class IOSDebugService extends DebugServiceBase implements IPlatformDebugService {
	private _lldbProcess: ChildProcess;
	private _sockets: net.Socket[] = [];
	private _childProcess: ChildProcess;
	private _socketProxy: any;

	constructor(protected $devicesService: Mobile.IDevicesService,
		private $platformService: IPlatformService,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $errors: IErrors,
		private $npmInstallationManager: INpmInstallationManager,
		private $iOSNotification: IiOSNotification,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $processService: IProcessService,
		private $socketProxyFactory: ISocketProxyFactory) {
		super($devicesService);
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

		if (debugOptions.emulator) {
			if (debugOptions.start) {
				return await this.emulatorStart(debugData, debugOptions);
			} else {
				return await this.emulatorDebugBrk(debugData, debugOptions);
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

	private async killProcess(childProcess: ChildProcess): Promise<void> {
		if (childProcess) {
			return new Promise<void>((resolve, reject) => {
				childProcess.on("close", resolve);
				childProcess.kill();
			});
		}
	}

	private async emulatorDebugBrk(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		let args = debugOptions.debugBrk ? "--nativescript-debug-brk" : "--nativescript-debug-start";
		let child_process = await this.$iOSEmulatorServices.runApplicationOnEmulator(debugData.pathToAppPackage, {
			waitForDebugger: true,
			captureStdin: true,
			args: args,
			appId: debugData.applicationIdentifier,
			skipInstall: true
		});

		let lineStream = byline(child_process.stdout);
		this._childProcess = child_process;

		lineStream.on('data', (line: NodeBuffer) => {
			let lineText = line.toString();
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

		return this.wireDebuggerClient(debugData, debugOptions);
	}

	private async emulatorStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		const result = await this.wireDebuggerClient(debugData, debugOptions);

		let attachRequestMessage = this.$iOSNotification.getAttachRequest(debugData.applicationIdentifier);

		let iOSEmulator = <Mobile.IiOSSimulatorService>this.$iOSEmulatorServices;
		await iOSEmulator.postDarwinNotification(attachRequestMessage);
		return result;
	}

	private async deviceDebugBrk(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });
		const action = async (device: iOSDevice.IOSDevice) => {
			if (device.isEmulator) {
				return await this.emulatorDebugBrk(debugData, debugOptions);
			}

			const runOptions: IRunPlatformOptions = {
				device: debugData.deviceIdentifier,
				emulator: debugOptions.emulator,
				justlaunch: debugOptions.justlaunch
			};
			// we intentionally do not wait on this here, because if we did, we'd miss the AppLaunching notification
			let startApplicationAction = this.$platformService.startApplication(this.platform, runOptions, debugData.applicationIdentifier);

			const result = await this.debugBrkCore(device, debugData, debugOptions);

			await startApplicationAction;

			return result;
		};

		const deviceActionResult = await this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
		return deviceActionResult[0].result;
	}

	private async debugBrkCore(device: Mobile.IiOSDevice, debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$iOSSocketRequestExecutor.executeLaunchRequest(device.deviceInfo.identifier, TIMEOUT_SECONDS, TIMEOUT_SECONDS, debugData.applicationIdentifier, debugOptions.debugBrk);
		return this.wireDebuggerClient(debugData, debugOptions, device);
	}

	private async deviceStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$devicesService.initialize({ platform: this.platform, deviceId: debugData.deviceIdentifier });
		const action = async (device: Mobile.IiOSDevice) => device.isEmulator ? await this.emulatorStart(debugData, debugOptions) : await this.deviceStartCore(device, debugData, debugOptions);
		const deviceActionResult = await this.$devicesService.execute(action, this.getCanExecuteAction(debugData.deviceIdentifier));
		return deviceActionResult[0].result;
	}

	private async deviceStartCore(device: Mobile.IiOSDevice, debugData: IDebugData, debugOptions: IDebugOptions): Promise<string> {
		await this.$iOSSocketRequestExecutor.executeAttachRequest(device, TIMEOUT_SECONDS, debugData.applicationIdentifier);
		return this.wireDebuggerClient(debugData, debugOptions, device);
	}

	private async wireDebuggerClient(debugData: IDebugData, debugOptions: IDebugOptions, device?: Mobile.IiOSDevice): Promise<string> {
		if (debugOptions.chrome) {
			this._socketProxy = await this.$socketProxyFactory.createWebSocketProxy(this.getSocketFactory(device));

			let chromeDevToolsPrefix = `chrome-devtools://devtools/`;

			if (debugOptions.useBundledDevTools) {
				chromeDevToolsPrefix += "bundled";
			} else {
				// corresponds to 55.0.2883 Chrome version
				const commitSHA = "02e6bde1bbe34e43b309d4ef774b1168d25fd024";
				chromeDevToolsPrefix += `remote/serve_file/@${commitSHA}`;
			}

			return `${chromeDevToolsPrefix}/inspector.html?experiments=true&ws=localhost:${this._socketProxy.options.port}`;
		} else {
			this._socketProxy = await this.$socketProxyFactory.createTCPSocketProxy(this.getSocketFactory(device));
			await this.openAppInspector(this._socketProxy.address(), debugData, debugOptions);
			return null;
		}
	}

	private async openAppInspector(fileDescriptor: string, debugData: IDebugData, debugOptions: IDebugOptions): Promise<void> {
		if (debugOptions.client) {
			let inspectorPath = await this.$npmInstallationManager.getInspectorFromCache(inspectorNpmPackageName, debugData.projectDir);

			let inspectorSourceLocation = path.join(inspectorPath, inspectorUiDir, "Main.html");
			let inspectorApplicationPath = path.join(inspectorPath, inspectorAppName);

			let cmd = `open -a '${inspectorApplicationPath}' --args '${inspectorSourceLocation}' '${debugData.projectName}' '${fileDescriptor}'`;
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

$injector.register("iOSDebugService", IOSDebugService);
