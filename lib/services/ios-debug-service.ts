import iOSProxyServices = require("./../common/mobile/ios/ios-proxy-services");
import iOSDevice = require("./../common/mobile/ios/ios-device");
import net = require("net");
import ws = require("ws");
import stream = require("stream");
import path = require("path");
import http = require("http");

module notification {
	export function waitForDebug(bundleId: string): string {
		return bundleId + ":NativeScript.Debug.WaitForDebugger";
	}

	export function attachRequest(bundleId: string): string {
		return bundleId + ":NativeScript.Debug.AttachRequest";
	}

	export function appLaunching(bundleId: string): string {
		return bundleId + ":NativeScript.Debug.AppLaunching";
	}

	export function readyForAttach(bundleId: string): string {
		return bundleId + ":NativeScript.Debug.ReadyForAttach";
	}
}

var InspectorBackendPort = 18181;

function connectEventually(factory: () => net.Socket, handler: (socket: net.Socket) => void) {
    function tryConnect() {
        var tryConnectAfterTimeout = setTimeout.bind(undefined, tryConnect, 1000);

        var socket = factory();
        socket.on("connect", () => {
            socket.removeListener("error", tryConnectAfterTimeout);
            handler(socket);
        });
        socket.on("error", tryConnectAfterTimeout);
    }

    tryConnect();
}

class IOSDebugService implements IDebugService {
	constructor(
		private $platformService: IPlatformService,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $devicesServices: Mobile.IDevicesServices,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $injector: IInjector,
		private $npm: INodePackageManager,
		private $options: IOptions) {
	}

	get platform(): string {
		return "ios";
	}

	public debug(): IFuture<void> {
		if ((!this.$options.debugBrk && !this.$options.start) || (this.$options.debugBrk && this.$options.start)) {
			this.$errors.failWithoutHelp("Expected exactly one of the --debug-brk or --start options.");
		}

		if (this.$options.emulator) {
			if (this.$options.debugBrk) {
				return this.emulatorDebugBrk();
			} else if (this.$options.start) {
				return this.emulatorStart();
			}
		} else {
			if (this.$options.debugBrk) {
				return this.deviceDebugBrk();
			} else if (this.$options.start) {
				return this.deviceStart();
			}
		}

		this.$errors.failWithoutHelp("Failed to select device or emulator to debug on.");
	}

	private emulatorDebugBrk(): IFuture<void> {
		return (() => {
			var platformData = this.$platformsData.getPlatformData(this.platform);
			this.$platformService.buildPlatform(this.platform).wait();
			var emulatorPackage = this.$platformService.getLatestApplicationPackageForEmulator(platformData).wait();

			this.$iOSEmulatorServices.startEmulator(emulatorPackage.packageName, { args: "--nativescript-debug-brk" }).wait();
            createWebSocketProxy(this.$logger, (callback) => connectEventually(() => net.connect(InspectorBackendPort), callback));
            this.executeOpenDebuggerClient().wait();
		}).future<void>()();
	}

	private emulatorStart(): IFuture<void> {
		return (() => {
            createWebSocketProxy(this.$logger, (callback) => connectEventually(() => net.connect(InspectorBackendPort), callback));
            this.executeOpenDebuggerClient().wait();
			var projectId = this.$projectData.projectId;
			var attachRequestMessage = notification.attachRequest(projectId);
            // TODO: send notifications with ios-sim-portable
		}).future<void>()();
	}

	private deviceDebugBrk(): IFuture<void> {
		return (() => {
			this.$devicesServices.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
			this.$devicesServices.execute(device => (() => {
				this.$platformService.deployOnDevice(this.platform).wait();

                var iosDevice = <iOSDevice.IOSDevice>device;
                iosDevice.runApplication(this.$projectData.projectId /* , ["--nativescript-debug-brk"] */).wait();
                createWebSocketProxy(this.$logger, (callback) => connectEventually(() => iosDevice.connectToPort(InspectorBackendPort), callback));
                this.executeOpenDebuggerClient().wait();
			}).future<void>()()).wait();
		}).future<void>()();
	}

	private deviceStart(): IFuture<void> {
		return (() => {
			this.$devicesServices.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
			this.$devicesServices.execute(device => (() => {
				var iosDevice = <iOSDevice.IOSDevice>device;
				createWebSocketProxy(this.$logger, (callback) => connectEventually(() => iosDevice.connectToPort(InspectorBackendPort), callback));
                this.executeOpenDebuggerClient().wait();
			}).future<void>()()).wait();
		}).future<void>()();
	}

	public executeOpenDebuggerClient(): IFuture<void> {
		if (this.$options.client === false) {
			// NOTE: The --no-client has been specified. Otherwise its either false or undefined.
			return (() => {
				this.$logger.info("Supressing debugging client.");
			}).future<void>()();
		} else {
			return this.openDebuggingClient();
		}
	}

	private openDebuggingClient(): IFuture<void> {
		return (() => {
			var cmd = "open -a Safari " + this.getSafariPath().wait();
			this.$childProcess.exec(cmd).wait();
		}).future<void>()();
	}

	private getSafariPath(): IFuture<string> {
		return (() => {
			var tnsIosPackage = "";
			if (this.$options.frameworkPath) {
				if (this.$fs.getFsStats(this.$options.frameworkPath).wait().isFile()) {
					this.$errors.failWithoutHelp("frameworkPath option must be path to directory which contains tns-ios framework");
				}
				tnsIosPackage = path.resolve(this.$options.frameworkPath);
			} else {
				var platformData = this.$platformsData.getPlatformData(this.platform);
				tnsIosPackage = this.$npm.install(platformData.frameworkPackageName).wait();
			}
			var safariPath = path.join(tnsIosPackage, "WebInspectorUI/Safari/Main.html");
			return safariPath;
		}).future<string>()();
	}
}
$injector.register("iOSDebugService", IOSDebugService);

function createWebSocketProxy($logger: ILogger, socketFactory: (handler: (socket: net.Socket) => void) => void): ws.Server {
    // NOTE: We will try to provide command line options to select ports, at least on the localhost.
    var localPort = 8080;

    $logger.info("\nSetting up debugger proxy...\nPress Ctrl + C to terminate, or disconnect.\n");

    // NB: When the inspector frontend connects we might not have connected to the inspector backend yet.
    // That's why we use the verifyClient callback of the websocket server to stall the upgrade request until we connect.
    // We store the socket that connects us to the device in the upgrade request object itself and later on retrieve it
    // in the connection callback.

    var server = ws.createServer(<any>{
        port: localPort,
        verifyClient: (info: any, callback: any) => {
            socketFactory((socket) => {
                info.req["__deviceSocket"] = socket;
                callback(true);
            });
        }
    });
    server.on("connection", (webSocket) => {
        $logger.info("Frontend client connected.");

        var deviceSocket: net.Socket = (<any>webSocket.upgradeReq)["__deviceSocket"];

        $logger.info("Backend socket created.");
        var packets = new PacketStream();
        deviceSocket.pipe(packets);

        packets.on("data", (buffer: Buffer) => {
            webSocket.send(buffer.toString("utf16le"));
        });

        webSocket.on("message", (message, flags) => {
            var length = Buffer.byteLength(message, "utf16le");
            var payload = new Buffer(length + 4);
            payload.writeInt32BE(length, 0);
            payload.write(message, 4, length, "utf16le");
            deviceSocket.write(payload);
        });

        deviceSocket.on("end", () => {
            $logger.info("Backend socket closed!");
            process.exit(0);
        });

        webSocket.on("close", () => {
            $logger.info('Frontend socket closed!');
            process.exit(0);
        });
    });

    $logger.info("Opened localhost " + localPort);
    return server;
}

class IOSDeviceDebugging {
	private $notificationProxyClient: iOSProxyServices.NotificationProxyClient;

	constructor(private bundleId: string,
		private $iOSDevice: iOSDevice.IOSDevice,
		private $logger: ILogger,
		private $injector: IInjector) {

		this.$notificationProxyClient = this.$injector.resolve(iOSProxyServices.NotificationProxyClient, { device: this.$iOSDevice })
	}

	public debugApplicationOnStart() {
		var appLaunchMessage = notification.appLaunching(this.bundleId);
		this.$notificationProxyClient.addObserver(appLaunchMessage, () => {
			this.$logger.info("Got AppLaunching");
			this.proxyDebuggingTraffic();
			var waitForDebuggerMessage = notification.waitForDebug(this.bundleId);
			this.$notificationProxyClient.postNotificationAndAttachForData(waitForDebuggerMessage);
		});
	}

	public debugRunningApplication() {
		this.proxyDebuggingTraffic();
		var attachRequestMessage = notification.attachRequest(this.bundleId);
		this.$notificationProxyClient.postNotificationAndAttachForData(attachRequestMessage);
	}

	private proxyDebuggingTraffic(): void {
		var identifier = this.$iOSDevice.getIdentifier();
		this.$logger.info("Device Identifier: " + identifier);

		var readyForAttachMessage = notification.readyForAttach(this.bundleId);
		this.$notificationProxyClient.addObserver(readyForAttachMessage, () => {
			createWebSocketProxy(this.$logger, (callback) => callback(this.$iOSDevice.connectToPort(InspectorBackendPort)));
		});
	}

	private printHowToTerminate() {
		this.$logger.info("\nSetting up debugger proxy...\n\nPress Ctrl + C to terminate, or disconnect.\n");
	}
}
$injector.register("iosDeviceDebugging", IOSDeviceDebugging);

class PacketStream extends stream.Transform {
    private buffer: Buffer;
    private offset: number;

    constructor(opts?: stream.TransformOptions) {
        super(opts);
    }

    public _transform(packet: any, encoding: string, done: Function): void {
        while (packet.length > 0) {
            if (!this.buffer) {
                // read length
                var length = packet.readInt32BE(0);
                this.buffer = new Buffer(length);
                this.offset = 0;
                packet = packet.slice(4);
            }

            packet.copy(this.buffer, this.offset);
            var copied = Math.min(this.buffer.length - this.offset, packet.length);
            this.offset += copied;
            packet = packet.slice(copied);

            if (this.offset === this.buffer.length) {
                this.push(this.buffer);
                this.buffer = undefined;
            }
        }
        done();
    }
}