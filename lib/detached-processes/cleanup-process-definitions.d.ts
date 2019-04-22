interface ISpawnCommandInfo {
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

interface ICleanupMessageBase {
	/**
	 * Type of the message
	 */
	messageType: CleanupProcessMessage;
}

interface ISpawnCommandCleanupMessage extends ICleanupMessageBase {
	/**
	 * Describes the command that must be executed
	 */
	commandInfo: ISpawnCommandInfo;
}

interface IDeleteFileCleanupMessage extends ICleanupMessageBase {
	/**
	 * Path to file/directory to be deleted.
	 */
	filePath: string;
}
