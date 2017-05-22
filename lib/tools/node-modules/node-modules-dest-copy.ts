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
		private $options: IOptions,
		private $fs: IFileSystem
	) {
	}

	public copyModules(dependencies: IDependencyData[], platform: string): void {
		for (let entry in dependencies) {
			let dependency = dependencies[entry];

			this.copyDependencyDir(dependency);

			if (dependency.name === constants.TNS_CORE_MODULES_NAME) {
				let tnsCoreModulesResourcePath = path.join(this.outputRoot, constants.TNS_CORE_MODULES_NAME);

				// Remove .ts files
				let allFiles = this.$fs.enumerateFilesInDirectorySync(tnsCoreModulesResourcePath);
				let matchPattern = this.$options.release ? "**/*.ts" : "**/*.d.ts";
				allFiles.filter(file => minimatch(file, matchPattern, { nocase: true })).map(file => this.$fs.deleteFile(file));

				shelljs.rm("-rf", path.join(tnsCoreModulesResourcePath, "node_modules"));
			}
		}
	}

	private copyDependencyDir(dependency: IDependencyData): void {
		if (dependency.depth === 0) {
			const targetPackageDir = path.join(this.outputRoot, dependency.name);

			shelljs.mkdir("-p", targetPackageDir);

			let isScoped = dependency.name.indexOf("@") === 0;

			if (isScoped) {
				// copy module into tns_modules/@scope/module instead of tns_modules/module
				shelljs.cp("-Rf", dependency.directory, path.join(this.outputRoot, dependency.name.substring(0, dependency.name.indexOf("/"))));
			} else {
				shelljs.cp("-Rf", dependency.directory, this.outputRoot);
			}

			// remove platform-specific files (processed separately by plugin services)
			shelljs.rm("-rf", path.join(targetPackageDir, "platforms"));
		}
	}
}

export class NpmPluginPrepare {
	constructor(
		private $fs: IFileSystem,
		private $pluginsService: IPluginsService,
		private $platformsData: IPlatformsData
	) {
	}

	protected async beforePrepare(dependencies: IDependencyData[], platform: string, projectData: IProjectData): Promise<void> {
		await this.$platformsData.getPlatformData(platform, projectData).platformProjectService.beforePrepareAllPlugins(projectData, dependencies);
	}

	protected async afterPrepare(dependencies: IDependencyData[], platform: string, projectData: IProjectData): Promise<void> {
		await this.$platformsData.getPlatformData(platform, projectData).platformProjectService.afterPrepareAllPlugins(projectData);
		this.writePreparedDependencyInfo(dependencies, platform, projectData);
	}

	private writePreparedDependencyInfo(dependencies: IDependencyData[], platform: string, projectData: IProjectData): void {
		let prepareData: IDictionary<boolean> = {};
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

	public async preparePlugins(dependencies: IDependencyData[], platform: string, projectData: IProjectData): Promise<void> {
		if (_.isEmpty(dependencies) || this.allPrepared(dependencies, platform, projectData)) {
			return;
		}

		await this.beforePrepare(dependencies, platform, projectData);
		for (let dependencyKey in dependencies) {
			const dependency = dependencies[dependencyKey];
			let isPlugin = !!dependency.nativescript;
			if (isPlugin) {
				await this.$pluginsService.prepare(dependency, platform, projectData);
			}
		}

		await this.afterPrepare(dependencies, platform, projectData);
	}
}
