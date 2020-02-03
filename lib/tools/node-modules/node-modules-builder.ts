export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(
		private $logger: ILogger,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		private $pluginsService: IPluginsService
	) { }

	public async prepareNodeModules({platformData , projectData}: IPrepareNodeModulesData): Promise<void> {
		const dependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(projectData.projectDir);
		await platformData.platformProjectService.beforePrepareAllPlugins(projectData, dependencies);

		const pluginsData = this.$pluginsService.getAllProductionPlugins(projectData, platformData.platformNameLowerCase, dependencies);
		if (_.isEmpty(pluginsData)) {
			return;
		}

		for (let i = 0; i < pluginsData.length; i++) {
			const pluginData = pluginsData[i];

			await this.$pluginsService.preparePluginNativeCode({pluginData, platform: platformData.normalizedPlatformName.toLowerCase(), projectData});
			this.$logger.debug(`Successfully prepared plugin ${pluginData.name} for ${platformData.normalizedPlatformName.toLowerCase()}.`);
		}
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
