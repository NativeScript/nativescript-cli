import {
	canExecuteCommandBase,
	injectPlatformCommandServices,
	platformArgument,
	validatePlatformArgument,
	validatePlatformOptions,
} from "./command-base";
import { PrepareController } from "../controllers/prepare-controller";
import { PrepareDataService } from "../services/prepare-data-service";
import { IMigrateController } from "../definitions/migrate";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
} from "../common/define-command";
import { inject } from "../common/di";

export const prepareCommandOptions = {
	watch: booleanOption({ default: false }),
	hmr: booleanOption({ default: false }),
	skipNative: booleanOption({ default: false }),
	force: booleanOption(),
} satisfies CommandOptionsSchema;

export type PrepareCommandContext = CommandContext<
	typeof prepareCommandOptions
>;

export function setupPrepareCommand() {
	const services = {
		...injectPlatformCommandServices(),
		$prepareController: inject<PrepareController>("prepareController"),
		$prepareDataService: inject<PrepareDataService>("prepareDataService"),
		$migrateController: inject<IMigrateController>("migrateController"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export type IPrepareCommandServices = ReturnType<typeof setupPrepareCommand>;

export async function canExecutePrepareCommand(
	context: PrepareCommandContext,
	services: IPrepareCommandServices,
): Promise<boolean> {
	const platform = context.args[0];
	if (!platform) {
		// The declared argument validates only a platform that was passed; an
		// absent one is rejected by the same check.
		validatePlatformArgument(context.injector, platform);
	}

	const result = await validatePlatformOptions(services, platform);

	if (!context.options.force) {
		await services.$migrateController.validate({
			projectDir: services.$projectData.projectDir,
			platforms: [platform],
		});
	}

	if (!result) {
		return false;
	}

	return canExecuteCommandBase(services, platform);
}

export async function runPrepareCommand(
	context: PrepareCommandContext,
	services: IPrepareCommandServices,
): Promise<void> {
	const prepareData = services.$prepareDataService.getPrepareData(
		services.$projectData.projectDir,
		context.args[0],
		services.$options,
	);
	await services.$prepareController.prepare(prepareData);
}

export const prepareCommandDefinition = defineCommand({
	name: "prepare",
	description: "Copies common and platform-specific content to the platform.",
	options: prepareCommandOptions,
	arguments: [platformArgument],
	setup: setupPrepareCommand,
	canExecute: canExecutePrepareCommand,
	run: runPrepareCommand,
});
