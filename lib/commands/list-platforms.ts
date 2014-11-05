///<reference path="../.d.ts"/>
import helpers = require("./../common/helpers");
import util = require("util")

export class ListPlatformsCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $logger: ILogger) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			var installedPlatforms = this.$platformService.getInstalledPlatforms().wait();

			if(installedPlatforms.length > 0) {
				var preparedPlatforms = this.$platformService.getPreparedPlatforms().wait();
				if(preparedPlatforms.length > 0) {
					this.$logger.out("The project is prepared for: ", helpers.formatListOfNames(preparedPlatforms, "and"));
				} else {
					this.$logger.out("The project is not prepared for any platform");
				}
				this.$logger.out("Installed platforms: ", helpers.formatListOfNames(installedPlatforms, "and"));
			} else {
				this.$logger.out("Available platforms for this OS: ", helpers.formatListOfNames(this.$platformService.getAvailablePlatforms().wait(), "and"));
				this.$logger.out("No installed platforms found. Use $ tns platform add");
			}
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("platform|*list", ListPlatformsCommand);
