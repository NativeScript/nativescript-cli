///<reference path="../.d.ts"/>
"use strict";

import path = require("path");

export class InstallCommand implements ICommand {
	private _projectData: any;
	
	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $options: IOptions,
		private $injector: IInjector,
		private $staticConfig: IStaticConfig) { }
		
	public enableHooks = false;
		
	public allowedParameters: ICommandParameter[] = [];
	
	public execute(args: string[]): IFuture<void> {
		return (() => {
			let projectFilePath = this.getProjectFilePath(args[0]);
			let projectData = this.getProjectData(projectFilePath).wait();
			let projectName = projectData.id.split(".")[2];
			
			this.$injector.resolve("projectService").createProject(projectName).wait(); 
			
			this.$options.path = path.join(this.$options.path || path.resolve("."), projectName);
			
			this.$logger.info("Adding platforms...");
			
			let $platformsData = this.$injector.resolve("platformsData");
			let $platformService = this.$injector.resolve("platformService");
			_.each($platformsData.platformsNames, platform => {
				let platformData = $platformsData.getPlatformData(platform);
				let frameworkPackageData = projectData[platformData.frameworkPackageName];
				if(frameworkPackageData && frameworkPackageData.version) {
					$platformService.addPlatforms([`${platform}@${frameworkPackageData.version}`]).wait();
				}
			}); 
			
		}).future<void>()();
	}
	
	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			let projectFilePath = this.getProjectFilePath(args[0]);
			let errorMessage = args[0] ? "The provided path doesn't contain package.json." : 
				"The current directory doesn't contain package.json file. Execute the command in directory which contains package.json file or specify the path to package.json file.";
			
			if(!this.$fs.exists(projectFilePath).wait()) {
				this.$errors.failWithoutHelp(errorMessage);	
			}
			
			let projectData = this.getProjectData(projectFilePath).wait();
			if(!projectData) {
				this.$errors.failWithoutHelp("Invalid project file. Verify that the specified package.json file contains a nativescript key and try again."); 
			}
			
			if(!projectData.id) {
				this.$errors.failWithoutHelp("Invalid project file. Verify that the specified package.json file contains an id and try again.");
			}
			
			return true;
		}).future<boolean>()();
	}
	
	private getProjectFilePath(providedPath: string): string {
		let resolvedPath = path.resolve(providedPath || ".");
		return path.basename(resolvedPath) === "package.json" ? resolvedPath : path.join(resolvedPath, "package.json");
	}
	
	private getProjectData(projectFilePath: string): IFuture<any> {
		return (() => {
			if(!this._projectData) {
				let fileContent = this.$fs.readJson(projectFilePath).wait();
				this._projectData = fileContent[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE];
			}
			
			return this._projectData;
		}).future<any>()();
	}
}
$injector.registerCommand("install", InstallCommand);