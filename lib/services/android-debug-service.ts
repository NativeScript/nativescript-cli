///<reference path="../.d.ts"/>
"use strict";
import * as helpers from "../common/helpers";
import * as path from "path";
import * as util from "util";
import * as net from "net";
import Future = require("fibers/future");

class AndroidDebugService implements IDebugService {
    private static ENV_DEBUG_IN_FILENAME = "envDebug.in";
	private static ENV_DEBUG_OUT_FILENAME = "envDebug.out";
    private static DEFAULT_NODE_INSPECTOR_URL = "http://127.0.0.1:8080/debug";
    private static PACKAGE_EXTERNAL_DIR_TEMPLATE = "/sdcard/Android/data/%s/files/";

	private _device: Mobile.IAndroidDevice = null;

	constructor(private $devicesService: Mobile.IDevicesService,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $logger: ILogger,
		private $options: IOptions,
		private $childProcess: IChildProcess,
        private $mobileHelper: Mobile.IMobileHelper,
        private $hostInfo: IHostInfo,
        private $errors: IErrors,
        private $opener: IOpener,
        private $staticConfig: IStaticConfig,
        private $utils: IUtils,
        private $config: IConfiguration) { }

	private get platform() { return "android"; }

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
			this.debugOnDevice().wait();
		}).future<void>()();
	}
    
    
    private isPortAvailable(candidatetPort: number): IFuture<boolean> {
		return (() => {
            
            let future = new Future<boolean>();
            var server = net.createServer();
            server.listen(candidatetPort, function (err: any) {
                server.once('close', function () {
                    future.return(true);
                })
                server.close();
            });
            
            server.on('error', function (err: any) {
               future.return(false);
            });
            
            return future;
		}).future<boolean>()();
	}
    
    
    private getForwardedLocalDebugPortForPackageName(deviceId: string, packageName: string): number {
        var port = -1;
        var forwardsResult = this.device.adb.executeCommand(["forward", "--list"]).wait();
        
        //this gets the port number without supporting forwards on multiple devices on the same package name
        //let match = forwardsResult.match(new RegExp("(?! tcp:)([\\d])+(?= localabstract:" + packageName + "-debug)", "g"));
        
        //matches 123a188909e6czzc tcp:40001 localabstract:org.nativescript.testUnixSockets-debug
        let match = forwardsResult.match(new RegExp("(" + deviceId + " tcp:)([\\d])+(?= localabstract:" + packageName + "-debug)", "g"));
        if (match) {
            port = parseInt(match[0].substring(match[0].length - 5));
        }
        else {
            var candidatePort = 40000;
            while (!this.isPortAvailable(candidatePort++).wait()) {
                if (candidatePort > 65534) {
                    this.$errors.failWithoutHelp("Unable to find free local port.");
                }
            }
            port = candidatePort;
            
            this.unixSocketForward(port, packageName + "-debug").wait();
        }
        
        return port;
    }
    

	private debugOnDevice(): IFuture<void> {
		return (() => {
			let packageFile = "";

			if(!this.$options.debugBrk && !this.$options.start && !this.$options.getPort && !this.$options.stop) {
				this.$logger.warn("Neither --debug-brk nor --start option was specified. Defaulting to --debug-brk.");
				this.$options.debugBrk = true;
			}

			if (this.$options.debugBrk && !this.$options.emulator) {
				let cachedDeviceOption = this.$options.forDevice;
				this.$options.forDevice = true;
				this.$platformService.buildPlatform(this.platform).wait();
				this.$options.forDevice = !!cachedDeviceOption;

				let platformData = this.$platformsData.getPlatformData(this.platform);
				packageFile = this.$platformService.getLatestApplicationPackageForDevice(platformData).wait().packageName;
				this.$logger.out("Using ", packageFile);
			}

			this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device}).wait();
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
                this.attachDebugger(device.deviceInfo.identifier, packageName);
            } else if (this.$options.stop) {
                this.detachDebugger(packageName).wait();
            } else if (this.$options.debugBrk) {
                this.startAppWithDebugger(packageFile, packageName).wait();
            }
        }).future<void>()();
    }

	private printDebugPort(deviceId: string, packageName: string): IFuture<void> {
        return (() => {
            var port = this.getForwardedLocalDebugPortForPackageName(deviceId, packageName);
            this.$logger.info(port);
        }).future<void>()();
    }

	private attachDebugger(deviceId: string,packageName: string): void {
        
        let startDebuggerCommand = ["am", "broadcast", "-a", '\"${packageName}-debug\"', "--ez", "enable", "true"];
        this.device.adb.executeShellCommand(startDebuggerCommand).wait();
        
        var port = this.getForwardedLocalDebugPortForPackageName(deviceId, packageName);
        
        
        this.startDebuggerClient(port).wait();
        this.openDebuggerClient(AndroidDebugService.DEFAULT_NODE_INSPECTOR_URL + "?port=" + port);
    }

    private detachDebugger(packageName: string): IFuture<void> {
        return this.device.adb.executeShellCommand(["am", "broadcast", "-a", `${packageName}-debug`, "--ez", "enable", "false"]);
    }

    private startAppWithDebugger(packageFile: string, packageName: string): IFuture<void> {
        return (() => {
            if(!this.$options.emulator) {
                this.device.applicationManager.uninstallApplication(packageName).wait();
                this.device.applicationManager.installApplication(packageFile).wait();
            }
            this.debugStartCore().wait();
        }).future<void>()();
    }

    public debugStart(): IFuture<void> {
        return (() => {
            this.$devicesService.initialize({ platform: this.platform, deviceId: this.$options.device}).wait();
            let action = (device: Mobile.IAndroidDevice): IFuture<void> => {
                this.device = device;
                return this.debugStartCore();
            };
            this.$devicesService.execute(action).wait();
        }).future<void>()();
    }

    private debugStartCore(): IFuture<void> {
        return (() => {
            let packageName = this.$projectData.projectId;
            
            //TODO: Removed these...
            //let packageDir = util.format(AndroidDebugService.PACKAGE_EXTERNAL_DIR_TEMPLATE, packageName);
            //let envDebugOutFullpath = this.$mobileHelper.buildDevicePath(packageDir, AndroidDebugService.ENV_DEBUG_OUT_FILENAME);

            //this.device.adb.executeShellCommand(["rm", `${envDebugOutFullpath}`]).wait();
            //this.device.adb.executeShellCommand(["mkdir", "-p", `${packageDir}`]).wait();

            //let debugBreakPath = this.$mobileHelper.buildDevicePath(packageDir, "debugbreak");
            //this.device.adb.executeShellCommand([`cat /dev/null > ${debugBreakPath}`]).wait();
            
            this.device.adb.executeShellCommand([`cat /dev/null > /data/local/tmp/${packageName}-debugbreak`]).wait();

            this.device.applicationManager.stopApplication(packageName).wait();
            this.device.applicationManager.startApplication(packageName).wait();

            var localDebugPort = this.getForwardedLocalDebugPortForPackageName(this.device.deviceInfo.identifier, packageName);
            this.startDebuggerClient(localDebugPort).wait();
            this.openDebuggerClient(AndroidDebugService.DEFAULT_NODE_INSPECTOR_URL + "?port=" + localDebugPort);
            
        }).future<void>()();
    }

    // private tcpForward(src: Number, dest: Number): IFuture<void> {
    //     return this.device.adb.executeCommand(["forward", `tcp:${src.toString()}`, `tcp:${dest.toString()}`]);
    // }
    
    private unixSocketForward(local: Number, remote: String): IFuture<void> {
        return this.device.adb.executeCommand(["forward", `tcp:${local.toString()}`, `localabstract:${remote.toString()}`]);
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
        if(this.$hostInfo.isDarwin) {
            defaultDebugUI = "Google Chrome";
        }
        if(this.$hostInfo.isLinux) {
            defaultDebugUI = "google-chrome";
        }

		let debugUI = this.$config.ANDROID_DEBUG_UI || defaultDebugUI;
		let child = this.$opener.open(url, debugUI);
		if(!child) {
			this.$errors.failWithoutHelp(`Unable to open ${debugUI}.`);
		}
    }

    // private checkIfRunning(packageName: string): boolean {
    //     let packageDir = util.format(AndroidDebugService.PACKAGE_EXTERNAL_DIR_TEMPLATE, packageName);
    //     let envDebugOutFullpath = packageDir + AndroidDebugService.ENV_DEBUG_OUT_FILENAME;
    //     let isRunning = this.checkIfFileExists(envDebugOutFullpath).wait();
    //     return isRunning;
    // }

    // private checkIfFileExists(filename: string): IFuture<boolean> {
    //     return (() => {
    //         let res = this.device.adb.executeShellCommand([`test -f ${filename} && echo 'yes' || echo 'no'`]).wait();
    //         let exists = res.indexOf('yes') > -1;
    //         return exists;
    //     }).future<boolean>()();
    // }

    // private startAndGetPort(packageName: string): IFuture<number> {
    //     return (() => {
    //         let port = -1;
	// 		let timeout = this.$utils.getParsedTimeout(90);

    //         let packageDir = util.format(AndroidDebugService.PACKAGE_EXTERNAL_DIR_TEMPLATE, packageName);
    //         let envDebugInFullpath = packageDir + AndroidDebugService.ENV_DEBUG_IN_FILENAME;
    //         this.device.adb.executeShellCommand(["rm", `${envDebugInFullpath}`]).wait();

    //         let isRunning = false;
    //         for (let i = 0; i < timeout; i++) {
    //             helpers.sleep(1000 /* ms */);
    //             isRunning = this.checkIfRunning(packageName);
    //             if (isRunning) {
    //                 break;
    //             }
    //         }

    //         if (isRunning) {
    //             this.device.adb.executeShellCommand([`cat /dev/null > ${envDebugInFullpath}`]).wait();

    //             for (let i = 0; i < timeout; i++) {
    //                 helpers.sleep(1000 /* ms */);
    //                 let envDebugOutFullpath = packageDir + AndroidDebugService.ENV_DEBUG_OUT_FILENAME;
    //                 let exists = this.checkIfFileExists(envDebugOutFullpath).wait();
    //                 if (exists) {
    //                     let res = this.device.adb.executeShellCommand(["cat", envDebugOutFullpath]).wait();
    //                     let match = res.match(/PORT=(\d)+/);
    //                     if (match) {
    //                         port = parseInt(match[0].substring(5), 10);
    //                         break;
    //                     }
    //                 }
    //             }
    //         }
    //         return port;
    //     }).future<number>()();
    // }
}
$injector.register("androidDebugService", AndroidDebugService);
