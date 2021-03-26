import { cache } from "../common/decorators";
import {
	HmrConstants,
	IOS_APP_CRASH_LOG_REG_EXP,
	FAIL_LIVESYNC_LOG_REGEX,
} from "../common/constants";
import { IDictionary } from "../common/declarations";
import { injector } from "../common/yok";
import { ISharedEventBus } from "../declarations";

export class HmrStatusService implements IHmrStatusService {
	public static HMR_STATUS_LOG_REGEX = /([a-z A-Z]*) hmr hash ([a-z0-9]*)\./;
	public static STARTED_MESSAGE = "Checking for updates to the bundle with";
	public static SUCCESS_MESSAGE = "Successfully applied update with";
	public static FAILED_MESSAGE = "Cannot apply update with";
	private hashOperationStatuses: IDictionary<any> = {};
	private uuidToDeviceMap: IDictionary<any> = {};
	private intervals: IDictionary<any> = {};

	constructor(
		private $logParserService: ILogParserService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger,
		private $sharedEventBus: ISharedEventBus
	) {}

	public getHmrStatus(
		deviceId: string,
		operationHash: string
	): Promise<number> {
		return new Promise((resolve, reject) => {
			const key = `${deviceId}${operationHash}`;
			let retryCount = 40;

			this.intervals[key] = setInterval(() => {
				const status = this.getStatusByKey(key);
				if (status || retryCount === 0) {
					clearInterval(this.intervals[key]);
					this.intervals[key] = null;
					resolve(status);
				} else {
					retryCount--;
				}
			}, 250);
		});
	}

	public watchHmrStatus(deviceId: string, operationHash: string): void {
		this.setData(deviceId, operationHash);
	}

	@cache()
	public attachToHmrStatusEvent(): void {
		this.$logParserService.addParseRule({
			regex: HmrStatusService.HMR_STATUS_LOG_REGEX,
			handler: this.handleHmrStatusFound.bind(this),
			name: "hmrStatus",
		});
		this.$logParserService.addParseRule({
			regex: IOS_APP_CRASH_LOG_REG_EXP,
			handler: this.handleAppCrash.bind(this),
			name: "appCrashHmr",
			platform: this.$devicePlatformsConstants.iOS.toLowerCase(),
		});
		this.$logParserService.addParseRule({
			regex: FAIL_LIVESYNC_LOG_REGEX,
			handler: this.handleAppCrash.bind(this),
			name: "failedLiveSync",
			platform: this.$devicePlatformsConstants.iOS.toLowerCase(),
		});

		// webpack5
		// todo: figure out a better way to map Device.uuid -> CLI.DeviceId
		this.$logParserService.addParseRule({
			regex: /\[HMR]\suuid\s=\s(.+)/,
			handler: (matches: RegExpMatchArray, deviceId: string) => {
				try {
					this.uuidToDeviceMap[matches[1]] = deviceId;
				} catch (err) {
					// should not happen
				}
			},
			name: "hmrUUID",
		});
		this.$sharedEventBus.on("webpack:hmr-status", (message) => {
			const deviceId = this.uuidToDeviceMap[message?.data?.uuid];
			const hash = message?.hash;
			const status = message?.data?.status;

			if (deviceId && hash && status) {
				if (status === "success") {
					this.setData(deviceId, hash, HmrConstants.HMR_SUCCESS_STATUS);
				} else if (status === "failure") {
					this.setData(deviceId, hash, HmrConstants.HMR_ERROR_STATUS);
				}
			}
		});
	}

	private handleAppCrash(matches: RegExpMatchArray, deviceId: string): void {
		for (const operationId in this.hashOperationStatuses) {
			const operation = this.hashOperationStatuses[operationId];
			if (operationId.startsWith(deviceId) && !operation.status) {
				operation.status = HmrConstants.HMR_ERROR_STATUS;
			}
		}
	}

	private handleHmrStatusFound(
		matches: RegExpMatchArray,
		deviceId: string
	): void {
		const message = matches[1].trim();
		const hash = matches[2];
		let status;

		switch (message) {
			case HmrStatusService.SUCCESS_MESSAGE: {
				status = HmrConstants.HMR_SUCCESS_STATUS;
				break;
			}
			case HmrStatusService.FAILED_MESSAGE: {
				status = HmrConstants.HMR_ERROR_STATUS;
				break;
			}
			default: {
				status = null;
				break;
			}
		}

		this.$logger.trace("Found hmr status.", { status, hash });

		if (status) {
			this.setData(deviceId, hash, status);
		}
	}

	private getStatusByKey(key: string): number {
		if (this.hashOperationStatuses[key]) {
			return this.hashOperationStatuses[key].status;
		}

		return null;
	}

	private setData(
		deviceId: string,
		operationHash: string,
		status?: Number
	): void {
		const key = `${deviceId}${operationHash}`;

		if (!this.hashOperationStatuses[key]) {
			this.hashOperationStatuses[key] = <any>{};
		}

		this.hashOperationStatuses[key].status = status;
	}
}

injector.register("hmrStatusService", HmrStatusService);
