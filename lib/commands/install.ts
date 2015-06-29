///<reference path="../.d.ts"/>
"use strict";

export class InstallCommand implements ICommand {
	private _projectData: any;
	
	constructor(private $platformsData: IPlatformsData,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService) { }
		
	public enableHooks = false;
		
	public allowedParameters: ICommandParameter[] = [];
	
	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$projectDataService.initialize(this.$projectData.projectDir);
			
			_.each(this.$platformsData.platformsNames, platform => {
				let platformData = this.$platformsData.getPlatformData(platform);
				let frameworkPackageData = this.$projectDataService.getValue(platformData.frameworkPackageName).wait();
				if(frameworkPackageData && frameworkPackageData.version) {
					this.$platformService.addPlatforms([`${platform}@${frameworkPackageData.version}`]).wait();
				}
			});
		}).future<void>()();
	}
}
$injector.registerCommand("install", InstallCommand);