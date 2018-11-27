/**
 * Defines messages used in communication between CLI's process and analytics subprocesses.
 */
declare const enum AnalyticsMessages {
	/**
	 * Analytics Broker is initialized and is ready to receive information for tracking.
	 */
	BrokerReadyToReceive = "BrokerReadyToReceive"
}

/**
 * Defines the type of the messages that should be written in the local analyitcs log file (in case such is specified).
 */
declare const enum AnalyticsLoggingMessageType {
	/**
	 * Information message. This is the default value in case type is not specified.
	 */
	Info = "Info",

	/**
	 * Error message - used to indicate that some action while trying to track information did not succeeded.
	 */
	Error = "Error"
}
