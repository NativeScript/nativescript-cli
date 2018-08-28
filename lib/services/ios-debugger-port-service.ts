import { DEBUGGER_PORT_FOUND_EVENT_NAME, ATTACH_REQUEST_EVENT_NAME } from "../common/constants";
import { cache } from "../common/decorators";
import * as semver from "semver";

export class IOSDebuggerPortService implements IIOSDebuggerPortService {
	private mapDebuggerPortData: IDictionary<IIOSDebuggerPortStoredData> = {};
	private static DEFAULT_PORT = 18181;
	private static MIN_REQUIRED_FRAMEWORK_VERSION = "4.0.1";
	private static DEFAULT_TIMEOUT_IN_SECONDS = 10;

	constructor(private $iOSLogParserService: IIOSLogParserService,
		private $iOSProjectService: IPlatformProjectService,
		private $iOSNotification: IiOSNotification,
		private $projectDataService: IProjectDataService,
		private $logger: ILogger) { }

	public getPort(data: IIOSDebuggerPortInputData, debugOptions?: IDebugOptions): Promise<number> {
		return new Promise((resolve, reject) => {
			if (!this.canStartLookingForDebuggerPort(data)) {
				resolve(IOSDebuggerPortService.DEFAULT_PORT);
				return;
			}

			const key = `${data.deviceId}${data.appId}`;
			const timeout = this.getTimeout(debugOptions);
			let retryCount = Math.max(timeout * 1000 / 500, 10);

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

	public async attachToDebuggerPortFoundEvent(device: Mobile.IDevice, data: IProjectDir, debugOptions: IDebugOptions): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(data && data.projectDir);
		if (!this.canStartLookingForDebuggerPort(projectData)) {
			return;
		}

		this.attachToDebuggerPortFoundEventCore();
		this.attachToAttachRequestEvent(device, debugOptions);

		await this.$iOSLogParserService.startParsingLog(device, projectData);
	}

	private canStartLookingForDebuggerPort(data: IProjectDir): boolean {
		const projectData = this.$projectDataService.getProjectData(data && data.projectDir);
		const frameworkVersion = this.$iOSProjectService.getFrameworkVersion(projectData);
		return !frameworkVersion || !semver.valid(frameworkVersion) || semver.gt(frameworkVersion, IOSDebuggerPortService.MIN_REQUIRED_FRAMEWORK_VERSION);
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
	private attachToAttachRequestEvent(device: Mobile.IDevice, debugOptions: IDebugOptions): void {
		const timeout = this.getTimeout(debugOptions);

		this.$iOSNotification.on(ATTACH_REQUEST_EVENT_NAME, (data: IIOSDebuggerPortData) => {
			this.$logger.trace(ATTACH_REQUEST_EVENT_NAME, data);
			const timer = setTimeout(() => {
				this.clearTimeout(data);
				if (!this.getPortByKey(`${data.deviceId}${data.appId}`)) {
					this.$logger.warn(`NativeScript debugger was not able to get inspector socket port on device ${data.deviceId} for application ${data.appId}.`);
				}
			}, timeout * 1000);

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

	private getTimeout(debugOptions: IDebugOptions): number {
		let timeout = parseInt(debugOptions && debugOptions.timeout, 10);
		if (timeout === 0) {
			timeout = Number.MAX_SAFE_INTEGER;
		}
		if (!timeout) {
			timeout = IOSDebuggerPortService.DEFAULT_TIMEOUT_IN_SECONDS;
		}

		return timeout;
	}
}
$injector.register("iOSDebuggerPortService", IOSDebuggerPortService);
