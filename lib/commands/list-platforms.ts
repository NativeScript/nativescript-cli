import * as helpers from "../common/helpers";
import { IProjectData } from "../definitions/project";
import { IPlatformCommandHelper } from "../declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export function setupListPlatformsCommand() {
	const services = {
		$platformCommandHelper: inject<IPlatformCommandHelper>(
			"platformCommandHelper",
		),
		$projectData: inject<IProjectData>("projectData"),
		$logger: inject<ILogger>("logger"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export type IListPlatformsCommandServices = ReturnType<
	typeof setupListPlatformsCommand
>;

export const listPlatformsCommandDefinition = defineCommand({
	name: "platform|*list",
	description: "Lists all platforms that the project currently targets.",
	arguments: "none",
	setup: setupListPlatformsCommand,
	async run(context, services): Promise<void> {
		const installedPlatforms =
			services.$platformCommandHelper.getInstalledPlatforms(
				services.$projectData,
			);

		if (installedPlatforms.length > 0) {
			const preparedPlatforms =
				services.$platformCommandHelper.getPreparedPlatforms(
					services.$projectData,
				);
			if (preparedPlatforms.length > 0) {
				services.$logger.info(
					"The project is prepared for: ",
					helpers.formatListOfNames(preparedPlatforms, "and"),
				);
			} else {
				services.$logger.info("The project is not prepared for any platform");
			}

			services.$logger.info(
				"Installed platforms: ",
				helpers.formatListOfNames(installedPlatforms, "and"),
			);
		} else {
			const formattedPlatformsList = helpers.formatListOfNames(
				services.$platformCommandHelper.getAvailablePlatforms(
					services.$projectData,
				),
				"and",
			);
			services.$logger.info(
				"Available platforms for this OS: ",
				formattedPlatformsList,
			);
			services.$logger.info(
				"No installed platforms found. Use $ ns platform add",
			);
		}
	},
});
