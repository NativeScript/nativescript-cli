import { EOL } from "os";

export class InstallCommand implements ICommand {
	public enableHooks = false;
	public allowedParameters: ICommandParameter[] = [this.$stringParameter];

	constructor(private $options: IOptions,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformsDataService: IPlatformsDataService,
		private $platformCommandHelper: IPlatformCommandHelper,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $stringParameter: ICommandParameter,
		private $packageManager: INodePackageManager) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		return args[0] ? this.installModule(args[0]) : this.installProjectDependencies();
	}

	private async installProjectDependencies(): Promise<void> {
		let error: string = "";

		await this.$pluginsService.ensureAllDependenciesAreInstalled(this.$projectData);

		for (const platform of this.$mobileHelper.platformNames) {
      const platformData = this.$platformsDataService.getPlatformData(platform, this.$projectData);
      let runtimeVersion: any;
      if (this.$projectData.isLegacy) {
        runtimeVersion = this.$projectDataService.getNSValue(this.$projectData.projectDir, platformData.frameworkPackageName);
        if (runtimeVersion) {
          runtimeVersion = runtimeVersion.version;
        }
      } else {
        runtimeVersion = this.$projectDataService.getDevDependencyValue(this.$projectData.projectDir, platformData.frameworkPackageName);
      }
			if (runtimeVersion) {
				try {
					const platformProjectService = platformData.platformProjectService;
					await platformProjectService.validate(this.$projectData, this.$options);

					await this.$platformCommandHelper.addPlatforms([`${platform}@${runtimeVersion}`], this.$projectData, this.$options.frameworkPath);
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

		await this.$packageManager.install(moduleName, projectDir, {
			'save-dev': true,
			disableNpmInstall: this.$options.disableNpmInstall,
			frameworkPath: this.$options.frameworkPath,
			ignoreScripts: this.$options.ignoreScripts,
			path: this.$options.path
		});
	}
}

$injector.registerCommand("install", InstallCommand);
