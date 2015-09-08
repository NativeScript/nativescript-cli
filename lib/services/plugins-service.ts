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

	constructor(private $platformsData: IPlatformsData,
		private $npm: INodePackageManager,
		private $fs: IFileSystem,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $childProcess: IChildProcess,
		private $options: IOptions,
		private $logger: ILogger,
		private $errors: IErrors,
		private $projectFilesManager: IProjectFilesManager) { }

	public add(plugin: string): IFuture<void> {
		return (() => {
			this.ensure().wait();
			let dependencyData = this.$npm.cache(plugin, undefined, PluginsService.NPM_CONFIG).wait();
			if(dependencyData.nativescript) {
				this.executeNpmCommand(PluginsService.INSTALL_COMMAND_NAME, plugin).wait();
				this.prepare(dependencyData).wait();
				this.$logger.out(`Successfully installed plugin ${dependencyData.name}.`);
			} else {
				this.$errors.failWithoutHelp(`${plugin} is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.`);
			}

		}).future<void>()();
	}

	public remove(pluginName: string): IFuture<void> {
		return (() => {
			let removePluginNativeCodeAction = (modulesDestinationPath: string, platform: string, platformData: IPlatformData) => {
				let pluginData = this.convertToPluginData(this.getNodeModuleData(pluginName).wait());
				pluginData.isPlugin = true;
				return platformData.platformProjectService.removePluginNativeCode(pluginData);
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

	public prepare(dependencyData: IDependencyData): IFuture<void> {
		return (() => {
			let pluginData = this.convertToPluginData(dependencyData);

			let action = (pluginDestinationPath: string, platform: string, platformData: IPlatformData) => {
				return (() => {
					// Process .js files
					let installedFrameworkVersion = this.getInstalledFrameworkVersion(platform).wait();
					let pluginPlatformsData = pluginData.platformsData;
					if(pluginPlatformsData) {
						let pluginVersion = (<any>pluginPlatformsData)[platform];
						if(!pluginVersion) {
							this.$logger.warn(`${pluginData.name} is not supported for ${platform}.`);
							return;
						}

						if(semver.gt(pluginVersion, installedFrameworkVersion)) {
							this.$logger.warn(`${pluginData.name} ${pluginVersion} for ${platform} is not compatible with the currently installed framework version ${installedFrameworkVersion}.`);
							return;
						}
					}

					if(this.$fs.exists(path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME)).wait()) {

						this.$fs.ensureDirectoryExists(pluginDestinationPath).wait();
						shelljs.cp("-Rf", pluginData.fullPath, pluginDestinationPath);

						let pluginPlatformsFolderPath = path.join(pluginDestinationPath, pluginData.name, "platforms", platform);
						let pluginConfigurationFilePath = path.join(pluginPlatformsFolderPath, platformData.configurationFileName);
						let configurationFilePath = platformData.configurationFilePath;

						if(this.$fs.exists(pluginConfigurationFilePath).wait()) {
							// Validate plugin configuration file
							let pluginConfigurationFileContent = this.$fs.readText(pluginConfigurationFilePath).wait();
							this.validateXml(pluginConfigurationFileContent, pluginConfigurationFilePath);

							// Validate configuration file
							let configurationFileContent = this.$fs.readText(configurationFilePath).wait();
							this.validateXml(configurationFileContent, configurationFilePath);

							// Merge xml
							let resultXml = this.mergeXml(configurationFileContent, pluginConfigurationFileContent, platformData.mergeXmlConfig || []).wait();
							this.validateXml(resultXml);
							this.$fs.writeFile(configurationFilePath, resultXml).wait();
						}

						this.$projectFilesManager.processPlatformSpecificFiles(pluginDestinationPath, platform).wait();

						pluginData.pluginPlatformsFolderPath = (_platform: string) => path.join(pluginData.fullPath, "platforms", _platform);
						platformData.platformProjectService.preparePluginNativeCode(pluginData, {executePodInstall: true }).wait();

						shelljs.rm("-rf", path.join(pluginDestinationPath, pluginData.name, "platforms"));

						// Show message
						this.$logger.out(`Successfully prepared plugin ${pluginData.name} for ${platform}.`);
					}

				}).future<void>()();
			};

			this.executeForAllInstalledPlatforms(action).wait();
		}).future<void>()();
	}

	public ensureAllDependenciesAreInstalled(): IFuture<void> {
		return (() => {
			if(!this.$fs.exists(path.join(this.$projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME)).wait()) {
				let command = "npm install ";
				if(this.$options.ignoreScripts) {
					command += "--ignore-scripts";
				}
				this.$childProcess.exec(command, { cwd: this.$projectData.projectDir }).wait();
			}
		}).future<void>()();
	}

	public getAllInstalledPlugins(): IFuture<IPluginData[]> {
		return (() => {
			let nodeModules = this.getAllInstalledModules().wait();
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

	private convertToPluginData(cacheData: any): IPluginData {
		let pluginData: any = {};
		pluginData.name = cacheData.name;
		pluginData.version = cacheData.version;
		pluginData.fullPath = cacheData.directory || path.dirname(this.getPackageJsonFilePathForModule(cacheData.name));
		pluginData.isPlugin = !!cacheData.nativescript;
		pluginData.pluginPlatformsFolderPath = (platform: string) => path.join(pluginData.fullPath, "platforms", platform);

		if(pluginData.isPlugin) {
			pluginData.platformsData = cacheData.nativescript.platforms;
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
}
$injector.register("pluginsService", PluginsService);
