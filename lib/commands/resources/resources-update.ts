import { IProjectData } from "../../definitions/project";
import { IAndroidResourcesMigrationService } from "../../declarations";
import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";

export const resourcesUpdateCommandDefinition = defineCommand({
	name: "resources|update",
	description:
		"Updates the App_Resources directory to the structure the current Android runtime expects.",
	arguments: "any",
	async canExecute(context): Promise<boolean> {
		const $androidResourcesMigrationService =
			inject<IAndroidResourcesMigrationService>(
				"androidResourcesMigrationService",
			);
		const $projectData = inject<IProjectData>("projectData");
		$projectData.initializeProjectData();

		let args = context.args;
		if (!args || args.length === 0) {
			// Command defaults to migrating the Android App_Resources, unless explicitly specified.
			// The default reaches this check only; the migration itself ignores the arguments.
			args = ["android"];
		}

		for (const platform of args) {
			if (!$androidResourcesMigrationService.canMigrate(platform)) {
				context.fail(
					`The ${platform} does not need to have its resources updated.`,
					{ help: false },
				);
			}

			if (
				$androidResourcesMigrationService.hasMigrated(
					$projectData.getAppResourcesDirectoryPath(),
				)
			) {
				context.fail(
					"The App_Resources have already been updated for the Android platform.",
					{ help: false },
				);
			}
		}

		return true;
	},
	async run(): Promise<void> {
		const $androidResourcesMigrationService =
			inject<IAndroidResourcesMigrationService>(
				"androidResourcesMigrationService",
			);
		const $projectData = inject<IProjectData>("projectData");
		$projectData.initializeProjectData();

		await $androidResourcesMigrationService.migrate(
			$projectData.getAppResourcesDirectoryPath(),
		);
	},
});
