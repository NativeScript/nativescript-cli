import * as helpers from "../common/helpers";

export class ListPlatformsCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $logger: ILogger) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			let installedPlatforms = this.$platformService.getInstalledPlatforms();

			if(installedPlatforms.length > 0) {
				let preparedPlatforms = this.$platformService.getPreparedPlatforms();
				if(preparedPlatforms.length > 0) {
					this.$logger.out("The project is prepared for: ", helpers.formatListOfNames(preparedPlatforms, "and"));
				} else {
					this.$logger.out("The project is not prepared for any platform");
				}
				this.$logger.out("Installed platforms: ", helpers.formatListOfNames(installedPlatforms, "and"));
			} else {
				let formattedPlatformsList = helpers.formatListOfNames(this.$platformService.getAvailablePlatforms(), "and");
				this.$logger.out("Available platforms for this OS: ", formattedPlatformsList);
				this.$logger.out("No installed platforms found. Use $ tns platform add");
			}
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("platform|*list", ListPlatformsCommand);
