interface ITimeout {
	/**
	 * Timeout to execute the action.
	 */
	timeout?: number;
}

interface IFilePath {
	/**
	* Path to file/directory to be deleted or required
	*/
	filePath: string;
}

interface ISpawnCommandInfo extends ITimeout {
	/**
	 * Executable to be started.
	 */
	command: string;

	/**
	 * Arguments that will be passed to the child process
	 */
	args: string[];
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

interface IFileCleanupMessage extends ICleanupMessageBase, IFilePath { }

interface IJSCommand extends ITimeout, IFilePath {
	data: IDictionary<any>;
}

interface IJSCleanupMessage extends ICleanupMessageBase {
	jsCommand: IJSCommand;
 }
