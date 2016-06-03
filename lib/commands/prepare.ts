export class PrepareCommand implements ICommand {
	constructor(private $errors: IErrors,
		private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			if (!this.$platformService.preparePlatform(args[0]).wait()) {
				this.$errors.failWithoutHelp("Unable to prepare the project.");
			}
		}).future<void>()();
	}

	allowedParameters = [this.$platformCommandParameter];
}
$injector.registerCommand("prepare", PrepareCommand);
