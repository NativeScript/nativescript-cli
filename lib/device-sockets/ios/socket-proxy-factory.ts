import { EventEmitter } from "events";
import { CONNECTION_ERROR_EVENT_NAME } from "../../constants";
import { PacketStream } from "./packet-stream";
import * as net from "net";
import * as ws from "ws";
import * as helpers from "../../common/helpers";
import temp = require("temp");

export class SocketProxyFactory extends EventEmitter implements ISocketProxyFactory {
	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $options: IOptions,
		private $net: INet) {
		super();
	}

	public async createTCPSocketProxy(factory: () => Promise<net.Socket>): Promise<net.Server> {
		const socketFactory = async (callback: (_socket: net.Socket) => void) => helpers.connectEventually(factory, callback);

		this.$logger.info("\nSetting up proxy...\nPress Ctrl + C to terminate, or disconnect.\n");

		const server = net.createServer({
			allowHalfOpen: true
		});

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

	public async createWebSocketProxy(factory: () => Promise<net.Socket>): Promise<ws.Server> {
		// NOTE: We will try to provide command line options to select ports, at least on the localhost.
		const localPort = await this.$net.getAvailablePortInRange(41000);

		this.$logger.info("\nSetting up debugger proxy...\nPress Ctrl + C to terminate, or disconnect.\n");

		// NB: When the inspector frontend connects we might not have connected to the inspector backend yet.
		// That's why we use the verifyClient callback of the websocket server to stall the upgrade request until we connect.
		// We store the socket that connects us to the device in the upgrade request object itself and later on retrieve it
		// in the connection callback.

		const server = new ws.Server(<any>{
			port: localPort,
			verifyClient: async (info: any, callback: Function) => {
				this.$logger.info("Frontend client connected.");
				let _socket;
				try {
					_socket = await factory();
				} catch (err) {
					this.$logger.trace(err);
					this.emit(CONNECTION_ERROR_EVENT_NAME, err);
					this.$errors.failWithoutHelp("Cannot connect to device socket.");
				}

				this.$logger.info("Backend socket created.");
				info.req["__deviceSocket"] = _socket;
				callback(true);
			}
		});
		server.on("connection", (webSocket) => {
			const encoding = "utf16le";

			const deviceSocket: net.Socket = (<any>webSocket.upgradeReq)["__deviceSocket"];
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

			webSocket.on("message", (message, flags) => {
				const length = Buffer.byteLength(message, encoding);
				const payload = new Buffer(length + 4);
				payload.writeInt32BE(length, 0);
				payload.write(message, 4, length, encoding);
				deviceSocket.write(payload);
			});

			deviceSocket.on("close", () => {
				this.$logger.info("Backend socket closed!");
				if (!this.$options.watch) {
					process.exit(0);
				}
			});

			webSocket.on("close", () => {
				this.$logger.info('Frontend socket closed!');
				if (!this.$options.watch) {
					process.exit(0);
				}
			});

		});

		this.$logger.info("Opened localhost " + localPort);
		return server;
	}
}
$injector.register("socketProxyFactory", SocketProxyFactory);
