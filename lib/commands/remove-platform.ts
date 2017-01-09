export class RemovePlatformCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $errors: IErrors) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.removePlatforms(args);
		}).future<void>()();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(!args || args.length === 0) {
				this.$errors.fail("No platform specified. Please specify a platform to remove");
			}

			_.each(args, arg => this.$platformService.validatePlatformInstalled(arg));

			return true;
		}).future<boolean>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("platform|remove", RemovePlatformCommand);
