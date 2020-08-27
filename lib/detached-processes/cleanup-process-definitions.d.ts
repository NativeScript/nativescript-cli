import { IDictionary } from "../common/declarations";

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

	/**
	 * Options to be passed to the child process
	 */
	options?: any;
}

interface IRequestInfo extends ITimeout {
	url: string;
	method: string;
	body: any;
	headers: any;
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

interface IRequestCleanupMessage extends ICleanupMessageBase {
	/**
	 * Describes the request that must be executed
	 */
	requestInfo: IRequestInfo;
}

interface IFileCleanupMessage extends ICleanupMessageBase, IFilePath {}

interface IJSCommand extends ITimeout, IFilePath {
	data: IDictionary<any>;
}

interface IJSCleanupMessage extends ICleanupMessageBase {
	jsCommand: IJSCommand;
}
