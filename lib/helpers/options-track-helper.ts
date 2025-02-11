import * as path from "path";
import { TrackActionNames } from "../constants";
import { IOptions } from "../declarations";
import {
	IAnalyticsService,
	IDictionary,
	IDashedOption,
	OptionType
} from "../common/declarations";
import * as _ from "lodash";
import { injector } from "../common/yok";

export class OptionsTracker {
	public static PASSWORD_DETECTION_STRING = "password";
	public static PRIVATE_REPLACE_VALUE = "private";
	public static PATH_REPLACE_VALUE = "_localpath";
	public static SIZE_EXEEDED_REPLACE_VALUE = "sizeExceeded";

	constructor(private $analyticsService: IAnalyticsService) {}

	public async trackOptions(options: IOptions) {
		const trackObject = this.getTrackObject(options);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.Options,
			additionalData: JSON.stringify(trackObject)
		});
	}

	private getTrackObject(options: IOptions): IDictionary<any> {
		const optionsArgvCopy = _.cloneDeep(options.argv);

		return this.sanitizeTrackObject(optionsArgvCopy, options);
	}

	private sanitizeTrackObject(
		data: IDictionary<any>,
		options?: IOptions
	): IDictionary<any> {
		const shorthands = options ? options.shorthands : [];
		const optionsDefinitions = options ? options.options : {};

		_.forEach(data, (value, key) => {
			if (this.shouldSkipProperty(key, value, shorthands, optionsDefinitions)) {
				delete data[key];
			} else {
				if (
					options &&
					optionsDefinitions[key] &&
					optionsDefinitions[key].hasSensitiveValue !== false
				) {
					value = OptionsTracker.PRIVATE_REPLACE_VALUE;
				} else if (
					key.toLowerCase().indexOf(OptionsTracker.PASSWORD_DETECTION_STRING) >=
					0
				) {
					value = OptionsTracker.PRIVATE_REPLACE_VALUE;
				} else if (_.isString(value) && value !== path.basename(value)) {
					value = OptionsTracker.PATH_REPLACE_VALUE;
				} else if (_.isObject(value) && !_.isArray(value)) {
					value = this.sanitizeTrackObject(value);
				}

				data[key] = value;
			}
		});

		return data;
	}

	private shouldSkipProperty(
		key: string,
		value: any,
		shorthands: string[] = [],
		options: IDictionary<IDashedOption> = {}
	): Boolean {
		if (shorthands.indexOf(key) >= 0) {
			return true;
		}

		if (key.indexOf("-") >= 0) {
			return true;
		}

		if (key === "_") {
			return true;
		}

		const optionDef = options[key];
		if (optionDef && optionDef.type === OptionType.Boolean) {
			if (
				(optionDef.default !== true && value === false) ||
				(optionDef.default === true && value === true)
			) {
				return true;
			}
		}

		if (_.isUndefined(value)) {
			return true;
		}
	}
}

injector.register("optionsTracker", OptionsTracker);
