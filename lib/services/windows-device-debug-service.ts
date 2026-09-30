import * as fs from "fs";
import * as net from "net";
import { sleep } from "../common/helpers";
import { performanceLog } from "../common/decorators";
import { DebugServiceBase } from "./debug-service-base";
import { APPLICATION_RESPONSE_TIMEOUT_SECONDS } from "../constants";
import {
	IDeviceDebugService,
	IDebugData,
	IDebugOptions,
	IDebugResultInfo,
} from "../definitions/debug";
import { IErrors } from "../common/declarations";
import { injector } from "../common/yok";
import {
	WindowsApplicationManager,
	WINDOWS_DEBUGGER_STARTED_MARKER,
} from "../common/mobile/windows/windows-application-manager";

export class WindowsDeviceDebugService
	extends DebugServiceBase
	implements IDeviceDebugService
{
	public get platform() {
		return "windows";
	}

	constructor(
		protected device: Mobile.IDevice,
		protected $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $logger: ILogger,
	) {
		super(device, $devicesService);
	}

	@performanceLog()
	public async debug(
		debugData: IDebugData,
		debugOptions: IDebugOptions,
	): Promise<IDebugResultInfo> {
		const result: IDebugResultInfo = { debugUrl: null };
		if (debugOptions.stop) {
			return result;
		}

		const port = await this.waitForDebugServer(
			debugData.applicationIdentifier,
			debugOptions,
		);
		if (!port) {
			this.$errors.fail(
				`The application ${debugData.applicationIdentifier} is not running with the debugger enabled. Start it with \`ns debug windows\`.`,
			);
		}

		this.$logger.info("# NativeScript Debugger started #");
		result.debugUrl = this.getChromeDebugUrl(debugOptions, port);
		return result;
	}

	public async debugStop(): Promise<void> {
		// The inspector lives in the app process.
	}

	// Probe the port so a stale marker isn't taken as live.
	private async waitForDebugServer(
		appId: string,
		debugOptions: IDebugOptions,
	): Promise<number | null> {
		const manager = this.device
			.applicationManager as WindowsApplicationManager;
		const markerPath = await manager.getLocalStateFilePath(
			appId,
			WINDOWS_DEBUGGER_STARTED_MARKER,
		);
		if (!markerPath) {
			return null;
		}

		const timeoutSeconds =
			parseInt(debugOptions.timeout, 10) || APPLICATION_RESPONSE_TIMEOUT_SECONDS;
		const deadline = Date.now() + timeoutSeconds * 1000;
		this.$logger.trace(`Waiting for the Windows debugger marker: ${markerPath}`);

		while (true) {
			const port = this.readPort(markerPath);
			if (port && (await this.isListening(port))) {
				return port;
			}
			if (Date.now() >= deadline) {
				return null;
			}
			await sleep(500);
		}
	}

	private readPort(markerPath: string): number | null {
		try {
			const port = parseInt(fs.readFileSync(markerPath, "utf8").trim(), 10);
			return port > 0 ? port : null;
		} catch {
			return null;
		}
	}

	private isListening(port: number): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const socket = net.connect({ host: "127.0.0.1", port });
			const done = (listening: boolean) => {
				socket.destroy();
				resolve(listening);
			};
			socket.setTimeout(1000, () => done(false));
			socket.once("connect", () => done(true));
			socket.once("error", () => done(false));
		});
	}
}

injector.register(
	"windowsDeviceDebugService",
	WindowsDeviceDebugService,
	false,
);
