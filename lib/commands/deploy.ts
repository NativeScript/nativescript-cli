///<reference path="../.d.ts"/>

export class DeployCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.deploy(args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("deploy", DeployCommand);