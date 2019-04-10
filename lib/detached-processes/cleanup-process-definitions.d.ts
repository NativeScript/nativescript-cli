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

	/**
	 * Describes the action that must be executed
	 */
	action: ICleanupAction;
}

