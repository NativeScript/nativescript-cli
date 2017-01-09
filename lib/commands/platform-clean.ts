export class CleanCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $errors: IErrors) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.removePlatforms(args);
			this.$platformService.addPlatforms(args).wait();
		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(!args || args.length === 0) {
				this.$errors.fail("No platform specified. Please specify a platform to clean");
			}

			_.each(args, arg => this.$platformService.validatePlatform(arg));

			return true;
		}).future<boolean>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("platform|clean", CleanCommand);
