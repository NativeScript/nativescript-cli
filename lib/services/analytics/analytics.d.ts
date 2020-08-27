import { TrackingTypes } from "../../common/declarations";
import {
	IGoogleAnalyticsData,
	IPreviewAppGoogleAnalyticsData,
} from "../../common/definitions/google-analytics";

/**
 * Describes the information that will be passed to analytics for tracking.
 */
interface ITrackingInformation {
	/**
	 * The type of the data sent to analytics service - initalization data, feature to be tracked, error to be tracked, etc.
	 */
	type: TrackingTypes;
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

interface IGoogleAnalyticsTrackingInformation
	extends IGoogleAnalyticsData,
		ITrackingInformation {}

interface IPreviewAppTrackingInformation
	extends IPreviewAppGoogleAnalyticsData,
		ITrackingInformation {}

/**
 * Describes methods required to track in Google Analytics.
 */
interface IGoogleAnalyticsProvider {
	/**
	 * Tracks hit types.
	 * @param {IGoogleAnalyticsData} data Data that has to be tracked.
	 * @returns {Promise<void>}
	 */
	trackHit(data: IGoogleAnalyticsData): Promise<void>;
}
