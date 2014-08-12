///<reference path="../.d.ts"/>

export class UpdatePlatformCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.updatePlatforms(args).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("platform|update", UpdatePlatformCommand);
