import * as path from "path";
import * as shelljs from "shelljs";
import * as semver from "semver";
import * as constants from "../constants";
import { NODE_MODULES_DIR_NAME } from "../common/constants";

export class PluginsService implements IPluginsService {
	private static INSTALL_COMMAND_NAME = "install";
	private static UNINSTALL_COMMAND_NAME = "uninstall";
	private static NPM_CONFIG = {
		save: true
	};
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

	private get npmInstallOptions(): INodePackageManagerInstallOptions {
		return _.merge({
			disableNpmInstall: this.$options.disableNpmInstall,
			frameworkPath: this.$options.frameworkPath,
			ignoreScripts: this.$options.ignoreScripts,
			path: this.$options.path
		}, PluginsService.NPM_CONFIG);
	}

	constructor(private $npm: INodePackageManager,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $logger: ILogger,
		private $errors: IErrors,
		private $filesHashService: IFilesHashService,
		private $injector: IInjector) { }

	public async add(plugin: string, projectData: IProjectData): Promise<void> {
		await this.ensure(projectData);
		const possiblePackageName = path.resolve(plugin);
		if (possiblePackageName.indexOf(".tgz") !== -1 && this.$fs.exists(possiblePackageName)) {
			plugin = possiblePackageName;
		}

		const name = (await this.$npm.install(plugin, projectData.projectDir, this.npmInstallOptions)).name;
		const pathToRealNpmPackageJson = path.join(projectData.projectDir, "node_modules", name, "package.json");
		const realNpmPackageJson = this.$fs.readJson(pathToRealNpmPackageJson);

		if (realNpmPackageJson.nativescript) {
			const pluginData = this.convertToPluginData(realNpmPackageJson, projectData.projectDir);

			// Validate
			const action = async (pluginDestinationPath: string, platform: string, platformData: IPlatformData): Promise<void> => {
				this.isPluginDataValidForPlatform(pluginData, platform, projectData);
			};

			await this.executeForAllInstalledPlatforms(action, projectData);

			try {
				await this.$pluginVariablesService.savePluginVariablesInProjectFile(pluginData, projectData.projectDir);
			} catch (err) {
				// Revert package.json
				this.$projectDataService.removeNSProperty(projectData.projectDir, this.$pluginVariablesService.getPluginVariablePropertyName(pluginData.name));
				await this.$npm.uninstall(plugin, PluginsService.NPM_CONFIG, projectData.projectDir);

				throw err;
			}

			this.$logger.out(`Successfully installed plugin ${realNpmPackageJson.name}.`);
		} else {
			await this.$npm.uninstall(realNpmPackageJson.name, { save: true }, projectData.projectDir);
			this.$errors.failWithoutHelp(`${plugin} is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.`);
		}
	}

	public async remove(pluginName: string, projectData: IProjectData): Promise<void> {
		const removePluginNativeCodeAction = async (modulesDestinationPath: string, platform: string, platformData: IPlatformData): Promise<void> => {
			const pluginData = this.convertToPluginData(this.getNodeModuleData(pluginName, projectData.projectDir), projectData.projectDir);

			await platformData.platformProjectService.removePluginNativeCode(pluginData, projectData);
		};

		this.$pluginVariablesService.removePluginVariablesFromProjectFile(pluginName.toLowerCase(), projectData.projectDir);
		await this.executeForAllInstalledPlatforms(removePluginNativeCodeAction, projectData);

		await this.executeNpmCommand(PluginsService.UNINSTALL_COMMAND_NAME, pluginName, projectData);

		let showMessage = true;
		const action = async (modulesDestinationPath: string, platform: string, platformData: IPlatformData): Promise<void> => {
			shelljs.rm("-rf", path.join(modulesDestinationPath, pluginName));

			this.$logger.out(`Successfully removed plugin ${pluginName} for ${platform}.`);
			showMessage = false;
		};

		await this.executeForAllInstalledPlatforms(action, projectData);

		if (showMessage) {
			this.$logger.out(`Successfully removed plugin ${pluginName}`);
		}
	}

	public async validate(platformData: IPlatformData, projectData: IProjectData): Promise<void> {
		return await platformData.platformProjectService.validatePlugins(projectData);
	}

	public async prepare(dependencyData: IDependencyData, platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): Promise<void> {
		platform = platform.toLowerCase();
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const pluginData = this.convertToPluginData(dependencyData, projectData.projectDir);

		const appFolderExists = this.$fs.exists(path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME));
		if (appFolderExists) {
			this.preparePluginScripts(pluginData, platform, projectData, projectFilesConfig);
			await this.preparePluginNativeCode(pluginData, platform, projectData);

			// Show message
			this.$logger.out(`Successfully prepared plugin ${pluginData.name} for ${platform}.`);
		}
	}

	public preparePluginScripts(pluginData: IPluginData, platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): void {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const pluginScriptsDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
		const scriptsDestinationExists = this.$fs.exists(pluginScriptsDestinationPath);
		if (!scriptsDestinationExists) {
			//tns_modules/<plugin> doesn't exist. Assuming we're running a bundled prepare.
			return;
		}

		if (!this.isPluginDataValidForPlatform(pluginData, platform, projectData)) {
			return;
		}

		//prepare platform speciffic files, .map and .ts files
		this.$projectFilesManager.processPlatformSpecificFiles(pluginScriptsDestinationPath, platform, projectFilesConfig);
	}

	public async preparePluginNativeCode(pluginData: IPluginData, platform: string, projectData: IProjectData): Promise<void> {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		pluginData.pluginPlatformsFolderPath = (_platform: string) => path.join(pluginData.fullPath, "platforms", _platform.toLowerCase());

		const pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(platform);
		if (this.$fs.exists(pluginPlatformsFolderPath)) {
			const pathToPluginsBuildFile = path.join(platformData.projectRoot, constants.PLUGINS_BUILD_DATA_FILENAME);

			const allPluginsNativeHashes = this.getAllPluginsNativeHashes(pathToPluginsBuildFile);
			const oldPluginNativeHashes = allPluginsNativeHashes[pluginData.name];
			const currentPluginNativeHashes = await this.getPluginNativeHashes(pluginPlatformsFolderPath);

			if (!oldPluginNativeHashes || this.$filesHashService.hasChangesInShasums(oldPluginNativeHashes, currentPluginNativeHashes)) {
				await platformData.platformProjectService.preparePluginNativeCode(pluginData, projectData);
				this.setPluginNativeHashes({
					pathToPluginsBuildFile,
					pluginData,
					currentPluginNativeHashes,
					allPluginsNativeHashes
				});
			}
		}
	}

	public async ensureAllDependenciesAreInstalled(projectData: IProjectData): Promise<void> {
		let installedDependencies = this.$fs.exists(this.getNodeModulesPath(projectData.projectDir)) ? this.$fs.readDirectory(this.getNodeModulesPath(projectData.projectDir)) : [];
		// Scoped dependencies are not on the root of node_modules,
		// so we have to list the contents of all directories, starting with @
		// and add them to installed dependencies, so we can apply correct comparison against package.json's dependencies.
		_(installedDependencies)
			.filter(dependencyName => _.startsWith(dependencyName, "@"))
			.each(scopedDependencyDir => {
				const contents = this.$fs.readDirectory(path.join(this.getNodeModulesPath(projectData.projectDir), scopedDependencyDir));
				installedDependencies = installedDependencies.concat(contents.map(dependencyName => `${scopedDependencyDir}/${dependencyName}`));
			});

		const packageJsonContent = this.$fs.readJson(this.getPackageJsonFilePath(projectData.projectDir));
		const allDependencies = _.keys(packageJsonContent.dependencies).concat(_.keys(packageJsonContent.devDependencies));
		const notInstalledDependencies = _.difference(allDependencies, installedDependencies);
		if (this.$options.force || notInstalledDependencies.length) {
			this.$logger.trace("Npm install will be called from CLI. Force option is: ", this.$options.force, " Not installed dependencies are: ", notInstalledDependencies);
			await this.$npm.install(projectData.projectDir, projectData.projectDir, {
				disableNpmInstall: this.$options.disableNpmInstall,
				frameworkPath: this.$options.frameworkPath,
				ignoreScripts: this.$options.ignoreScripts,
				path: this.$options.path
			});
		}
	}

	public async getAllInstalledPlugins(projectData: IProjectData): Promise<IPluginData[]> {
		const nodeModules = (await this.getAllInstalledModules(projectData)).map(nodeModuleData => this.convertToPluginData(nodeModuleData, projectData.projectDir));
		return _.filter(nodeModules, nodeModuleData => nodeModuleData && nodeModuleData.isPlugin);
	}

	public getDependenciesFromPackageJson(projectDir: string): IPackageJsonDepedenciesResult {
		const packageJson = this.$fs.readJson(this.getPackageJsonFilePath(projectDir));
		const dependencies: IBasePluginData[] = this.getBasicPluginInformation(packageJson.dependencies);

		const devDependencies: IBasePluginData[] = this.getBasicPluginInformation(packageJson.devDependencies);

		return {
			dependencies,
			devDependencies
		};
	}

	public isNativeScriptPlugin(pluginName: string, projectData: IProjectData): boolean {
		const pluginPackageJsonPath = path.join(projectData.projectDir, NODE_MODULES_DIR_NAME, pluginName, "package.json");
		const pluginPackageJsonContent = this.$fs.readJson(pluginPackageJsonPath);
		return pluginPackageJsonContent && pluginPackageJsonContent.nativescript;
	}

	private getBasicPluginInformation(dependencies: any): IBasePluginData[] {
		return _.map(dependencies, (version: string, key: string) => ({
			name: key,
			version: version
		}));
	}

	private getNodeModulesPath(projectDir: string): string {
		return path.join(projectDir, "node_modules");
	}

	private getPackageJsonFilePath(projectDir: string): string {
		return path.join(projectDir, "package.json");
	}

	private getPackageJsonFilePathForModule(moduleName: string, projectDir: string): string {
		return path.join(this.getNodeModulesPath(projectDir), moduleName, "package.json");
	}

	private getDependencies(projectDir: string): string[] {
		const packageJsonFilePath = this.getPackageJsonFilePath(projectDir);
		return _.keys(require(packageJsonFilePath).dependencies);
	}

	private getNodeModuleData(module: string, projectDir: string): INodeModuleData { // module can be  modulePath or moduleName
		if (!this.$fs.exists(module) || path.basename(module) !== "package.json") {
			module = this.getPackageJsonFilePathForModule(module, projectDir);
		}

		const data = this.$fs.readJson(module);
		return {
			name: data.name,
			version: data.version,
			fullPath: path.dirname(module),
			isPlugin: data.nativescript !== undefined,
			moduleInfo: data.nativescript
		};
	}

	public convertToPluginData(cacheData: any, projectDir: string): IPluginData {
		const pluginData: any = {};
		pluginData.name = cacheData.name;
		pluginData.version = cacheData.version;
		pluginData.fullPath = cacheData.directory || path.dirname(this.getPackageJsonFilePathForModule(cacheData.name, projectDir));
		pluginData.isPlugin = !!cacheData.nativescript || !!cacheData.moduleInfo;
		pluginData.pluginPlatformsFolderPath = (platform: string) => path.join(pluginData.fullPath, "platforms", platform);
		const data = cacheData.nativescript || cacheData.moduleInfo;

		if (pluginData.isPlugin) {
			pluginData.platformsData = data.platforms;
			pluginData.pluginVariables = data.variables;
		}

		return pluginData;
	}

	private async ensure(projectData: IProjectData): Promise<void> {
		await this.ensureAllDependenciesAreInstalled(projectData);
		this.$fs.ensureDirectoryExists(this.getNodeModulesPath(projectData.projectDir));
	}

	private async getAllInstalledModules(projectData: IProjectData): Promise<INodeModuleData[]> {
		await this.ensure(projectData);

		const nodeModules = this.getDependencies(projectData.projectDir);
		return _.map(nodeModules, nodeModuleName => this.getNodeModuleData(nodeModuleName, projectData.projectDir));
	}

	private async executeNpmCommand(npmCommandName: string, npmCommandArguments: string, projectData: IProjectData): Promise<string> {
		if (npmCommandName === PluginsService.INSTALL_COMMAND_NAME) {
			await this.$npm.install(npmCommandArguments, projectData.projectDir, this.npmInstallOptions);
		} else if (npmCommandName === PluginsService.UNINSTALL_COMMAND_NAME) {
			await this.$npm.uninstall(npmCommandArguments, PluginsService.NPM_CONFIG, projectData.projectDir);
		}

		return this.parseNpmCommandResult(npmCommandArguments);
	}

	private parseNpmCommandResult(npmCommandResult: string): string {
		return npmCommandResult.split("@")[0]; // returns plugin name
	}

	private async executeForAllInstalledPlatforms(action: (_pluginDestinationPath: string, pl: string, _platformData: IPlatformData) => Promise<void>, projectData: IProjectData): Promise<void> {
		const availablePlatforms = _.keys(this.$platformsData.availablePlatforms);
		for (const platform of availablePlatforms) {
			const isPlatformInstalled = this.$fs.exists(path.join(projectData.platformsDir, platform.toLowerCase()));
			if (isPlatformInstalled) {
				const platformData = this.$platformsData.getPlatformData(platform.toLowerCase(), projectData);
				const pluginDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, "tns_modules");
				await action(pluginDestinationPath, platform.toLowerCase(), platformData);
			}
		}
	}

	private getInstalledFrameworkVersion(platform: string, projectData: IProjectData): string {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const frameworkData = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
		return frameworkData.version;
	}

	private isPluginDataValidForPlatform(pluginData: IPluginData, platform: string, projectData: IProjectData): boolean {
		let isValid = true;

		const installedFrameworkVersion = this.getInstalledFrameworkVersion(platform, projectData);
		const pluginPlatformsData = pluginData.platformsData;
		if (pluginPlatformsData) {
			const pluginVersion = (<any>pluginPlatformsData)[platform];
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

	private async getPluginNativeHashes(pluginPlatformsDir: string): Promise<IStringDictionary> {
		let data: IStringDictionary = {};
		if (this.$fs.exists(pluginPlatformsDir)) {
			const pluginNativeDataFiles = this.$fs.enumerateFilesInDirectorySync(pluginPlatformsDir);
			data = await this.$filesHashService.generateHashes(pluginNativeDataFiles);
		}

		return data;
	}

	private getAllPluginsNativeHashes(pathToPluginsBuildFile: string): IDictionary<IStringDictionary> {
		let data: IDictionary<IStringDictionary> = {};
		if (this.$fs.exists(pathToPluginsBuildFile)) {
			data = this.$fs.readJson(pathToPluginsBuildFile);
		}

		return data;
	}

	private setPluginNativeHashes(opts: { pathToPluginsBuildFile: string, pluginData: IPluginData, currentPluginNativeHashes: IStringDictionary, allPluginsNativeHashes: IDictionary<IStringDictionary> }): void {
		opts.allPluginsNativeHashes[opts.pluginData.name] = opts.currentPluginNativeHashes;
		this.$fs.writeJson(opts.pathToPluginsBuildFile, opts.allPluginsNativeHashes);
	}
}

$injector.register("pluginsService", PluginsService);
