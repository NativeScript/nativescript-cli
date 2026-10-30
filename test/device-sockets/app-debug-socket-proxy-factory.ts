import { assert } from "chai";
import * as net from "net";
import * as os from "os";
import * as sinon from "sinon";
import * as ws from "ws";
import { MessageUnpackStream } from "ios-device-lib";
import {
	AppDebugSocketProxyFactory,
	isAllowedDebuggerOrigin,
} from "../../lib/device-sockets/ios/app-debug-socket-proxy-factory";

const REPLACED_CLOSE_REASON = "Replaced by a newer debugger client";

const encode = (message: string): Buffer => {
	const length = Buffer.byteLength(message, "utf16le");
	const payload = Buffer.allocUnsafe(length + 4);
	payload.writeInt32BE(length, 0);
	payload.write(message, 4, length, "utf16le");
	return payload;
};

const hasIPv6Loopback = () =>
	Object.values(os.networkInterfaces())
		.flat()
		.some((address) => address.internal && address.family === "IPv6");

describe("AppDebugSocketProxyFactory", () => {
	let backend: net.Server;
	let backendPort: number;
	let backendConnections: number;
	let proxy: any;
	let proxies: ws.Server[];
	let device: any;

	// Echoes every framed message, as the runtime answers each CDP request.
	const startBackend = () =>
		new Promise<void>((resolve) => {
			backend = net.createServer((socket) => {
				backendConnections++;
				const packets = new MessageUnpackStream();
				socket.pipe(packets);
				packets.on("data", (buffer: Buffer) => {
					socket.write(encode(buffer.toString("utf16le")));
				});
				socket.on("error", () => {});
			});
			backend.listen(0, "127.0.0.1", () => {
				backendPort = (<net.AddressInfo>backend.address()).port;
				resolve();
			});
		});

	const createDevice = () => {
		const cachedSockets: { [appId: string]: net.Socket } = {};
		return {
			deviceInfo: { identifier: "device" },
			getDebugSocket: async (appId: string) => {
				if (!cachedSockets[appId]) {
					cachedSockets[appId] = net.connect(backendPort, "127.0.0.1");
				}
				return cachedSockets[appId];
			},
			destroyDebugSocket: async (appId: string) => {
				cachedSockets[appId]?.destroy();
				cachedSockets[appId] = null;
			},
		};
	};

	const createProxy = (
		getAvailablePortInRange?: () => Promise<number>,
		watch = true,
	) =>
		new AppDebugSocketProxyFactory(
			<any>{ info: () => {}, trace: () => {}, warn: () => {} },
			<any>{ fail: (message: string) => assert.fail(message) },
			<any>{ watch },
			<any>{},
			<any>{
				getAvailablePortInRange:
					getAvailablePortInRange ||
					(async () => {
						const server = net.createServer();
						await new Promise<void>((r) => server.listen(0, () => r()));
						const { port } = <net.AddressInfo>server.address();
						await new Promise((r) => server.close(r));
						return port;
					}),
			},
		);

	const startProxy = async (factory: any = proxy) => {
		const server: ws.Server = await factory.ensureWebSocketProxy(
			device,
			"app",
			"project",
			"/project",
		);
		proxies.push(server);
		return <number>(<any>server.address()).port;
	};

	const open = (port: number, options?: ws.ClientOptions, host = "127.0.0.1") =>
		new Promise<ws>((resolve, reject) => {
			const client = new ws(`ws://${host}:${port}`, options);
			client.once("open", () => resolve(client));
			client.once("error", reject);
		});

	const assertRejects = async (promise: Promise<ws>) => {
		const client = await promise.catch((): ws => null);
		assert.isNull(client);
	};

	const roundTrip = (client: ws, message: string) =>
		new Promise<string>((resolve, reject) => {
			client.once("message", (data) => resolve(data.toString()));
			client.once("close", () => reject(new Error("closed before the reply")));
			client.send(message);
		});

	const closeReason = (client: ws) =>
		new Promise<string>((resolve) => {
			client.once("close", (_code, reason) => resolve(reason.toString()));
		});

	beforeEach(async () => {
		backendConnections = 0;
		proxies = [];
		await startBackend();
		device = createDevice();
		proxy = createProxy();
	});

	afterEach(async () => {
		await device.destroyDebugSocket("app");
		proxies.forEach((server) => {
			server.clients.forEach((client) => client.terminate());
			server.close();
		});
		await new Promise((resolve) => backend.close(resolve));
	});

	it("moves to the next port when another server takes the checked one", async () => {
		const blocker = net.createServer();
		await new Promise<void>((resolve) =>
			blocker.listen(0, "127.0.0.1", () => resolve()),
		);
		const blockedPort = (<net.AddressInfo>blocker.address()).port;
		const ports = [blockedPort];
		const factory = createProxy(async () => {
			if (ports.length) {
				return ports.shift();
			}
			const server = net.createServer();
			await new Promise<void>((r) => server.listen(0, () => r()));
			const { port } = <net.AddressInfo>server.address();
			await new Promise((r) => server.close(r));
			return port;
		});

		const port = await startProxy(factory);
		await new Promise((resolve) => blocker.close(resolve));

		assert.notEqual(port, blockedPort);
		const client = await open(port);
		assert.equal(await roundTrip(client, "hello"), "hello");
	});

	it("listens on both loopback addresses and nothing else", async () => {
		const port = await startProxy();

		const hosts = ["127.0.0.1"];
		if (hasIPv6Loopback()) {
			hosts.push("[::1]");
		}
		for (const host of hosts) {
			const client = await open(port, undefined, host);
			assert.equal(await roundTrip(client, host), host);
		}

		const addresses = Object.values(os.networkInterfaces())
			.flat()
			.filter((address) => !address.internal && address.family === "IPv4");
		for (const { address } of addresses) {
			await assertRejects(open(port, undefined, address));
		}
	});

	it("turns away web pages but not DevTools or clients without an origin", async () => {
		const port = await startProxy();

		await assertRejects(open(port, { origin: "https://evil.example" }));
		assert.equal(backendConnections, 0);

		const devtools = await open(port, { origin: "devtools://devtools" });
		assert.equal(await roundTrip(devtools, "hello"), "hello");
		const noOrigin = await open(port);
		assert.equal(await roundTrip(noOrigin, "hello"), "hello");
	});

	it("serves a client after the previous one disconnected", async () => {
		const port = await startProxy();
		for (let i = 0; i < 3; i++) {
			const client = await open(port);
			assert.equal(await roundTrip(client, `message ${i}`), `message ${i}`);
			client.close();
		}

		const client = await open(port);
		assert.equal(await roundTrip(client, "last"), "last");
	});

	it("still serves clients after one drops during the handshake", async () => {
		const port = await startProxy();
		await new Promise<void>((resolve) => {
			const socket = net.connect(port, "127.0.0.1", () => {
				socket.write(
					"GET / HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
						"Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n",
				);
				setImmediate(() => {
					socket.destroy();
					resolve();
				});
			});
		});

		const client = await open(port);
		assert.equal(await roundTrip(client, "hello"), "hello");
	});

	it("gives the backend to the newest client and tells the previous one why", async () => {
		const port = await startProxy();
		const first = await open(port);
		const firstClosed = closeReason(first);

		const second = await open(port);

		assert.equal(await firstClosed, REPLACED_CLOSE_REASON);
		assert.equal(await roundTrip(second, "hello"), "hello");
		assert.equal(backendConnections, 2);
	});

	it("cleans up and exits without watch when the app goes away", async () => {
		const exit = sinon.stub(process, "exit");
		const destroyDebugSocket = sinon.spy(device, "destroyDebugSocket");
		try {
			const port = await startProxy(createProxy(undefined, false));
			const client = await open(port);
			const closed = closeReason(client);
			const appSocket = await device.getDebugSocket("app");

			appSocket.destroy();
			await closed;
			await new Promise((resolve) => setTimeout(resolve, 20));

			assert.isTrue(destroyDebugSocket.called);
			assert.isTrue(exit.calledWith(0));
		} finally {
			exit.restore();
			destroyDebugSocket.restore();
		}
	});

	it("keeps the new client's backend when the replaced client closes late", async () => {
		const port = await startProxy();
		const first = await open(port);
		const opening = open(port);
		first.terminate();

		const second = await opening;
		await new Promise((resolve) => setTimeout(resolve, 20));

		assert.equal(second.readyState, ws.OPEN);
		assert.equal(await roundTrip(second, "hello"), "hello");
	});

	it("leaves only the newest of simultaneous clients connected", async () => {
		const port = await startProxy();
		const clients = await Promise.all(
			[0, 1, 2, 3].map(() => open(port).catch((): ws => null)),
		);
		await new Promise((resolve) => setTimeout(resolve, 50));

		const connected = clients.filter(
			(client) => client && client.readyState === ws.OPEN,
		);
		assert.lengthOf(connected, 1);
		assert.equal(await roundTrip(connected[0], "hello"), "hello");
	});

	describe("isAllowedDebuggerOrigin", () => {
		const allowed = [
			undefined,
			"",
			"devtools://devtools",
			"chrome-devtools://devtools",
			"https://chrome-devtools-frontend.appspot.com",
			"http://localhost:5173",
			"http://127.0.0.1:8080",
			"http://[::1]:3000",
		];
		for (const origin of allowed) {
			it(`allows ${origin || "no origin"}`, () => {
				assert.isTrue(isAllowedDebuggerOrigin(origin));
			});
		}

		const rejected = [
			"https://evil.example",
			"http://localhost.evil.example",
			"http://127.0.0.1.evil.example",
			"https://chrome-devtools-frontend.appspot.com.evil.example",
			"null",
			"file://",
		];
		for (const origin of rejected) {
			it(`rejects ${origin}`, () => {
				assert.isFalse(isAllowedDebuggerOrigin(origin));
			});
		}
	});
});
