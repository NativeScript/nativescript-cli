/**
 * Defines messages used in communication between CLI's process and analytics subprocesses.
 */
declare const enum DetachedProcessMessages {
	/**
	 * The detached process is initialized and is ready to receive information for tracking.
	 */
	ProcessReadyToReceive = "ProcessReadyToReceive",

	/**
	 * The detached process finished its tasks and will now exit.
	 */
	ProcessFinishedTasks = "ProcessFinishedTasks",
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
	Error = "Error",
}

declare const enum CleanupProcessMessage {
	/**
	 * This type of message defines that cleanup procedure should execute specific command.
	 */
	AddCleanCommand = "AddCleanCommand",

	/**
	 * This type of message defines that cleanup procedure should not execute previously defined cleanup command.
	 */
	RemoveCleanCommand = "RemoveCleanCommand",
	/**
	 * This type of message defines that cleanup procedure should execute specific request.
	 */
	AddRequest = "AddRequest",

	/**
	 * This type of message defines that cleanup procedure should not execute previously defined request.
	 */
	RemoveRequest = "RemoveRequest",

	/**
	 * This type of message defines that cleanup procedure should delete specified files.
	 */
	AddDeleteFileAction = "AddDeleteFileAction",

	/**
	 * This type of message defines that the cleanup procedure should not delete previously specified file.
	 */
	RemoveDeleteFileAction = "RemoveDeleteFileAction",

	/**
	 * This type of message defines that the cleanup procedure will require the specified JS file, which should execute some action.
	 */
	AddJSFileToRequire = "AddJSFileToRequire",

	/**
	 * This type of message defines that the cleanup procedure will not require the previously specified JS file.
	 */
	RemoveJSFileToRequire = "RemoveJSFileToRequire",
}
