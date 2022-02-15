import { EOL } from "os";
import * as path from "path";
import * as constants from "../../constants";
import { IOptions } from "../../declarations";
import {
	IAndroidPluginBuildService,
	IPluginBuildOptions,
} from "../../definitions/android-plugin-migrator";
import { ICommand, ICommandParameter } from "../../common/definitions/commands";
import { IErrors, IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";
import { ITempService } from "../../definitions/temp-service";

export class BuildPluginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public pluginProjectPath: string;

	constructor(
		private $androidPluginBuildService: IAndroidPluginBuildService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $tempService: ITempService
	) {
		this.pluginProjectPath = path.resolve(this.$options.path || ".");
	}

	public async execute(args: string[]): Promise<void> {
		const platformsAndroidPath = path.join(
			this.pluginProjectPath,
			constants.PLATFORMS_DIR_NAME,
			"android"
		);
		let pluginName = "";

		const pluginPackageJsonPath = path.join(
			this.pluginProjectPath,
			constants.PACKAGE_JSON_FILE_NAME
		);

		if (this.$fs.exists(pluginPackageJsonPath)) {
			const packageJsonContents = this.$fs.readJson(pluginPackageJsonPath);

			if (packageJsonContents && packageJsonContents["name"]) {
				pluginName = packageJsonContents["name"];
			}
		}

		const tempAndroidProject = await this.$tempService.mkdirSync(
			"android-project"
		);

		const options: IPluginBuildOptions = {
			gradlePath: this.$options.gradlePath,
			aarOutputDir: platformsAndroidPath,
			platformsAndroidDirPath: platformsAndroidPath,
			pluginName: pluginName,
			tempPluginDirPath: tempAndroidProject,
		};

		const androidPluginBuildResult = await this.$androidPluginBuildService.buildAar(
			options
		);

		if (androidPluginBuildResult) {
			this.$logger.info(
				`${pluginName} successfully built aar at ${platformsAndroidPath}.${EOL}Temporary Android project can be found at ${tempAndroidProject}.`
			);
		}

		const migratedIncludeGradle = this.$androidPluginBuildService.migrateIncludeGradle(
			options
		);

		if (migratedIncludeGradle) {
			this.$logger.info(`${pluginName} include gradle updated.`);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (
			!this.$fs.exists(
				path.join(
					this.pluginProjectPath,
					constants.PLATFORMS_DIR_NAME,
					"android"
				)
			)
		) {
			this.$errors.fail(
				"No plugin found at the current directory, or the plugin does not need to have its platforms/android components built into an `.aar`."
			);
		}

		return true;
	}
}

injector.registerCommand("plugin|build", BuildPluginCommand);
