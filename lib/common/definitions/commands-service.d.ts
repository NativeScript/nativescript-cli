interface ICommandsService {
	currentCommandData: ICommandData;
	/**
	 * Whether the command running right now was dispatched by
	 * runCommand rather than by the command line — what tells a
	 * command that it is borrowing a host process instead of owning one.
	 */
	readonly isExecutingInProcess: boolean;
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
	runCommand(
		command: import("../define-command").CommandReference,
		commandArguments?: string[],
		options?: import("../contracts/commands-service").CommandDispatchOptions,
	): Promise<void>;
	/**
	 * Asks a command whether it could run, without running it. The command
	 * builds its own setup from its own services.
	 */
	canExecuteCommand(
		command: import("../define-command").CommandReference,
		commandArguments?: string[],
		options?: import("../contracts/commands-service").CommandDispatchOptions,
	): Promise<boolean>;
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
