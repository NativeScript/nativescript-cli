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
			var message = installedPlatforms.length > 0 ? helpers.formatListOfNames(installedPlatforms) : "No installed platforms found";
			this.$logger.out("Installed platforms: %s",  message);
		}).future<void>()();
	}
}
$injector.registerCommand("platform|*list", ListPlatformsCommand);


