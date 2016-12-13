export class PlatformProjectServiceBase implements IPlatformProjectServiceBase {
	constructor(protected $fs: IFileSystem,
		    protected $projectData: IProjectData,
			protected $projectDataService: IProjectDataService) {
	}

	public getPluginPlatformsFolderPath(pluginData: IPluginData, platform: string): string {
		return pluginData.pluginPlatformsFolderPath(platform);
	}

	protected getAllNativeLibrariesForPlugin(pluginData: IPluginData, platform: string, filter: (fileName: string, _pluginPlatformsFolderPath: string) => boolean): string[] {
		let pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, platform),
			nativeLibraries: string[] = [];

		if(pluginPlatformsFolderPath && this.$fs.exists(pluginPlatformsFolderPath)) {
			let platformsContents = this.$fs.readDirectory(pluginPlatformsFolderPath);
			nativeLibraries = _(platformsContents)
							.filter(platformItemName => filter(platformItemName, pluginPlatformsFolderPath))
							.value();
		}

		return nativeLibraries;
	}

	protected getFrameworkVersion(runtimePackageName: string): string {
		this.$projectDataService.initialize(this.$projectData.projectDir);
		let frameworkVersion = this.$projectDataService.getValue(runtimePackageName).version;
		return frameworkVersion;
	}
}
