///<reference path="../.d.ts"/>
"use strict";
import path = require("path");
import shelljs = require("shelljs");
import semver = require("semver");
import Future = require("fibers/future");
import constants = require("./../constants");
let xmlmerge = require("xmlmerge-js");

export class PluginsService implements IPluginsService {
	private static INSTALL_COMMAND_NAME = "install";
	private static UNINSTALL_COMMAND_NAME = "uninstall";
	
	constructor(private $npm: INodePackageManager,
		private $fs: IFileSystem,
		private $projectData: IProjectData,
		private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService,
		private $childProcess: IChildProcess,
		private $options: IOptions,
		private $logger: ILogger,
		private $errors: IErrors) { }
		
	public add(plugin: string): IFuture<void> {
		return (() => {
			let pluginName = this.executeNpmCommand(PluginsService.INSTALL_COMMAND_NAME, plugin).wait();
			let nodeModuleData = this.getNodeModuleData(pluginName);
			if(!nodeModuleData.isPlugin) {
				// We should remove already downloaded plugin and show an error message
				this.executeNpmCommand(PluginsService.UNINSTALL_COMMAND_NAME, pluginName).wait();
				this.$errors.failWithoutHelp(`${plugin} is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.`);
			}
			
			this.prepare(this.convertToPluginData(nodeModuleData)).wait();
			this.$logger.out(`Successfully installed plugin ${nodeModuleData.name}.`);	
		}).future<void>()();
	}
	
	public remove(pluginName: string): IFuture<void> {
		return (() => {
			this.executeNpmCommand(PluginsService.UNINSTALL_COMMAND_NAME, pluginName).wait();
			let showMessage = true;
			let action = (modulesDestinationPath: string, platform: string, platformData: IPlatformData) => {
				shelljs.rm("-rf", path.join(modulesDestinationPath, pluginName));
				this.$logger.out(`Successfully removed plugin ${pluginName} for ${platform}.`);
				showMessage = false;
			};
			this.executeForAllInstalledPlatforms(action);
			
			if(showMessage) {
				this.$logger.out(`Succsessfully removed plugin ${pluginName}`);	
			}
		}).future<void>()();
	}
	
	public prepare(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let action = (pluginDestinationPath: string, platform: string, platformData: IPlatformData) => {
				let skipExecution = false;
				// Process .js files 				
				let installedFrameworkVersion = this.getInstalledFrameworkVersion(platform).wait();
				let pluginVersion = (<any>pluginData.platformsData)[platform];
				if(semver.gt(pluginVersion, installedFrameworkVersion)) {
					this.$logger.warn(`${pluginData.name} ${pluginVersion} for ${platform} is not compatible with the currently installed framework version ${installedFrameworkVersion}.`);
					skipExecution = true;  
				}
				
				if(!skipExecution) {
					this.$fs.ensureDirectoryExists(pluginDestinationPath).wait();
					shelljs.cp("-R", pluginData.fullPath, pluginDestinationPath);
				
					let pluginPlatformsFolderPath = path.join(pluginDestinationPath, pluginData.name, "platforms", platform);
					let pluginConfigurationFilePath = path.join(pluginPlatformsFolderPath, platformData.configurationFileName);					
					if(this.$fs.exists(pluginConfigurationFilePath).wait()) {
						let pluginConfigurationFileContent = this.$fs.readText(pluginConfigurationFilePath).wait();
						let configurationFileContent = this.$fs.readText(platformData.configurationFilePath).wait();
						let resultXml = this.mergeXml(pluginConfigurationFileContent, configurationFileContent).wait();
						this.$fs.writeFile(platformData.configurationFilePath, resultXml).wait();	
					}
					
					if(this.$fs.exists(pluginPlatformsFolderPath).wait()) {
						shelljs.rm("-rf", pluginPlatformsFolderPath);			
					}						
					
					// TODO: Add libraries
					
					// Show message
					this.$logger.out(`Successfully prepared plugin ${pluginData.name} for ${platform}.`);
				}
			};
			
			this.executeForAllInstalledPlatforms(action);
		}).future<void>()();
	}
	
	public getAllInstalledPlugins(): IFuture<IPluginData[]> {
		return (() => {
			let nodeModules = this.$fs.readDirectory(this.nodeModulesPath).wait();
			let plugins: IPluginData[] = [];
			_.each(nodeModules, nodeModuleName => {
				let nodeModuleData = this.getNodeModuleData(nodeModuleName);
				if(nodeModuleData.isPlugin) {
					plugins.push(this.convertToPluginData(nodeModuleData));
				}
			});
			
			return plugins;
		}).future<IPluginData[]>()();
	}
	
	private executeNpmCommand(npmCommandName: string, npmCommandArguments: string): IFuture<string> {
		return (() => {
			let command = this.composeNpmCommand(npmCommandName, npmCommandArguments);
			let result = this.$childProcess.exec(command, { cwd: this.$projectData.projectDir }).wait();
			return this.parseNpmCommandResult(result);
		}).future<string>()();
	}
	
	private composeNpmCommand(npmCommandName: string, npmCommandArguments: string): string {
		let command = ` npm ${npmCommandName} ${npmCommandArguments} --save `;
		if(this.$options.production) {
			command += " --production ";
		}
		
		return command;
	}
	
	private parseNpmCommandResult(npmCommandResult: string): string { // The npmCommandResult is in the following format: [<name>@<version node_modules/<name>]
		return npmCommandResult.split("@")[0]; // returns plugin name
	}
	
	private executeForAllInstalledPlatforms(action: (pluginDestinationPath: string, platform: string, platformData: IPlatformData) => void): void {
		let availablePlatforms = _.keys(this.$platformsData.availablePlatforms);
		_.each(availablePlatforms, platform => {
			let isPlatformInstalled = this.$fs.exists(path.join(this.$projectData.platformsDir, platform.toLowerCase())).wait();
			if(isPlatformInstalled) {
				let platformData = this.$platformsData.getPlatformData(platform.toLowerCase());
				let pluginDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
				action(pluginDestinationPath, platform.toLowerCase(), platformData);
			}
		});
	}
	
	private getNodeModuleData(moduleName: string): INodeModuleData {
		let fullNodeModulePath = path.join(this.nodeModulesPath, moduleName);
		let packageJsonFilePath = path.join(fullNodeModulePath, "package.json");
		let data = require(packageJsonFilePath);
		let result = {
			name: data.name,
			version: data.version,
			fullPath: fullNodeModulePath,
			isPlugin: data.nativescript !== undefined,
			moduleInfo: data.nativescript			
		};
		
		return result;
	}
	
	private convertToPluginData(nodeModuleData: INodeModuleData): IPluginData {
		let pluginData: any = _.extend({}, nodeModuleData);
		
		if(pluginData.isPlugin) {
			pluginData.platformsData = nodeModuleData.moduleInfo.platforms;
		}
		
		return pluginData;
	}
	
	private get nodeModulesPath(): string {
		return path.join(this.$projectData.projectDir, "node_modules");
	}	
	
	private getInstalledFrameworkVersion(platform: string): IFuture<string> {
		return (() => {
			let platformData = this.$platformsData.getPlatformData(platform);
			this.$projectDataService.initialize(this.$projectData.projectDir);
			let frameworkData = this.$projectDataService.getValue(platformData.frameworkPackageName).wait();
			return frameworkData.version;
		}).future<string>()();
	}
	
	private mergeXml(xml1: string, xml2: string): IFuture<string> {
		let future = new Future<string>();
		
		try {
			xmlmerge.merge(xml1, xml2, "", (mergedXml: string) => { 
				future.return(mergedXml);
			});
		} catch(err) {
			future.throw(err);
		}
		
		return future;
	}
}
$injector.register("pluginsService", PluginsService);