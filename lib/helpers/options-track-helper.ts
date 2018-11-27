import * as path from "path";
import { TrackActionNames } from "../constants";

export class OptionsTrackHelper {
	public static SINGLE_OBJECT_SIZE_LIMIT = 400;
	public static SINGLE_PROPERTY_SIZE_LIMIT = 300;
	public static PASSWORD_DETECTION_STRING = "password";
	public static PASSOWRD_REPLACE_VALUE = "privateData";
	public static PATH_REPLACE_VALUE = "_localpath";
	public static SIZE_EXEEDED_REPLACE_VALUE = "popertySizeExceeded";


	constructor(
		private $analyticsService: IAnalyticsService) {
	}

	public async trackOptions(options: IOptions) {
		const trackObjects = this.getTrackObjects(options);
		const promises: Promise<void>[] = [];
		_.forEach(trackObjects, trackObject => {
			const json = JSON.stringify(trackObject);

			const trackPromise = this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.Options,
				additionalData: json
			});

			promises.push(trackPromise);
		});

		await Promise.all(promises);
	}

	private getTrackObjects(options: IOptions): Object[] {
		const optionsArgvCopy = _.cloneDeep(options.argv);
		const data = this.sanitizeTrackObject(optionsArgvCopy, options);

		return this.splitTrackObjects(data);
	}

	private sanitizeTrackObject(data:  IDictionary<any>, options?: IOptions): IDictionary<any> {
		const shorthands = options ? options.shorthands: [];
		const optionsDefinitions = options ? options.options: {};

		_.forEach(data, (value, key) => {
			if(this.shouldSkipProperty(key, value, shorthands, optionsDefinitions)) {
				delete data[key];
			} else {
				if(key.toLowerCase().indexOf(OptionsTrackHelper.PASSWORD_DETECTION_STRING) >= 0) {
					value = OptionsTrackHelper.PASSOWRD_REPLACE_VALUE;
				} else if(typeof value === "string" && value !== path.basename(value)) {
					value = OptionsTrackHelper.PATH_REPLACE_VALUE;
				} else if(_.isObject(value) && !_.isArray(value)) {
					value = this.sanitizeTrackObject(value);
				}
				data[key] = value;
			}
		});

		return data;
	}

	private shouldSkipProperty(key: string, value: any, shorthands: string[] = [], options: IDictionary<IDashedOption> = {}): Boolean {
		if(shorthands.indexOf(key) >= 0){
			return true;
		}

		if(key.indexOf("-") >= 0) {
			return true;
		}

		if(key === "_") {
			return true;
		}
		
		const optionDef = options[key];
		if(optionDef && optionDef.type === OptionType.Boolean) {
			if(optionDef.default !== true && value === false || optionDef.default === true && value === true) {
				return true;
			}
		}

		if(_.isUndefined(value)) {
			return true;
		}
	}

	private splitTrackObjects(trackData: Object): Object[] {
		const json = JSON.stringify(trackData);
		const firstObject: IDictionary<any> = {};
		const secondObject: IDictionary<any> = {};
		const bigFields: Object[] = [];

		if(json.length > OptionsTrackHelper.SINGLE_OBJECT_SIZE_LIMIT){
			const keys = _.keys(trackData);

			if(keys.length === 1) {
				return [trackData];
			}

			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				let value = trackData[key];
				const valueLength = JSON.stringify(value).length;

				if(valueLength > OptionsTrackHelper.SINGLE_OBJECT_SIZE_LIMIT) {
					value = "SIZE_EXEEDED_REPLACE_VALUE";
				}

				if(valueLength > OptionsTrackHelper.SINGLE_PROPERTY_SIZE_LIMIT) {
					bigFields.push({
						[key]: value
					});
				} else if(i < keys.length/2) {
					firstObject[key] = value;
				} else {
					secondObject[key] = value;
				}
			}

			return bigFields.concat(this.splitTrackObjects(firstObject), this.splitTrackObjects(secondObject));
		} else {
			return [trackData];
		}
	}
}

$injector.register("optionsTrackHelper", OptionsTrackHelper);
