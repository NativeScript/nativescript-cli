export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		private $pluginsService: IPluginsService
	) { }

	public async prepareNodeModules(platformData: IPlatformData, projectData: IProjectData): Promise<void> {
		const dependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(projectData.projectDir);
		if (_.isEmpty(dependencies)) {
			return;
		}

		await platformData.platformProjectService.beforePrepareAllPlugins(projectData, dependencies);

		for (const dependencyKey in dependencies) {
			const dependency = dependencies[dependencyKey];
			const isPlugin = !!dependency.nativescript;
			if (isPlugin) {
				const pluginData = this.$pluginsService.convertToPluginData(dependency, projectData.projectDir);
				await this.$pluginsService.preparePluginNativeCode(pluginData, platformData.normalizedPlatformName.toLowerCase(), projectData);
			}
		}
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
