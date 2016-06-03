export class PlatformProjectServiceBase implements IPlatformProjectServiceBase {
	constructor(protected $fs: IFileSystem,
		    protected $projectData: IProjectData,
			protected $projectDataService: IProjectDataService) {
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

	protected getFrameworkVersion(runtimePackageName: string): IFuture<string> {
		return (() => {
			this.$projectDataService.initialize(this.$projectData.projectDir);
			let frameworkVersion = this.$projectDataService.getValue(runtimePackageName).wait().version;
			return frameworkVersion;
		}).future<string>()();
	}
}
