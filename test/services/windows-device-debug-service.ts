import * as fs from "fs";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import { assert } from "chai";
import { WindowsDeviceDebugService } from "../../lib/services/windows-device-debug-service";
import { WINDOWS_DEBUGGER_STARTED_MARKER } from "../../lib/common/mobile/windows/windows-application-manager";
import * as stubs from "../stubs";

const appId = "org.nativescript.windowsapp";

function createService(markerPath: string): WindowsDeviceDebugService {
	const device = <any>{
		deviceInfo: { identifier: "host" },
		applicationManager: {
			getLocalStateFilePath: async (id: string, fileName: string) => {
				assert.equal(id, appId);
				assert.equal(fileName, WINDOWS_DEBUGGER_STARTED_MARKER);
				return markerPath;
			},
		},
	};
	return new WindowsDeviceDebugService(
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

describe("windowsDeviceDebugService", () => {
	let tempDir: string;
	let markerPath: string;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-windows-debug-"));
		markerPath = path.join(tempDir, WINDOWS_DEBUGGER_STARTED_MARKER);
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it("returns the DevTools URL for the port written by the app host", async () => {
		const server = await listen();
		try {
			const port = (<net.AddressInfo>server.address()).port;
			fs.writeFileSync(markerPath, `${port}`);

			const result = await createService(markerPath).debug(
				{ applicationIdentifier: appId, projectDir: tempDir, deviceIdentifier: "host" },
				{ timeout: "2" },
			);

			assert.equal(
				result.debugUrl,
				`devtools://devtools/bundled/inspector.html?ws=127.0.0.1:${port}`,
			);
		} finally {
			server.close();
		}
	});

	it("fails when the marker's port isn't listening", async () => {
		const server = await listen();
		const port = (<net.AddressInfo>server.address()).port;
		await new Promise((resolve) => server.close(resolve));
		fs.writeFileSync(markerPath, `${port}`);

		let error: Error;
		try {
			await createService(markerPath).debug(
				{ applicationIdentifier: appId, projectDir: tempDir, deviceIdentifier: "host" },
				{ timeout: "1" },
			);
		} catch (err) {
			error = err;
		}

		assert.include(error?.message, "is not running with the debugger enabled");
	});

	it("does not wait for the debugger when stopping", async () => {
		const result = await createService(markerPath).debug(
			{ applicationIdentifier: appId, projectDir: tempDir, deviceIdentifier: "host" },
			{ stop: true },
		);

		assert.isNull(result.debugUrl);
	});
});
