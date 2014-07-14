///<reference path="../.d.ts"/>

export class ListPlatformsCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
		}).future<void>()();
	}
}
$injector.registerCommand("platform|*list", ListPlatformsCommand);

export class AddPlatformCommand implements ICommand {
    constructor(private $platformService: IPlatformService) { }

    execute(args: string[]): IFuture<void> {
        return (() => {
            this.$platformService.addPlatforms(args).wait();
        }).future<void>()();
    }
}
$injector.registerCommand("platform|add", AddPlatformCommand);
