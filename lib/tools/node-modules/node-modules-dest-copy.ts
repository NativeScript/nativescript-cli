import * as path from "path";
import * as shelljs from "shelljs";
import * as constants from "../../constants";
import * as minimatch from "minimatch";

export interface ILocalDependencyData extends IDependencyData {
	directory: string;
}

export class TnsModulesCopy {
	constructor(
		private outputRoot: string,
		private projectDir: string,
		private $fs: IFileSystem,
		private $pluginsService: IPluginsService
	) {
	}

	public prepareNodeModules(opts: { dependencies: IDependencyData[], release: boolean }): void {
		const filePatternsToDelete = opts.release ? "**/*.ts" : "**/*.d.ts";
		for (const entry in opts.dependencies) {
			const dependency = opts.dependencies[entry];

			if (dependency.depth === 0) {
				this.copyDependencyDir(dependency, filePatternsToDelete);
			}
		}
	}

	private copyDependencyDir(dependency: IDependencyData, filePatternsToDelete: string): void {
		const targetPackageDir = path.join(this.outputRoot, dependency.name);

		shelljs.mkdir("-p", targetPackageDir);

		const isScoped = dependency.name.indexOf("@") === 0;
		const destinationPath = isScoped ? path.join(this.outputRoot, dependency.name.substring(0, dependency.name.indexOf("/"))) : this.outputRoot;
		shelljs.cp("-RfL", dependency.directory, destinationPath);

		// remove platform-specific files (processed separately by plugin services)
		shelljs.rm("-rf", path.join(targetPackageDir, "platforms"));

		this.removeNonProductionDependencies(dependency, targetPackageDir);
		this.removeDependenciesPlatformsDirs(targetPackageDir);
		const allFiles = this.$fs.enumerateFilesInDirectorySync(targetPackageDir);
		allFiles.filter(file => minimatch(file, filePatternsToDelete, { nocase: true })).map(file => this.$fs.deleteFile(file));
	}

	private removeDependenciesPlatformsDirs(dependencyDir: string): void {
		const dependenciesFolder = path.join(dependencyDir, constants.NODE_MODULES_FOLDER_NAME);

		if (this.$fs.exists(dependenciesFolder)) {
			const dependencies = this.getDependencies(dependenciesFolder);

			dependencies
				.forEach(d => {
					const pathToDependency = path.join(dependenciesFolder, d);
					const pathToPackageJson = path.join(pathToDependency, constants.PACKAGE_JSON_FILE_NAME);

					if (this.$pluginsService.isNativeScriptPlugin(pathToPackageJson)) {
						this.$fs.deleteDirectory(path.join(pathToDependency, constants.PLATFORMS_DIR_NAME));
					}

					this.removeDependenciesPlatformsDirs(pathToDependency);
				});
		}
	}

	private removeNonProductionDependencies(dependency: IDependencyData, targetPackageDir: string): void {
		const packageJsonFilePath = path.join(dependency.directory, constants.PACKAGE_JSON_FILE_NAME);
		if (!this.$fs.exists(packageJsonFilePath)) {
			return;
		}

		const packageJsonContent = this.$fs.readJson(packageJsonFilePath);
		const productionDependencies = packageJsonContent.dependencies;

		const dependenciesFolder = path.join(targetPackageDir, constants.NODE_MODULES_FOLDER_NAME);
		if (this.$fs.exists(dependenciesFolder)) {
			const dependencies = this.getDependencies(dependenciesFolder);

			dependencies.filter(dir => !productionDependencies || !productionDependencies.hasOwnProperty(dir))
				.forEach(dir => shelljs.rm("-rf", path.join(dependenciesFolder, dir)));
		}
	}

	private getDependencies(dependenciesFolder: string): string[] {
		const dependencies = _.flatten(
			this.$fs.readDirectory(dependenciesFolder)
				.map(dir => {
					if (_.startsWith(dir, "@")) {
						const pathToDir = path.join(dependenciesFolder, dir);
						const contents = this.$fs.readDirectory(pathToDir);
						return _.map(contents, subDir => `${dir}/${subDir}`);
					}

					return dir;
				})
		)
			.filter(dir => {
				// remove folders that do not have package.json inside - they are not dependencies.
				// such dir for example is .bin produced in node_modules.
				const pathToDir = path.join(dependenciesFolder, dir);
				return this.$fs.exists(path.join(pathToDir, constants.PACKAGE_JSON_FILE_NAME));
			});

		return dependencies;
	}
}

export class NpmPluginPrepare {
	constructor(
		private $fs: IFileSystem,
		private $pluginsService: IPluginsService,
		private $platformsData: IPlatformsData,
		private $logger: ILogger
	) {
	}

	protected async afterPrepare(dependencies: IDependencyData[], platform: string, projectData: IProjectData): Promise<void> {
		const prepareData: IDictionary<boolean> = {};
		_.each(dependencies, d => {
			prepareData[d.name] = true;
		});
		this.$fs.createDirectory(this.preparedPlatformsDir(platform, projectData));
		this.$fs.writeJson(this.preparedPlatformsFile(platform, projectData), prepareData, "    ", "utf8");
	}

	private preparedPlatformsDir(platform: string, projectData: IProjectData): string {
		const platformRoot = this.$platformsData.getPlatformData(platform, projectData).projectRoot;
		if (/android/i.test(platform)) {
			return path.join(platformRoot, "build", "intermediates");
		} else if (/ios/i.test(platform)) {
			return path.join(platformRoot, "build");
		} else {
			throw new Error("Invalid platform: " + platform);
		}
	}

	private preparedPlatformsFile(platform: string, projectData: IProjectData): string {
		return path.join(this.preparedPlatformsDir(platform, projectData), "prepared-platforms.json");
	}

	protected getPreviouslyPreparedDependencies(platform: string, projectData: IProjectData): IDictionary<boolean> {
		if (!this.$fs.exists(this.preparedPlatformsFile(platform, projectData))) {
			return {};
		}
		return this.$fs.readJson(this.preparedPlatformsFile(platform, projectData), "utf8");
	}

	private allPrepared(dependencies: IDependencyData[], platform: string, projectData: IProjectData): boolean {
		let result = true;
		const previouslyPrepared = this.getPreviouslyPreparedDependencies(platform, projectData);
		_.each(dependencies, d => {
			if (!previouslyPrepared[d.name]) {
				result = false;
			}
		});
		return result;
	}

	public async preparePlugins(dependencies: IDependencyData[], platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): Promise<void> {
		if (_.isEmpty(dependencies)) {
			return;
		}

		await this.$platformsData.getPlatformData(platform, projectData).platformProjectService.beforePrepareAllPlugins(projectData, dependencies);

		for (const dependencyKey in dependencies) {
			const dependency = dependencies[dependencyKey];
			const isPlugin = !!dependency.nativescript;
			if (isPlugin && !dependency.deduped) {
				const pluginData = this.$pluginsService.convertToPluginData(dependency, projectData.projectDir);
				await this.$pluginsService.preparePluginNativeCode(pluginData, platform, projectData);
			}
		}

		await this.afterPrepare(dependencies, platform, projectData);
	}

	public async prepareJSPlugins(dependencies: IDependencyData[], platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): Promise<void> {
		if (_.isEmpty(dependencies) || this.allPrepared(dependencies, platform, projectData)) {
			return;
		}

		platform = platform.toLowerCase();
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const appFolderExists = this.$fs.exists(path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME));

		if (appFolderExists) {
			for (const dependencyKey in dependencies) {
				const dependency = dependencies[dependencyKey];
				const isPlugin = !!dependency.nativescript;
				if (isPlugin) {
					const pluginData = this.$pluginsService.convertToPluginData(dependency, projectData.projectDir);
					this.$pluginsService.preparePluginScripts(pluginData, platform, projectData, projectFilesConfig);
					// Show message
					this.$logger.out(`Successfully prepared plugin ${pluginData.name} for ${platform}.`);
				}
			}
		}
	}
}
