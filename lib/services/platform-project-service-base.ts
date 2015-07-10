///<reference path="../.d.ts"/>
"use strict";
import path = require("path");

export class PlatformProjectServiceBase implements IPlatformProjectServiceBase {
	constructor(protected $fs: IFileSystem) { }
	
	public getPluginPlatformsFolderPath(pluginData: IPluginData, platform: string) {
		return pluginData.pluginPlatformsFolderPath(platform);
	}
	
	public getAllNativeLibrariesForPlugin(pluginData: IPluginData, platform: string, filter: (fileName: string, pluginPlatformsFolderPath: string) => boolean): IFuture<string[]> {
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
}