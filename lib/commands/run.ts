///<reference path="../.d.ts"/>
"use strict";

export class RunCommandBase {
	constructor(private $platformService: IPlatformService) { }

	public executeCore(args: string[]): IFuture<void> {
		return this.$platformService.runPlatform(args[0]);
	}
}

export class RunIosCommand extends RunCommandBase implements ICommand {
	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData) {
		super($platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}
}
$injector.registerCommand("run|ios", RunIosCommand);

export class RunAndroidCommand extends RunCommandBase implements ICommand {
	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData) {
		super($platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.Android]);
	}
}
$injector.registerCommand("run|android", RunAndroidCommand);
