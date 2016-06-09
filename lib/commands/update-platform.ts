export class UpdatePlatformCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $errors:IErrors) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.updatePlatforms(args).wait();
		}).future<void>()();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(!args || args.length === 0) {
				this.$errors.fail("No platform specified. Please specify platforms to update.");
			}

			_.each(args, arg => this.$platformService.validatePlatform(arg.split("@")[0]));

			return true;
		}).future<boolean>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("platform|update", UpdatePlatformCommand);
