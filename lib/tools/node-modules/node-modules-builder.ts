export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(
		private $logger: ILogger,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		private $pluginsService: IPluginsService
	) { }

	public async prepareNodeModules({platformData , projectData}: IPrepareNodeModulesData): Promise<void> {
		const dependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(projectData.projectDir);
		if (_.isEmpty(dependencies)) {
			return;
		}

		await platformData.platformProjectService.beforePrepareAllPlugins(projectData, dependencies);

		for (const dependencyKey in dependencies) {
			const dependency = dependencies[dependencyKey];
			const isPlugin = !!dependency.nativescript;
			if (isPlugin) {
				this.$logger.debug(`Successfully prepared plugin ${dependency.name} for ${platformData.normalizedPlatformName.toLowerCase()}.`);
				const pluginData = this.$pluginsService.convertToPluginData(dependency, projectData.projectDir);
				await this.$pluginsService.preparePluginNativeCode({pluginData, platform: platformData.normalizedPlatformName.toLowerCase(), projectData});
			}
		}
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
