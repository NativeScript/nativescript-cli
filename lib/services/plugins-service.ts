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
	private static NPM_CONFIG = {
		save: true
	}
	
	constructor(private $platformsData: IPlatformsData,		
		private $npm: INodePackageManager,
		private $fs: IFileSystem,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $childProcess: IChildProcess,
		private $options: IOptions,
		private $logger: ILogger,
		private $errors: IErrors,
		private $injector: IInjector) { }
		
	public add(plugin: string): IFuture<void> {
		return (() => {
			let dependencies = this.getAllInstalledModules().wait();
			let cacheData = this.$npm.cache(plugin, undefined, PluginsService.NPM_CONFIG).wait();
			if(cacheData.nativescript) {
				let pluginName = this.executeNpmCommand(PluginsService.INSTALL_COMMAND_NAME, plugin).wait();
				this.prepare(this.convertToPluginData(cacheData)).wait();
				this.$logger.out(`Successfully installed plugin ${cacheData.name}.`);									
			} else {
				this.$errors.failWithoutHelp(`${plugin} is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.`);				
			}
			
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
				let pluginPlatformsData = pluginData.platformsData;
				if(pluginPlatformsData) {
					let pluginVersion = (<any>pluginPlatformsData)[platform];
					if(semver.gt(pluginVersion, installedFrameworkVersion)) {
						this.$logger.warn(`${pluginData.name} ${pluginVersion} for ${platform} is not compatible with the currently installed framework version ${installedFrameworkVersion}.`);
						skipExecution = true;  
					}
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
	
	public ensureAllDependenciesAreInstalled(): IFuture<void> {
		return this.$childProcess.exec("npm install ", { cwd: this.$projectData.projectDir });
	}
	
	public getAllInstalledPlugins(): IFuture<IPluginData[]> {
		return (() => {
			let nodeModules = this.getAllInstalledModules().wait();
			return _.filter(nodeModules, nodeModuleData => nodeModuleData && nodeModuleData.isPlugin);
		}).future<IPluginData[]>()();
	}
	
	private get nodeModulesPath(): string {
		return path.join(this.$projectData.projectDir, "node_modules");
	}
	
	private getPackageJsonFilePath(): string {
		return path.join(this.$projectData.projectDir, "package.json");
	}
	
	private getPackageJsonFilePathForModule(moduleName: string): string {
		return path.join(this.nodeModulesPath, moduleName, "package.json");
	}
	
	private getDependencies(): string[] {
		let packageJsonFilePath = this.getPackageJsonFilePath();
		return _.keys(require(packageJsonFilePath).dependencies);
	}
	
	private getNodeModuleData(moduleName: string): IFuture<INodeModuleData> {
		return (() => { 
			let packageJsonFilePath = this.getPackageJsonFilePathForModule(moduleName);
			if(this.$fs.exists(packageJsonFilePath).wait()) {
				let data = require(packageJsonFilePath);
				return {
					name: data.name,
					version: data.version,
					fullPath: path.dirname(packageJsonFilePath),
					isPlugin: data.nativescript !== undefined,
					moduleInfo: data.nativescript			
				};
			}
			
			return null;
		}).future<INodeModuleData>()();
	}
	
	private convertToPluginData(cacheData: ICacheData): IPluginData {
		let pluginData: any = {};
		pluginData.name = cacheData.name;
		pluginData.version = cacheData.version;
		pluginData.fullPath = path.dirname(this.getPackageJsonFilePathForModule(cacheData.name));
		pluginData.isPlugin = !!cacheData.nativescript;
		
		if(pluginData.isPlugin) {
			pluginData.platformsData = cacheData.nativescript.platforms;
		}
		
		return pluginData;
	}
	
	private getAllInstalledModules(): IFuture<INodeModuleData[]> {
		return (() => {
			this.ensureAllDependenciesAreInstalled().wait();
			this.$fs.ensureDirectoryExists(this.nodeModulesPath).wait();
			
			let nodeModules = this.getDependencies();
			return _.map(nodeModules, nodeModuleName => this.getNodeModuleData(nodeModuleName).wait());
		}).future<INodeModuleData[]>()();
	}
	
	private executeNpmCommand(npmCommandName: string, npmCommandArguments: string): IFuture<string> {
		return (() => {
			let result = "";
			
			if(npmCommandName === PluginsService.INSTALL_COMMAND_NAME) {
				result = this.$npm.install(npmCommandArguments, this.$projectData.projectDir, PluginsService.NPM_CONFIG).wait();				
			} else if(npmCommandName === PluginsService.UNINSTALL_COMMAND_NAME) {
				result = this.$npm.uninstall(npmCommandArguments, PluginsService.NPM_CONFIG).wait();
			}
			
			return this.parseNpmCommandResult(result);
		}).future<string>()();
	}
	
	private parseNpmCommandResult(npmCommandResult: string): string {  // [[name@version, node_modules/name]]
		return npmCommandResult[0][0].split("@")[0]; // returns plugin name
	}
	
	private executeForAllInstalledPlatforms(action: (pluginDestinationPath: string, pl: string, platformData: IPlatformData) => void): void {
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