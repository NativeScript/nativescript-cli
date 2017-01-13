export class InitCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public enableHooks = false;

	constructor(private $initService: IInitService) { }

	public async execute(args: string[]): Promise<void> {
		return this.$initService.initialize();
	}
}

$injector.registerCommand("init", InitCommand);
