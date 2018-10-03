import { DEVICE_LOG_EVENT_NAME } from "../common/constants";
import { cache } from "../common/decorators";
import { EventEmitter } from "events";

export class LogParserService extends EventEmitter implements ILogParserService {
	private parseRules: IDictionary<ILogParseRule> = {};

	constructor(private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $previewSdkService: IPreviewSdkService) {
		super();
	}

	public addParseRule(rule: ILogParseRule): void {
		if (this.parseRules[rule.name]) {
			this.$errors.failWithoutHelp("Log parse rule already exists.");
		}

		this.parseRules[rule.name] = rule;
		this.startParsingLogCore();
	}

	@cache()
	private startParsingLogCore(): void {
		this.$deviceLogProvider.on(DEVICE_LOG_EVENT_NAME, (message: string, deviceIdentifier: string) => this.processDeviceLogResponse(message, deviceIdentifier));
		this.$previewSdkService.on(DEVICE_LOG_EVENT_NAME, (message: string, deviceIdentifier: string) => this.processDeviceLogResponse(message, deviceIdentifier));
	}

	private processDeviceLogResponse(message: string, deviceIdentifier: string) {
		const devicePlatform = this.tryGetPlatform(deviceIdentifier);

		const lines = message.split("\n");
		_.forEach(lines, line => {
			_.forEach(this.parseRules, (parseRule) => {
				if (!devicePlatform || !parseRule.platform || parseRule.platform.toLowerCase() === devicePlatform) {
					const matches = parseRule.regex.exec(line);

					if (matches) {
						parseRule.handler(matches, deviceIdentifier);
					}
				}
			});
		});
	}

	private tryGetPlatform (deviceIdentifier: string): string {
		let devicePlatform;
		try {
			const device = this.$devicesService.getDeviceByIdentifier(deviceIdentifier);
			devicePlatform = device.deviceInfo.platform.toLowerCase();
		} catch (err) {
			devicePlatform = null;
		}

		return devicePlatform;
	}
}

$injector.register("logParserService", LogParserService);
