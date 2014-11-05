///<reference path="../.d.ts"/>

export class EmulateCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter) { }

	execute(args: string[]): IFuture<void> { return this.$platformService.deployOnEmulator(args[0]); }

	allowedParameters = [this.$platformCommandParameter];
}
$injector.registerCommand("emulate", EmulateCommand);
