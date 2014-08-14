///<reference path="../.d.ts"/>
import helpers = require("./../common/helpers");
import util = require("util")

export class ListPlatformsCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $logger: ILogger) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			var availablePlatforms = this.$platformService.getAvailablePlatforms().wait();
			if(availablePlatforms.length > 0) {
				this.$logger.out("Available platforms: %s", helpers.formatListOfNames(availablePlatforms));
			} else {
				this.$logger.out("No available platforms found.");
			}

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
