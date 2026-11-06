import * as net from "net";
import { assert } from "chai";
import { LinuxDeviceDebugService } from "../../lib/services/linux-device-debug-service";
import * as stubs from "../stubs";

const appId = "org.nativescript.linuxapp";

function createService(port: number): LinuxDeviceDebugService {
	const device = <any>{
		deviceInfo: { identifier: "host" },
		applicationManager: { inspectorPort: port },
	};
	return new LinuxDeviceDebugService(
		device,
		<any>{},
		new stubs.ErrorsStub(),
		new stubs.LoggerStub(),
	);
}

function listen(): Promise<net.Server> {
	return new Promise((resolve) => {
		const server = net.createServer((socket) => socket.destroy());
		server.listen(0, "127.0.0.1", () => resolve(server));
	});
}

describe("linuxDeviceDebugService", () => {
	const debugData = {
		applicationIdentifier: appId,
		projectDir: "/tmp",
		deviceIdentifier: "host",
	};

	it("returns the DevTools URL once the inspector listens", async () => {
		const server = await listen();
		try {
			const port = (<net.AddressInfo>server.address()).port;
			const result = await createService(port).debug(debugData, {
				timeout: "2",
			});
			assert.equal(
				result.debugUrl,
				`devtools://devtools/bundled/inspector.html?ws=127.0.0.1:${port}`,
			);
		} finally {
			server.close();
		}
	});

	it("fails when nothing listens on the inspector port", async () => {
		const server = await listen();
		const port = (<net.AddressInfo>server.address()).port;
		await new Promise((resolve) => server.close(resolve));
		let error: Error;
		try {
			await createService(port).debug(debugData, { timeout: "1" });
		} catch (err) {
			error = err;
		}
		assert.include(error?.message, "is not running with the debugger enabled");
	});

	it("does not wait when stopping", async () => {
		const result = await createService(1).debug(debugData, { stop: true });
		assert.isNull(result.debugUrl);
	});
});
