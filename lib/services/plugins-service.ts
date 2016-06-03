import * as path from "path";
import * as shelljs from "shelljs";
import * as semver from "semver";
import * as constants from "../constants";

export class PluginsService implements IPluginsService {
	private static INSTALL_COMMAND_NAME = "install";
	private static UNINSTALL_COMMAND_NAME = "uninstall";
	private static NPM_CONFIG = {
		save: true
	};
	private get $projectData(): IProjectData {
		return this.$injector.resolve("projectData");
	}
	private get $platformsData(): IPlatformsData {
		return this.$injector.resolve("platformsData");
	}
	private get $pluginVariablesService(): IPluginVariablesService {
		return this.$injector.resolve("pluginVariablesService");
	}
	private get $projectDataService(): IProjectDataService {
		return this.$injector.resolve("projectDataService");
	}
	private get $projectFilesManager(): IProjectFilesManager {
		return this.$injector.resolve("projectFilesManager");
	}
	private get $broccoliBuilder(): IBroccoliBuilder {
		return this.$injector.resolve("broccoliBuilder");
	}

	constructor(private $npm: INodePackageManager,
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $options: IOptions,
		private $logger: ILogger,
		private $errors: IErrors,
		private $injector: IInjector) { }

	public add(plugin: string): IFuture<void> {
		return (() => {
			this.ensure().wait();
			let dependencyData = this.$npm.cache(plugin, undefined, PluginsService.NPM_CONFIG).wait();
			if (dependencyData.nativescript) {
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
				} catch (err) {
					// Revert package.json
					this.$projectDataService.initialize(this.$projectData.projectDir);
					this.$projectDataService.removeProperty(this.$pluginVariablesService.getPluginVariablePropertyName(pluginData.name)).wait();
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
				}).future<void>()();
			};

			this.$pluginVariablesService.removePluginVariablesFromProjectFile(pluginName.toLowerCase()).wait();
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

			if (showMessage) {
				this.$logger.out(`Succsessfully removed plugin ${pluginName}`);
			}
		}).future<void>()();
	}

	public getAvailable(filter: string[]): IFuture<IDictionary<any>> {
		let silent: boolean = true;
		return this.$npm.search(filter, silent);
	}

	public prepare(dependencyData: IDependencyData, platform: string): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			let platformData = this.$platformsData.getPlatformData(platform);
			let pluginDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
			let pluginData = this.convertToPluginData(dependencyData);

			if (!this.isPluginDataValidForPlatform(pluginData, platform).wait()) {
				return;
			}

			if (this.$fs.exists(path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME)).wait()) {
				this.$fs.ensureDirectoryExists(pluginDestinationPath).wait();
				shelljs.cp("-Rf", pluginData.fullPath, pluginDestinationPath);

				this.$projectFilesManager.processPlatformSpecificFiles(pluginDestinationPath, platform).wait();

				pluginData.pluginPlatformsFolderPath = (_platform: string) => path.join(pluginData.fullPath, "platforms", _platform);
				platformData.platformProjectService.preparePluginNativeCode(pluginData).wait();

				shelljs.rm("-rf", path.join(pluginDestinationPath, pluginData.name, "platforms"));
				// Remove node_modules of the plugin. The destination path should have flattened node_modules.
				shelljs.rm("-rf", path.join(pluginDestinationPath, pluginData.name, constants.NODE_MODULES_FOLDER_NAME));

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
			if (this.$options.force || _.difference(allDependencies, installedDependencies).length) {
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

	public getDependenciesFromPackageJson(): IFuture<IPackageJsonDepedenciesResult> {
		return (() => {
			let packageJson = this.$fs.readJson(this.getPackageJsonFilePath()).wait();
			let dependencies: IBasePluginData[] = this.getBasicPluginInformation(packageJson.dependencies);

			let devDependencies: IBasePluginData[] = this.getBasicPluginInformation(packageJson.devDependencies);

			return {
				dependencies,
				devDependencies
			};
		}).future<IPackageJsonDepedenciesResult>()();
	}

	private getBasicPluginInformation(dependencies: any): IBasePluginData[] {
		return _.map(dependencies, (version: string, key: string) => ({
			name: key,
			version: version
		}));
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
			if (!this.$fs.exists(module).wait() || path.basename(module) !== "package.json") {
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

		if (pluginData.isPlugin) {
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

			if (npmCommandName === PluginsService.INSTALL_COMMAND_NAME) {
				result = this.$npm.install(npmCommandArguments, this.$projectData.projectDir, PluginsService.NPM_CONFIG).wait();
			} else if (npmCommandName === PluginsService.UNINSTALL_COMMAND_NAME) {
				result = this.$npm.uninstall(npmCommandArguments, PluginsService.NPM_CONFIG, this.$projectData.projectDir).wait();
				if (!result || !result.length) {
					// indicates something's wrong with the data in package.json, for example version of the plugin that we are trying to remove is invalid.
					return npmCommandArguments.toLowerCase();
				}
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
				if (isPlatformInstalled) {
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

	private isPluginDataValidForPlatform(pluginData: IPluginData, platform: string): IFuture<boolean> {
		return (() => {
			let isValid = true;

			let installedFrameworkVersion = this.getInstalledFrameworkVersion(platform).wait();
			let pluginPlatformsData = pluginData.platformsData;
			if (pluginPlatformsData) {
				let pluginVersion = (<any>pluginPlatformsData)[platform];
				if (!pluginVersion) {
					this.$logger.warn(`${pluginData.name} is not supported for ${platform}.`);
					isValid = false;
				} else if (semver.gt(pluginVersion, installedFrameworkVersion)) {
					this.$logger.warn(`${pluginData.name} ${pluginVersion} for ${platform} is not compatible with the currently installed framework version ${installedFrameworkVersion}.`);
					isValid = false;
				}
			}

			return isValid;

		}).future<boolean>()();
	}
}
$injector.register("pluginsService", PluginsService);
