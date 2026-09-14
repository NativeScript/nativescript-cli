import { IProjectData, IValidatePlatformOutput } from "../definitions/project";
import { IOptions, IPlatformValidationService } from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import {
	ICanExecuteCommandOptions,
	INotConfiguredEnvOptions,
} from "../common/definitions/commands";
import { ArgumentSpec, CommandContext } from "../common/define-command";
import { Injector } from "../common/di";

/** The part of a command context these helpers read. */
type PlatformCommandContext = Pick<CommandContext<any>, "injector">;

/**
 * The declarative form of `$platformCommandParameter`. Initializing the
 * project data is what makes the platform check possible, so it stays part of
 * validating the argument instead of moving to the command's own handlers,
 * which the adapter runs only after argument enforcement.
 */
export function validatePlatformArgument(
	targetInjector: Injector,
	platform: string,
): void {
	const projectData = targetInjector.get<IProjectData>("projectData");
	projectData.initializeProjectData();
	targetInjector
		.get<IPlatformValidationService>("platformValidationService")
		.validatePlatform(platform, projectData);
}

/** The `platform` positional argument, shared by prepare, deploy and embed. */
export const platformArgument: ArgumentSpec<any> = {
	name: "platform",
	validate(value, context) {
		validatePlatformArgument(context.injector, value);
		return true;
	},
};

export function validatePlatformOptions(
	context: PlatformCommandContext,
	platform: string,
): Promise<boolean> {
	const $options = context.injector.get<IOptions>("options");
	const $projectData = context.injector.get<IProjectData>("projectData");

	return context.injector
		.get<IPlatformValidationService>("platformValidationService")
		.validateOptions(
			$options.provision,
			$options.teamId,
			$projectData,
			platform,
		);
}

async function validatePlatformBase(
	context: PlatformCommandContext,
	platform: string,
	notConfiguredEnvOptions: INotConfiguredEnvOptions,
): Promise<IValidatePlatformOutput> {
	const $options = context.injector.get<IOptions>("options");
	const $projectData = context.injector.get<IProjectData>("projectData");
	const platformData = context.injector
		.get<IPlatformsDataService>("platformsDataService")
		.getPlatformData(platform, $projectData);

	return platformData.platformProjectService.validate(
		$projectData,
		$options,
		notConfiguredEnvOptions,
	);
}

function hasUsableEnvironment(
	validatePlatformOutput: IValidatePlatformOutput,
): boolean {
	return (
		validatePlatformOutput &&
		validatePlatformOutput.checkEnvironmentRequirementsOutput &&
		validatePlatformOutput.checkEnvironmentRequirementsOutput.canExecute
	);
}

export async function canExecuteCommandBase(
	context: PlatformCommandContext,
	platform: string,
	options: ICanExecuteCommandOptions = {},
): Promise<boolean> {
	const validatePlatformOutput = await validatePlatformBase(
		context,
		platform,
		options.notConfiguredEnvOptions,
	);
	const canExecute = hasUsableEnvironment(validatePlatformOutput);
	let result = canExecute;

	if (canExecute && options.validateOptions) {
		result = await validatePlatformOptions(context, platform);
	}

	return result;
}
