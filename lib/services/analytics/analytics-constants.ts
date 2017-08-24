/**
 * Defines messages used in communication between CLI's process and analytics subprocesses.
 */
const enum AnalyticsMessages {
	/**
	 * Analytics Broker is initialized and is ready to receive information for tracking.
	 */
	BrokerReadyToReceive = "BrokerReadyToReceive",

	/**
	 * Eqatec Analytics process is initialized and is ready to receive information for tracking.
	 */
	EqatecAnalyticsReadyToReceive = "EqatecAnalyticsReadyToReceive"
}
