import { DEVICE_LOG_EVENT_NAME } from "../common/constants";
import { cache } from "../common/decorators";
import { EventEmitter } from "events";

export class LogParserService extends EventEmitter implements ILogParserService {
	private parseRules: IDictionary<ILogParseRule> = {};

	constructor(private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors) {
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
	}

	private processDeviceLogResponse(message: string, deviceIdentifier: string) {
		const device = this.$devicesService.getDeviceByIdentifier(deviceIdentifier);
		const devicePlatform = device.deviceInfo.platform.toLowerCase();

		const lines = message.split("\n");
		_.forEach(lines, line => {
			_.forEach(this.parseRules, (parseRule) => {
				if (!parseRule.platform || parseRule.platform.toLowerCase() === devicePlatform) {
					const matches = parseRule.regex.exec(line);

					if (matches) {
						parseRule.handler(matches, deviceIdentifier);
					}
				}
			});
		});
	}
}

$injector.register("logParserService", LogParserService);
