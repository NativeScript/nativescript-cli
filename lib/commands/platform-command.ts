///<reference path="../.d.ts"/>
import helpers = require("./../common/helpers");

export class ListPlatformsCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $logger: ILogger) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			var availablePlatforms = this.$platformService.getAvailablePlatforms().wait();
			this.$logger.out("Available platforms: %s", helpers.formatListOfNames(availablePlatforms));

			var installedPlatforms = this.$platformService.getInstalledPlatforms().wait();
			this.$logger.out("Installed platforms %s", helpers.formatListOfNames(installedPlatforms));
		}).future<void>()();
	}
}
$injector.registerCommand("platform|*list", ListPlatformsCommand);

export class AddPlatformCommand implements ICommand {
	constructor(private $platformService: IPlatformService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$platformService.addPlatforms(args).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("platform|add", AddPlatformCommand);
