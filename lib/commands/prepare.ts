export class PrepareCommand implements ICommand {
	public allowedParameters = [this.$platformCommandParameter];

	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter) { }

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.preparePlatform(args[0]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return await this.$platformCommandParameter.validate(args[0]) && await this.$platformService.validateOptions(args[0]);
	}
}

$injector.registerCommand("prepare", PrepareCommand);
