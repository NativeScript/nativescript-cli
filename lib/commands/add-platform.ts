export class AddPlatformCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $errors: IErrors) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.addPlatforms(args).wait();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(!args || args.length === 0) {
				this.$errors.fail("No platform specified. Please specify a platform to add");
			}

			_.each(args, arg => this.$platformService.validatePlatform(arg));

			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("platform|add", AddPlatformCommand);
