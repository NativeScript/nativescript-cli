import * as _ from "lodash";
import { IProjectData } from "../definitions/project";
import {
	IOptions,
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import {
	IPlatformEnvironmentRequirements,
	ICheckEnvironmentRequirementsInput,
} from "../definitions/platform";
import { IErrors } from "../common/declarations";
import { CommandContext, defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export function setupUpdatePlatformCommand() {
	const services = {
		$errors: inject<IErrors>("errors"),
		$options: inject<IOptions>("options"),
		$platformEnvironmentRequirements: inject<IPlatformEnvironmentRequirements>(
			"platformEnvironmentRequirements",
		),
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

export type IUpdatePlatformCommandServices = ReturnType<
	typeof setupUpdatePlatformCommand
>;

export async function canExecuteUpdatePlatformCommand(
	context: CommandContext,
	services: IUpdatePlatformCommandServices,
): Promise<boolean> {
	const args = context.args;
	if (!args || args.length === 0) {
		services.$errors.failWithHelp(
			"No platform specified. Please specify platforms to update.",
		);
	}

	_.each(args, (arg) => {
		const platform = arg.split("@")[0];
		services.$platformValidationService.validatePlatform(
			platform,
			services.$projectData,
		);
	});

	for (const arg of args) {
		const [platform, versionToBeInstalled] = arg.split("@");
		const checkEnvironmentRequirementsInput: ICheckEnvironmentRequirementsInput =
			{
				platform,
				options: services.$options,
			};
		// If version is not specified, we know the command will install the latest compatible Android runtime.
		// The latest compatible Android runtime supports Java version, so we do not need to pass it here.
		// Passing projectDir to the @nativescript/doctor validation will cause it to check the runtime from the current package.json
		// So in this case, where we do not want to validate the runtime, just do not pass both projectDir and runtimeVersion.
		if (versionToBeInstalled) {
			checkEnvironmentRequirementsInput.projectDir =
				services.$projectData.projectDir;
			checkEnvironmentRequirementsInput.runtimeVersion = versionToBeInstalled;
		}

		await services.$platformEnvironmentRequirements.checkEnvironmentRequirements(
			checkEnvironmentRequirementsInput,
		);
	}

	return true;
}

export async function runUpdatePlatformCommand(
	context: CommandContext,
	services: IUpdatePlatformCommandServices,
): Promise<void> {
	await services.$platformCommandHelper.updatePlatforms(
		context.args,
		services.$projectData,
	);
}

export const updatePlatformCommandDefinition = defineCommand({
	name: "platform|update",
	description: "Updates the NativeScript runtime for the specified platform.",
	arguments: "any",
	setup: setupUpdatePlatformCommand,
	canExecute: canExecuteUpdatePlatformCommand,
	run: runUpdatePlatformCommand,
});
