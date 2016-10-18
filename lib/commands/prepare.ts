export class PrepareCommand implements ICommand {
	constructor(private $errors: IErrors,
		private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.preparePlatform(args[0], true).wait();
		}).future<void>()();
	}

	allowedParameters = [this.$platformCommandParameter];
}
$injector.registerCommand("prepare", PrepareCommand);
