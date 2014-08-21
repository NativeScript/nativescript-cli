///<reference path="../.d.ts"/>

export class DeployOnDeviceCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return this.$platformService.deployOnDevice(args[0]);
	}
}
$injector.registerCommand("deploy", DeployOnDeviceCommand);