import * as helpers from "../common/helpers";

export class ListPlatformsCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $logger: ILogger) {
			this.$projectData.initializeProjectData();
		}

	public async execute(args: string[]): Promise<void> {
		let installedPlatforms = this.$platformService.getInstalledPlatforms(this.$projectData);

		if (installedPlatforms.length > 0) {
			let preparedPlatforms = this.$platformService.getPreparedPlatforms(this.$projectData);
			if (preparedPlatforms.length > 0) {
				this.$logger.out("The project is prepared for: ", helpers.formatListOfNames(preparedPlatforms, "and"));
			} else {
				this.$logger.out("The project is not prepared for any platform");
			}

			this.$logger.out("Installed platforms: ", helpers.formatListOfNames(installedPlatforms, "and"));
		} else {
			let formattedPlatformsList = helpers.formatListOfNames(this.$platformService.getAvailablePlatforms(this.$projectData), "and");
			this.$logger.out("Available platforms for this OS: ", formattedPlatformsList);
			this.$logger.out("No installed platforms found. Use $ tns platform add");
		}
	}
}

$injector.registerCommand("platform|*list", ListPlatformsCommand);
