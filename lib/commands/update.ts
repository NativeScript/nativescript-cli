import { IProjectData } from "../definitions/project";
import { IMigrateController } from "../definitions/migrate";
import { IErrors } from "../common/declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";

export const SHOULD_MIGRATE_PROJECT_MESSAGE =
	'This project is not compatible with the current NativeScript version and cannot be updated. Use "ns migrate" to make your project compatible.';
export const PROJECT_UP_TO_DATE_MESSAGE = "This project is up to date.";

const updateCommandOptions = {
	markingMode: booleanOption(),
	frameworkPath: stringOption(),
} satisfies CommandOptionsSchema;

export type UpdateCommandContext = CommandContext<typeof updateCommandOptions>;

export function setupUpdateCommand() {
	const services = {
		$devicePlatformsConstants: inject<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		),
		$updateController: inject<IUpdateController>("updateController"),
		$migrateController: inject<IMigrateController>("migrateController"),
		$errors: inject<IErrors>("errors"),
		$logger: inject<ILogger>("logger"),
		$projectData: inject<IProjectData>("projectData"),
		$markingModeService: inject<IMarkingModeService>("markingModeService"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export type IUpdateCommandServices = ReturnType<typeof setupUpdateCommand>;

export async function canExecuteUpdateCommand(
	context: UpdateCommandContext,
	services: IUpdateCommandServices,
): Promise<boolean> {
	const shouldMigrate = await services.$migrateController.shouldMigrate({
		projectDir: services.$projectData.projectDir,
		platforms: [
			services.$devicePlatformsConstants.Android,
			services.$devicePlatformsConstants.iOS,
		],
		loose: true,
	});

	if (shouldMigrate) {
		services.$errors.fail(SHOULD_MIGRATE_PROJECT_MESSAGE);
	}

	return context.args.length < 2 && services.$projectData.projectDir !== "";
}

export async function runUpdateCommand(
	context: UpdateCommandContext,
	services: IUpdateCommandServices,
): Promise<void> {
	if (context.options.markingMode) {
		// ns update --markingMode
		await services.$markingModeService.handleMarkingModeFullDeprecation({
			projectDir: services.$projectData.projectDir,
			forceSwitch: true,
		});
		return;
	}

	if (
		!(await services.$updateController.shouldUpdate({
			projectDir: services.$projectData.projectDir,
			version: context.args[0],
		}))
	) {
		services.$logger.printMarkdown(`__${PROJECT_UP_TO_DATE_MESSAGE}__`);
		return;
	}

	await services.$updateController.update({
		projectDir: services.$projectData.projectDir,
		version: context.args[0],
		frameworkPath: context.options.frameworkPath,
	});
}

export const updateCommandDefinition = defineCommand({
	name: "update",
	description:
		"Updates the project with the latest versions of its NativeScript dependencies.",
	options: updateCommandOptions,
	arguments: "any",
	setup: setupUpdateCommand,
	canExecute: canExecuteUpdateCommand,
	run: runUpdateCommand,
});
