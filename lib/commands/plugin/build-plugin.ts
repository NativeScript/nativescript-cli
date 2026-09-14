import { EOL } from "os";
import * as path from "path";
import * as constants from "../../constants";
import {
	IAndroidPluginBuildService,
	IPluginBuildOptions,
} from "../../definitions/android-plugin-migrator";
import { IErrors, IFileSystem } from "../../common/declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../common/define-command";
import { inject } from "../../common/di";
import { ITempService } from "../../definitions/temp-service";

const buildPluginCommandOptions = {
	path: stringOption(),
	gradlePath: stringOption(),
	gradleArgs: stringOption(),
} satisfies CommandOptionsSchema;

export type BuildPluginCommandContext = CommandContext<
	typeof buildPluginCommandOptions
>;

export function setupBuildPluginCommand(context: BuildPluginCommandContext) {
	return {
		pluginProjectPath: path.resolve(context.options.path || "."),
		$androidPluginBuildService: inject<IAndroidPluginBuildService>(
			"androidPluginBuildService",
		),
		$errors: inject<IErrors>("errors"),
		$logger: inject<ILogger>("logger"),
		$fs: inject<IFileSystem>("fs"),
		$tempService: inject<ITempService>("tempService"),
	};
}

export type IBuildPluginCommandServices = ReturnType<
	typeof setupBuildPluginCommand
>;

export async function canExecuteBuildPluginCommand(
	context: BuildPluginCommandContext,
	services: IBuildPluginCommandServices,
): Promise<boolean> {
	if (
		!services.$fs.exists(
			path.join(
				services.pluginProjectPath,
				constants.PLATFORMS_DIR_NAME,
				"android",
			),
		)
	) {
		services.$errors.fail(
			"No plugin found at the current directory, or the plugin does not need to have its platforms/android components built into an `.aar`.",
		);
	}

	return true;
}

export async function runBuildPluginCommand(
	context: BuildPluginCommandContext,
	services: IBuildPluginCommandServices,
): Promise<void> {
	const platformsAndroidPath = path.join(
		services.pluginProjectPath,
		constants.PLATFORMS_DIR_NAME,
		"android",
	);
	let pluginName = "";

	const pluginPackageJsonPath = path.join(
		services.pluginProjectPath,
		constants.PACKAGE_JSON_FILE_NAME,
	);

	if (services.$fs.exists(pluginPackageJsonPath)) {
		const packageJsonContents = services.$fs.readJson(pluginPackageJsonPath);

		if (packageJsonContents && packageJsonContents["name"]) {
			pluginName = packageJsonContents["name"];
		}
	}

	const tempAndroidProject =
		await services.$tempService.mkdirSync("android-project");

	const options: IPluginBuildOptions = {
		gradlePath: context.options.gradlePath,
		gradleArgs: context.options.gradleArgs,
		aarOutputDir: platformsAndroidPath,
		platformsAndroidDirPath: platformsAndroidPath,
		pluginName: pluginName,
		tempPluginDirPath: tempAndroidProject,
	};

	const androidPluginBuildResult =
		await services.$androidPluginBuildService.buildAar(options);

	if (androidPluginBuildResult) {
		services.$logger.info(
			`${pluginName} successfully built aar at ${platformsAndroidPath}.${EOL}Temporary Android project can be found at ${tempAndroidProject}.`,
		);
	}

	const migratedIncludeGradle =
		services.$androidPluginBuildService.migrateIncludeGradle(options);

	if (migratedIncludeGradle) {
		services.$logger.info(`${pluginName} include gradle updated.`);
	}
}

export const buildPluginCommandDefinition = defineCommand({
	name: "plugin|build",
	description:
		"Builds the Android parts of a NativeScript plugin into an `.aar`.",
	options: buildPluginCommandOptions,
	arguments: "any",
	setup: setupBuildPluginCommand,
	canExecute: canExecuteBuildPluginCommand,
	run: runBuildPluginCommand,
});
