import * as path from "path";
import * as shelljs from "shelljs";
import * as semver from "semver";
import * as constants from "../constants";
import {
	IPluginsService,
	IPreparePluginNativeCodeData,
	IPluginData,
	IPackageJsonDepedenciesResult,
	IBasePluginData,
	INodeModuleData,
} from "../definitions/plugins";
import {
	IPlatformsDataService,
	INodeModulesDependenciesBuilder,
	IPlatformData,
} from "../definitions/platform";
import { IProjectDataService, IProjectData } from "../definitions/project";
import {
	INodePackageManagerInstallOptions,
	INodePackageManager,
	IOptions,
	IDependencyData,
} from "../declarations";
import {
	IFileSystem,
	IErrors,
	IDictionary,
	IStringDictionary,
} from "../common/declarations";
import { IFilesHashService } from "../definitions/files-hash-service";
import * as _ from "lodash";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import {
	resolvePackagePath,
	resolvePackageJSONPath,
} from "../helpers/package-path-helper";
import { color } from "../color";

export class PluginsService implements IPluginsService {
	private static INSTALL_COMMAND_NAME = "install";
	private static UNINSTALL_COMMAND_NAME = "uninstall";
	private static NPM_CONFIG = {
		save: true,
	};

	private static LOCK_FILES = [
		"package-lock.json",
		"npm-shrinkwrap.json",
		"yarn.lock",
		"pnpm-lock.yaml",
	];

	private get $platformsDataService(): IPlatformsDataService {
		return this.$injector.resolve("platformsDataService");
	}
	private get $projectDataService(): IProjectDataService {
		return this.$injector.resolve("projectDataService");
	}

	private get npmInstallOptions(): INodePackageManagerInstallOptions {
		return _.merge(
			{
				disableNpmInstall: this.$options.disableNpmInstall,
				frameworkPath: this.$options.frameworkPath,
				ignoreScripts: this.$options.ignoreScripts,
				path: this.$options.path,
			},
			PluginsService.NPM_CONFIG
		);
	}

	constructor(
		private $packageManager: INodePackageManager,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $logger: ILogger,
		private $errors: IErrors,
		private $filesHashService: IFilesHashService,
		private $injector: IInjector,
		private $mobileHelper: Mobile.IMobileHelper,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder
	) {}

	public async add(plugin: string, projectData: IProjectData): Promise<void> {
		await this.ensure(projectData);
		const possiblePackageName = path.resolve(plugin);
		if (
			possiblePackageName.indexOf(".tgz") !== -1 &&
			this.$fs.exists(possiblePackageName)
		) {
			plugin = possiblePackageName;
		}

		const name = (
			await this.$packageManager.install(
				plugin,
				projectData.projectDir,
				this.npmInstallOptions
			)
		).name;
		const pathToRealNpmPackageJson = this.getPackageJsonFilePathForModule(
			name,
			projectData.projectDir
		);
		const realNpmPackageJson = this.$fs.readJson(pathToRealNpmPackageJson);

		if (realNpmPackageJson.nativescript) {
			const pluginData = this.convertToPluginData(
				realNpmPackageJson,
				projectData.projectDir
			);

			// Validate
			const action = async (
				pluginDestinationPath: string,
				platform: constants.PlatformTypes,
				platformData: IPlatformData
			): Promise<void> => {
				this.isPluginDataValidForPlatform(pluginData, platform, projectData);
			};

			await this.executeForAllInstalledPlatforms(action, projectData);

			this.$logger.info(
				`Successfully installed plugin ${realNpmPackageJson.name}.`
			);
		} else {
			await this.$packageManager.uninstall(
				realNpmPackageJson.name,
				{ save: true },
				projectData.projectDir
			);
			this.$errors.fail(
				`${plugin} is not a valid NativeScript plugin. Verify that the plugin package.json file contains a nativescript key and try again.`
			);
		}
	}

	public async remove(
		pluginName: string,
		projectData: IProjectData
	): Promise<void> {
		const removePluginNativeCodeAction = async (
			modulesDestinationPath: string,
			platform: string,
			platformData: IPlatformData
		): Promise<void> => {
			const pluginData = this.convertToPluginData(
				this.getNodeModuleData(pluginName, projectData.projectDir),
				projectData.projectDir
			);

			await platformData.platformProjectService.removePluginNativeCode(
				pluginData,
				projectData
			);
		};

		await this.executeForAllInstalledPlatforms(
			removePluginNativeCodeAction,
			projectData
		);

		await this.executeNpmCommand(
			PluginsService.UNINSTALL_COMMAND_NAME,
			pluginName,
			projectData
		);

		let showMessage = true;
		const action = async (
			modulesDestinationPath: string,
			platform: string,
			platformData: IPlatformData
		): Promise<void> => {
			shelljs.rm("-rf", path.join(modulesDestinationPath, pluginName));

			this.$logger.info(
				`Successfully removed plugin ${pluginName} for ${platform}.`
			);
			showMessage = false;
		};

		await this.executeForAllInstalledPlatforms(action, projectData);

		if (showMessage) {
			this.$logger.info(`Successfully removed plugin ${pluginName}`);
		}
	}

	public addToPackageJson(
		plugin: string,
		version: string,
		isDev: boolean,
		projectDir: string
	) {
		const packageJsonPath = this.getPackageJsonFilePath(projectDir);
		let packageJsonContent = this.$fs.readJson(packageJsonPath);
		const collectionKey = isDev ? "devDependencies" : "dependencies";
		const oppositeCollectionKey = isDev ? "dependencies" : "devDependencies";
		if (
			packageJsonContent[oppositeCollectionKey] &&
			packageJsonContent[oppositeCollectionKey][plugin]
		) {
			const result = this.removeDependencyFromPackageJsonContent(
				plugin,
				packageJsonContent
			);
			packageJsonContent = result.packageJsonContent;
		}

		packageJsonContent[collectionKey] = packageJsonContent[collectionKey] || {};
		packageJsonContent[collectionKey][plugin] = version;

		this.$fs.writeJson(packageJsonPath, packageJsonContent);
	}

	public removeFromPackageJson(plugin: string, projectDir: string) {
		const packageJsonPath = this.getPackageJsonFilePath(projectDir);
		const packageJsonContent = this.$fs.readJson(packageJsonPath);
		const result = this.removeDependencyFromPackageJsonContent(
			plugin,
			packageJsonContent
		);

		if (result.hasModifiedPackageJson) {
			this.$fs.writeJson(packageJsonPath, result.packageJsonContent);
		}
	}

	public async preparePluginNativeCode({
		pluginData,
		platform,
		projectData,
	}: IPreparePluginNativeCodeData): Promise<void> {
		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		);

		const pluginPlatformsFolderPath =
			pluginData.pluginPlatformsFolderPath(platform);
		if (this.$fs.exists(pluginPlatformsFolderPath)) {
			const pathToPluginsBuildFile = path.join(
				platformData.projectRoot,
				constants.PLUGINS_BUILD_DATA_FILENAME
			);

			const allPluginsNativeHashes = this.getAllPluginsNativeHashes(
				pathToPluginsBuildFile
			);
			const oldPluginNativeHashes = allPluginsNativeHashes[pluginData.name];
			const currentPluginNativeHashes = await this.getPluginNativeHashes(
				pluginPlatformsFolderPath
			);
			if (
				!oldPluginNativeHashes ||
				this.$filesHashService.hasChangesInShasums(
					oldPluginNativeHashes,
					currentPluginNativeHashes
				)
			) {
				await platformData.platformProjectService.preparePluginNativeCode(
					pluginData,
					projectData
				);

				const updatedPluginNativeHashes = await this.getPluginNativeHashes(
					pluginPlatformsFolderPath
				);

				this.setPluginNativeHashes({
					pathToPluginsBuildFile,
					pluginData,
					currentPluginNativeHashes: updatedPluginNativeHashes,
					allPluginsNativeHashes,
				});
			}
		}
	}

	public async ensureAllDependenciesAreInstalled(
		projectData: IProjectData
	): Promise<void> {
		const packageJsonContent = this.$fs.readJson(
			this.getPackageJsonFilePath(projectData.projectDir)
		);
		const allDependencies = _.keys(packageJsonContent.dependencies).concat(
			_.keys(packageJsonContent.devDependencies)
		);

		const notInstalledDependencies = allDependencies
			.map((dep) => {
				this.$logger.trace(`Checking if ${dep} is installed...`);
				const pathToPackage = resolvePackagePath(dep, {
					paths: [projectData.projectDir],
				});

				if (pathToPackage) {
					// return false if the dependency is installed - we'll filter out boolean values
					// and end up with an array of dep names that are not installed if we end up
					// inside the catch block.
					return false;
				}

				this.$logger.trace(`${dep} is not installed, or couldn't be found`);
				return dep;
			})
			.filter(Boolean);

		if (this.$options.force || notInstalledDependencies.length) {
			this.$logger.trace(
				"Npm install will be called from CLI. Force option is: ",
				this.$options.force,
				" Not installed dependencies are: ",
				notInstalledDependencies
			);
			await this.$packageManager.install(
				projectData.projectDir,
				projectData.projectDir,
				{
					disableNpmInstall: this.$options.disableNpmInstall,
					frameworkPath: this.$options.frameworkPath,
					ignoreScripts: this.$options.ignoreScripts,
					path: this.$options.path,
				}
			);
		}
	}

	public async getAllInstalledPlugins(
		projectData: IProjectData
	): Promise<IPluginData[]> {
		const nodeModules = (await this.getAllInstalledModules(projectData)).map(
			(nodeModuleData) =>
				this.convertToPluginData(nodeModuleData, projectData.projectDir)
		);
		return _.filter(
			nodeModules,
			(nodeModuleData) => nodeModuleData && nodeModuleData.isPlugin
		);
	}

	public getAllProductionPlugins(
		projectData: IProjectData,
		platform: string,
		dependencies?: IDependencyData[]
	): IPluginData[] {
		dependencies =
			dependencies ||
			this.$nodeModulesDependenciesBuilder.getProductionDependencies(
				projectData.projectDir,
				projectData.ignoredDependencies
			);

		if (_.isEmpty(dependencies)) {
			return [];
		}

		let productionPlugins: IDependencyData[] = dependencies.filter(
			(d) => !!d.nativescript
		);
		productionPlugins = this.ensureValidProductionPlugins(
			productionPlugins,
			projectData.projectDir,
			platform
		);
		return productionPlugins
			.map((plugin) => this.convertToPluginData(plugin, projectData.projectDir))
			.filter((item, idx, self) => {
				// Filter out duplicates to speed up build times by not building the same dependency
				// multiple times. One possible downside is that if there are different versions
				// of the same native dependency only the first one in the array will be built
				return self.findIndex((p) => p.name === item.name) === idx;
			});
	}

	public getDependenciesFromPackageJson(
		projectDir: string
	): IPackageJsonDepedenciesResult {
		const packageJson = this.$fs.readJson(
			this.getPackageJsonFilePath(projectDir)
		);
		const dependencies: IBasePluginData[] = this.getBasicPluginInformation(
			packageJson.dependencies
		);

		const devDependencies: IBasePluginData[] = this.getBasicPluginInformation(
			packageJson.devDependencies
		);

		return {
			dependencies,
			devDependencies,
		};
	}

	public isNativeScriptPlugin(pluginPackageJsonPath: string): boolean {
		const pluginPackageJsonContent = this.$fs.readJson(pluginPackageJsonPath);
		return pluginPackageJsonContent && pluginPackageJsonContent.nativescript;
	}

	private ensureValidProductionPlugins = _.memoize<
		(
			productionDependencies: IDependencyData[],
			projectDir: string,
			platform: string
		) => IDependencyData[]
	>(
		this._ensureValidProductionPlugins,
		(
			productionDependencies: IDependencyData[],
			projectDir: string,
			platform: string
		) => {
			let key = _.sortBy(productionDependencies, (p) => p.directory)
				.map((d) => JSON.stringify(d, null, 2))
				.join("\n");
			key += projectDir + platform;
			return key;
		}
	);

	private _ensureValidProductionPlugins(
		productionDependencies: IDependencyData[],
		projectDir: string,
		platform: string
	): IDependencyData[] {
		let clonedProductionDependencies = _.cloneDeep(productionDependencies);
		platform = platform.toLowerCase();

		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			this.ensureValidProductionPluginsForAndroid(clonedProductionDependencies);
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			clonedProductionDependencies = this.ensureValidProductionPluginsForIOS(
				clonedProductionDependencies,
				projectDir,
				platform
			);
		}

		return clonedProductionDependencies;
	}

	private ensureValidProductionPluginsForAndroid(
		productionDependencies: IDependencyData[]
	): void {
		const dependenciesGroupedByName = _.groupBy(
			productionDependencies,
			(p) => p.name
		);
		_.each(
			dependenciesGroupedByName,
			(dependencyOccurrences, dependencyName) => {
				if (dependencyOccurrences.length > 1) {
					// the dependency exists multiple times in node_modules
					const dependencyOccurrencesGroupedByVersion = _.groupBy(
						dependencyOccurrences,
						(g) => g.version
					);
					const versions = _.keys(dependencyOccurrencesGroupedByVersion);
					if (versions.length === 1) {
						// all dependencies with this name have the same version
						this.$logger.trace(
							`Detected same versions (${_.first(
								versions
							)}) of the ${dependencyName} installed at locations: ${_.map(
								dependencyOccurrences,
								(d) => d.directory
							).join(", ")}`
						);
					} else {
						this.$logger.trace(
							`Detected different versions of the ${dependencyName} installed at locations: ${_.map(
								dependencyOccurrences,
								(d) => d.directory
							).join(", ")}\nThis can cause build failures.`
						);
					}
				}
			}
		);
	}

	private ensureValidProductionPluginsForIOS(
		productionDependencies: IDependencyData[],
		projectDir: string,
		platform: string
	): IDependencyData[] {
		const dependenciesWithFrameworks: any[] = [];
		_.each(productionDependencies, (d) => {
			const pathToPlatforms = path.join(
				d.directory,
				constants.PLATFORMS_DIR_NAME,
				platform
			);
			if (this.$fs.exists(pathToPlatforms)) {
				const contents = this.$fs.readDirectory(pathToPlatforms);
				_.each(contents, (file) => {
					if (path.extname(file) === ".framework") {
						dependenciesWithFrameworks.push({
							...d,
							frameworkName: path.basename(file),
							frameworkLocation: path.join(pathToPlatforms, file),
						});
					}
				});
			}
		});

		if (dependenciesWithFrameworks.length > 0) {
			const dependenciesGroupedByFrameworkName = _.groupBy(
				dependenciesWithFrameworks,
				(d) => d.frameworkName
			);
			_.each(
				dependenciesGroupedByFrameworkName,
				(dependencyOccurrences, frameworkName) => {
					if (dependencyOccurrences.length > 1) {
						// A framework exists multiple times in node_modules
						const groupedByName = _.groupBy(
							dependencyOccurrences,
							(d) => d.name
						);
						const pluginsNames = _.keys(groupedByName);
						if (pluginsNames.length > 1) {
							// fail - the same framework is installed by different dependencies.
							const locations = dependencyOccurrences.map(
								(d) => d.frameworkLocation
							);
							let msg = `Detected the framework ${frameworkName} is installed from multiple plugins at locations:\n${locations.join(
								"\n"
							)}\n`;
							msg += this.getHelpMessage(projectDir);
							this.$errors.fail(msg);
						}

						const dependencyName = _.first(pluginsNames);
						const dependencyOccurrencesGroupedByVersion = _.groupBy(
							dependencyOccurrences,
							(g) => g.version
						);
						const versions = _.keys(dependencyOccurrencesGroupedByVersion);
						if (versions.length === 1) {
							// all dependencies with this name have the same version
							this.$logger.warn(
								`Detected the framework ${frameworkName} is installed multiple times from the same versions of plugin (${_.first(
									versions
								)}) at locations: ${_.map(
									dependencyOccurrences,
									(d) => d.directory
								).join(", ")}`
							);
							const selectedPackage = _.minBy(
								dependencyOccurrences,
								(d) => d.depth
							);
							this.$logger.info(
								color.green(
									`CLI will use only the native code from '${selectedPackage.directory}'.`
								)
							);
							_.each(dependencyOccurrences, (dependency) => {
								if (dependency !== selectedPackage) {
									productionDependencies.splice(
										productionDependencies.indexOf(dependency),
										1
									);
								}
							});
						} else {
							const message =
								this.getFailureMessageForDifferentDependencyVersions(
									dependencyName,
									frameworkName,
									dependencyOccurrencesGroupedByVersion,
									projectDir
								);
							this.$errors.fail(message);
						}
					}
				}
			);
		}

		return productionDependencies;
	}

	private getFailureMessageForDifferentDependencyVersions(
		dependencyName: string,
		frameworkName: string,
		dependencyOccurrencesGroupedByVersion: IDictionary<IDependencyData[]>,
		projectDir: string
	): string {
		let message = `Cannot use the same framework ${frameworkName} multiple times in your application.
This framework comes from ${dependencyName} plugin, which is installed multiple times in node_modules:\n`;
		_.each(dependencyOccurrencesGroupedByVersion, (dependencies, version) => {
			message += dependencies.map(
				(d) => `* Path: ${d.directory}, version: ${d.version}\n`
			);
		});

		message += this.getHelpMessage(projectDir);
		return message;
	}

	private getHelpMessage(projectDir: string): string {
		const existingLockFiles: string[] = [];
		PluginsService.LOCK_FILES.forEach((lockFile) => {
			if (this.$fs.exists(path.join(projectDir, lockFile))) {
				existingLockFiles.push(lockFile);
			}
		});

		let msgForLockFiles: string = "";
		if (existingLockFiles.length) {
			msgForLockFiles += ` and ${existingLockFiles.join(", ")}`;
		}

		return `\nProbably you need to update your dependencies, remove node_modules${msgForLockFiles} and try again.`;
	}

	private convertToPluginData(
		cacheData: IDependencyData | INodeModuleData,
		projectDir: string
	): IPluginData {
		try {
			const pluginData: IPluginData = <IPluginData>{};
			pluginData.name = cacheData.name;
			pluginData.version = cacheData.version;
			pluginData.fullPath =
				(<IDependencyData>cacheData).directory ||
				path.dirname(
					this.getPackageJsonFilePathForModule(cacheData.name, projectDir)
				);
			pluginData.isPlugin = !!cacheData.nativescript;
			pluginData.pluginPlatformsFolderPath = (platform: string) => {
				if (this.$mobileHelper.isvisionOSPlatform(platform)) {
					platform = constants.PlatformTypes.ios;
				}
				return path.join(
					pluginData.fullPath,
					constants.PLATFORMS_DIR_NAME,
					platform.toLowerCase()
				);
			};
			const data = cacheData.nativescript;

			if (pluginData.isPlugin) {
				pluginData.platformsData = data.platforms;
				pluginData.pluginVariables = data.variables;
				pluginData.nativescript = data;
			}
			return pluginData;
		} catch (err) {
			this.$logger.trace(
				"NOTE: There appears to be a problem with this dependency:",
				cacheData.name
			);
			this.$logger.trace(err);
			return null;
		}
	}

	private removeDependencyFromPackageJsonContent(
		dependency: string,
		packageJsonContent: any
	): { hasModifiedPackageJson: boolean; packageJsonContent: any } {
		let hasModifiedPackageJson = false;

		if (
			packageJsonContent.devDependencies &&
			packageJsonContent.devDependencies[dependency]
		) {
			delete packageJsonContent.devDependencies[dependency];
			hasModifiedPackageJson = true;
		}

		if (
			packageJsonContent.dependencies &&
			packageJsonContent.dependencies[dependency]
		) {
			delete packageJsonContent.dependencies[dependency];
			hasModifiedPackageJson = true;
		}

		return {
			hasModifiedPackageJson,
			packageJsonContent,
		};
	}

	private getBasicPluginInformation(dependencies: any): IBasePluginData[] {
		return _.map(dependencies, (version: string, key: string) => ({
			name: key,
			version: version,
		}));
	}

	private getNodeModulesPath(projectDir: string): string {
		return path.join(projectDir, "node_modules");
	}

	private getPackageJsonFilePath(projectDir: string): string {
		return path.join(projectDir, "package.json");
	}

	private getPackageJsonFilePathForModule(
		moduleName: string,
		projectDir: string
	): string {
		const pathToJsonFile = resolvePackageJSONPath(moduleName, {
			paths: [projectDir],
		});
		return pathToJsonFile;
	}

	private getDependencies(projectDir: string): string[] {
		const packageJsonFilePath = this.getPackageJsonFilePath(projectDir);
		return _.keys(require(packageJsonFilePath).dependencies);
	}

	private getNodeModuleData(
		module: string,
		projectDir: string
	): INodeModuleData {
		// module can be  modulePath or moduleName
		if (!this.$fs.exists(module) || path.basename(module) !== "package.json") {
			module = this.getPackageJsonFilePathForModule(module, projectDir);
		}

		const data = this.$fs.readJson(module);
		return {
			name: data.name,
			version: data.version,
			fullPath: path.dirname(module),
			isPlugin: data.nativescript !== undefined,
			nativescript: data.nativescript,
		};
	}

	private async ensure(projectData: IProjectData): Promise<void> {
		await this.ensureAllDependenciesAreInstalled(projectData);
		this.$fs.ensureDirectoryExists(
			this.getNodeModulesPath(projectData.projectDir)
		);
	}

	private async getAllInstalledModules(
		projectData: IProjectData
	): Promise<INodeModuleData[]> {
		await this.ensure(projectData);

		const nodeModules = this.getDependencies(projectData.projectDir);
		return _.map(nodeModules, (nodeModuleName) =>
			this.getNodeModuleData(nodeModuleName, projectData.projectDir)
		);
	}

	private async executeNpmCommand(
		npmCommandName: string,
		npmCommandArguments: string,
		projectData: IProjectData
	): Promise<string> {
		if (npmCommandName === PluginsService.INSTALL_COMMAND_NAME) {
			await this.$packageManager.install(
				npmCommandArguments,
				projectData.projectDir,
				this.npmInstallOptions
			);
		} else if (npmCommandName === PluginsService.UNINSTALL_COMMAND_NAME) {
			await this.$packageManager.uninstall(
				npmCommandArguments,
				PluginsService.NPM_CONFIG,
				projectData.projectDir
			);
		}

		return this.parseNpmCommandResult(npmCommandArguments);
	}

	private parseNpmCommandResult(npmCommandResult: string): string {
		return npmCommandResult.split("@")[0]; // returns plugin name
	}

	private async executeForAllInstalledPlatforms(
		action: (
			_pluginDestinationPath: string,
			pl: string,
			_platformData: IPlatformData
		) => Promise<void>,
		projectData: IProjectData
	): Promise<void> {
		const availablePlatforms = this.$mobileHelper.platformNames.map((p) =>
			p.toLowerCase()
		);
		for (const platform of availablePlatforms) {
			const isPlatformInstalled = this.$fs.exists(
				path.join(projectData.platformsDir, platform.toLowerCase())
			);
			if (isPlatformInstalled) {
				const platformData = this.$platformsDataService.getPlatformData(
					platform.toLowerCase(),
					projectData
				);
				const pluginDestinationPath = path.join(
					platformData.appDestinationDirectoryPath,
					this.$options.hostProjectModuleName,
					"tns_modules"
				);
				await action(
					pluginDestinationPath,
					platform.toLowerCase(),
					platformData
				);
			}
		}
	}

	private getInstalledFrameworkVersion(
		platform: constants.PlatformTypes,
		projectData: IProjectData
	): string {
		const runtimePackage = this.$projectDataService.getRuntimePackage(
			projectData.projectDir,
			platform
		);
		// const platformData = this.$platformsDataService.getPlatformData(platform, projectData);
		// const frameworkData = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
		return runtimePackage.version;
	}

	private isPluginDataValidForPlatform(
		pluginData: IPluginData,
		platform: constants.PlatformTypes,
		projectData: IProjectData
	): boolean {
		let isValid = true;

		const installedFrameworkVersion = this.getInstalledFrameworkVersion(
			platform,
			projectData
		);
		const pluginPlatformsData = pluginData.platformsData;
		if (pluginPlatformsData) {
			const versionRequiredByPlugin = (<any>pluginPlatformsData)[platform];
			if (!versionRequiredByPlugin) {
				this.$logger.warn(
					`${pluginData.name} is not supported for ${platform}.`
				);
				isValid = false;
			} else if (
				semver.gt(versionRequiredByPlugin, installedFrameworkVersion)
			) {
				this.$logger.warn(
					`${pluginData.name} requires at least version ${versionRequiredByPlugin} of platform ${platform}. Currently installed version is ${installedFrameworkVersion}.`
				);
				isValid = false;
			}
		}

		return isValid;
	}

	private async getPluginNativeHashes(
		pluginPlatformsDir: string
	): Promise<IStringDictionary> {
		let data: IStringDictionary = {};
		if (this.$fs.exists(pluginPlatformsDir)) {
			const pluginNativeDataFiles =
				this.$fs.enumerateFilesInDirectorySync(pluginPlatformsDir);
			data = await this.$filesHashService.generateHashes(pluginNativeDataFiles);
		}

		return data;
	}

	private getAllPluginsNativeHashes(
		pathToPluginsBuildFile: string
	): IDictionary<IStringDictionary> {
		if (this.$options.hostProjectPath) {
			// TODO: force rebuild plugins for now until we decide where to put .ns-plugins-build-data.json when embedding
			return {};
		}
		let data: IDictionary<IStringDictionary> = {};
		if (this.$fs.exists(pathToPluginsBuildFile)) {
			data = this.$fs.readJson(pathToPluginsBuildFile);
		}

		return data;
	}

	private setPluginNativeHashes(opts: {
		pathToPluginsBuildFile: string;
		pluginData: IPluginData;
		currentPluginNativeHashes: IStringDictionary;
		allPluginsNativeHashes: IDictionary<IStringDictionary>;
	}): void {
		if (this.$options.hostProjectPath) {
			// TODO: force rebuild plugins for now until we decide where to put .ns-plugins-build-data.json when embedding
			return;
		}

		opts.allPluginsNativeHashes[opts.pluginData.name] =
			opts.currentPluginNativeHashes;
		this.$fs.writeJson(
			opts.pathToPluginsBuildFile,
			opts.allPluginsNativeHashes
		);
	}
}

injector.register("pluginsService", PluginsService);
