import { EventEmitter } from "events";
import { CONNECTION_ERROR_EVENT_NAME } from "../../constants";
import * as net from "net";
import * as ws from "ws";
import { MessageUnpackStream } from "ios-device-lib";
import { IAppDebugSocketProxyFactory, IOptions } from "../../declarations";
import { IDictionary, IErrors, INet } from "../../common/declarations";
import { injector } from "../../common/yok";
import { ITempService } from "../../definitions/temp-service";

const REPLACED_CLOSE_REASON = "Replaced by a newer debugger client";

interface IDebugProxySession {
	appDebugSocket: net.Socket;
	webSocket?: ws;
}

export class AppDebugSocketProxyFactory
	extends EventEmitter
	implements IAppDebugSocketProxyFactory
{
	private deviceWebServers: IDictionary<ws.Server> = {};
	private deviceTcpServers: IDictionary<net.Server> = {};

	constructor(
		private $logger: ILogger,
		private $errors: IErrors,
		private $options: IOptions,
		private $tempService: ITempService,
		private $net: INet,
	) {
		super();
	}

	public getTCPSocketProxy(
		deviceIdentifier: string,
		appId: string,
	): net.Server {
		return this.deviceTcpServers[`${deviceIdentifier}-${appId}`];
	}

	public async addTCPSocketProxy(
		device: Mobile.IiOSDevice,
		appId: string,
		projectName: string,
		projectDir: string,
	): Promise<net.Server> {
		const cacheKey = `${device.deviceInfo.identifier}-${appId}`;
		const existingServer = this.deviceTcpServers[cacheKey];
		if (existingServer) {
			this.$errors.fail(
				`TCP socket proxy is already running for device '${device.deviceInfo.identifier}' and app '${appId}'`,
			);
		}

		this.$logger.info(
			"\nSetting up proxy...\nPress Ctrl + C to terminate, or disconnect.\n",
		);

		const server = net.createServer({
			allowHalfOpen: true,
		});

		this.deviceTcpServers[cacheKey] = server;

		server.on("connection", async (frontendSocket: net.Socket) => {
			this.$logger.info("Frontend client connected.");
			frontendSocket.on("end", () => {
				this.$logger.info("Frontend socket closed!");
				if (!this.$options.watch) {
					process.exit(0);
				}
			});

			const appDebugSocket = await device.getDebugSocket(
				appId,
				projectName,
				projectDir,
			);
			this.$logger.info("Backend socket created.");

			appDebugSocket.on("end", () => {
				this.$logger.info("Backend socket closed!");
				if (!this.$options.watch) {
					process.exit(0);
				}
			});

			frontendSocket.on("close", async () => {
				this.$logger.info("Frontend socket closed");
				await device.destroyDebugSocket(appId);
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

		const socketFileLocation = await this.$tempService.path({
			suffix: ".sock",
		});
		server.listen(socketFileLocation);
		if (!this.$options.client) {
			this.$logger.info("socket-file-location: " + socketFileLocation);
		}

		return server;
	}

	public async ensureWebSocketProxy(
		device: Mobile.IiOSDevice,
		appId: string,
		projectName: string,
		projectDir: string,
	): Promise<ws.Server> {
		const existingWebProxy =
			this.deviceWebServers[`${device.deviceInfo.identifier}-${appId}`];
		const result =
			existingWebProxy ||
			(await this.addWebSocketProxy(device, appId, projectName, projectDir));

		// TODO: do not remove till VSCode waits for this message in order to reattach
		this.$logger.info("Opened localhost " + result.options.port);

		return result;
	}

	private async addWebSocketProxy(
		device: Mobile.IiOSDevice,
		appId: string,
		projectName: string,
		projectDir: string,
	): Promise<ws.Server> {
		const cacheKey = `${device.deviceInfo.identifier}-${appId}`;
		const existingServer = this.deviceWebServers[cacheKey];
		if (existingServer) {
			this.$errors.fail(
				`Web socket proxy is already running for device '${device.deviceInfo.identifier}' and app '${appId}'`,
			);
		}

		this.$logger.info(
			"\nSetting up debugger proxy...\nPress Ctrl + C to terminate, or disconnect.\n",
		);

		// NB: When the inspector frontend connects we might not have connected to the inspector backend yet.
		// That's why we use the verifyClient callback of the websocket server to stall the upgrade request until we connect.
		// We store the session in the upgrade request object itself and later on retrieve it in the connection callback.

		// The runtime serves a single frontend, so the newest client takes over.
		// Handlers of a replaced session must leave the device socket alone, as
		// by then it belongs to the session that replaced it.
		let currentSession: IDebugProxySession = null;
		let pendingConnect: Promise<void> = Promise.resolve();

		const connectToApp = async (): Promise<IDebugProxySession> => {
			const previousSession = currentSession;
			currentSession = null;
			if (previousSession) {
				previousSession.webSocket?.close(1000, REPLACED_CLOSE_REASON);
				await device.destroyDebugSocket(appId);
			}

			const appDebugSocket = await device.getDebugSocket(
				appId,
				projectName,
				projectDir,
			);
			appDebugSocket.on("error", (err: Error) => {
				this.$logger.trace("Error on debugger deviceSocket", err);
			});
			this.$logger.info("Backend socket created.");

			currentSession = { appDebugSocket };
			return currentSession;
		};

		const server = await this.listenOnAvailablePort(41000, {
			verifyClient: (
				info: any,
				callback: (res: boolean, code?: number, message?: string) => void,
			) => {
				this.$logger.info("Frontend client connected.");

				// Not released on "connection": that never fires for a client that
				// drops during the handshake.
				pendingConnect = pendingConnect.then(async () => {
					try {
						info.req["__session"] = await connectToApp();
						callback(true);
					} catch (err) {
						err.deviceIdentifier = device.deviceInfo.identifier;
						this.$logger.trace(err);
						this.emit(CONNECTION_ERROR_EVENT_NAME, err);
						this.$logger.warn(
							`Cannot connect to device socket. The error message is '${err.message}'.`,
						);
						callback(false);
					}
				});
			},
		});
		this.deviceWebServers[cacheKey] = server;
		server.on("connection", (webSocket, req) => {
			const encoding = "utf16le";

			webSocket.on("error", (err) => {
				this.$logger.trace("Error on debugger websocket", err);
			});

			const session: IDebugProxySession = (<any>req)["__session"];
			if (session !== currentSession || session.appDebugSocket.destroyed) {
				webSocket.close(1000, REPLACED_CLOSE_REASON);
				return;
			}

			session.webSocket = webSocket;
			const appDebugSocket = session.appDebugSocket;
			const packets = new MessageUnpackStream();
			appDebugSocket.pipe(packets);

			packets.on("data", (buffer: Buffer) => {
				const message = buffer.toString(encoding);
				if (webSocket.readyState === webSocket.OPEN) {
					if (process.env.DEBUG_DEVTOOLS_SOCKETS) {
						console.log({
							msgFromRuntime: JSON.parse(message),
						});
					}
					webSocket.send(message);
				} else {
					this.$logger.trace(
						`Received message ${message}, but unable to send it to webSocket as its state is: ${webSocket.readyState}`,
					);
				}
			});

			webSocket.on("message", (message) => {
				const msg = message.toString();
				if (process.env.DEBUG_DEVTOOLS_SOCKETS) {
					console.log({
						msgFromDevtools: JSON.parse(msg),
					});
				}
				const length = Buffer.byteLength(msg, encoding);
				const payload = Buffer.allocUnsafe(length + 4);
				payload.writeInt32BE(length, 0);
				payload.write(msg, 4, length, encoding);
				appDebugSocket.write(payload);
			});

			appDebugSocket.on("close", () => {
				this.$logger.trace("Backend socket closed!");
				if (currentSession === session) {
					currentSession = null;
				}
				webSocket.close();
			});

			webSocket.on("close", async () => {
				this.$logger.trace("Frontend socket closed!");
				appDebugSocket.unpipe(packets);
				packets.destroy();
				if (currentSession !== session) {
					return;
				}

				currentSession = null;
				await device.destroyDebugSocket(appId);
				if (!this.$options.watch) {
					process.exit(0);
				}
			});
		});

		return server;
	}

	private async listenOnAvailablePort(
		startPort: number,
		options: ws.ServerOptions,
	): Promise<ws.Server> {
		// The port can still get taken after the check, by another CLI for example.
		let port = await this.$net.getAvailablePortInRange(startPort);
		while (true) {
			const result = await new Promise<ws.Server | NodeJS.ErrnoException>(
				(resolve) => {
					const server = new ws.Server({ ...options, port });
					server.once("listening", () => {
						server.removeAllListeners("error");
						server.on("error", (err: Error) => {
							this.$logger.trace("Error on debugger web socket server", err);
						});
						resolve(server);
					});
					server.once("error", resolve);
				},
			);

			if (result instanceof ws.Server) {
				return result;
			}

			if (result.code !== "EADDRINUSE") {
				throw result;
			}

			port = await this.$net.getAvailablePortInRange(port + 1);
		}
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
injector.register("appDebugSocketProxyFactory", AppDebugSocketProxyFactory);
