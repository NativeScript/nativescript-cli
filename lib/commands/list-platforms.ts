import * as helpers from "../common/helpers";
import { IProjectData } from "../definitions/project";
import { IPlatformCommandHelper } from "../declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export const listPlatformsCommandDefinition = defineCommand({
	name: "platform|*list",
	description: "Lists all platforms that the project currently targets.",
	arguments: "none",
	// In setup, not run: it lands ahead of the arguments policy, so being
	// outside a project is what a bad invocation reports first.
	setup(): void {
		inject<IProjectData>("projectData").initializeProjectData();
	},
	async run(): Promise<void> {
		const $platformCommandHelper = inject<IPlatformCommandHelper>(
			"platformCommandHelper",
		);
		const $projectData = inject<IProjectData>("projectData");
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
