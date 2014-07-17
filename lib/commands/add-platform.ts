///<reference path="../.d.ts"/>

export class AddPlatformCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.addPlatforms(args).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("platform|add", AddPlatformCommand);