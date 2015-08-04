import iOSProxyServices = require("./../common/mobile/ios/ios-proxy-services");
import iOSDevice = require("./../common/mobile/ios/ios-device");
import helpers = require("../common/helpers");
import net = require("net");
import path = require("path");
import util = require("util");

class AndroidDebugService implements IDebugService {
    private static ENV_DEBUG_IN_FILENAME = "envDebug.in";
	private static ENV_DEBUG_OUT_FILENAME = "envDebug.out";
    private static DEFAULT_NODE_INSPECTOR_URL = "http://127.0.0.1:8080/debug";
    private static PACKAGE_EXTERNAL_DIR_TEMPLATE = "/sdcard/Android/data/%s/files/";
    
	private _device: Mobile.IAndroidDevice = null;
	
	constructor(private $devicesServices: Mobile.IDevicesServices,
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

	public debugOnEmulator(): IFuture<void> {
		return (() => {
			this.$platformService.deployOnEmulator(this.platform).wait();
			this.debugOnDevice().wait();
		}).future<void>()();
	}

	public debugOnDevice(): IFuture<void> {
		return (() => {
			let packageFile = "";

			if(!this.$options.debugBrk && !this.$options.start) {
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

			this.$devicesServices.initialize({ platform: this.platform, deviceId: this.$options.device}).wait();
			let action = (device: Mobile.IAndroidDevice): IFuture<void> => { return this.debugCore(device, packageFile, this.$projectData.projectId) };
			this.$devicesServices.execute(action).wait();

		}).future<void>()();
	}
	
	 private debugCore(device: Mobile.IAndroidDevice, packageFile: string, packageName: string): IFuture<void> {
        return (() => {
			this.device = device;
			
            if (this.$options.getPort) {
                this.printDebugPort(packageName).wait();
            } else if (this.$options.start) {
                this.attachDebugger(packageName);
            } else if (this.$options.stop) {
                this.detachDebugger(packageName).wait();
            } else if (this.$options.debugBrk) {
                this.startAppWithDebugger(packageFile, packageName).wait();
            }
        }).future<void>()();
    }
	
	private printDebugPort(packageName: string): IFuture<void> {
        return (() => {
            let res = this.$childProcess.spawnFromEvent(this.$staticConfig.getAdbFilePath().wait(), ["shell", "am", "broadcast", "-a", packageName + "-GetDgbPort"], "exit").wait();
            this.$logger.info(res.stdout);
        }).future<void>()();
    }
	
	private attachDebugger(packageName: string): void {
        let startDebuggerCommand = `am broadcast -a \"${packageName}-Debug\" --ez enable true`;
        let port = this.$options.debugPort;
		
        if (port > 0) {
            startDebuggerCommand += " --ei debuggerPort " + port;
            this.device.adb.executeShellCommand(startDebuggerCommand).wait();
        } else {
            let res = this.$childProcess.spawnFromEvent(this.$staticConfig.getAdbFilePath().wait(), ["shell", "am", "broadcast", "-a", packageName + "-Debug", "--ez", "enable", "true"], "exit").wait();
            let match = res.stdout.match(/result=(\d)+/);
            if (match) {
                port = match[0].substring(7);
            } else {
                port = 0;
            }
        }
        if ((0 < port) && (port < 65536)) {
            this.tcpForward(port, port).wait();
            this.startDebuggerClient(port).wait();
            this.openDebuggerClient(AndroidDebugService.DEFAULT_NODE_INSPECTOR_URL + "?port=" + port);
        } else {
          this.$logger.info("Cannot detect debug port.");
        }
    }

    private detachDebugger(packageName: string): IFuture<void> {
        return this.device.adb.executeShellCommand(this.device.deviceInfo.identifier, `shell am broadcast -a \"${packageName}-Debug\" --ez enable false`);
    }

    private startAppWithDebugger(packageFile: string, packageName: string): IFuture<void> {
        return (() => {
            if(!this.$options.emulator) {
                this.device.applicationManager.uninstallApplication(packageName).wait();
                this.device.applicationManager.installApplication(packageFile).wait();
            }
            
            let port = this.$options.debugPort;
    
            let packageDir = util.format(AndroidDebugService.PACKAGE_EXTERNAL_DIR_TEMPLATE, packageName);
            let envDebugOutFullpath = this.$mobileHelper.buildDevicePath(packageDir, AndroidDebugService.ENV_DEBUG_OUT_FILENAME);
            
            this.device.adb.executeShellCommand(`rm "${envDebugOutFullpath}"`).wait();
            this.device.adb.executeShellCommand(`mkdir -p "${packageDir}"`).wait();
    
    		let debugBreakPath = this.$mobileHelper.buildDevicePath(packageDir, "debugbreak");
            this.device.adb.executeShellCommand(`"cat /dev/null > ${debugBreakPath}"`).wait();
    		
            this.device.applicationManager.startApplication(packageName).wait();
    
            let dbgPort = this.startAndGetPort(packageName).wait();
            if (dbgPort > 0) {
                this.tcpForward(dbgPort, dbgPort).wait();
                this.startDebuggerClient(dbgPort).wait();
                this.openDebuggerClient(AndroidDebugService.DEFAULT_NODE_INSPECTOR_URL + "?port=" + dbgPort);
            }
        }).future<void>()();
    }
    
    private tcpForward(src: Number, dest: Number): IFuture<void> {
        return this.device.adb.executeCommand(`forward tcp:${src.toString()} tcp:${dest.toString()}`);
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
		let chrome = this.$hostInfo.isDarwin ? this.$config.ANDROID_DEBUG_UI_MAC : "chrome";
		let child = this.$opener.open(url, chrome);
		if(!child) {
			this.$errors.fail(`Unable to open ${chrome}.`);
		}
		return child;
    }

    private checkIfRunning(packageName: string): boolean {
        let packageDir = util.format(AndroidDebugService.PACKAGE_EXTERNAL_DIR_TEMPLATE, packageName);
        let envDebugOutFullpath = packageDir + AndroidDebugService.ENV_DEBUG_OUT_FILENAME;
        let isRunning = this.checkIfFileExists(envDebugOutFullpath).wait();
        return isRunning;
    }

    private checkIfFileExists(filename: string): IFuture<boolean> {
        return (() => {
            let args = ["shell", "test", "-f", filename, "&&", "echo 'yes'", "||", "echo 'no'"];
            let res = this.$childProcess.spawnFromEvent(this.$staticConfig.getAdbFilePath().wait(), args, "exit").wait();
            let exists = res.stdout.indexOf('yes') > -1;
            return exists;
        }).future<boolean>()();
    }

    private startAndGetPort(packageName: string): IFuture<number> {
        return (() => {
            let port = -1;
			let timeout = this.$utils.getParsedTimeout(60);       
             
            let packageDir = util.format(AndroidDebugService.PACKAGE_EXTERNAL_DIR_TEMPLATE, packageName);
            let envDebugInFullpath = packageDir + AndroidDebugService.ENV_DEBUG_IN_FILENAME;
            this.device.adb.executeShellCommand(`rm "${envDebugInFullpath}"`).wait();

            let isRunning = false;
            for (let i = 0; i < timeout; i++) {
                helpers.sleep(1000 /* ms */);
                isRunning = this.checkIfRunning(packageName);
                if (isRunning)
                    break;
            }
			
            if (isRunning) {
                this.device.adb.executeShellCommand(`"cat /dev/null > ${envDebugInFullpath}"`).wait();

                for (let i = 0; i < timeout; i++) {
                    helpers.sleep(1000 /* ms */);
                    let envDebugOutFullpath = packageDir + AndroidDebugService.ENV_DEBUG_OUT_FILENAME;
                    let exists = this.checkIfFileExists(envDebugOutFullpath).wait();
                    if (exists) {
                        let res = this.$childProcess.spawnFromEvent(this.$staticConfig.getAdbFilePath().wait(), ["shell", "cat", envDebugOutFullpath], "exit").wait();
                        let match = res.stdout.match(/PORT=(\d)+/);
                        if (match) {
                            port = parseInt(match[0].substring(5), 10);
                            break;
                        }
                    }
                }
            }
            return port;
        }).future<number>()();
    }
}
$injector.register("androidDebugService", AndroidDebugService);
