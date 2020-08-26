import { EventEmitter } from "events";
import * as _ from 'lodash';
import { IProjectDataService, IPlatformProjectServiceBase, IProjectData } from "../definitions/project";
import { IPlatformData } from "../definitions/platform";
import { IPluginData } from "../definitions/plugins";
import { IFileSystem } from "../common/declarations";
import { PlatformTypes } from "../constants";

export abstract class PlatformProjectServiceBase extends EventEmitter implements IPlatformProjectServiceBase {
	constructor(protected $fs: IFileSystem,
		protected $projectDataService: IProjectDataService) {
			super();
	}

	protected abstract getPlatformData(projectData: IProjectData): IPlatformData;

	public getPluginPlatformsFolderPath(pluginData: IPluginData, platform: string): string {
		return pluginData.pluginPlatformsFolderPath(platform);
	}

	public getFrameworkVersion(projectData: IProjectData): string {
		const frameworkData = this.$projectDataService.getRuntimePackage(projectData.projectDir, <PlatformTypes>this.getPlatformData(projectData).platformNameLowerCase);
		return frameworkData && frameworkData.version;
	}

	protected getAllNativeLibrariesForPlugin(pluginData: IPluginData, platform: string, filter: (fileName: string, _pluginPlatformsFolderPath: string) => boolean): string[] {
		const pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, platform);
		let nativeLibraries: string[] = [];

		if (pluginPlatformsFolderPath && this.$fs.exists(pluginPlatformsFolderPath)) {
			const platformsContents = this.$fs.readDirectory(pluginPlatformsFolderPath);
			nativeLibraries = _(platformsContents)
				.filter(platformItemName => filter(platformItemName, pluginPlatformsFolderPath))
				.value();
		}

		return nativeLibraries;
	}
}
