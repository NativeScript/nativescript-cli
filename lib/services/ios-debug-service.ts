import * as iOSDevice from "../common/mobile/ios/device/ios-device";
import * as net from "net";
import * as path from "path";
import * as log4js from "log4js";
import {ChildProcess} from "child_process";
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

	constructor(
		private $config: IConfiguration,
		private $platformService: IPlatformService,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $devicesService: Mobile.IDevicesService,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $injector: IInjector,
		private $npmInstallationManager: INpmInstallationManager,
		private $options: IOptions,
		private $utils: IUtils,
		private $iOSNotification: IiOSNotification,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $processService: IProcessService,
		private $socketProxyFactory: ISocketProxyFactory,
		private $npm: INodePackageManager) {
			this.$processService.attachToProcessExitSignals(this, this.debugStop);
		}

	public get platform(): string {
		return "ios";
	}

	public debug(): IFuture<void> {
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

	public debugStart(): IFuture<void> {
		return (() => {
			this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
			this.$devicesService.execute((device: Mobile.IiOSDevice) => device.isEmulator ? this.emulatorDebugBrk() : this.debugBrkCore(device)).wait();
		}).future<void>()();
	}

	public debugStop(): IFuture<void> {
		return (() => {
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
		}).future<void>()();
	}

	private emulatorDebugBrk(shouldBreak?: boolean): IFuture<void> {
		return (() => {
			let platformData = this.$platformsData.getPlatformData(this.platform);
			if (this.$options.rebuild) {
				this.$platformService.prepareAndBuild(this.platform).wait();
			}
			let emulatorPackage = this.$platformService.getLatestApplicationPackageForEmulator(platformData).wait();

			let args = shouldBreak ? "--nativescript-debug-brk" : "--nativescript-debug-start";
			let child_process = this.$iOSEmulatorServices.runApplicationOnEmulator(emulatorPackage.packageName, {
				waitForDebugger: true, captureStdin: true,
				args: args, appId: this.$projectData.projectId,
				skipInstall: this.$config.debugLivesync
			}).wait();
			let lineStream = byline(child_process.stdout);
			this._childProcess = child_process;

			lineStream.on('data', (line: NodeBuffer) => {
				let lineText = line.toString();
				if (lineText && _.startsWith(lineText, this.$projectData.projectId)) {
					let pid = _.trimStart(lineText, this.$projectData.projectId + ": ");
					this._lldbProcess = this.$childProcess.spawn("lldb", [ "-p", pid]);
					if (log4js.levels.TRACE.isGreaterThanOrEqualTo(this.$logger.getLevel())) {
						this._lldbProcess.stdout.pipe(process.stdout);
					}
					this._lldbProcess.stderr.pipe(process.stderr);
					this._lldbProcess.stdin.write("process continue\n");
				} else {
					process.stdout.write(line + "\n");
				}
			});

			this.wireDebuggerClient().wait();
		}).future<void>()();
	}

	private emulatorStart(): IFuture<void> {
		return (() => {
			this.wireDebuggerClient().wait();

			let attachRequestMessage = this.$iOSNotification.attachRequest;

			let iOSEmulator = <Mobile.IiOSSimulatorService>this.$iOSEmulatorServices;
			iOSEmulator.postDarwinNotification(attachRequestMessage).wait();
		}).future<void>()();
	}

	private deviceDebugBrk(shouldBreak?: boolean): IFuture<void> {
		return (() => {
			this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
			this.$devicesService.execute((device: iOSDevice.IOSDevice) => (() => {
				if (device.isEmulator) {
					return this.emulatorDebugBrk(shouldBreak).wait();
				}
				// we intentionally do not wait on this here, because if we did, we'd miss the AppLaunching notification
				let action: IFuture<void>;
				if (this.$config.debugLivesync) {
					action = this.$platformService.startOnDevice(this.platform);
				} else {
					action = this.$platformService.deployOnDevice(this.platform);
				}
				this.debugBrkCore(device, shouldBreak).wait();
				action.wait();
			}).future<void>()()).wait();
		}).future<void>()();
	}

	private debugBrkCore(device: Mobile.IiOSDevice, shouldBreak?: boolean): IFuture<void> {
		return (() => {
			let timeout = this.$utils.getMilliSecondsTimeout(TIMEOUT_SECONDS);
			this.$iOSSocketRequestExecutor.executeLaunchRequest(device, timeout, timeout, shouldBreak).wait();
			this.wireDebuggerClient(device).wait();
		}).future<void>()();
	}

	private deviceStart(): IFuture<void> {
		return (() => {
			this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
			this.$devicesService.execute((device: Mobile.IiOSDevice) => device.isEmulator ? this.emulatorStart() : this.deviceStartCore(device)).wait();
		}).future<void>()();
	}

	private deviceStartCore(device: Mobile.IiOSDevice): IFuture<void> {
		return (() => {
			let timeout = this.$utils.getMilliSecondsTimeout(TIMEOUT_SECONDS);
			this.$iOSSocketRequestExecutor.executeAttachRequest(device, timeout).wait();
			this.wireDebuggerClient(device).wait();
		}).future<void>()();
	}

	private wireDebuggerClient(device?: Mobile.IiOSDevice): IFuture<void> {
		return (() => {
			let factory = () => {
				let socket = device ? device.connectToPort(inspectorBackendPort) : net.connect(inspectorBackendPort);
				this._sockets.push(socket);
				return socket;
			};

			if (this.$options.chrome) {
				this._socketProxy = this.$socketProxyFactory.createWebSocketProxy(factory);

				this.$logger.info(`To start debugging, open the following URL in Chrome:\nchrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=localhost:${this._socketProxy.options.port}\n`);
			} else {
				this._socketProxy = this.$socketProxyFactory.createTCPSocketProxy(factory);
				this.openAppInspector(this._socketProxy.address()).wait();
			}
		}).future<void>()();
	}

	private openAppInspector(fileDescriptor: string): IFuture<void> {
		if (this.$options.client) {
			return (() => {
				let inspectorPath = path.join(this.$projectData.projectDir, "node_modules", inspectorNpmPackageName);

				// local installation takes precedence over cache
				if(!this.inspectorAlreadyInstalled(inspectorPath).wait()) {
					let cachepath = this.$childProcess.exec("npm get cache").wait().trim();
					let version = this.$npmInstallationManager.getLatestCompatibleVersion(inspectorNpmPackageName).wait();
					let pathToPackageInCache = path.join(cachepath, inspectorNpmPackageName, version);
					let pathToUnzippedInspector = path.join(pathToPackageInCache, "package");

					if(!this.$fs.exists(pathToPackageInCache).wait()) {
						this.$childProcess.exec(`npm cache add ${inspectorNpmPackageName}@${version}`).wait();
						let inspectorTgzPathInCache = path.join(pathToPackageInCache, "package.tgz");
						this.$childProcess.exec(`tar -xf ${inspectorTgzPathInCache} -C ${pathToPackageInCache}`).wait();
						this.$childProcess.exec(`npm install --prefix ${pathToUnzippedInspector}`).wait();
					}

					inspectorPath = pathToUnzippedInspector;
				}

				let inspectorSourceLocation = path.join(inspectorPath, inspectorUiDir, "Main.html");
				let inspectorApplicationPath = path.join(inspectorPath, inspectorAppName);

				let cmd = `open -a '${inspectorApplicationPath}' --args '${inspectorSourceLocation}' '${this.$projectData.projectName}' '${fileDescriptor}'`;
				this.$childProcess.exec(cmd).wait();
			}).future<void>()();
		} else {
			return (() => {
				this.$logger.info("Suppressing debugging client.");
			}).future<void>()();
		}
	}

	private inspectorAlreadyInstalled(pathToInspector: string): IFuture<Boolean> {
		return (() => {
			if(this.$fs.exists(pathToInspector).wait()) {
				return true;
			}
			return false;
		}).future<Boolean>()();
	}
}
$injector.register("iOSDebugService", IOSDebugService);
