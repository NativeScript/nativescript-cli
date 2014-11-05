///<reference path="../.d.ts"/>
"use strict";

export class DeployOnDeviceCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter) { }

	execute(args: string[]): IFuture<void> {
		return this.$platformService.deployOnDevice(args[0]);
	}

	allowedParameters = [this.$platformCommandParameter];
}
$injector.registerCommand("deploy", DeployOnDeviceCommand);
