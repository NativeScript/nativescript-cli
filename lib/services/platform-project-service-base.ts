///<reference path="../.d.ts"/>
"use strict";

export class PlatformProjectServiceBase implements IPlatformProjectServiceBase {
	constructor(protected $fs: IFileSystem,
		    protected $projectData: IProjectData) {
	}

	public getPluginPlatformsFolderPath(pluginData: IPluginData, platform: string) {
		return pluginData.pluginPlatformsFolderPath(platform);
	}

	public getAllNativeLibrariesForPlugin(pluginData: IPluginData, platform: string, filter: (fileName: string, _pluginPlatformsFolderPath: string) => boolean): IFuture<string[]> {
		return (() => {
			let pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, platform),
				nativeLibraries: string[] = [];
			if(pluginPlatformsFolderPath && this.$fs.exists(pluginPlatformsFolderPath).wait()) {
				let platformsContents = this.$fs.readDirectory(pluginPlatformsFolderPath).wait();
				nativeLibraries = _(platformsContents)
								.filter(platformItemName => filter(platformItemName, pluginPlatformsFolderPath))
								.value();
			}

			return nativeLibraries;
		}).future<string[]>()();
	}

	protected getFrameworkVersion(runtimePackageName: string): string {
		let frameworkVersion: string;
		let jsonData = this.$fs.readJson(this.$projectData.projectFilePath).wait();
		if (jsonData && jsonData.nativescript && jsonData.nativescript[runtimePackageName]) {
			frameworkVersion = jsonData.nativescript[runtimePackageName].version;
		}
		return frameworkVersion;
	}
}
