///<reference path="../.d.ts"/>
"use strict";

export class PrepareCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter) { }

	execute(args: string[]): IFuture<void> {
		return this.$platformService.preparePlatform(args[0]);
	}

	allowedParameters = [this.$platformCommandParameter];
}
$injector.registerCommand("prepare", PrepareCommand);
