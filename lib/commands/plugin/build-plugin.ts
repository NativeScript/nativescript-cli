import { EOL } from "os";
import * as path from "path";
import * as constants from "../../constants";
import {
	IAndroidPluginBuildService,
	IPluginBuildOptions,
} from "../../definitions/android-plugin-migrator";
import { IFileSystem } from "../../common/declarations";
import {
	Command,
	CommandOptionsInput,
	CommandOptionsSchema,
	stringOption,
} from "../../common/define-command";
import { CliOptions } from "../../common/contracts/cli-options";
import { inject } from "../../common/di";
import { ITempService } from "../../definitions/temp-service";

const buildPluginCommandOptions = [
	CliOptions,
	{
		gradlePath: stringOption(),
		gradleArgs: stringOption(),
	} satisfies CommandOptionsSchema,
] satisfies CommandOptionsInput;

export class BuildPluginCommand extends Command({
	name: "plugin|build",
	description:
		"Builds the Android parts of a NativeScript plugin into an `.aar`.",
	options: buildPluginCommandOptions,
	params: "any",
}) {
	private $androidPluginBuildService = inject<IAndroidPluginBuildService>(
		"androidPluginBuildService",
	);
	private $logger = inject<ILogger>("logger");
	private $fs = inject<IFileSystem>("fs");
	private $tempService = inject<ITempService>("tempService");

	private pluginProjectPath = path.resolve(this.options.path || ".");

	public async canExecute(): Promise<boolean> {
		if (
			!this.$fs.exists(
				path.join(
					this.pluginProjectPath,
					constants.PLATFORMS_DIR_NAME,
					"android",
				),
			)
		) {
			this.context.fail(
				"No plugin found at the current directory, or the plugin does not need to have its platforms/android components built into an `.aar`.",
				{ help: false },
			);
		}

		return true;
	}

	public async run(): Promise<void> {
		const platformsAndroidPath = path.join(
			this.pluginProjectPath,
			constants.PLATFORMS_DIR_NAME,
			"android",
		);
		let pluginName = "";

		const pluginPackageJsonPath = path.join(
			this.pluginProjectPath,
			constants.PACKAGE_JSON_FILE_NAME,
		);

		if (this.$fs.exists(pluginPackageJsonPath)) {
			const packageJsonContents = this.$fs.readJson(pluginPackageJsonPath);

			if (packageJsonContents && packageJsonContents["name"]) {
				pluginName = packageJsonContents["name"];
			}
		}

		const tempAndroidProject =
			await this.$tempService.mkdirSync("android-project");

		const options: IPluginBuildOptions = {
			gradlePath: this.options.gradlePath,
			gradleArgs: this.options.gradleArgs,
			aarOutputDir: platformsAndroidPath,
			platformsAndroidDirPath: platformsAndroidPath,
			pluginName: pluginName,
			tempPluginDirPath: tempAndroidProject,
		};

		const androidPluginBuildResult =
			await this.$androidPluginBuildService.buildAar(options);

		if (androidPluginBuildResult) {
			this.$logger.info(
				`${pluginName} successfully built aar at ${platformsAndroidPath}.${EOL}Temporary Android project can be found at ${tempAndroidProject}.`,
			);
		}

		const migratedIncludeGradle =
			this.$androidPluginBuildService.migrateIncludeGradle(options);

		if (migratedIncludeGradle) {
			this.$logger.info(`${pluginName} include gradle updated.`);
		}
	}
}
