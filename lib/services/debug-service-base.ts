import { EventEmitter } from "events";
import {
	IDebugData,
	IDebugOptions,
	IDeviceDebugService,
	IDebugResultInfo
} from "../definitions/debug";

export abstract class DebugServiceBase
	extends EventEmitter
	implements IDeviceDebugService
{
	constructor(
		protected device: Mobile.IDevice,
		protected $devicesService: Mobile.IDevicesService
	) {
		super();
	}

	public abstract get platform(): string;

	public abstract debug(
		debugData: IDebugData,
		debugOptions: IDebugOptions
	): Promise<IDebugResultInfo>;

	public abstract debugStop(): Promise<void>;

	protected getCanExecuteAction(
		deviceIdentifier: string
	): (device: Mobile.IDevice) => boolean {
		return (device: Mobile.IDevice): boolean => {
			if (deviceIdentifier) {
				let isSearchedDevice =
					device.deviceInfo.identifier === deviceIdentifier;
				if (!isSearchedDevice) {
					const deviceByDeviceOption =
						this.$devicesService.getDeviceByDeviceOption();
					isSearchedDevice =
						deviceByDeviceOption &&
						device.deviceInfo.identifier ===
							deviceByDeviceOption.deviceInfo.identifier;
				}

				return isSearchedDevice;
			} else {
				return true;
			}
		};
	}

	protected getChromeDebugUrl(
		debugOptions: IDebugOptions,
		port: number
	): string {
		// corresponds to 55.0.2883 Chrome version
		// SHA is taken from https://chromium.googlesource.com/chromium/src/+/55.0.2883.100
		// This SHA is old and does not support debugging with HMR.
		// In case we want to stick with concrete SHA, get it from one of the tags https://chromium.googlesource.com/chromium/src/
		// IMPORTANT: When you get the SHA, ensure you are using the `parent` commit, not the actual one.
		// Using the actual commit will result in 404 error in the remote serve.
		const commitSHA =
			debugOptions.devToolsCommit || "02e6bde1bbe34e43b309d4ef774b1168d25fd024";

		const devToolsProtocol = `devtools`;
		let chromeDevToolsPrefix = `${devToolsProtocol}://devtools/remote/serve_file/@${commitSHA}`;

		if (
			debugOptions.useBundledDevTools === undefined ||
			debugOptions.useBundledDevTools
		) {
			chromeDevToolsPrefix = `${devToolsProtocol}://devtools/bundled`;
		}

		if (debugOptions.useHttpUrl) {
			chromeDevToolsPrefix = `https://chrome-devtools-frontend.appspot.com/serve_file/@${commitSHA}`;
		}

		const chromeUrl = `${chromeDevToolsPrefix}/inspector.html?ws=localhost:${port}`;
		return chromeUrl;
	}
}
