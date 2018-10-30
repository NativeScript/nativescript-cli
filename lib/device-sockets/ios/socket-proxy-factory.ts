import { EventEmitter } from "events";
import { CONNECTION_ERROR_EVENT_NAME } from "../../constants";
import { PacketStream } from "./packet-stream";
import * as net from "net";
import * as ws from "ws";
import * as helpers from "../../common/helpers";
import temp = require("temp");

export class SocketProxyFactory extends EventEmitter implements ISocketProxyFactory {
	private deviceWebServers: { [id: string]: ws.Server; } = {};
	private deviceTcpServers: { [id: string]: net.Server; } = {};

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $iOSDeviceSocketService: Mobile.IiOSDeviceSocketsService,
		private $options: IOptions,
		private $net: INet) {
		super();
	}

	public getTCPSocketProxy(deviceIdentifier: string): net.Server {
		return this.deviceTcpServers[deviceIdentifier];
	}

	public getWebSocketProxy(deviceIdentifier: string): ws.Server {
		return this.deviceWebServers[deviceIdentifier];
	}

	public async addTCPSocketProxy(factory: () => Promise<net.Socket>, deviceIdentifier: string): Promise<net.Server> {
		const existingServer = this.deviceTcpServers[deviceIdentifier];
		if (existingServer) {
			throw new Error(`TCP socket proxy is already running for device '${deviceIdentifier}'`);
		}

		// await here?
		const socketFactory = async (callback: (_socket: net.Socket) => void) => helpers.connectEventually(factory, callback);

		this.$logger.info("\nSetting up proxy...\nPress Ctrl + C to terminate, or disconnect.\n");

		const server = net.createServer({
			allowHalfOpen: true
		});

		this.deviceTcpServers[deviceIdentifier] = server;

		server.on("connection", async (frontendSocket: net.Socket) => {
			this.$logger.info("Frontend client connected.");

			frontendSocket.on("end", () => {
				this.$logger.info('Frontend socket closed!');
				if (!this.$options.watch) {
					process.exit(0);
				}
			});

			await socketFactory((backendSocket: net.Socket) => {
				this.$logger.info("Backend socket created.");

				backendSocket.on("end", () => {
					this.$logger.info("Backend socket closed!");
					if (!this.$options.watch) {
						process.exit(0);
					}
				});

				frontendSocket.on("close", () => {
					this.$logger.info("Frontend socket closed");
					if (!(<any>backendSocket).destroyed) {
						backendSocket.destroy();
					}
				});

				backendSocket.on("close", () => {
					this.$logger.info("Backend socket closed");
					if (!(<any>frontendSocket).destroyed) {
						frontendSocket.destroy();
					}
				});

				backendSocket.pipe(frontendSocket);
				frontendSocket.pipe(backendSocket);
				frontendSocket.resume();
			});
		});

		const socketFileLocation = temp.path({ suffix: ".sock" });
		server.listen(socketFileLocation);
		if (!this.$options.client) {
			this.$logger.info("socket-file-location: " + socketFileLocation);
		}

		return server;
	}

	public async addWebSocketProxy(factory: () => Promise<net.Socket>, deviceIdentifier: string): Promise<ws.Server> {
		const existingServer = this.deviceWebServers[deviceIdentifier];
		if (existingServer) {
			throw new Error(`Web socket proxy is already running for device '${deviceIdentifier}'`);
		}

		// NOTE: We will try to provide command line options to select ports, at least on the localhost.
		const localPort = await this.$net.getAvailablePortInRange(41000);

		this.$logger.info("\nSetting up debugger proxy...\nPress Ctrl + C to terminate, or disconnect.\n");

		// NB: When the inspector frontend connects we might not have connected to the inspector backend yet.
		// That's why we use the verifyClient callback of the websocket server to stall the upgrade request until we connect.
		// We store the socket that connects us to the device in the upgrade request object itself and later on retrieve it
		// in the connection callback.

		const server = new ws.Server(<any>{
			port: localPort,
			host: "localhost",
			verifyClient: async (info: any, callback: Function) => {
				this.$logger.info("Frontend client connected.");
				let _socket;
				try {
					const existingServerSocket = this.$iOSDeviceSocketService.getSocket(deviceIdentifier);
					_socket = existingServerSocket || await helpers.connectEventuallyUntilTimeout(factory, 10000);
				} catch (err) {
					err.deviceIdentifier = deviceIdentifier;
					this.$logger.trace(err);
					this.emit(CONNECTION_ERROR_EVENT_NAME, err);
					this.$errors.failWithoutHelp(`Cannot connect to device socket. The error message is ${err.message}`);
				}

				this.$logger.info("Backend socket created.");
				info.req["__deviceSocket"] = _socket;
				callback(true);
			}
		});
		this.deviceWebServers[deviceIdentifier] = server;
		server.on("connection", (webSocket, req) => {
			const encoding = "utf16le";

			const deviceSocket: net.Socket = (<any>req)["__deviceSocket"];
			const packets = new PacketStream();
			deviceSocket.pipe(packets);

			packets.on("data", (buffer: Buffer) => {
				webSocket.send(buffer.toString(encoding));
			});

			webSocket.on("error", err => {
				this.$logger.trace("Error on debugger websocket", err);
			});

			deviceSocket.on("error", err => {
				this.$logger.trace("Error on debugger deviceSocket", err);
			});

			webSocket.on("message", (message: string) => {
				const length = Buffer.byteLength(message, encoding);
				const payload = Buffer.allocUnsafe(length + 4);
				payload.writeInt32BE(length, 0);
				payload.write(message, 4, length, encoding);
				deviceSocket.write(payload);
			});

			deviceSocket.on("close", () => {
				this.$logger.info("Backend socket closed!");
				webSocket.close();
			});

			webSocket.on("close", () => {
				this.$logger.info('Frontend socket closed!');
				packets.destroy();
				deviceSocket.destroy();
				// delete this.deviceWebServers[deviceIdentifier];
				// server.close();
				if (!this.$options.watch) {
					process.exit(0);
				}
			});

		});

		this.$logger.info("Opened localhost " + localPort);
		console.log("return new proxy");
		return server;
	}

	public removeAllProxies() {
		this.deviceWebServers = {};
		this.deviceTcpServers = {};
	}
}
$injector.register("socketProxyFactory", SocketProxyFactory);
