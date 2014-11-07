///<reference path="../.d.ts"/>
"use strict";

export class RunCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.runPlatform(args[0]).wait();
		}).future<void>()();
	}

	allowedParameters = [this.$platformCommandParameter];
}
$injector.registerCommand("run", RunCommand);
