///<reference path="../.d.ts"/>
"use strict";

import * as path from 'path';

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
				let frameworkPackageData = this.$projectDataService.getValue(platformData.frameworkPackageName).wait();
				if (frameworkPackageData && frameworkPackageData.version) {
					try {
						this.$platformService.addPlatforms([`${platform}@${frameworkPackageData.version}`]).wait();
					} catch (err) {
						error += err;
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
			process.env['TNS_PROJECT_DIR'] = projectDir;
			process.env['TNS_HOOKS_DIR'] = path.join(projectDir, 'hooks');

			if (!this.$fs.exists(moduleName).wait()) {
				moduleName = 'nativescript-dev-' + moduleName;
			}

			this.$npm.install(moduleName, projectDir, { 'save-dev': true }).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("install", InstallCommand);
