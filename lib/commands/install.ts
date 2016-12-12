import {EOL} from "os";

export class InstallCommand implements ICommand {
	constructor(private $platformsData: IPlatformsData,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $stringParameter: ICommandParameter,
		private $npm: INodePackageManager) { }

	public enableHooks = false;

	public allowedParameters: ICommandParameter[] = [this.$stringParameter];

	public execute(args: string[]): IFuture<void> {
		return args[0] ? this.installModule(args[0]) : this.installProjectDependencies();
	}

	private installProjectDependencies(): IFuture<void> {
		return (() => {
			let error: string = "";

			this.$pluginsService.ensureAllDependenciesAreInstalled().wait();

			this.$projectDataService.initialize(this.$projectData.projectDir);
			_.each(this.$platformsData.platformsNames, platform => {
				let platformData = this.$platformsData.getPlatformData(platform);
				let frameworkPackageData = this.$projectDataService.getValue(platformData.frameworkPackageName);
				if (frameworkPackageData && frameworkPackageData.version) {
					try {
						this.$platformService.addPlatforms([`${platform}@${frameworkPackageData.version}`]).wait();
					} catch (err) {
						error = `${error}${EOL}${err}`;
					}
				}
			});

			if (error) {
				this.$logger.error(error);
			}
		}).future<void>()();
	}

	private installModule(moduleName: string): IFuture<void> {
		return (() => {
			let projectDir = this.$projectData.projectDir;

			let devPrefix = 'nativescript-dev-';
			if (!this.$fs.exists(moduleName) && moduleName.indexOf(devPrefix) !== 0) {
				moduleName = devPrefix + moduleName;
			}

			this.$npm.install(moduleName, projectDir, { 'save-dev': true }).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("install", InstallCommand);
