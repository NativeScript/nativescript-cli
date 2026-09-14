interface ICommandsService {
	currentCommandData: ICommandData;
	allCommands(opts: { includeDevCommands: boolean }): string[];
	tryExecuteCommand(
		commandName: string,
		commandArguments: string[],
	): Promise<void>;
	executeCommandUnchecked(
		commandName: string,
		commandArguments: string[],
	): Promise<boolean>;
	/**
	 * Runs a command inside the running process, throwing on failure rather
	 * than exiting, so a long-lived host survives it.
	 */
	executeCommandInProcess(
		commandName: string,
		commandArguments?: string[],
	): Promise<void>;
}

/**
 * Describes the command data.
 */
interface ICommandData {
	/**
	 * Name of the command, usually the one registered in bootstrap.
	 */
	commandName: string;

	/**
	 * Additional arguments passed to the command.
	 */
	commandArguments: string[];
}
