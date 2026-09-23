import {
	canExecuteCommandBase,
	platformArgument,
	platformSigningOptions,
	provideProject,
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
import { IOptions } from "../declarations";
import { ProjectData } from "../contracts/project-data";

export const prepareCommandOptions = {
	...platformSigningOptions,
	watch: booleanOption({ default: false }),
	hmr: booleanOption({ default: false }),
	skipNative: booleanOption({ default: false }),
	force: booleanOption(),
} satisfies CommandOptionsSchema;

type PrepareCommandContext = CommandContext<typeof prepareCommandOptions>;

async function canExecutePrepareCommand(
	context: PrepareCommandContext,
): Promise<boolean> {
	const $migrateController =
		context.injector.get<IMigrateController>("migrateController");
	const $projectData = context.injector.get(ProjectData);

	const platform = context.args[0];
	if (!platform) {
		// The declared argument validates only a platform that was passed; an
		// absent one is rejected by the same check.
		validatePlatformArgument(context.injector, platform);
	}

	const result = await validatePlatformOptions(context, platform);

	if (!context.options.force) {
		await $migrateController.validate({
			projectDir: $projectData.projectDir,
			platforms: [platform],
		});
	}

	if (!result) {
		return false;
	}

	return canExecuteCommandBase(context, platform);
}

export async function runPrepareCommand(
	context: PrepareCommandContext,
): Promise<void> {
	const $options = context.injector.get<IOptions>("options");
	const $prepareController =
		context.injector.get<PrepareController>("prepareController");
	const $prepareDataService =
		context.injector.get<PrepareDataService>("prepareDataService");
	const $projectData = context.injector.get(ProjectData);

	const prepareData = $prepareDataService.getPrepareData(
		$projectData.projectDir,
		context.args[0],
		$options,
	);
	await $prepareController.prepare(prepareData);
}

export const prepareCommandDefinition = defineCommand({
	name: "prepare",
	description: "Copies common and platform-specific content to the platform.",
	options: prepareCommandOptions,
	arguments: [platformArgument],
	providers: [provideProject()],
	canExecute: canExecutePrepareCommand,
	run: runPrepareCommand,
});
