import { DEBUGGER_PORT_FOUND_EVENT_NAME, STARTING_IOS_APPLICATION_EVENT_NAME } from "../common/constants";
import { cache } from "../common/decorators";
import * as semver from "semver";

export class IOSDebuggerPortService implements IIOSDebuggerPortService {
	private mapDebuggerPortData: IDictionary<IIOSDebuggerPortStoredData> = {};
	private static DEFAULT_PORT = 18181;
	private static MIN_REQUIRED_FRAMEWORK_VERSION = "4.0.0";

	constructor(private $iOSLogParserService: IIOSLogParserService,
		private $iOSProjectService: IPlatformProjectService,
		private $logger: ILogger,
		private $projectData: IProjectData) { }

	public getPort(data: IIOSDebuggerPortInputData): Promise<number> {
		return new Promise((resolve, reject) => {
			if (!this.canStartLookingForDebuggerPort()) {
				return IOSDebuggerPortService.DEFAULT_PORT;
			}

			const key = `${data.deviceId}${data.appId}`;
			let retryCount: number = 10;

			const interval = setInterval(() => {
				let port = this.getPortByKey(key);
				if (port || retryCount === 0) {
					clearInterval(interval);
					resolve(port);
				} else {
					port = this.getPortByKey(key);
					retryCount--;
				}
			}, 500);
		});
	}

	public attachToDebuggerPortFoundEvent(device: Mobile.IDevice): void {
		if (!this.canStartLookingForDebuggerPort()) {
			return;
		}

		this.attachToDebuggerPortFoundEventCore();
		this.attachToStartingApplicationEvent(device);

		this.$iOSLogParserService.startLookingForDebuggerPort(device);
	}

	private canStartLookingForDebuggerPort(): boolean {
		const frameworkVersion = this.$iOSProjectService.getFrameworkVersion(this.$projectData);
		return semver.gte(frameworkVersion, IOSDebuggerPortService.MIN_REQUIRED_FRAMEWORK_VERSION);
	}

	@cache()
	private attachToDebuggerPortFoundEventCore(): void {
		this.$iOSLogParserService.on(DEBUGGER_PORT_FOUND_EVENT_NAME, (data: IIOSDebuggerPortData) => {
			this.$logger.trace(DEBUGGER_PORT_FOUND_EVENT_NAME, data);
			this.setData(data, { port: data.port });
			this.clearTimeout(data);
		});
	}

	@cache()
	private attachToStartingApplicationEvent(device: Mobile.IDevice): void {
		device.applicationManager.on(STARTING_IOS_APPLICATION_EVENT_NAME, (data: IIOSDebuggerPortData) => {
			this.$logger.trace(STARTING_IOS_APPLICATION_EVENT_NAME, data);
			const timer = setTimeout(() => {
				this.clearTimeout(data);
				if (!this.getPortByKey(`${data.deviceId}${data.appId}`)) {
					this.$logger.warn("NativeScript debugger was not able to get inspector socket port.");
				}
			}, 5000);

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
