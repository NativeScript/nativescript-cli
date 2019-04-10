import { NpmPluginPrepare } from "./node-modules-dest-copy";

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(
		private $injector: IInjector,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder
	) { }

	public async prepareNodeModules(opts: INodeModulesBuilderData): Promise<void> {
		const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(opts.nodeModulesData.projectData.projectDir);
		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.preparePlugins(productionDependencies, opts.nodeModulesData.platform, opts.nodeModulesData.projectData);
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
