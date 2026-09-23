import * as helpers from "../common/helpers";
import { IPlatformCommandHelper } from "../declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { ProjectData } from "../contracts/project-data";
import { provideProject } from "./command-base";

export const listPlatformsCommandDefinition = defineCommand({
	name: "platform|*list",
	description: "Lists all platforms that the project currently targets.",
	arguments: "none",
	providers: [provideProject()],
	async run(): Promise<void> {
		const $platformCommandHelper = inject<IPlatformCommandHelper>(
			"platformCommandHelper",
		);
		const $projectData = inject(ProjectData);
		const $logger = inject<ILogger>("logger");
		const installedPlatforms =
			$platformCommandHelper.getInstalledPlatforms($projectData);

		if (installedPlatforms.length > 0) {
			const preparedPlatforms =
				$platformCommandHelper.getPreparedPlatforms($projectData);
			if (preparedPlatforms.length > 0) {
				$logger.info(
					"The project is prepared for: ",
					helpers.formatListOfNames(preparedPlatforms, "and"),
				);
			} else {
				$logger.info("The project is not prepared for any platform");
			}

			$logger.info(
				"Installed platforms: ",
				helpers.formatListOfNames(installedPlatforms, "and"),
			);
		} else {
			const formattedPlatformsList = helpers.formatListOfNames(
				$platformCommandHelper.getAvailablePlatforms($projectData),
				"and",
			);
			$logger.info("Available platforms for this OS: ", formattedPlatformsList);
			$logger.info("No installed platforms found. Use $ ns platform add");
		}
	},
});
