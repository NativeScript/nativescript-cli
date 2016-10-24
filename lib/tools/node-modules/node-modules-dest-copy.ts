import * as path from "path";
import * as shelljs from "shelljs";
import * as constants from "../../constants";
import * as minimatch from "minimatch";
import Future = require("fibers/future");

export interface ILocalDependencyData extends IDependencyData {
	directory: string;
}

export class TnsModulesCopy {
	constructor(
		private outputRoot: string,
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
				let deleteFilesFutures = allFiles.filter(file => minimatch(file, "**/*.ts", { nocase: true })).map(file => this.$fs.deleteFile(file));
				Future.wait(deleteFilesFutures);
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

	public preparePlugins(dependencies: IDictionary<IDependencyData>, platform: string): void {
		if (_.isEmpty(dependencies)) {
			return;
		}

		this.$platformsData.getPlatformData(platform).platformProjectService.beforePrepareAllPlugins().wait();
		_.each(dependencies, dependency => {
			let isPlugin = !!dependency.nativescript;
			if (isPlugin) {
				console.log("preparing: " + dependency.name);
				this.$pluginsService.prepare(dependency, platform).wait();
			}
		});
		this.$platformsData.getPlatformData(platform).platformProjectService.afterPrepareAllPlugins().wait();
	}
}
