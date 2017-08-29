/**
 * Describes if the user allows to be tracked.
 */
interface IAcceptUsageReportingInformation extends ITrackingInformation {
	/**
	 * The answer of the question if user allows us to track them.
	 */
	acceptTrackFeatureUsage: boolean;
}

/**
 * Describes information used for tracking feature.
 */
interface IFeatureTrackingInformation extends ITrackingInformation {
	/**
	 * The name of the feature that should be tracked.
	 */
	featureName: string;

	/**
	 * Value of the feature that should be tracked.
	 */
	featureValue: string;
}

/**
 * Describes information for exception that should be tracked.
 */
interface IExceptionsTrackingInformation extends ITrackingInformation {
	/**
	 * The exception that should be tracked.
	 */
	exception: Error;

	/**
	 * The message of the error that should be tracked.
	 */
	message: string;
}

/**
 * Describes the broker used to pass information to all analytics providers.
 */
interface IAnalyticsBroker {
	/**
	 * Sends the specified tracking information to all providers.
	 * @param {ITrackingInformation} trackInfo The information that should be passed to all providers.
	 * @returns {Promise<void>}
	 */
	sendDataForTracking(trackInfo: ITrackingInformation): Promise<void>;
}

/**
 * Describes analytics provider used for tracking in a specific Analytics Service.
 */
interface IAnalyticsProvider {
	/**
	 * Sends exception for tracking in the analytics service provider.
	 * @param {IExceptionsTrackingInformation} trackInfo The information for exception that should be tracked.
	 * @returns {Promise<void>}
	 */
	trackError(trackInfo: IExceptionsTrackingInformation): Promise<void>;

	/**
	 * Sends feature for tracking in the analytics service provider.
	 * @param {IFeatureTrackingInformation} trackInfo The information for feature that should be tracked.
	 * @returns {Promise<void>}
	 */
	trackInformation(trackInfo: IFeatureTrackingInformation): Promise<void>;

	/**
	 * Sends information if user accepts to be tracked.
	 * @param {IAcceptUsageReportingInformation} trackInfo The information, containing user's answer if they allow to be tracked.
	 * @returns {Promise<void>}
	 */
	acceptFeatureUsageTracking(data: IAcceptUsageReportingInformation): Promise<void>;

	/**
	 * Waits for execution of all pending requests and finishes tracking operation
	 * @returns {Promise<void>}
	 */
	finishTracking(): Promise<void>;
}
