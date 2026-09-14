import * as _ from "lodash";
import { IProjectData } from "../definitions/project";
import {
	IOptions,
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import { IPlatformEnvironmentRequirements } from "../definitions/platform";
import { IErrors } from "../common/declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";

const platformCleanCommandOptions = {
	frameworkPath: stringOption(),
} satisfies CommandOptionsSchema;

export type PlatformCleanCommandContext = CommandContext<
	typeof platformCleanCommandOptions
>;

export function setupPlatformCleanCommand() {
	const services = {
		$errors: inject<IErrors>("errors"),
		$options: inject<IOptions>("options"),
		$platformCommandHelper: inject<IPlatformCommandHelper>(
			"platformCommandHelper",
		),
		$platformValidationService: inject<IPlatformValidationService>(
			"platformValidationService",
		),
		$platformEnvironmentRequirements: inject<IPlatformEnvironmentRequirements>(
			"platformEnvironmentRequirements",
		),
		$projectData: inject<IProjectData>("projectData"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export type IPlatformCleanCommandServices = ReturnType<
	typeof setupPlatformCleanCommand
>;

export async function canExecutePlatformCleanCommand(
	context: PlatformCleanCommandContext,
	services: IPlatformCleanCommandServices,
): Promise<boolean> {
	const args = context.args;
	if (!args || args.length === 0) {
		services.$errors.failWithHelp(
			"No platform specified. Please specify a platform to clean.",
		);
	}

	_.each(args, (platform) => {
		services.$platformValidationService.validatePlatform(
			platform,
			services.$projectData,
		);
	});

	for (const platform of args) {
		services.$platformValidationService.validatePlatformInstalled(
			platform,
			services.$projectData,
		);

		const currentRuntimeVersion =
			services.$platformCommandHelper.getCurrentPlatformVersion(
				platform,
				services.$projectData,
			);
		await services.$platformEnvironmentRequirements.checkEnvironmentRequirements(
			{
				platform,
				projectDir: services.$projectData.projectDir,
				runtimeVersion: currentRuntimeVersion,
				options: services.$options,
			},
		);
	}

	return true;
}

export async function runPlatformCleanCommand(
	context: PlatformCleanCommandContext,
	services: IPlatformCleanCommandServices,
): Promise<void> {
	await services.$platformCommandHelper.cleanPlatforms(
		context.args,
		services.$projectData,
		context.options.frameworkPath,
	);
}

export const platformCleanCommandDefinition = defineCommand({
	name: "platform|clean",
	description: "Removes and adds again the selected platform.",
	options: platformCleanCommandOptions,
	arguments: "any",
	setup: setupPlatformCleanCommand,
	canExecute: canExecutePlatformCleanCommand,
	run: runPlatformCleanCommand,
});
