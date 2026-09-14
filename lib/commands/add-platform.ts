import {
	canExecuteCommandBase,
	injectPlatformCommandServices,
	IPlatformCommandServices,
} from "./command-base";
import { IPlatformCommandHelper } from "../declarations";
import { IErrors } from "../common/declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { registerCommand } from "../common/services/command-definition-adapter";

const addPlatformCommandOptions = {
	frameworkPath: stringOption(),
} satisfies CommandOptionsSchema;

export type AddPlatformCommandContext = CommandContext<
	typeof addPlatformCommandOptions
>;

export interface IAddPlatformCommandServices extends IPlatformCommandServices {
	$errors: IErrors;
	$platformCommandHelper: IPlatformCommandHelper;
}

export function setupAddPlatformCommand(): IAddPlatformCommandServices {
	const services = {
		...injectPlatformCommandServices(),
		$errors: inject<IErrors>("errors"),
		$platformCommandHelper: inject<IPlatformCommandHelper>(
			"platformCommandHelper",
		),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export async function canExecuteAddPlatformCommand(
	context: AddPlatformCommandContext,
	services: IAddPlatformCommandServices,
): Promise<boolean> {
	const args = context.args;
	if (!args || args.length === 0) {
		services.$errors.failWithHelp(
			"No platform specified. Please specify a platform to add.",
		);
	}

	let canExecute = true;
	for (const arg of args) {
		services.$platformValidationService.validatePlatform(
			arg,
			services.$projectData,
		);

		if (
			!services.$platformValidationService.isPlatformSupportedForOS(
				arg,
				services.$projectData,
			)
		) {
			services.$errors.fail(
				`Applications for platform ${arg} cannot be built on this OS`,
			);
		}

		// The assignment overwrites the previous platform's verdict, so only the
		// last one decides. Kept as it was.
		canExecute = await canExecuteCommandBase(services, arg);
	}

	return canExecute;
}

export async function runAddPlatformCommand(
	context: AddPlatformCommandContext,
	services: IAddPlatformCommandServices,
): Promise<void> {
	await services.$platformCommandHelper.addPlatforms(
		context.args,
		services.$projectData,
		context.options.frameworkPath,
	);
}

export const addPlatformCommandDefinition = defineCommand({
	name: "platform|add",
	description:
		"Configures the current project to target the selected platform.",
	options: addPlatformCommandOptions,
	arguments: "any",
	setup: setupAddPlatformCommand,
	canExecute: canExecuteAddPlatformCommand,
	run: runAddPlatformCommand,
});

registerCommand(addPlatformCommandDefinition);
