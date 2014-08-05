///<reference path="../.d.ts"/>

export class RemovePlatformCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.removePlatforms(args).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("platform|remove", RemovePlatformCommand);