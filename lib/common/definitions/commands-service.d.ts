interface ICommandsService {
	currentCommandData: ICommandData;
	allCommands(opts: {includeDevCommands: boolean}): string[];
	tryExecuteCommand(commandName: string, commandArguments: string[]): Promise<void>;
	executeCommandUnchecked(commandName: string, commandArguments: string[]): Promise<boolean>;
	completeCommand(): Promise<boolean>;
}

interface ICommandsServiceProvider {
	dynamicCommandsPrefix: string;
	getDynamicCommands(): Promise<string[]>;
	generateDynamicCommands(): Promise<void>;
	registerDynamicSubCommands(): void;
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
