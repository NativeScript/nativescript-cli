export class AddPlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $platformService: IPlatformService,
		private $errors: IErrors) { }

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.addPlatforms(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify a platform to add");
		}

		_.each(args, arg => this.$platformService.validatePlatform(arg));

		return true;
	}
}

$injector.registerCommand("platform|add", AddPlatformCommand);
