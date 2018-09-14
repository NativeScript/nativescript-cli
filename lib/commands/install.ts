import { EOL } from "os";

export class InstallCommand implements ICommand {
	public enableHooks = false;
	public allowedParameters: ICommandParameter[] = [this.$stringParameter];

	constructor(private $options: IOptions,
		private $platformsData: IPlatformsData,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $stringParameter: ICommandParameter,
		private $npm: INodePackageManager) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		return args[0] ? this.installModule(args[0]) : this.installProjectDependencies();
	}

	private async installProjectDependencies(): Promise<void> {
		let error: string = "";

		await this.$pluginsService.ensureAllDependenciesAreInstalled(this.$projectData);

		for (const platform of this.$platformsData.platformsNames) {
			const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
			const frameworkPackageData = this.$projectDataService.getNSValue(this.$projectData.projectDir, platformData.frameworkPackageName);
			if (frameworkPackageData && frameworkPackageData.version) {
				try {
					const platformProjectService = platformData.platformProjectService;
					await platformProjectService.validate(this.$projectData, this.$options);

					await this.$platformService.addPlatforms([`${platform}@${frameworkPackageData.version}`], this.$options.platformTemplate, this.$projectData, this.$options, this.$options.frameworkPath);
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
		const projectDir = this.$projectData.projectDir;

		const devPrefix = 'nativescript-dev-';
		if (!this.$fs.exists(moduleName) && moduleName.indexOf(devPrefix) !== 0) {
			moduleName = devPrefix + moduleName;
		}

		await this.$npm.install(moduleName, projectDir, {
			'save-dev': true,
			disableNpmInstall: this.$options.disableNpmInstall,
			frameworkPath: this.$options.frameworkPath,
			ignoreScripts: this.$options.ignoreScripts,
			path: this.$options.path
		});
	}
}

$injector.registerCommand("install", InstallCommand);
