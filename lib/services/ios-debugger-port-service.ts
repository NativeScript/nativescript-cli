import { DEBUGGER_PORT_FOUND_EVENT_NAME, ATTACH_REQUEST_EVENT_NAME } from "../common/constants";
import { cache } from "../common/decorators";
import { APPLICATION_RESPONSE_TIMEOUT_SECONDS } from "../constants";

export class IOSDebuggerPortService implements IIOSDebuggerPortService {
	public static DEBUG_PORT_LOG_REGEX = /NativeScript debugger has opened inspector socket on port (\d+?) for (.*)[.]/;
	private mapDebuggerPortData: IDictionary<IIOSDebuggerPortStoredData> = {};

	constructor(private $logParserService: ILogParserService,
		private $iOSNotification: IiOSNotification,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger) { }

	public getPort(data: IIOSDebuggerPortInputData): Promise<number> {
		return new Promise((resolve, reject) => {
			const key = `${data.deviceId}${data.appId}`;
			const retryInterval = 500;
			let retryCount = Math.max(APPLICATION_RESPONSE_TIMEOUT_SECONDS * 1000 / retryInterval, 10);

			const interval = setInterval(() => {
				let port = this.getPortByKey(key);
				if (port || retryCount === 0) {
					clearInterval(interval);
					resolve(port);
				} else {
					port = this.getPortByKey(key);
					retryCount--;
				}
			}, retryInterval);
		});
	}

	public async attachToDebuggerPortFoundEvent(): Promise<void> {
		this.attachToDebuggerPortFoundEventCore();
		this.attachToAttachRequestEvent();
	}

	@cache()
	private attachToDebuggerPortFoundEventCore(): void {
		this.$logParserService.addParseRule({
			regex: IOSDebuggerPortService.DEBUG_PORT_LOG_REGEX,
			handler: this.handlePortFound.bind(this),
			name: "debugPort",
			platform: this.$devicePlatformsConstants.iOS.toLowerCase()
		});
	}

	private handlePortFound(matches: RegExpMatchArray, deviceId: string): void {
		const data = {
			port: parseInt(matches[1]),
			appId: matches[2],
			deviceId
		};

		this.$logger.trace(DEBUGGER_PORT_FOUND_EVENT_NAME, data);
		this.clearTimeout(data);
		this.setData(data, { port: data.port });
	}

	@cache()
	private attachToAttachRequestEvent(): void {
		this.$iOSNotification.on(ATTACH_REQUEST_EVENT_NAME, (data: IIOSDebuggerPortData) => {
			this.$logger.trace(ATTACH_REQUEST_EVENT_NAME, data);
			const timer = setTimeout(() => {
				this.clearTimeout(data);
				if (!this.getPortByKey(`${data.deviceId}${data.appId}`)) {
					this.$logger.warn(`NativeScript debugger was not able to get inspector socket port on device ${data.deviceId} for application ${data.appId}.`);
				}
			}, APPLICATION_RESPONSE_TIMEOUT_SECONDS * 1000);

			this.setData(data, { port: null, timer });
		});
	}

	private getPortByKey(key: string): number {
		if (this.mapDebuggerPortData[key]) {
			return this.mapDebuggerPortData[key].port;
		}

		return null;
	}

	private setData(data: IIOSDebuggerPortData, storedData: IIOSDebuggerPortStoredData): void {
		const key = `${data.deviceId}${data.appId}`;

		if (!this.mapDebuggerPortData[key]) {
			this.mapDebuggerPortData[key] = <any>{};
		}

		this.mapDebuggerPortData[key].port = storedData.port;
		this.mapDebuggerPortData[key].timer = storedData.timer;
	}

	private clearTimeout(data: IIOSDebuggerPortData): void {
		const storedData = this.mapDebuggerPortData[`${data.deviceId}${data.appId}`];
		if (storedData && storedData.timer) {
			clearTimeout(storedData.timer);
		}
	}
}
$injector.register("iOSDebuggerPortService", IOSDebuggerPortService);
