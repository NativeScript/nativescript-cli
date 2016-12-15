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

	public copyModules(dependencies: any[], platform: string): void {
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

	private copyDependencyDir(dependency: any): void {
		if (dependency.depth === 0) {
			let isScoped = dependency.name.indexOf("@") === 0;
			let targetDir = this.outputRoot;

			if (isScoped) {
				targetDir = path.join(this.outputRoot, dependency.name.substring(0, dependency.name.indexOf("/")));
			}

			shelljs.mkdir("-p", targetDir);
			shelljs.cp("-Rf", dependency.directory, targetDir);

			//remove platform-specific files (processed separately by plugin services)
			const targetPackageDir = path.join(targetDir, dependency.name);
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

	protected beforePrepare(dependencies: IDictionary<IDependencyData>, platform: string): void {
		this.$platformsData.getPlatformData(platform).platformProjectService.beforePrepareAllPlugins(dependencies).wait();
	}

	protected afterPrepare(dependencies: IDictionary<IDependencyData>, platform: string): void {
		this.$platformsData.getPlatformData(platform).platformProjectService.afterPrepareAllPlugins().wait();
		this.writePreparedDependencyInfo(dependencies, platform);
	}

	private writePreparedDependencyInfo(dependencies: IDictionary<IDependencyData>, platform: string): void {
		let prepareData: IDictionary<boolean> = {};
		_.values(dependencies).forEach(d => {
			prepareData[d.name] = true;
		});
		this.$fs.createDirectory(this.preparedPlatformsDir(platform));
		this.$fs.writeJson(this.preparedPlatformsFile(platform), prepareData, "    ", "utf8");
	}

	private preparedPlatformsDir(platform: string): string {
		const platformRoot = this.$platformsData.getPlatformData(platform).projectRoot;
		if (/android/i.test(platform)) {
			return path.join(platformRoot, "build", "intermediates");
		} else if (/ios/i.test(platform)) {
			return path.join(platformRoot, "build");
		} else {
			throw new Error("Invalid platform: " + platform);
		}
	}

	private preparedPlatformsFile(platform: string): string {
		return path.join(this.preparedPlatformsDir(platform), "prepared-platforms.json");
	}

	protected getPreviouslyPreparedDependencies(platform: string): IDictionary<boolean> {
		if (!this.$fs.exists(this.preparedPlatformsFile(platform))) {
			return {};
		}
		return this.$fs.readJson(this.preparedPlatformsFile(platform), "utf8");
	}

	private allPrepared(dependencies: IDictionary<IDependencyData>, platform: string): boolean {
		let result = true;
		const previouslyPrepared = this.getPreviouslyPreparedDependencies(platform);
		_.values(dependencies).forEach(d => {
			if (!previouslyPrepared[d.name]) {
				result = false;
			}
		});
		return result;
	}

	public preparePlugins(dependencies: IDictionary<IDependencyData>, platform: string): void {
		if (_.isEmpty(dependencies) || this.allPrepared(dependencies, platform)) {
			return;
		}

		this.beforePrepare(dependencies, platform);
		_.each(dependencies, dependency => {
			let isPlugin = !!dependency.nativescript;
			if (isPlugin) {
				this.$pluginsService.prepare(dependency, platform).wait();
			}
		});
		this.afterPrepare(dependencies, platform);
	}
}
