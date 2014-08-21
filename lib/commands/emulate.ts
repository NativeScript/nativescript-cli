///<reference path="../.d.ts"/>

export class EmulateCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> { return this.$platformService.deployOnEmulator(args[0]);}
}
$injector.registerCommand("emulate", EmulateCommand);