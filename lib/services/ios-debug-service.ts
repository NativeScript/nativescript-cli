///<reference path="../.d.ts"/>
"use strict";

import * as iOSProxyServices from "../common/mobile/ios/ios-proxy-services";
import * as iOSDevice from "../common/mobile/ios/ios-device";
import * as net from "net";
import ws = require("ws");
import * as stream from "stream";
import * as path from "path";
import Future = require("fibers/future");
import semver = require("semver");
import temp = require("temp");

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

let InspectorBackendPort = 18181;

function connectEventually(factory: () => net.Socket, handler: (_socket: net.Socket) => void) {
    function tryConnect() {
        let tryConnectAfterTimeout = setTimeout.bind(undefined, tryConnect, 1000);

        let socket = factory();
        socket.on("connect", () => {
            socket.removeListener("error", tryConnectAfterTimeout);
            handler(socket);
        });
        socket.on("error", tryConnectAfterTimeout);
    }

    tryConnect();
}

class IOSDebugService implements IDebugService {
    private static TIMEOUT_SECONDS = 90;

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
        private $options: IOptions,
        private $projectDataService: IProjectDataService,
        private $utils: IUtils) { }

    get platform(): string {
        return "ios";
    }

    public debug(): IFuture<void> {
        if (this.$options.debugBrk && this.$options.start) {
            this.$errors.failWithoutHelp("Expected exactly one of the --debug-brk or --start options.");
        }

        if(!this.$options.debugBrk && !this.$options.start) {
            this.$logger.warn("Neither --debug-brk nor --start option was specified. Defaulting to --debug-brk.");
            this.$options.debugBrk = true;
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
            let platformData = this.$platformsData.getPlatformData(this.platform);
            this.$platformService.buildPlatform(this.platform).wait();
            let emulatorPackage = this.$platformService.getLatestApplicationPackageForEmulator(platformData).wait();

            this.$iOSEmulatorServices.startEmulator(emulatorPackage.packageName, { args: "--nativescript-debug-brk" }).wait();
            this.wireDebuggerClient(() => net.connect(InspectorBackendPort)).wait();
        }).future<void>()();
    }

    private emulatorStart(): IFuture<void> {
        return (() => {
            this.wireDebuggerClient(() => net.connect(InspectorBackendPort)).wait();

            let projectId = this.$projectData.projectId;
            let attachRequestMessage = notification.attachRequest(projectId);

            let iOSEmulator = <Mobile.IiOSSimulatorService>this.$iOSEmulatorServices;
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
                    let timeout = this.$utils.getMilliSecondsTimeout(IOSDebugService.TIMEOUT_SECONDS);
                    awaitNotification(npc, notification.appLaunching(projectId), timeout).wait();
                    process.nextTick(() => {
                        npc.postNotificationAndAttachForData(notification.waitForDebug(projectId));
                        npc.postNotificationAndAttachForData(notification.attachRequest(projectId));
                    });

                    awaitNotification(npc, notification.readyForAttach(projectId), this.getReadyForAttachTimeout(timeout)).wait();
                } catch(e) {
                    this.$logger.trace(`Timeout error: ${e}`);
                    this.$errors.failWithoutHelp("Timeout waiting for NativeScript debugger.");
                }

                this.wireDebuggerClient(() => iosDevice.connectToPort(InspectorBackendPort)).wait();
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

                let timeout = this.getReadyForAttachTimeout();
                let [alreadyConnected, readyForAttach, attachAvailable] = [
                    notification.alreadyConnected(projectId),
                    notification.readyForAttach(projectId),
                    notification.attachAvailable(projectId)
                ].map((notification) => awaitNotification(npc, notification, timeout));

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
                        break;
                    case attachAvailable:
                        process.nextTick(() => npc.postNotificationAndAttachForData(notification.attachRequest(projectId)));
                        try {
                            awaitNotification(npc, notification.readyForAttach(projectId), timeout).wait();
                        } catch (e) {
                            this.$errors.failWithoutHelp(`The application ${projectId} timed out when performing the NativeScript debugger handshake.`);
                        }
                        this.wireDebuggerClient(() => iosDevice.connectToPort(InspectorBackendPort)).wait();
                        break;
                    case readyForAttach:
                        this.wireDebuggerClient(() => iosDevice.connectToPort(InspectorBackendPort)).wait();
                        break;
                }
            }).future<void>()()).wait();
        }).future<void>()();
    }

    private wireDebuggerClient(factory: () => net.Socket): IFuture<void> {
        return (() => {
            let frameworkVersion = this.getProjectFrameworkVersion().wait();
            let socketFileLocation = "";
            if (semver.gte(frameworkVersion, "1.4.0")) {
                socketFileLocation = createTcpSocketProxy(this.$logger, (callback) => connectEventually(factory, callback));
            } else {
                createWebSocketProxy(this.$logger, (callback) => connectEventually(factory, callback));
            }

            this.executeOpenDebuggerClient(socketFileLocation).wait();
        }).future<void>()();
    }

    public executeOpenDebuggerClient(fileDescriptor: string): IFuture<void> {
        if (this.$options.client) {
            return this.openDebuggingClient(fileDescriptor);
        } else {
            return (() => {
                this.$logger.info("Supressing debugging client.");
            }).future<void>()();
        }
    }

    private openDebuggingClient(fileDescriptor: string): IFuture<void> {
        return (() => {
            let frameworkVersion = this.getProjectFrameworkVersion().wait();
            let inspectorPath = this.getInspectorPath(frameworkVersion).wait();
            let inspectorSourceLocation = path.join(inspectorPath, "Safari/Main.html");
            let cmd: string = null;

            if(semver.lt(frameworkVersion, "1.2.0")) {
                cmd = `open -a Safari "${inspectorSourceLocation}"`;
            } else {
                let inspectorApplicationPath = path.join(inspectorPath, "NativeScript Inspector.app");
                if(!this.$fs.exists(inspectorApplicationPath).wait()) {
                    this.$fs.unzip(path.join(inspectorPath, "NativeScript Inspector.zip"), inspectorPath).wait();
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
            let inspectorPath = path.join(tnsIosPackage, "WebInspectorUI/");
            return inspectorPath;
        }).future<string>()();
    }

    private getReadyForAttachTimeout(timeoutInMilliseconds?: number): number {
        let timeout = timeoutInMilliseconds || this.$utils.getMilliSecondsTimeout(IOSDebugService.TIMEOUT_SECONDS);
        let readyForAttachTimeout = timeout / 10 ;
        let defaultReadyForAttachTimeout = 5000;
        return readyForAttachTimeout > defaultReadyForAttachTimeout ? readyForAttachTimeout : defaultReadyForAttachTimeout;
    }
}
$injector.register("iOSDebugService", IOSDebugService);

function createTcpSocketProxy($logger: ILogger, socketFactory: (handler: (socket: net.Socket) => void) => void): string {
    $logger.info("\nSetting up debugger proxy...\nPress Ctrl + C to terminate, or disconnect.\n");

    let server = net.createServer({
        allowHalfOpen: true
    });

    server.on("connection", (frontendSocket: net.Socket) => {
        $logger.info("Frontend client connected.");

        frontendSocket.on("end", function() {
            $logger.info('Frontend socket closed!');
            process.exit(0);
        });

        socketFactory((backendSocket) => {
            $logger.info("Backend socket created.");

            backendSocket.on("end", () => {
                $logger.info("Backend socket closed!");
                process.exit(0);
            });

            backendSocket.pipe(frontendSocket);
            frontendSocket.pipe(backendSocket);
            frontendSocket.resume();
        });
    });

    let socketFileLocation = temp.path({ suffix: ".sock" });
    server.listen(socketFileLocation);

    return socketFileLocation;
}

function createWebSocketProxy($logger: ILogger, socketFactory: (handler: (socket: net.Socket) => void) => void): ws.Server {
    // NOTE: We will try to provide command line options to select ports, at least on the localhost.
    let localPort = 8080;

    $logger.info("\nSetting up debugger proxy...\nPress Ctrl + C to terminate, or disconnect.\n");

    // NB: When the inspector frontend connects we might not have connected to the inspector backend yet.
    // That's why we use the verifyClient callback of the websocket server to stall the upgrade request until we connect.
    // We store the socket that connects us to the device in the upgrade request object itself and later on retrieve it
    // in the connection callback.

    let server = ws.createServer(<any>{
        port: localPort,
        verifyClient: (info: any, callback: any) => {
            $logger.info("Frontend client connected.");
            socketFactory((_socket: any) => {
                $logger.info("Backend socket created.");
                info.req["__deviceSocket"] = _socket;
                callback(true);
            });
        }
    });
    server.on("connection", (webSocket) => {
        let deviceSocket: net.Socket = (<any>webSocket.upgradeReq)["__deviceSocket"];
        let packets = new PacketStream();
        deviceSocket.pipe(packets);

        packets.on("data", (buffer: Buffer) => {
            webSocket.send(buffer.toString("utf16le"));
        });

        webSocket.on("message", (message, flags) => {
            let length = Buffer.byteLength(message, "utf16le");
            let payload = new Buffer(length + 4);
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
        future.throw(new Error(`Timeout receiving ${notification} notification.`));
    }, timeout);

    function notificationObserver(_notification: string) {
        clearTimeout(timeoutObject);
        detachObserver();
        future.return(_notification);
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
    let futureLocal: IFuture<T>;

    for (let future of futures) {
        futureLocal = future;
        future.resolve((error, result?) => {
            futuresLeft--;

            if (!resultFuture.isResolved()) {
                if (typeof error === "undefined") {
                    resultFuture.return(futureLocal);
                } else if (futuresLeft === 0) {
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
                let length = packet.readInt32BE(0);
                this.buffer = new Buffer(length);
                this.offset = 0;
                packet = packet.slice(4);
            }

            packet.copy(this.buffer, this.offset);
            let copied = Math.min(this.buffer.length - this.offset, packet.length);
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
