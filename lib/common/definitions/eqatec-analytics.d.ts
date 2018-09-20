/**
 * Describes the information that will be passed to analytics for tracking.
 */
interface ITrackingInformation {
	/**
	 * The type of the data sent to analytics service - initalization data, feature to be tracked, error to be tracked, etc.
	 */
	type: TrackingTypes
}

/**
 * Describes information required for starting Eqatec Analytics tracking.
 */
interface IEqatecInitializeData extends ITrackingInformation {
	/**
	 * The API key of the project in which we'll collect data.
	 */
	analyticsAPIKey: string;

	/**
	 * The number of the current session in this project for this user. In case the value is 1, Analytics will count the user as new one.
	 * Whenever a new session is started, we should increase the count.
	 */
	userSessionCount: number;

	/**
	 * The installation identifier of analytics. It is unique per user.
	 */
	analyticsInstallationId: string;

	/**
	 * The unique identifier of a user.
	 */
	userId: string;
}
