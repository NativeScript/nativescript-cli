///<reference path="../.d.ts"/>
"use strict";
import path = require("path");
import shelljs = require("shelljs");
import constants = require("./../constants");

export class PluginsService implements IPluginsService {
	constructor(private $npm: INodePackageManager,
		private $fs: IFileSystem,
		private $projectData: IProjectData,
		private $platformsData: IPlatformsData,
		private $childProcess: IChildProcess) { }
		
	public get modulesDestinationPath() {
		let platformData = this.$platformsData.getPlatformData("ios");
		return path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
	} 
		
	public add(pluginName: string): IFuture<void> {
		return (() => {
			let command = `npm install ${pluginName} --save`;
			this.$childProcess.exec(command, { cwd: this.$projectData.projectDir }).wait();
			this.prepare(pluginName).wait();	
		}).future<void>()();
	}
	
	public prepare(pluginName: string): IFuture<void> {
		return (() => {
			// Process .js files 
			// TODO: get correctly pluginName if plugin is installed with url or folder path
			var pathToPlugin = path.join(this.$projectData.projectDir, "node_modules", pluginName);
			shelljs.cp("-R", pathToPlugin, this.modulesDestinationPath);
			shelljs.rm("-rf", path.join(this.modulesDestinationPath, pluginName, "platforms"));
				
			// TODO: Merge xmls
			// TODO: Add libraries
		}).future<void>()();
	}
	
	public remove(pluginName: string): IFuture<void> {
		return (() => {
			let command = `npm uninstall ${pluginName} --save`;
			this.$childProcess.exec(command, { cwd: this.$projectData.projectDir }).wait();
			shelljs.rm("-rf", path.join(this.modulesDestinationPath, pluginName));
		}).future<void>()();
	}
}
$injector.register("pluginsService", PluginsService);