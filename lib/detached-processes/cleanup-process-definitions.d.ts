interface ICleanupAction {
	/**
	 * Executable to be started.
	 */
	command: string;

	/**
	 * Arguments that will be passed to the child process
	 */
	args: string[];
	/**
	 * Timeout to execute the action.
	 */
	timeout?: number;
}

interface ICleanupProcessMessage {
	/**
	 * Type of the action
	 */
	actionType: CleanupProcessMessageType;
}

interface ICleanupActionMessage extends ICleanupProcessMessage {
	/**
	 * Describes the action that must be executed
	 */
	action: ICleanupAction;
}

interface ICleanupDeleteActionMessage extends ICleanupProcessMessage {
	/**
	 * Path to file/directory to be deleted.
	 */
	filePath: string;
}
