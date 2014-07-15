///<reference path="../.d.ts"/>

export class RunCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.runPlatform(args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("run", RunCommand);

export class PrepareCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.preparePlatform(args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("prepare", PrepareCommand);

export class BuildCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.buildPlatform(args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("build", BuildCommand);