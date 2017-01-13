export class UpdatePlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $platformService: IPlatformService,
		private $errors: IErrors) { }

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.updatePlatforms(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify platforms to update.");
		}

		_.each(args, arg => this.$platformService.validatePlatform(arg.split("@")[0]));

		return true;
	}
}

$injector.registerCommand("platform|update", UpdatePlatformCommand);
