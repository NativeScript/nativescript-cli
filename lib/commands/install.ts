export class InstallCommand implements ICommand {
	constructor(private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $pluginsService: IPluginsService,
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
			this.$pluginsService.ensureAllDependenciesAreInstalled().wait();
		}).future<void>()();
	}

	private installModule(moduleName: string): IFuture<void> {
		return (() => {
			let projectDir = this.$projectData.projectDir;

			let devPrefix = 'nativescript-dev-';
			if (!this.$fs.exists(moduleName).wait() && moduleName.indexOf(devPrefix) !== 0) {
				moduleName = devPrefix + moduleName;
			}

			this.$npm.install(moduleName, projectDir, { 'save-dev': true }).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("install", InstallCommand);
