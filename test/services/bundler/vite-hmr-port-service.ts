import { assert } from "chai";
import * as net from "net";
import { Yok } from "../../../lib/common/yok";
import { IInjector } from "../../../lib/common/definitions/yok";
import { ErrorsStub, LoggerStub } from "../../stubs";
import { ViteHmrPortServiceImpl } from "../../../lib/services/bundler/vite-hmr-port-service";

const ENV_KEYS = ["NS_HMR_PORT", "NS_HMR_STRICT_PORT"] as const;

function listen(host: string, port = 0): Promise<net.Server> {
	return new Promise((resolve, reject) => {
		const server = net.createServer();
		server.once("error", reject);
		server.listen(port, host, () => resolve(server));
	});
}

function close(server: net.Server): Promise<void> {
	return new Promise((resolve) => server.close(() => resolve()));
}

function portOf(server: net.Server): number {
	return (<net.AddressInfo>server.address()).port;
}

function createService(): ViteHmrPortServiceImpl {
	const injector: IInjector = new Yok();
	injector.register("errors", ErrorsStub);
	injector.register("logger", LoggerStub);
	injector.register("viteHmrPortService", ViteHmrPortServiceImpl);
	return injector.resolve("viteHmrPortService");
}

describe("ViteHmrPortService", () => {
	const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};
	const holders: net.Server[] = [];

	beforeEach(() => {
		for (const key of ENV_KEYS) {
			savedEnv[key] = process.env[key];
			delete process.env[key];
		}
	});

	afterEach(async () => {
		for (const key of ENV_KEYS) {
			if (savedEnv[key] === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = savedEnv[key];
			}
		}
		await Promise.all(holders.splice(0).map(close));
	});

	it("uses the preferred port when it is free", async () => {
		// Grab an ephemeral port and release it so it is (almost certainly)
		// free for the service to pick.
		const probe = await listen("0.0.0.0");
		const free = portOf(probe);
		await close(probe);
		process.env.NS_HMR_PORT = String(free);

		assert.strictEqual(await createService().getPort("ios"), free);
	});

	it("moves past a port held on the wildcard address", async () => {
		const holder = await listen("0.0.0.0");
		holders.push(holder);
		process.env.NS_HMR_PORT = String(portOf(holder));

		const port = await createService().getPort("ios");
		assert.isAbove(port, portOf(holder));
		const server = await listen("0.0.0.0", port);
		holders.push(server);
	});

	it("moves past a port that only answers on loopback", async () => {
		const holder = await listen("127.0.0.1");
		holders.push(holder);
		process.env.NS_HMR_PORT = String(portOf(holder));

		const port = await createService().getPort("android");
		assert.isAbove(port, portOf(holder));
	});

	it("resolves the same port for a platform on every call", async () => {
		const service = createService();
		const first = await service.getPort("ios");
		assert.strictEqual(await service.getPort("ios"), first);
		assert.strictEqual(await service.getPort("iOS"), first);
	});

	it("gives concurrently requested platforms distinct ports", async () => {
		const service = createService();
		const [ios, android] = await Promise.all([
			service.getPort("ios"),
			service.getPort("android"),
		]);
		assert.notStrictEqual(ios, android);
	});

	it("fails instead of moving when NS_HMR_STRICT_PORT is set", async () => {
		const holder = await listen("0.0.0.0");
		holders.push(holder);
		process.env.NS_HMR_PORT = String(portOf(holder));
		process.env.NS_HMR_STRICT_PORT = "1";

		await assert.isRejected(
			createService().getPort("ios"),
			/NS_HMR_STRICT_PORT/,
		);
	});
});
