import {
	INodeModulesBuilder,
	INodeModulesDependenciesBuilder,
	IPrepareNodeModulesData,
} from "../../definitions/platform";
import { IPluginsService } from "../../definitions/plugins";
import * as _ from "lodash";
import { injector } from "../../common/yok";

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(
		private $logger: ILogger,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		private $pluginsService: IPluginsService
	) {}

	public async prepareNodeModules({
		platformData,
		projectData,
	}: IPrepareNodeModulesData): Promise<void> {
		let dependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(
			projectData.projectDir,
			projectData.ignoredDependencies
		);
		dependencies = await platformData.platformProjectService.beforePrepareAllPlugins(
			projectData,
			dependencies
		);

		const pluginsData = this.$pluginsService.getAllProductionPlugins(
			projectData,
			platformData.platformNameLowerCase,
			dependencies
		);
		if (_.isEmpty(pluginsData)) {
			return;
		}

		for (let i = 0; i < pluginsData.length; i++) {
			const pluginData = pluginsData[i];

			await this.$pluginsService.preparePluginNativeCode({
				pluginData,
				platform: platformData.normalizedPlatformName.toLowerCase(),
				projectData,
			});
			this.$logger.trace(
				`Successfully prepared plugin ${
					pluginData.name
				} for ${platformData.normalizedPlatformName.toLowerCase()}.`
			);
		}
	}
}

injector.register("nodeModulesBuilder", NodeModulesBuilder);
