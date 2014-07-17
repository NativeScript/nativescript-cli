///<reference path="../.d.ts"/>

export class PrepareCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.preparePlatform(args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("prepare", PrepareCommand);
