import { DEVICE_LOG_EVENT_NAME } from "../common/constants";
import { cache } from "../common/decorators";
import { EventEmitter } from "events";
import * as _ from 'lodash';
import { IDictionary, IErrors } from "../common/declarations";
import { injector } from "../common/yok";

export class LogParserService extends EventEmitter implements ILogParserService {
	private parseRules: IDictionary<ILogParseRule> = {};

	constructor(private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $errors: IErrors,
		private $previewAppLogProvider: IPreviewAppLogProvider) {
		super();
	}

	public addParseRule(rule: ILogParseRule): void {
		if (this.parseRules[rule.name]) {
			this.$errors.fail("Log parse rule already exists.");
		}

		this.parseRules[rule.name] = rule;
		this.startParsingLogCore();
	}

	@cache()
	private startParsingLogCore(): void {
		this.$deviceLogProvider.on(DEVICE_LOG_EVENT_NAME, this.processDeviceLogResponse.bind(this));
		this.$previewAppLogProvider.on(DEVICE_LOG_EVENT_NAME, (deviceId: string, message: string) => {
			this.processDeviceLogResponse(message, deviceId);
		});
	}

	private processDeviceLogResponse(message: string, deviceIdentifier: string, devicePlatform?: string) {
		const lines = message.split("\n");
		_.forEach(lines, line => {
			_.forEach(this.parseRules, parseRule => {
				if (!devicePlatform || !parseRule.platform || parseRule.platform.toLowerCase() === devicePlatform.toLowerCase()) {
					const matches = parseRule.regex.exec(line);

					if (matches) {
						parseRule.handler(matches, deviceIdentifier);
					}
				}
			});
		});
	}
}

injector.register("logParserService", LogParserService);
