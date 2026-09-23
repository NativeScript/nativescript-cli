import { IProjectData, IValidatePlatformOutput } from "../definitions/project";
import { IOptions, IPlatformValidationService } from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import {
	ICanExecuteCommandOptions,
	INotConfiguredEnvOptions,
} from "../common/definitions/commands";
import {
	ArgumentSpec,
	CommandContext,
	CommandOptionsSchema,
	objectOption,
} from "../common/define-command";
import { Injector, inject } from "../common/di";
import type { Provider } from "../common/di/providers";
import { ProjectData } from "../contracts/project-data";
import {
	COMMAND_PRECONDITIONS,
	CommandPrecondition,
} from "../common/contracts/command-preconditions";

/**
 * The CLI-wide signing options `validatePlatformOptions` checks. A command
 * that validates them spreads this into its own schema.
 */
export const platformSigningOptions = {
	provision: objectOption(),
	teamId: objectOption(),
} satisfies CommandOptionsSchema;

/** The part of a command context these helpers read. */
type PlatformCommandContext = Pick<CommandContext<any>, "injector">;

type PlatformSigningContext = Pick<
	CommandContext<typeof platformSigningOptions>,
	"injector" | "options"
>;

/**
 * Declares that a command runs inside a project: the project the command line
 * names, through `--path` or the working directory, is resolved before the
 * command's setup and arguments policy, and its absence fails the invocation
 * with the "no project found" error. `inject(ProjectData)` then reads it.
 */
export function provideProject(): Provider {
	return {
		provide: COMMAND_PRECONDITIONS,
		multi: true,
		useValue: requireProject,
	};
}

const requireProject: CommandPrecondition = () => {
	const projectData = inject<IProjectData>("projectData");
	if (typeof projectData.initializeProjectData === "function") {
		projectData.initializeProjectData();
	}
};

/**
 * The declarative form of `$platformCommandParameter`. The command declares
 * `provideProject()`, so resolving the project here is what makes the
 * platform check possible before the command's own handlers run.
 */
export function validatePlatformArgument(
	targetInjector: Injector,
	platform: string,
): void {
	const projectData = targetInjector.get(ProjectData);
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
	context: PlatformSigningContext,
	platform: string,
): Promise<boolean> {
	const $projectData = context.injector.get(ProjectData);

	return context.injector
		.get<IPlatformValidationService>("platformValidationService")
		.validateOptions(
			context.options.provision,
			context.options.teamId,
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
	const $projectData = context.injector.get(ProjectData);
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

export function canExecuteCommandBase(
	context: PlatformSigningContext,
	platform: string,
	options: ICanExecuteCommandOptions & { validateOptions: true },
): Promise<boolean>;
export function canExecuteCommandBase(
	context: PlatformCommandContext,
	platform: string,
	options?: ICanExecuteCommandOptions & { validateOptions?: false },
): Promise<boolean>;
export async function canExecuteCommandBase(
	context: PlatformCommandContext | PlatformSigningContext,
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
		result = await validatePlatformOptions(
			<PlatformSigningContext>context,
			platform,
		);
	}

	return result;
}
