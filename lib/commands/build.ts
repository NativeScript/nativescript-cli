///<reference path="../.d.ts"/>
"use strict";

export class BuildCommandBase {
	constructor(private $platformService: IPlatformService) { }

	executeCore(args: string[], buildConfig?: IBuildConfig): IFuture<void> {
		return this.$platformService.buildPlatform(args[0], buildConfig);
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
				private $platformsData: IPlatformsData,
				private $options: IOptions) {
		super($platformService);
	}

	public execute(args: string[]): IFuture<void> {
		let config = this.$options.staticBindings ? { runSbGenerator: true } : undefined;
		return this.executeCore([this.$platformsData.availablePlatforms.Android], config);
	}

	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("build|android", BuildAndroidCommand);
