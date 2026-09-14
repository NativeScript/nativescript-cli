import { IProjectData } from "../../definitions/project";
import { IAndroidResourcesMigrationService } from "../../declarations";
import { IErrors } from "../../common/declarations";
import { CommandContext, defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { registerCommand } from "../../common/services/command-definition-adapter";

export interface IResourcesUpdateCommandServices {
	$projectData: IProjectData;
	$errors: IErrors;
	$androidResourcesMigrationService: IAndroidResourcesMigrationService;
}

export function setupResourcesUpdateCommand(): IResourcesUpdateCommandServices {
	const services = {
		$projectData: inject<IProjectData>("projectData"),
		$errors: inject<IErrors>("errors"),
		$androidResourcesMigrationService:
			inject<IAndroidResourcesMigrationService>(
				"androidResourcesMigrationService",
			),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export async function canExecuteResourcesUpdateCommand(
	context: CommandContext,
	services: IResourcesUpdateCommandServices,
): Promise<boolean> {
	let args = context.args;
	if (!args || args.length === 0) {
		// Command defaults to migrating the Android App_Resources, unless explicitly specified.
		// The default reaches this check only; the migration itself ignores the arguments.
		args = ["android"];
	}

	for (const platform of args) {
		if (!services.$androidResourcesMigrationService.canMigrate(platform)) {
			services.$errors.fail(
				`The ${platform} does not need to have its resources updated.`,
			);
		}

		if (
			services.$androidResourcesMigrationService.hasMigrated(
				services.$projectData.getAppResourcesDirectoryPath(),
			)
		) {
			services.$errors.fail(
				"The App_Resources have already been updated for the Android platform.",
			);
		}
	}

	return true;
}

export const resourcesUpdateCommandDefinition = defineCommand({
	name: "resources|update",
	description:
		"Updates the App_Resources directory to the structure the current Android runtime expects.",
	arguments: "any",
	setup: setupResourcesUpdateCommand,
	canExecute: canExecuteResourcesUpdateCommand,
	async run(context, services): Promise<void> {
		await services.$androidResourcesMigrationService.migrate(
			services.$projectData.getAppResourcesDirectoryPath(),
		);
	},
});

registerCommand(resourcesUpdateCommandDefinition);
