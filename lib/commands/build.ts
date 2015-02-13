///<reference path="../.d.ts"/>
"use strict";

export class BuildCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter) { }

	execute(args: string[]): IFuture<void> {
		return	this.$platformService.buildPlatform(args[0]);
	}

	allowedParameters = [this.$platformCommandParameter];
}
$injector.registerCommand("build", BuildCommand);