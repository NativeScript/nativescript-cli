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

	constructor(private $npm: INodePackageManager,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $logger: ILogger,
		private $errors: IErrors,
		private $injector: IInjector) { }

	public async add(plugin: string): Promise<void> {
		await this.ensure();
		const possiblePackageName = path.resolve(plugin);
		if (possiblePackageName.indexOf(".tgz") !== -1 && this.$fs.exists(possiblePackageName)) {
			plugin = possiblePackageName;
		}
		let name = (await this.$npm.install(plugin, this.$projectData.projectDir, PluginsService.NPM_CONFIG))[0];
		let pathToRealNpmPackageJson = path.join(this.$projectData.projectDir, "node_modules", name, "package.json");
		let realNpmPackageJson = this.$fs.readJson(pathToRealNpmPackageJson);

		if (realNpmPackageJson.nativescript) {
			let pluginData = this.convertToPluginData(realNpmPackageJson);

			// Validate
			let action = async (pluginDestinationPath: string, platform: string, platformData: IPlatformData): Promise<void> => {
				this.isPluginDataValidForPlatform(pluginData, platform);
			};

			this.executeForAllInstalledPlatforms(action);

			try {
				await this.$pluginVariablesService.savePluginVariablesInProjectFile(pluginData);
			} catch (err) {
				// Revert package.json
				this.$projectDataService.initialize(this.$projectData.projectDir);
				this.$projectDataService.removeProperty(this.$pluginVariablesService.getPluginVariablePropertyName(pluginData.name));
				await this.$npm.uninstall(plugin, PluginsService.NPM_CONFIG, this.$projectData.projectDir);

				throw err;
			}

			this.$logger.out(`Successfully installed plugin ${realNpmPackageJson.name}.`);
		} else {
			this.$npm.uninstall(realNpmPackageJson.name, { save: true }, this.$projectData.projectDir);
			this.$errors.failWithoutHelp(`${plugin} is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.`);
		}
	}

	public async remove(pluginName: string): Promise<void> {
		let removePluginNativeCodeAction = async (modulesDestinationPath: string, platform: string, platformData: IPlatformData): Promise<void> => {
			let pluginData = this.convertToPluginData(this.getNodeModuleData(pluginName));

			await platformData.platformProjectService.removePluginNativeCode(pluginData);
		};

		this.$pluginVariablesService.removePluginVariablesFromProjectFile(pluginName.toLowerCase());
		this.executeForAllInstalledPlatforms(removePluginNativeCodeAction);

		await this.executeNpmCommand(PluginsService.UNINSTALL_COMMAND_NAME, pluginName);

		let showMessage = true;
		let action = async (modulesDestinationPath: string, platform: string, platformData: IPlatformData): Promise<void> => {
			shelljs.rm("-rf", path.join(modulesDestinationPath, pluginName));

			this.$logger.out(`Successfully removed plugin ${pluginName} for ${platform}.`);
			showMessage = false;
		};

		this.executeForAllInstalledPlatforms(action);

		if (showMessage) {
			this.$logger.out(`Succsessfully removed plugin ${pluginName}`);
		}
	}

	public getAvailable(filter: string[]): Promise<IDictionary<any>> {
		let silent: boolean = true;
		return this.$npm.search(filter, { "silent": silent });
	}

	public async prepare(dependencyData: IDependencyData, platform: string): Promise<void> {
		platform = platform.toLowerCase();
		let platformData = this.$platformsData.getPlatformData(platform);
		let pluginData = this.convertToPluginData(dependencyData);

		let appFolderExists = this.$fs.exists(path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME));
		if (appFolderExists) {
			this.preparePluginScripts(pluginData, platform);
			await this.preparePluginNativeCode(pluginData, platform);

			// Show message
			this.$logger.out(`Successfully prepared plugin ${pluginData.name} for ${platform}.`);
		}
	}

	private preparePluginScripts(pluginData: IPluginData, platform: string): void {
		let platformData = this.$platformsData.getPlatformData(platform);
		let pluginScriptsDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
		let scriptsDestinationExists = this.$fs.exists(pluginScriptsDestinationPath);
		if (!scriptsDestinationExists) {
			//tns_modules/<plugin> doesn't exist. Assuming we're running a bundled prepare.
			return;
		}

		if (!this.isPluginDataValidForPlatform(pluginData, platform)) {
			return;
		}

		//prepare platform speciffic files, .map and .ts files
		this.$projectFilesManager.processPlatformSpecificFiles(pluginScriptsDestinationPath, platform);
	}

	private async preparePluginNativeCode(pluginData: IPluginData, platform: string): Promise<void> {
		let platformData = this.$platformsData.getPlatformData(platform);

		pluginData.pluginPlatformsFolderPath = (_platform: string) => path.join(pluginData.fullPath, "platforms", _platform);
		await platformData.platformProjectService.preparePluginNativeCode(pluginData);
	}

	public async ensureAllDependenciesAreInstalled(): Promise<void> {
		let installedDependencies = this.$fs.exists(this.nodeModulesPath) ? this.$fs.readDirectory(this.nodeModulesPath) : [];
		// Scoped dependencies are not on the root of node_modules,
		// so we have to list the contents of all directories, starting with @
		// and add them to installed dependencies, so we can apply correct comparison against package.json's dependencies.
		_(installedDependencies)
			.filter(dependencyName => _.startsWith(dependencyName, "@"))
			.each(scopedDependencyDir => {
				let contents = this.$fs.readDirectory(path.join(this.nodeModulesPath, scopedDependencyDir));
				installedDependencies = installedDependencies.concat(contents.map(dependencyName => `${scopedDependencyDir}/${dependencyName}`));
			});

		let packageJsonContent = this.$fs.readJson(this.getPackageJsonFilePath());
		let allDependencies = _.keys(packageJsonContent.dependencies).concat(_.keys(packageJsonContent.devDependencies));
		let notInstalledDependencies = _.difference(allDependencies, installedDependencies);
		if (this.$options.force || notInstalledDependencies.length) {
			this.$logger.trace("Npm install will be called from CLI. Force option is: ", this.$options.force, " Not installed dependencies are: ", notInstalledDependencies);
			await this.$npm.install(this.$projectData.projectDir, this.$projectData.projectDir, { "ignore-scripts": this.$options.ignoreScripts });
		}
	}

	public async getAllInstalledPlugins(): Promise<IPluginData[]> {
		let nodeModules = (await this.getAllInstalledModules()).map(nodeModuleData => this.convertToPluginData(nodeModuleData));
		return _.filter(nodeModules, nodeModuleData => nodeModuleData && nodeModuleData.isPlugin);
	}

	public getDependenciesFromPackageJson(): IPackageJsonDepedenciesResult {
		let packageJson = this.$fs.readJson(this.getPackageJsonFilePath());
		let dependencies: IBasePluginData[] = this.getBasicPluginInformation(packageJson.dependencies);

		let devDependencies: IBasePluginData[] = this.getBasicPluginInformation(packageJson.devDependencies);

		return {
			dependencies,
			devDependencies
		};
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

	private getNodeModuleData(module: string): INodeModuleData { // module can be  modulePath or moduleName
		if (!this.$fs.exists(module) || path.basename(module) !== "package.json") {
			module = this.getPackageJsonFilePathForModule(module);
		}

		let data = this.$fs.readJson(module);
		return {
			name: data.name,
			version: data.version,
			fullPath: path.dirname(module),
			isPlugin: data.nativescript !== undefined,
			moduleInfo: data.nativescript
		};
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

	private async ensure(): Promise<void> {
		await this.ensureAllDependenciesAreInstalled();
		this.$fs.ensureDirectoryExists(this.nodeModulesPath);
	}

	private async getAllInstalledModules(): Promise<INodeModuleData[]> {
		await this.ensure();

		let nodeModules = this.getDependencies();
		return _.map(nodeModules, nodeModuleName => this.getNodeModuleData(nodeModuleName));
	}

	private async executeNpmCommand(npmCommandName: string, npmCommandArguments: string): Promise<string> {
		if (npmCommandName === PluginsService.INSTALL_COMMAND_NAME) {
			await this.$npm.install(npmCommandArguments, this.$projectData.projectDir, PluginsService.NPM_CONFIG);
		} else if (npmCommandName === PluginsService.UNINSTALL_COMMAND_NAME) {
			await this.$npm.uninstall(npmCommandArguments, PluginsService.NPM_CONFIG, this.$projectData.projectDir);
		}

		return this.parseNpmCommandResult(npmCommandArguments);
	}

	private parseNpmCommandResult(npmCommandResult: string): string {
		return npmCommandResult.split("@")[0]; // returns plugin name
	}

	private async executeForAllInstalledPlatforms(action: (_pluginDestinationPath: string, pl: string, _platformData: IPlatformData) => Promise<void>): Promise<void> {
		let availablePlatforms = _.keys(this.$platformsData.availablePlatforms);
		for (let platform of availablePlatforms) {
			let isPlatformInstalled = this.$fs.exists(path.join(this.$projectData.platformsDir, platform.toLowerCase()));
			if (isPlatformInstalled) {
				let platformData = this.$platformsData.getPlatformData(platform.toLowerCase());
				let pluginDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
				await action(pluginDestinationPath, platform.toLowerCase(), platformData);
			}
		};
	}

	public getInstalledFrameworkVersion(platform: string): string {
		let pathToInstalledFrameworkPackageJson = path.join(this.$projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME, constants.FRAMEWORK_TO_PACKAGE[platform.toLowerCase()], constants.PACKAGE_JSON_FILE_NAME);
		let jsonContent = this.$fs.readJson(pathToInstalledFrameworkPackageJson);
		return jsonContent.version;
	}

	private isPluginDataValidForPlatform(pluginData: IPluginData, platform: string): boolean {
		let isValid = true;

		let installedFrameworkVersion = this.getInstalledFrameworkVersion(platform);
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
	}
}

$injector.register("pluginsService", PluginsService);
