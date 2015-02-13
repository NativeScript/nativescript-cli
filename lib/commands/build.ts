///<reference path="../.d.ts"/>
"use strict";

export class BuildCommandBase {
	constructor(private $platformService: IPlatformService) { }

	executeCore(args: string[]): IFuture<void> {
		return this.$platformService.buildPlatform(args[0]);
	}
}

export class BuildIosCommand extends BuildCommandBase implements  ICommand {
	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData) {
		super($platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}
}
$injector.registerCommand("build|ios", BuildIosCommand);


export class BuildAndroidCommand extends BuildCommandBase implements  ICommand {
	constructor($platformService: IPlatformService,
				private $platformsData: IPlatformsData) {
		super($platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.Android]);
	}
}
$injector.registerCommand("build|android", BuildAndroidCommand);
