import { IProjectData, IValidatePlatformOutput } from "../definitions/project";
import { IOptions, IPlatformValidationService } from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import {
	ICommandParameter,
	ICanExecuteCommandOptions,
	INotConfiguredEnvOptions,
} from "../common/definitions/commands";
import { ArgumentSpec } from "../common/define-command";
import { inject, Injector } from "../common/di";

/** Callable from `setup` and from `canExecute` before their first `await`. */
export function injectPlatformCommandServices() {
	return {
		$options: inject<IOptions>("options"),
		$platformsDataService: inject<IPlatformsDataService>(
			"platformsDataService",
		),
		$platformValidationService: inject<IPlatformValidationService>(
			"platformValidationService",
		),
		$projectData: inject<IProjectData>("projectData"),
	};
}

/**
 * What the platform-validation helpers below need. A command definition's
 * `setup` returns this shape (see `injectPlatformCommandServices`), so its
 * result can be handed straight to them.
 */
export type IPlatformCommandServices = ReturnType<
	typeof injectPlatformCommandServices
>;

/**
 * The declarative form of `$platformCommandParameter`. Initializing the
 * project data is what makes the platform check possible, so it stays part of
 * validating the argument instead of moving to `setup`, which the adapter runs
 * only after argument enforcement.
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
	services: IPlatformCommandServices,
	platform: string,
): Promise<boolean> {
	return services.$platformValidationService.validateOptions(
		services.$options.provision,
		services.$options.teamId,
		services.$projectData,
		platform,
	);
}

async function validatePlatformBase(
	services: IPlatformCommandServices,
	platform: string,
	notConfiguredEnvOptions: INotConfiguredEnvOptions,
): Promise<IValidatePlatformOutput> {
	const platformData = services.$platformsDataService.getPlatformData(
		platform,
		services.$projectData,
	);
	const platformProjectService = platformData.platformProjectService;
	const result = await platformProjectService.validate(
		services.$projectData,
		services.$options,
		notConfiguredEnvOptions,
	);
	return result;
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
	services: IPlatformCommandServices,
	platform: string,
	options: ICanExecuteCommandOptions = {},
): Promise<boolean> {
	const validatePlatformOutput = await validatePlatformBase(
		services,
		platform,
		options.notConfiguredEnvOptions,
	);
	const canExecute = hasUsableEnvironment(validatePlatformOutput);
	let result = canExecute;

	if (canExecute && options.validateOptions) {
		result = await validatePlatformOptions(services, platform);
	}

	return result;
}

/**
 * @deprecated Nothing extends this any more; the exported functions beside it carry
 * the same behaviour for definitions.
 */
export abstract class ValidatePlatformCommandBase {
	constructor(
		protected $options: IOptions,
		protected $platformsDataService: IPlatformsDataService,
		protected $platformValidationService: IPlatformValidationService,
		protected $projectData: IProjectData,
	) {}

	abstract allowedParameters: ICommandParameter[];
	abstract execute(args: string[]): Promise<void>;

	public canExecuteCommandBase(
		platform: string,
		options?: ICanExecuteCommandOptions,
	): Promise<boolean> {
		return canExecuteCommandBase(
			{
				$options: this.$options,
				$platformsDataService: this.$platformsDataService,
				$platformValidationService: this.$platformValidationService,
				$projectData: this.$projectData,
			},
			platform,
			options,
		);
	}
}
