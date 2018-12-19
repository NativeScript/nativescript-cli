import { EventEmitter } from "events";
import { CONNECTION_ERROR_EVENT_NAME } from "../../constants";
import { PacketStream } from "./packet-stream";
import * as net from "net";
import * as ws from "ws";
import temp = require("temp");

export class AppDebugSocketProxyFactory extends EventEmitter implements IAppDebugSocketProxyFactory {
	private deviceWebServers: IDictionary<ws.Server> = {};
	private deviceTcpServers: IDictionary<net.Server> = {};

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $options: IOptions,
		private $net: INet) {
		super();
	}

	public getTCPSocketProxy(deviceIdentifier: string, appId: string): net.Server {
		return this.deviceTcpServers[`${deviceIdentifier}-${appId}`];
	}

	public async addTCPSocketProxy(device: Mobile.IiOSDevice, appId: string): Promise<net.Server> {
		const cacheKey = `${device.deviceInfo.identifier}-${appId}`;
		const existingServer = this.deviceTcpServers[cacheKey];
		if (existingServer) {
			this.$errors.failWithoutHelp(`TCP socket proxy is already running for device '${device.deviceInfo.identifier}' and app '${appId}'`);
		}

		this.$logger.info("\nSetting up proxy...\nPress Ctrl + C to terminate, or disconnect.\n");

		const server = net.createServer({
			allowHalfOpen: true
		});

		this.deviceTcpServers[cacheKey] = server;

		server.on("connection", async (frontendSocket: net.Socket) => {
			this.$logger.info("Frontend client connected.");
			frontendSocket.on("end", () => {
				this.$logger.info('Frontend socket closed!');
				if (!this.$options.watch) {
					process.exit(0);
				}
			});

			const appDebugSocket = await device.getDebugSocket(appId);
			this.$logger.info("Backend socket created.");

			appDebugSocket.on("end", () => {
				this.$logger.info("Backend socket closed!");
				if (!this.$options.watch) {
					process.exit(0);
				}
			});

			frontendSocket.on("close", () => {
				this.$logger.info("Frontend socket closed");
				device.destroyDebugSocket(appId);
			});

			appDebugSocket.on("close", () => {
				this.$logger.info("Backend socket closed");
				frontendSocket.destroy();
				server.close();
				delete this.deviceTcpServers[cacheKey];
			});

			appDebugSocket.pipe(frontendSocket);
			frontendSocket.pipe(appDebugSocket);
			frontendSocket.resume();
		});

		const socketFileLocation = temp.path({ suffix: ".sock" });
		server.listen(socketFileLocation);
		if (!this.$options.client) {
			this.$logger.info("socket-file-location: " + socketFileLocation);
		}

		return server;
	}

	public async ensureWebSocketProxy(device: Mobile.IiOSDevice, appId: string): Promise<ws.Server> {
		const existingWebProxy = this.deviceWebServers[`${device.deviceInfo.identifier}-${appId}`];
		const result = existingWebProxy || await this.addWebSocketProxy(device, appId);

		// TODO: do not remove till VSCode waits for this message in order to reattach
		this.$logger.info("Opened localhost " + result.options.port);

		return result;
	}

	private async addWebSocketProxy(device: Mobile.IiOSDevice, appId: string): Promise<ws.Server> {
		const cacheKey = `${device.deviceInfo.identifier}-${appId}`;
		const existingServer = this.deviceWebServers[cacheKey];
		if (existingServer) {
			this.$errors.failWithoutHelp(`Web socket proxy is already running for device '${device.deviceInfo.identifier}' and app '${appId}'`);
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
				let appDebugSocket;
				try {
					appDebugSocket = await device.getDebugSocket(appId);
				} catch (err) {
					err.deviceIdentifier = device.deviceInfo.identifier;
					this.$logger.trace(err);
					this.emit(CONNECTION_ERROR_EVENT_NAME, err);
					this.$errors.failWithoutHelp(`Cannot connect to device socket.The error message is ${err.message} `);
				}

				this.$logger.info("Backend socket created.");
				info.req["__deviceSocket"] = appDebugSocket;
				callback(true);
			}
		});
		this.deviceWebServers[cacheKey] = server;
		server.on("connection", (webSocket, req) => {
			const encoding = "utf16le";

			const appDebugSocket: net.Socket = (<any>req)["__deviceSocket"];
			const packets = new PacketStream();
			appDebugSocket.pipe(packets);

			packets.on("data", (buffer: Buffer) => {
				webSocket.send(buffer.toString(encoding));
			});

			webSocket.on("error", err => {
				this.$logger.trace("Error on debugger websocket", err);
			});

			appDebugSocket.on("error", err => {
				this.$logger.trace("Error on debugger deviceSocket", err);
			});

			webSocket.on("message", (message: string) => {
				const length = Buffer.byteLength(message, encoding);
				const payload = Buffer.allocUnsafe(length + 4);
				payload.writeInt32BE(length, 0);
				payload.write(message, 4, length, encoding);
				appDebugSocket.write(payload);
			});

			appDebugSocket.on("close", () => {
				this.$logger.info("Backend socket closed!");
				webSocket.close();
			});

			webSocket.on("close", () => {
				this.$logger.info('Frontend socket closed!');
				appDebugSocket.unpipe(packets);
				packets.destroy();
				device.destroyDebugSocket(appId);
				if (!this.$options.watch) {
					process.exit(0);
				}
			});

		});

		return server;
	}

	public removeAllProxies() {
		let deviceId;
		for (deviceId in this.deviceWebServers) {
			this.deviceWebServers[deviceId].close();
		}

		for (deviceId in this.deviceTcpServers) {
			this.deviceTcpServers[deviceId].close();
		}

		this.deviceWebServers = {};
		this.deviceTcpServers = {};
	}
}
$injector.register("appDebugSocketProxyFactory", AppDebugSocketProxyFactory);
