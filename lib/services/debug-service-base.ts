import { EventEmitter } from "events";

export abstract class DebugServiceBase extends EventEmitter implements IDeviceDebugService {
	constructor(
		protected device: Mobile.IDevice,
		protected $devicesService: Mobile.IDevicesService
	) {
		super();
	}

	public abstract get platform(): string;

	public abstract async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string>;

	public abstract async debugStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void>;

	public abstract async debugStop(): Promise<void>;

	protected getCanExecuteAction(deviceIdentifier: string): (device: Mobile.IDevice) => boolean {
		return (device: Mobile.IDevice): boolean => {
			if (deviceIdentifier) {
				let isSearchedDevice = device.deviceInfo.identifier === deviceIdentifier;
				if (!isSearchedDevice) {
					const deviceByDeviceOption = this.$devicesService.getDeviceByDeviceOption();
					isSearchedDevice = deviceByDeviceOption && device.deviceInfo.identifier === deviceByDeviceOption.deviceInfo.identifier;
				}

				return isSearchedDevice;
			} else {
				return true;
			}
		};
	}

	protected getChromeDebugUrl(debugOptions: IDebugOptions, port: number): string {
		// corresponds to 55.0.2883 Chrome version
		const commitSHA = debugOptions.devToolsCommit || "02e6bde1bbe34e43b309d4ef774b1168d25fd024";
		debugOptions.useHttpUrl = debugOptions.useHttpUrl === undefined ? false : debugOptions.useHttpUrl;

		let chromeDevToolsPrefix = `chrome-devtools://devtools/remote/serve_file/@${commitSHA}`;

		if (debugOptions.useBundledDevTools) {
			chromeDevToolsPrefix = "chrome-devtools://devtools/bundled";
		}

		if (debugOptions.useHttpUrl) {
			chromeDevToolsPrefix = `https://chrome-devtools-frontend.appspot.com/serve_file/@${commitSHA}`;
		}

		const chromeUrl = `${chromeDevToolsPrefix}/inspector.html?experiments=true&ws=localhost:${port}`;
		return chromeUrl;
	}
}
