export enum GoogleAnalyticsDataType {
	Page = "pageview",
	Event = "event",
}

export enum TrackingTypes {
	/**
	 * Defines that the data contains information for initialization of a new Analytics monitor.
	 */
	Initialization = "initialization",

	/**
	 * Defines that the data contains exception that should be tracked.
	 */
	Exception = "exception",

	/**
	 * Defines that the data contains the answer of the question if user allows to be tracked.
	 */
	AcceptTrackFeatureUsage = "acceptTrackFeatureUsage",

	/**
	 * Defines data that will be tracked to Google Analytics.
	 */
	GoogleAnalyticsData = "googleAnalyticsData",

	/**
	 * Defines that the broker process should send all the pending information to Analytics.
	 * After that the process should send information it has finished tracking and die gracefully.
	 */
	FinishTracking = "FinishTracking",
}

export enum AnalyticsStatus {
	/**
	 * User has allowed to be tracked.
	 */
	enabled = "enabled",

	/**
	 * User has declined to be tracked.
	 */
	disabled = "disabled",

	/**
	 * User has not been asked to allow feature and error tracking.
	 */
	notConfirmed = "not confirmed",
}

export enum OptionType {
	/**
	 * String option
	 */
	String = "string",
	/**
	 * Boolean option
	 */
	Boolean = "boolean",
	/**
	 * Number option
	 */
	Number = "number",
	/**
	 * Array option
	 */
	Array = "array",
	/**
	 * Object option
	 */
	Object = "object",
}

export enum ErrorCodes {
	UNCAUGHT = 120,
	UNKNOWN = 127,
	INVALID_ARGUMENT = 128,
	RESOURCE_PROBLEM = 129,
	KARMA_FAIL = 130,
	UNHANDLED_REJECTION_FAILURE = 131,
	DELETED_KILL_FILE = 132,
	TESTS_INIT_REQUIRED = 133,
	ALL_DEVICES_DISCONNECTED = 134,
}
