export class RemovePlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $platformService: IPlatformService,
		private $errors: IErrors) { }

	public async execute(args: string[]): Promise<void> {
		this.$platformService.removePlatforms(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify a platform to remove");
		}

		_.each(args, arg => this.$platformService.validatePlatformInstalled(arg));

		return true;
	}
}

$injector.registerCommand("platform|remove", RemovePlatformCommand);
