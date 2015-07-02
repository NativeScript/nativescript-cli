///<reference path="../.d.ts"/>
"use strict";

export class InstallCommand implements ICommand {
	private _projectData: any;
	
	constructor(private $platformsData: IPlatformsData,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $pluginsService: IPluginsService,
		private $logger: ILogger) { }
		
	public enableHooks = false;
		
	public allowedParameters: ICommandParameter[] = [];
	
	public execute(args: string[]): IFuture<void> {
		return (() => {
			let error: string = "";
			
			this.$pluginsService.ensureAllDependenciesAreInstalled().wait();
						
			this.$projectDataService.initialize(this.$projectData.projectDir);
			_.each(this.$platformsData.platformsNames, platform => {
				let platformData = this.$platformsData.getPlatformData(platform);
				let frameworkPackageData = this.$projectDataService.getValue(platformData.frameworkPackageName).wait();
				if(frameworkPackageData && frameworkPackageData.version) {
					try {
						this.$platformService.addPlatforms([`${platform}@${frameworkPackageData.version}`]).wait();
					} catch(err) {
						error += err;
					}
				}
			});
			
			if(error) {
				this.$logger.error(error);
			}
			
		}).future<void>()();
	}
}
$injector.registerCommand("install", InstallCommand);