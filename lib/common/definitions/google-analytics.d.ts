import { GoogleAnalyticsDataType, IStringDictionary } from "../declarations";

/**
 * Describes data that will be tracked to Google Analytics
 */
interface IGoogleAnalyticsData {
	/**
	 * Describes the type of information that will be tracked (Page or Event).
	 */
	googleAnalyticsDataType: GoogleAnalyticsDataType;

	/**
	 * Describes all custom dimensions that will be send to analytics.
	 */
	customDimensions?: IStringDictionary;
}

interface IPreviewAppGoogleAnalyticsData {
	platform: string;
	additionalData?: string;
}

/**
 * Describes information about event that should be tracked.
 */
interface IEventActionData {
	/**
	 * The action name.
	 */
	action: string;

	/**
	 * Mobile platform for which the action will be tracked.
	 * In case device is passed, this property is disregarded and device.deviceInfo.platform is used instead.
	 */
	platform?: string;

	/**
	 * Describes if the action is for device or for simulator/emulator.
	 * In case device is passed, this property is disregarded and !device.isEmulator is used instead.
	 */
	isForDevice?: boolean;

	/**
	 * Device instance for which the action will be tracked.
	 */
	device?: Mobile.IDevice;

	/**
	 * Any additional data that should be tracked.
	 */
	additionalData?: string;

	/**
	 * Project directory, in case the action is executed inside project.
	 */
	projectDir?: string;

	/**
	 * Value that should be tracked
	 */
	value?: number;
}

/**
 * Describes page's information that should be tracked in Google Analytics.
 * In CLI one page is one command.
 */
interface IGoogleAnalyticsPageviewData extends IGoogleAnalyticsData {
	/**
	 * Document path. The path portion of the page URL.
	 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#dp
	 * In our case this is the beautified command name, i.e. `build|android` will be tracked as `build android`, `build|*all` will be tracked as `build`.
	 */
	path: string;

	/**
	 * The title of the page / document.
	 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#dt
	 * In our case this is the beautified command name, i.e. `build|android` will be tracked as `build android`, `build|*all` will be tracked as `build`.
	 */
	title: string;
}

/**
 * Describes event's information that should be tracked in Google Analytics.
 * In CLI these are all custom metrics and data that we track, instead of command.
 */
interface IGoogleAnalyticsEventData extends IGoogleAnalyticsData {
	/**
	 * Event category. For the moment it is hardcoded to CLI.
	 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#ec
	 */
	category?: string;

	/**
	 * Event action - the real action that has to be tracked, like Build, LiveSync, etc.
	 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#ea
	 */
	action: string;

	/**
	 * Event label - all custom data, specific for this action, like platform for Build operation, device type, os version, etc. for LiveSync.
	 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#el
	 */
	label: string;

	/**
	 * Event value. Specifies the event value. Values must be non-negative.
	 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#ev
	 * Currently not used.
	 */
	value?: number;
}
