/**
 * Defines messages used in communication between CLI's process and analytics subprocesses.
 */
declare const enum DetachedProcessMessages {
	/**
	 * The detached process is initialized and is ready to receive information for tracking.
	 */
	ProcessReadyToReceive = "ProcessReadyToReceive"
}

/**
 * Defines the type of the messages that should be written in the local analyitcs log file (in case such is specified).
 */
declare const enum FileLogMessageType {
	/**
	 * Information message. This is the default value in case type is not specified.
	 */
	Info = "Info",

	/**
	 * Error message - used to indicate that some action did not succeed.
	 */
	Error = "Error"
}

declare const enum CleanupProcessMessageType {
	AddCleanAction = "AddCleanAction",
}
