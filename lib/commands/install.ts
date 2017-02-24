import { EOL } from "os";
import * as constants from "../constants";

export class InstallCommand implements ICommand {
	public enableHooks = false;
	public allowedParameters: ICommandParameter[] = [this.$stringParameter];

	constructor(private $platformsData: IPlatformsData,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $stringParameter: ICommandParameter,
		private $npm: INodePackageManager) { }

	public async execute(args: string[]): Promise<void> {
		return args[0] ? this.installModule(args[0]) : this.installProjectDependencies();
	}

	private async installProjectDependencies(): Promise<void> {
		let error: string = "";

		await this.$pluginsService.ensureAllDependenciesAreInstalled();

		this.$projectDataService.initialize(this.$projectData.projectDir);
		for (let platform of this.$platformsData.platformsNames) {
			let platformData = this.$platformsData.getPlatformData(platform);
			let frameworkPackageData = this.$projectDataService.getValue(platformData.frameworkPackageName, constants.DEV_DEPENDENCIES);
			if (frameworkPackageData && frameworkPackageData.version) {
				try {
					await this.$platformService.addPlatforms([`${platform}@${frameworkPackageData.version}`]);
				} catch (err) {
					error = `${error}${EOL}${err}`;
				}
			}
		}

		if (error) {
			this.$logger.error(error);
		}
	}

	private async installModule(moduleName: string): Promise<void> {
		let projectDir = this.$projectData.projectDir;

		let devPrefix = 'nativescript-dev-';
		if (!this.$fs.exists(moduleName) && moduleName.indexOf(devPrefix) !== 0) {
			moduleName = devPrefix + moduleName;
		}

		await this.$npm.install(moduleName, projectDir, { 'save-dev': true });
	}
}

$injector.registerCommand("install", InstallCommand);
