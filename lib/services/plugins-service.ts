///<reference path="../.d.ts"/>
"use strict";
import * as path from "path";
import * as shelljs from "shelljs";
import * as semver from "semver";
import Future = require("fibers/future");
import * as constants from "../constants";
let xmlmerge = require("xmlmerge-js");
let DOMParser = require('xmldom').DOMParser;

export class PluginsService implements IPluginsService {
	private static INSTALL_COMMAND_NAME = "install";
	private static UNINSTALL_COMMAND_NAME = "uninstall";
	private static NPM_CONFIG = {
		save: true
	};

	constructor(private $broccoliBuilder: IBroccoliBuilder,
		private $platformsData: IPlatformsData,
		private $npm: INodePackageManager,
		private $fs: IFileSystem,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $childProcess: IChildProcess,
		private $options: IOptions,
		private $logger: ILogger,
		private $errors: IErrors,
		private $pluginVariablesService: IPluginVariablesService,
		private $projectFilesManager: IProjectFilesManager,
		private $injector: IInjector) { }

	public add(plugin: string): IFuture<void> {
		return (() => {
			this.ensure().wait();
			let dependencyData = this.$npm.cache(plugin, undefined, PluginsService.NPM_CONFIG).wait();
			if(dependencyData.nativescript) {
				let pluginData = this.convertToPluginData(dependencyData);

				// Validate
				let action = (pluginDestinationPath: string, platform: string, platformData: IPlatformData) => {
					return (() => {
						this.isPluginDataValidForPlatform(pluginData, platform).wait();
					}).future<void>()();
				};
				this.executeForAllInstalledPlatforms(action).wait();

				try {
					this.$pluginVariablesService.savePluginVariablesInProjectFile(pluginData).wait();
					this.executeNpmCommand(PluginsService.INSTALL_COMMAND_NAME, plugin).wait();
				} catch(err) {
					// Revert package.json
					this.$projectDataService.initialize(this.$projectData.projectDir);
					this.$projectDataService.removeProperty(this.$pluginVariablesService.getPluginVariablePropertyName(pluginData)).wait();
					this.$projectDataService.removeDependency(pluginData.name).wait();

					throw err;
				}

				this.$logger.out(`Successfully installed plugin ${dependencyData.name}.`);
			} else {
				this.$errors.failWithoutHelp(`${plugin} is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.`);
			}

		}).future<void>()();
	}

	public remove(pluginName: string): IFuture<void> {
		return (() => {
			let removePluginNativeCodeAction = (modulesDestinationPath: string, platform: string, platformData: IPlatformData) => {
				return (() => {
					let pluginData = this.convertToPluginData(this.getNodeModuleData(pluginName).wait());

					platformData.platformProjectService.removePluginNativeCode(pluginData).wait();

					// Remove the plugin and call merge for another plugins that have configuration file
					let pluginConfigurationFilePath = this.getPluginConfigurationFilePath(pluginData, platformData);
					if(this.$fs.exists(pluginConfigurationFilePath).wait()) {
						this.merge(pluginData, platformData, (data: IPluginData) => data.name !== pluginData.name).wait();
					}

					if(pluginData.pluginVariables) {
						this.$pluginVariablesService.removePluginVariablesFromProjectFile(pluginData).wait();
					}
				}).future<void>()();
			};
			this.executeForAllInstalledPlatforms(removePluginNativeCodeAction).wait();

			this.executeNpmCommand(PluginsService.UNINSTALL_COMMAND_NAME, pluginName).wait();

			let showMessage = true;
			let action = (modulesDestinationPath: string, platform: string, platformData: IPlatformData) => {
				return (() => {
					shelljs.rm("-rf", path.join(modulesDestinationPath, pluginName));

					this.$logger.out(`Successfully removed plugin ${pluginName} for ${platform}.`);
					showMessage = false;
				}).future<void>()();
			};
			this.executeForAllInstalledPlatforms(action).wait();

			if(showMessage) {
				this.$logger.out(`Succsessfully removed plugin ${pluginName}`);
			}
		}).future<void>()();
	}

	private initializeConfigurationFileFromCache(platformData: IPlatformData): IFuture<void> {
		return (() => {
			this.$projectDataService.initialize(this.$projectData.projectDir);
			let frameworkVersion = this.$projectDataService.getValue(platformData.frameworkPackageName).wait().version;

			// We need to resolve this manager here due to some restrictions from npm api and in order to load PluginsService.NPM_CONFIG config
			let npmInstallationManager: INpmInstallationManager = this.$injector.resolve("npmInstallationManager");
			npmInstallationManager.addToCache(platformData.frameworkPackageName, frameworkVersion).wait();

			let cachedPackagePath = npmInstallationManager.getCachedPackagePath(platformData.frameworkPackageName, frameworkVersion);
			let cachedConfigurationFilePath = path.join(cachedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME, platformData.relativeToFrameworkConfigurationFilePath);
			let cachedConfigurationFileContent = this.$fs.readText(cachedConfigurationFilePath).wait();
			this.$fs.writeFile(platformData.configurationFilePath, cachedConfigurationFileContent).wait();

			platformData.platformProjectService.interpolateConfigurationFile().wait();
		}).future<void>()();
	}

	public prepare(dependencyData: IDependencyData, platform: string): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			let platformData = this.$platformsData.getPlatformData(platform);
			let pluginDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
			let pluginData = this.convertToPluginData(dependencyData);

			if(!this.isPluginDataValidForPlatform(pluginData, platform).wait()) {
				return;
			}

			if(this.$fs.exists(path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME)).wait()) {
				this.$fs.ensureDirectoryExists(pluginDestinationPath).wait();
				shelljs.cp("-Rf", pluginData.fullPath, pluginDestinationPath);

				let pluginConfigurationFilePath = this.getPluginConfigurationFilePath(pluginData, platformData);

				if(this.$fs.exists(pluginConfigurationFilePath).wait()) {
					this.merge(pluginData, platformData).wait();
				}

				this.$projectFilesManager.processPlatformSpecificFiles(pluginDestinationPath, platform).wait();

				pluginData.pluginPlatformsFolderPath = (_platform: string) => path.join(pluginData.fullPath, "platforms", _platform);
				platformData.platformProjectService.preparePluginNativeCode(pluginData).wait();

				shelljs.rm("-rf", path.join(pluginDestinationPath, pluginData.name, "platforms"));

				// Show message
				this.$logger.out(`Successfully prepared plugin ${pluginData.name} for ${platform}.`);
			}
		}).future<void>()();
	}

	public ensureAllDependenciesAreInstalled(): IFuture<void> {
		return (() => {
			let installedDependencies = this.$fs.exists(this.nodeModulesPath).wait() ? this.$fs.readDirectory(this.nodeModulesPath).wait() : [];
			let packageJsonContent = this.$fs.readJson(this.getPackageJsonFilePath()).wait();
			let allDependencies = _.keys(packageJsonContent.dependencies).concat(_.keys(packageJsonContent.devDependencies));
			if(this.$options.force || _.difference(allDependencies, installedDependencies).length) {
				this.$npm.install(this.$projectData.projectDir, this.$projectData.projectDir, { "ignore-scripts": this.$options.ignoreScripts }).wait();
			}
		}).future<void>()();
	}

	public getAllInstalledPlugins(): IFuture<IPluginData[]> {
		return (() => {
			let nodeModules = this.getAllInstalledModules().wait().map(nodeModuleData => this.convertToPluginData(nodeModuleData));
			return _.filter(nodeModules, nodeModuleData => nodeModuleData && nodeModuleData.isPlugin);
		}).future<IPluginData[]>()();
	}

	public afterPrepareAllPlugins(): IFuture<void> {
		let action = (pluginDestinationPath: string, platform: string, platformData: IPlatformData) => {
			return platformData.platformProjectService.afterPrepareAllPlugins();
		};

		return this.executeForAllInstalledPlatforms(action);
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

	private getNodeModuleData(module: string): IFuture<INodeModuleData> { // module can be  modulePath or moduleName
		return (() => {
			if(!this.$fs.exists(module).wait() || path.basename(module) !== "package.json") {
				module = this.getPackageJsonFilePathForModule(module);
			}

			let data = this.$fs.readJson(module).wait();
			return {
				name: data.name,
				version: data.version,
				fullPath: path.dirname(module),
				isPlugin: data.nativescript !== undefined,
				moduleInfo: data.nativescript
			};
		}).future<INodeModuleData>()();
	}

	private convertToPluginData(cacheData: any): IPluginData {
		let pluginData: any = {};
		pluginData.name = cacheData.name;
		pluginData.version = cacheData.version;
		pluginData.fullPath = cacheData.directory || path.dirname(this.getPackageJsonFilePathForModule(cacheData.name));
		pluginData.isPlugin = !!cacheData.nativescript || !!cacheData.moduleInfo;
		pluginData.pluginPlatformsFolderPath = (platform: string) => path.join(pluginData.fullPath, "platforms", platform);
		let data = cacheData.nativescript || cacheData.moduleInfo;

		if(pluginData.isPlugin) {
			pluginData.platformsData = data.platforms;
			pluginData.pluginVariables = data.variables;
		}

		return pluginData;
	}

	private ensure(): IFuture<void> {
		return (() => {
			this.ensureAllDependenciesAreInstalled().wait();
			this.$fs.ensureDirectoryExists(this.nodeModulesPath).wait();
		}).future<void>()();
	}

	private getAllInstalledModules(): IFuture<INodeModuleData[]> {
		return (() => {
			this.ensure().wait();

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
				result = this.$npm.uninstall(npmCommandArguments, PluginsService.NPM_CONFIG, this.$projectData.projectDir).wait();
			}

			return this.parseNpmCommandResult(result);
		}).future<string>()();
	}

	private parseNpmCommandResult(npmCommandResult: string): string {  // [[name@version, node_modules/name]]
		return npmCommandResult[0][0].split("@")[0]; // returns plugin name
	}

	private executeForAllInstalledPlatforms(action: (_pluginDestinationPath: string, pl: string, _platformData: IPlatformData) => IFuture<void>): IFuture<void> {
		return (() => {
			let availablePlatforms = _.keys(this.$platformsData.availablePlatforms);
			_.each(availablePlatforms, platform => {
				let isPlatformInstalled = this.$fs.exists(path.join(this.$projectData.platformsDir, platform.toLowerCase())).wait();
				if(isPlatformInstalled) {
					let platformData = this.$platformsData.getPlatformData(platform.toLowerCase());
					let pluginDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
					action(pluginDestinationPath, platform.toLowerCase(), platformData).wait();
				}
			});
		}).future<void>()();
	}

	private getInstalledFrameworkVersion(platform: string): IFuture<string> {
		return (() => {
			let platformData = this.$platformsData.getPlatformData(platform);
			this.$projectDataService.initialize(this.$projectData.projectDir);
			let frameworkData = this.$projectDataService.getValue(platformData.frameworkPackageName).wait();
			return frameworkData.version;
		}).future<string>()();
	}

	private mergeXml(xml1: string, xml2: string, config: any[]): IFuture<string> {
		let future = new Future<string>();

		try {
			xmlmerge.merge(xml1, xml2, config, (mergedXml: string) => {
				future.return(mergedXml);
			});
		} catch(err) {
			future.throw(err);
		}

		return future;
	}

	private validateXml(xml: string, xmlFilePath?: string): void {
		let doc = new DOMParser({
			locator: {},
			errorHandler: (level: any, msg: string) => {
				let errorMessage = xmlFilePath ? `Invalid xml file ${xmlFilePath}.` : `Invalid xml ${xml}.`;
				this.$errors.fail(errorMessage + ` Additional technical information: ${msg}.` );
			}
		});
		doc.parseFromString(xml, 'text/xml');
	}

	private mergeCore(pluginData: IPluginData, platformData: IPlatformData): IFuture<void> {
		return (() => {
			let pluginConfigurationFilePath = this.getPluginConfigurationFilePath(pluginData, platformData);
			let configurationFilePath = platformData.configurationFilePath;

			// Validate plugin configuration file
			let pluginConfigurationFileContent = this.$fs.readText(pluginConfigurationFilePath).wait();
			pluginConfigurationFileContent = this.$pluginVariablesService.interpolatePluginVariables(pluginData, pluginConfigurationFileContent).wait();
			this.validateXml(pluginConfigurationFileContent, pluginConfigurationFilePath);

			// Validate configuration file
			let configurationFileContent = this.$fs.readText(configurationFilePath).wait();
			this.validateXml(configurationFileContent, configurationFilePath);

			// Merge xml
			let resultXml = this.mergeXml(configurationFileContent, pluginConfigurationFileContent, platformData.mergeXmlConfig || []).wait();
			this.validateXml(resultXml);
			this.$fs.writeFile(configurationFilePath, resultXml).wait();
		}).future<void>()();
	}

	private merge(pluginData: IPluginData, platformData: IPlatformData, mergeCondition?: (_pluginData: IPluginData) => boolean): IFuture<void> {
		return (() => {
			let tnsModulesDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, constants.TNS_MODULES_FOLDER_NAME);
			let nodeModules = this.$broccoliBuilder.getChangedNodeModules(tnsModulesDestinationPath, platformData.normalizedPlatformName.toLowerCase()).wait();

			_(nodeModules)
				.keys()
				.filter(nodeModule => this.$fs.exists(path.join(nodeModule, "package.json")).wait())
				.map(nodeModule => this.getNodeModuleData(path.join(nodeModule, "package.json")).wait())
				.map(nodeModuleData => this.convertToPluginData(nodeModuleData))
				.filter(data => data.isPlugin && this.$fs.exists(this.getPluginConfigurationFilePath(data, platformData)).wait())
				.forEach((data, index) => {
					if(index === 0) {
						this.initializeConfigurationFileFromCache(platformData).wait();
					}

					if(!mergeCondition || (mergeCondition && mergeCondition(data))) {
						this.mergeCore(data, platformData).wait();
					}
				})
				.value();

		}).future<void>()();
	}

	private getPluginConfigurationFilePath(pluginData: IPluginData, platformData: IPlatformData): string {
		 let pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(platformData.normalizedPlatformName.toLowerCase());
		 let pluginConfigurationFilePath = path.join(pluginPlatformsFolderPath, platformData.configurationFileName);
		 return pluginConfigurationFilePath;
	}

	private isPluginDataValidForPlatform(pluginData: IPluginData, platform: string): IFuture<boolean> {
		return (() => {
			let isValid = true;

			let installedFrameworkVersion = this.getInstalledFrameworkVersion(platform).wait();
			let pluginPlatformsData = pluginData.platformsData;
			if(pluginPlatformsData) {
				let pluginVersion = (<any>pluginPlatformsData)[platform];
				if(!pluginVersion) {
					this.$logger.warn(`${pluginData.name} is not supported for ${platform}.`);
					isValid = false;
				} else if(semver.gt(pluginVersion, installedFrameworkVersion)) {
					this.$logger.warn(`${pluginData.name} ${pluginVersion} for ${platform} is not compatible with the currently installed framework version ${installedFrameworkVersion}.`);
					isValid = false;
				}
			}

			return isValid;

		}).future<boolean>()();
	}
}
$injector.register("pluginsService", PluginsService);
