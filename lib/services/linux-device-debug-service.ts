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
import { LinuxApplicationManager } from "../common/mobile/linux/linux-application-manager";

/** The app is started with `--inspect=<port>`; wait for the inspector to listen. */
export class LinuxDeviceDebugService
	extends DebugServiceBase
	implements IDeviceDebugService
{
	public get platform() {
		return "linux";
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
		const port = (this.device.applicationManager as LinuxApplicationManager)
			.inspectorPort;
		if (!(await this.waitForPort(port, debugOptions))) {
			this.$errors.fail(
				`The application ${debugData.applicationIdentifier} is not running with the debugger enabled. Start it with \`ns debug linux\`.`,
			);
		}
		this.$logger.info("# NativeScript Debugger started #");
		result.debugUrl = this.getChromeDebugUrl(debugOptions, port);
		return result;
	}

	public async debugStop(): Promise<void> {
		// the inspector lives in the app process
	}

	private async waitForPort(
		port: number,
		debugOptions: IDebugOptions,
	): Promise<boolean> {
		const timeoutSeconds =
			parseInt(debugOptions.timeout, 10) ||
			APPLICATION_RESPONSE_TIMEOUT_SECONDS;
		const deadline = Date.now() + timeoutSeconds * 1000;
		while (!(await this.isListening(port))) {
			if (Date.now() >= deadline) {
				return false;
			}
			await sleep(250);
		}
		return true;
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

injector.register("linuxDeviceDebugService", LinuxDeviceDebugService, false);
