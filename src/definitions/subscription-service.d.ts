/**
 * Describes methods for subscribing to different NativeScript campaigns.
 */
interface ISubscriptionService {
	/**
	 * Subscribes users for NativeScript's newsletter by asking them for their email.
	 * In case we've already asked the user for his email, this method will do nothing.
	 * @returns {Promise<void>}
	 */
	subscribeForNewsletter(): Promise<void>;
}
