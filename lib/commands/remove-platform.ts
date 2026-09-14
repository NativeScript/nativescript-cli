import * as _ from "lodash";
import { IProjectData } from "../definitions/project";
import {
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import { IErrors } from "../common/declarations";
import { CommandContext, defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { registerCommand } from "../common/services/command-definition-adapter";

export interface IRemovePlatformCommandServices {
	$errors: IErrors;
	$platformCommandHelper: IPlatformCommandHelper;
	$platformValidationService: IPlatformValidationService;
	$projectData: IProjectData;
}

export function setupRemovePlatformCommand(): IRemovePlatformCommandServices {
	const services = {
		$errors: inject<IErrors>("errors"),
		$platformCommandHelper: inject<IPlatformCommandHelper>(
			"platformCommandHelper",
		),
		$platformValidationService: inject<IPlatformValidationService>(
			"platformValidationService",
		),
		$projectData: inject<IProjectData>("projectData"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export async function canExecuteRemovePlatformCommand(
	context: CommandContext,
	services: IRemovePlatformCommandServices,
): Promise<boolean> {
	const args = context.args;
	if (!args || args.length === 0) {
		services.$errors.failWithHelp(
			"No platform specified. Please specify a platform to remove.",
		);
	}

	_.each(args, (platform) => {
		services.$platformValidationService.validatePlatform(
			platform,
			services.$projectData,
		);
	});

	return true;
}

export function runRemovePlatformCommand(
	context: CommandContext,
	services: IRemovePlatformCommandServices,
): Promise<void> {
	return services.$platformCommandHelper.removePlatforms(
		context.args,
		services.$projectData,
	);
}

export const removePlatformCommandDefinition = defineCommand({
	name: "platform|remove",
	description:
		"Removes the selected platform from the platforms that the project currently targets.",
	arguments: "any",
	setup: setupRemovePlatformCommand,
	canExecute: canExecuteRemovePlatformCommand,
	run: runRemovePlatformCommand,
});

registerCommand(removePlatformCommandDefinition);
