import * as iOSDevice from "../common/mobile/ios/device/ios-device";
import * as net from "net";
import * as path from "path";
import * as semver from "semver";
import byline = require("byline");

const inspectorBackendPort = 18181;
const inspectorAppName = "NativeScript Inspector.app";
const inspectorZipName = "NativeScript Inspector.zip";
const inspectorNpmPackageName = "tns-ios-inspector";
const inspectorUiDir = "WebInspectorUI/";
const TIMEOUT_SECONDS = 90;

class IOSDebugService implements IDebugService {
    constructor(
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
        private $projectDataService: IProjectDataService,
        private $utils: IUtils,
        private $iOSNotification: IiOSNotification,
        private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
        private $socketProxyFactory: ISocketProxyFactory) { }

    public get platform(): string {
        return "ios";
    }

    public debug(): IFuture<void> {
        if (this.$options.debugBrk && this.$options.start) {
            this.$errors.failWithoutHelp("Expected exactly one of the --debug-brk or --start options.");
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
                let deploy = this.$platformService.deployOnDevice(this.platform);
                deploy.wait();

                return this.deviceStart();
            }
        }
    }

    public debugStart(): IFuture<void> {
        return (() => {
            this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
            this.$devicesService.execute((device: Mobile.IiOSDevice) => device.isEmulator ? this.emulatorDebugBrk() : this.debugBrkCore(device)).wait();
        }).future<void>()();
    }

    private emulatorDebugBrk(shouldBreak? : boolean): IFuture<void> {
        return (() => {
            let platformData = this.$platformsData.getPlatformData(this.platform);
            this.$platformService.buildPlatform(this.platform).wait();
            let emulatorPackage = this.$platformService.getLatestApplicationPackageForEmulator(platformData).wait();

            let args = shouldBreak ? "--nativescript-debug-brk" : "--nativescript-debug-start";
            let child_process = this.$iOSEmulatorServices.runApplicationOnEmulator(emulatorPackage.packageName, { waitForDebugger: true, captureStdin: true,
                args: args, appId: this.$projectData.projectId }).wait();
            let lineStream = byline(child_process.stdout);

            lineStream.on('data', (line: NodeBuffer) => {
                let lineText = line.toString();
                if(lineText && _.startsWith(lineText, this.$projectData.projectId)) {
                    let pid = _.trimLeft(lineText, this.$projectData.projectId + ": ");

                    this.$childProcess.exec(`lldb -p ${pid} -o "process continue"`);
                } else {
                    process.stdout.write(line + "\n");
                }
            });

            this.wireDebuggerClient(() => net.connect(inspectorBackendPort)).wait();
        }).future<void>()();
    }

    private emulatorStart(): IFuture<void> {
        return (() => {
            this.wireDebuggerClient(() => net.connect(inspectorBackendPort)).wait();

            let attachRequestMessage = this.$iOSNotification.attachRequest;

            let iOSEmulator = <Mobile.IiOSSimulatorService>this.$iOSEmulatorServices;
            iOSEmulator.postDarwinNotification(attachRequestMessage).wait();
        }).future<void>()();
    }

    private deviceDebugBrk(shouldBreak? : boolean): IFuture<void> {
        return (() => {
            this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
            this.$devicesService.execute((device: iOSDevice.IOSDevice) => (() => {
                if(device.isEmulator) {
                    return this.emulatorDebugBrk(shouldBreak).wait();
                }
                // we intentionally do not wait on this here, because if we did, we'd miss the AppLaunching notification
                let deploy = this.$platformService.deployOnDevice(this.platform);
                this.debugBrkCore(device).wait();
                deploy.wait();
            }).future<void>()()).wait();
        }).future<void>()();
    }

    private debugBrkCore(device: Mobile.IiOSDevice): IFuture<void> {
        return (() => {
            let timeout = this.$utils.getMilliSecondsTimeout(TIMEOUT_SECONDS);
            let readyForAttachTimeout = this.getReadyForAttachTimeout(timeout);

            this.$iOSSocketRequestExecutor.executeLaunchRequest(device, timeout, readyForAttachTimeout).wait();
            this.wireDebuggerClient(() => device.connectToPort(inspectorBackendPort)).wait();
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
            let timeout = this.getReadyForAttachTimeout();
            this.$iOSSocketRequestExecutor.executeAttachRequest(device, timeout).wait();
            this.wireDebuggerClient(() => device.connectToPort(inspectorBackendPort)).wait();
        }).future<void>()();
    }

    private wireDebuggerClient(factory: () => net.Socket): IFuture<void> {
        return (() => {
            let socketProxy = this.$socketProxyFactory.createSocketProxy(factory).wait();
            this.executeOpenDebuggerClient(socketProxy).wait();
        }).future<void>()();
    }

    public executeOpenDebuggerClient(fileDescriptor: string): IFuture<void> {
        if (this.$options.client) {
            return this.openDebuggingClient(fileDescriptor);
        } else {
            return (() => {
                this.$logger.info("Suppressing debugging client.");
            }).future<void>()();
        }
    }

    private openDebuggingClient(fileDescriptor: string): IFuture<void> {
        return (() => {
            let frameworkVersion = this.getProjectFrameworkVersion().wait();
            let inspectorPath = this.getInspectorPath(frameworkVersion).wait();
            let inspectorSourceLocation: string;
            let cmd: string = null;

            if (semver.lt(frameworkVersion, "1.2.0")) {
                cmd = `open -a Safari "${inspectorSourceLocation}"`;
            } else {
                let inspectorApplicationDir: string;
                if (semver.lt(frameworkVersion, "1.6.0")) {
                    inspectorApplicationDir = inspectorPath;
                    inspectorSourceLocation = path.join(inspectorPath, "Safari/Main.html");
                } else {
                    inspectorApplicationDir = path.join(inspectorPath, "..");
                    inspectorSourceLocation = path.join(inspectorPath, "Main.html");
                }

                let inspectorApplicationPath = path.join(inspectorApplicationDir, inspectorAppName);
                if(!this.$fs.exists(inspectorApplicationPath).wait()) {
                    this.$fs.unzip(path.join(inspectorApplicationDir, inspectorZipName), inspectorApplicationDir).wait();
                }
                cmd = `open -a '${inspectorApplicationPath}' --args '${inspectorSourceLocation}' '${this.$projectData.projectName}' '${fileDescriptor}'`;
            }

            this.$childProcess.exec(cmd).wait();
        }).future<void>()();
    }

    private getProjectFrameworkVersion(): IFuture<string> {
        return (() => {
            this.$projectDataService.initialize(this.$projectData.projectDir);
            let platformData = this.$platformsData.getPlatformData(this.platform);
            return this.$projectDataService.getValue(platformData.frameworkPackageName).wait().version;
        }).future<string>()();
    }

    private getInspectorPath(frameworkVersion: string): IFuture<string> {
            if (semver.lt(frameworkVersion, "1.6.0")) {
                return this.getInspectorPathFromTnsIosPackage(frameworkVersion);
            } else {
                return this.getInspectorPathFromInspectorPackage();
            }
    }

    private getInspectorPathFromInspectorPackage(): IFuture<string> {
        return (() => {
            let inspectorPackage = this.$npmInstallationManager.install(inspectorNpmPackageName).wait();
            let inspectorPath = path.join(inspectorPackage, inspectorUiDir);
            return inspectorPath;
        }).future<string>()();
    }

    private getInspectorPathFromTnsIosPackage(frameworkVersion: string): IFuture<string> {
        return (() => {
            let tnsIosPackage = "";
            if (this.$options.frameworkPath) {
                if (this.$fs.getFsStats(this.$options.frameworkPath).wait().isFile()) {
                    this.$errors.failWithoutHelp("frameworkPath option must be path to directory which contains tns-ios framework");
                }
                tnsIosPackage = path.resolve(this.$options.frameworkPath);
            } else {
                let platformData = this.$platformsData.getPlatformData(this.platform);
                tnsIosPackage = this.$npmInstallationManager.install(platformData.frameworkPackageName, { version: frameworkVersion }).wait();
            }
            let inspectorPath = path.join(tnsIosPackage, inspectorUiDir);
            return inspectorPath;
        }).future<string>()();
    }

    private getReadyForAttachTimeout(timeoutInMilliseconds?: number): number {
        let timeout = timeoutInMilliseconds || this.$utils.getMilliSecondsTimeout(TIMEOUT_SECONDS);
        let readyForAttachTimeout = timeout / 10 ;
        let defaultReadyForAttachTimeout = 5000;
        return readyForAttachTimeout > defaultReadyForAttachTimeout ? readyForAttachTimeout : defaultReadyForAttachTimeout;
    }
}
$injector.register("iOSDebugService", IOSDebugService);
