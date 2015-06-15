import iOSProxyServices = require("./../common/mobile/ios/ios-proxy-services");
import iOSDevice = require("./../common/mobile/ios/ios-device");
import net = require("net");
import ws = require("ws");
import stream = require("stream");
import path = require("path");
import http = require("http");
import Future = require("fibers/future");

module notification {
    function formatNotification(bundleId: string, notification: string) {
        return `${bundleId}:NativeScript.Debug.${notification}`;
    }
    
    export function waitForDebug(bundleId: string): string {
        return formatNotification(bundleId, "WaitForDebugger");
    }

    export function attachRequest(bundleId: string): string {
        return formatNotification(bundleId, "AttachRequest");
    }

    export function appLaunching(bundleId: string): string {
        return formatNotification(bundleId, "AppLaunching");
    }

    export function readyForAttach(bundleId: string): string {
        return formatNotification(bundleId, "ReadyForAttach");
    }
    
    export function attachAvailabilityQuery(bundleId: string) {
        return formatNotification(bundleId, "AttachAvailabilityQuery");
    }
    
    export function alreadyConnected(bundleId: string) {
        return formatNotification(bundleId, "AlreadyConnected");
    }
    
    export function attachAvailable(bundleId: string) {
        return formatNotification(bundleId, "AttachAvailable");
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
        private $npmInstallationManager: INpmInstallationManager,
        private $options: IOptions) { }

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
            
            var iOSEmulator = <Mobile.IiOSSimulatorService>this.$iOSEmulatorServices;
            iOSEmulator.postDarwinNotification(attachRequestMessage).wait();
        }).future<void>()();
    }

    private deviceDebugBrk(): IFuture<void> {
        return (() => {
            this.$devicesServices.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
            this.$devicesServices.execute(device => (() => {
                // we intentionally do not wait on this here, because if we did, we'd miss the AppLaunching notification
                let deploy = this.$platformService.deployOnDevice(this.platform);
                
                let iosDevice = <iOSDevice.IOSDevice>device;
                let projectId = this.$projectData.projectId;
                let npc = new iOSProxyServices.NotificationProxyClient(iosDevice, this.$injector);
                
                try {
                    awaitNotification(npc, notification.appLaunching(projectId), 60000).wait();
                    process.nextTick(() => {
                        npc.postNotificationAndAttachForData(notification.waitForDebug(projectId));
                        npc.postNotificationAndAttachForData(notification.attachRequest(projectId));
                    });
                    awaitNotification(npc, notification.readyForAttach(projectId), 5000).wait();
                } catch(e) {
                    this.$errors.failWithoutHelp("Timeout waiting for NativeScript debugger.");
                }
                
                createWebSocketProxy(this.$logger, (callback) => connectEventually(() => iosDevice.connectToPort(InspectorBackendPort), callback));
                this.executeOpenDebuggerClient().wait();
                deploy.wait();
            }).future<void>()()).wait();
        }).future<void>()();
    }

    private deviceStart(): IFuture<void> {
        return (() => {
            this.$devicesServices.initialize({ platform: this.platform, deviceId: this.$options.device }).wait();
            this.$devicesServices.execute(device => (() => {
                let iosDevice = <iOSDevice.IOSDevice>device;
                let projectId = this.$projectData.projectId;
                let npc = new iOSProxyServices.NotificationProxyClient(iosDevice, this.$injector);
                
                let [alreadyConnected, readyForAttach, attachAvailable] = [
                    notification.alreadyConnected(projectId),
                    notification.readyForAttach(projectId),
                    notification.attachAvailable(projectId)
                ].map((notification) => awaitNotification(npc, notification, 2000));
                
                npc.postNotificationAndAttachForData(notification.attachAvailabilityQuery(projectId));
                
                let receivedNotification: IFuture<string>;
                try {
                    receivedNotification = whenAny(alreadyConnected, readyForAttach, attachAvailable).wait();
                } catch (e) {
                    this.$errors.failWithoutHelp(`The application ${projectId} does not appear to be running on ${device.deviceInfo.displayName} or is not built with debugging enabled.`);
                }
                
                switch (receivedNotification) {
                    case alreadyConnected:
                        this.$errors.failWithoutHelp("A debugger is already connected.");
                    case attachAvailable:
                        process.nextTick(() => npc.postNotificationAndAttachForData(notification.attachRequest(projectId)));
                        try { awaitNotification(npc, notification.readyForAttach(projectId), 2000).wait(); }
                        catch (e) {
                            this.$errors.failWithoutHelp(`The application ${projectId} timed out when performing the NativeScript debugger handshake.`);
                        }
                    case readyForAttach:
                        createWebSocketProxy(this.$logger, (callback) => connectEventually(() => iosDevice.connectToPort(InspectorBackendPort), callback));
                        this.executeOpenDebuggerClient().wait();
                }
            }).future<void>()()).wait();
        }).future<void>()();
    }

    public executeOpenDebuggerClient(): IFuture<void> {
        if (this.$options.client) {
            return this.openDebuggingClient();
        } else {
            return (() => {
                this.$logger.info("Supressing debugging client.");
            }).future<void>()();
        }
    }

    private openDebuggingClient(): IFuture<void> {
        return (() => {
            let inspectorPath = this.getInspectorPath().wait();
            let inspectorApplicationPath = path.join(inspectorPath, "NativeScript Inspector.app");
            let inspectorSourceLocation = path.join(inspectorPath, "Safari/Main.html");
            let cmd = `open -a '${inspectorApplicationPath}' --args '${inspectorSourceLocation}' '${this.$projectData.projectName}'`;
            this.$childProcess.exec(cmd).wait();
        }).future<void>()();
    }

    private getInspectorPath(): IFuture<string> {
        return (() => {
            var tnsIosPackage = "";
            if (this.$options.frameworkPath) {
                if (this.$fs.getFsStats(this.$options.frameworkPath).wait().isFile()) {
                    this.$errors.failWithoutHelp("frameworkPath option must be path to directory which contains tns-ios framework");
                }
                tnsIosPackage = path.resolve(this.$options.frameworkPath);
            } else {
                var platformData = this.$platformsData.getPlatformData(this.platform);
                tnsIosPackage = this.$npmInstallationManager.install(platformData.frameworkPackageName).wait();
            }
            var inspectorPath = path.join(tnsIosPackage, "WebInspectorUI/");
            return inspectorPath;
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
            $logger.info("Frontend client connected.");
            socketFactory((socket) => {
                $logger.info("Backend socket created.");
                info.req["__deviceSocket"] = socket;
                callback(true);
            });
        }
    });
    server.on("connection", (webSocket) => {
        var deviceSocket: net.Socket = (<any>webSocket.upgradeReq)["__deviceSocket"];
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

function awaitNotification(npc: iOSProxyServices.NotificationProxyClient, notification: string, timeout: number): IFuture<string> {
    let future = new Future<string>();
    
    let timeoutObject = setTimeout(() => {
        detachObserver();
        future.throw(new Error("Timeout receiving notification."));
    }, timeout);
    
    function notificationObserver(notification: string) {
        clearTimeout(timeoutObject);
        detachObserver();
        future.return(notification);
    }
    
    function detachObserver() {
        process.nextTick(() => npc.removeObserver(notification, notificationObserver));
    }
    
    npc.addObserver(notification, notificationObserver);
    
    return future;
}

function whenAny<T>(...futures: IFuture<T>[]): IFuture<IFuture<T>> {
    let resultFuture = new Future<IFuture<T>>();    
    let futuresLeft = futures.length;

    for (let future of futures) {
        var futureLocal = future;
        future.resolve((error, result?) => {
            futuresLeft--;
            
            if (!resultFuture.isResolved()) {
                if (typeof error === "undefined") {
                    resultFuture.return(futureLocal);
                } else if (futuresLeft == 0) {
                    resultFuture.throw(new Error("None of the futures succeeded."));
                }
            }
        });
    }
    
    return resultFuture;
}

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