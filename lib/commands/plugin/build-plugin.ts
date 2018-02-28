import { EOL } from "os";
import * as path from "path";
import * as constants from "../../constants";
export class BuildPluginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public pluginProjectPath: string;

	constructor(private $androidPluginBuildService: IAndroidPluginBuildService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $options: IOptions) {

		if (this.$options.path) {
			this.pluginProjectPath = path.resolve(this.$options.path);
		} else {
			this.pluginProjectPath = path.resolve(".");
		}
	}

	public async execute(args: string[]): Promise<void> {
		const platformsAndroidPath = path.join(this.pluginProjectPath, constants.PLATFORMS_DIR_NAME, "android");
		let pluginName = "";

		const pluginPackageJsonPath = path.join(this.pluginProjectPath, constants.PACKAGE_JSON_FILE_NAME);

		if (this.$fs.exists(pluginPackageJsonPath)) {
			const packageJsonContents = this.$fs.readJson(pluginPackageJsonPath);

			if (packageJsonContents && packageJsonContents["name"]) {
				pluginName = packageJsonContents["name"];
			}
		}

		const tempAndroidProject = path.join(platformsAndroidPath, "android-project");

		const options: IBuildOptions = {
			aarOutputDir: platformsAndroidPath,
			platformsAndroidDirPath: platformsAndroidPath,
			pluginName: pluginName,
			tempPluginDirPath: tempAndroidProject
		};

		const androidPluginBuildResult = await this.$androidPluginBuildService.buildAar(options);

		if (androidPluginBuildResult) {
			this.$logger.info(`${pluginName} successfully built aar at ${platformsAndroidPath}.${EOL}Temporary Android project can be found at ${tempAndroidProject}.`);
		}

		const migratedIncludeGradle = this.$androidPluginBuildService.migrateIncludeGradle(options);

		if (migratedIncludeGradle) {
			this.$logger.info(`${pluginName} include gradle updated.`);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$fs.exists(path.join(this.pluginProjectPath, "platforms", "android"))) {
			this.$errors.failWithoutHelp("No plugin found at the current directory, or the plugin does not need to have its platforms/android components built into an `.aar`.");
		}

		return true;
	}
}

$injector.registerCommand("plugin|build", BuildPluginCommand);
