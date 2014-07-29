///<reference path="../.d.ts"/>
import helpers = require("./../common/helpers");
import util = require("util")

export class ListPlatformsCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $logger: ILogger) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			var availablePlatforms = this.$platformService.getAvailablePlatforms().wait();
			this.$logger.out("Available platforms: %s", helpers.formatListOfNames(availablePlatforms));

			var message = "No installed platforms found.";
			var installedPlatforms = this.$platformService.getInstalledPlatforms().wait();
			if (installedPlatforms.length > 0){
				message = util.format("Installed platforms: %s", helpers.formatListOfNames(installedPlatforms));
			}

			this.$logger.out(message);
		}).future<void>()();
	}
}
$injector.registerCommand("platform|*list", ListPlatformsCommand);
