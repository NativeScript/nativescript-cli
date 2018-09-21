export class HelpCommand implements ICommand {
	constructor(private $injector: IInjector,
		private $helpService: IHelpService,
		private $options: ICommonOptions) { }

	public enableHooks = false;
	public async canExecute(args: string[]): Promise<boolean> {
		return true;
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		let commandName = (args[0] || "").toLowerCase();
		let commandArguments = _.tail(args);
		const hierarchicalCommand = this.$injector.buildHierarchicalCommand(args[0], commandArguments);
		if (hierarchicalCommand) {
			commandName = hierarchicalCommand.commandName;
			commandArguments = hierarchicalCommand.remainingArguments;
		}

		const commandData: ICommandData = {
			commandName,
			commandArguments
		};

		if (this.$options.help) {
			await this.$helpService.showCommandLineHelp(commandData);
		} else {
			await this.$helpService.openHelpForCommandInBrowser(commandData);
		}
	}
}

$injector.registerCommand(["help", "/?"], HelpCommand);
