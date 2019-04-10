export class NpmPluginPrepare {
	constructor(
		private $pluginsService: IPluginsService,
		private $platformsData: IPlatformsData,
	) { }

	public async preparePlugins(dependencies: IDependencyData[], platform: string, projectData: IProjectData): Promise<void> {
		if (_.isEmpty(dependencies)) {
			return;
		}

		await this.$platformsData.getPlatformData(platform, projectData).platformProjectService.beforePrepareAllPlugins(projectData, dependencies);

		for (const dependencyKey in dependencies) {
			const dependency = dependencies[dependencyKey];
			const isPlugin = !!dependency.nativescript;
			if (isPlugin) {
				const pluginData = this.$pluginsService.convertToPluginData(dependency, projectData.projectDir);
				await this.$pluginsService.preparePluginNativeCode(pluginData, platform, projectData);
			}
		}
	}
}
