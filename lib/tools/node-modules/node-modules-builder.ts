import { TnsModulesCopy, NpmPluginPrepare } from "./node-modules-dest-copy";

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(private $fs: IFileSystem,
		private $injector: IInjector,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder
	) { }

	public async prepareNodeModules(opts: INodeModulesBuilderData): Promise<void> {
		const productionDependencies = this.intialPrepareNodeModulesIfRequired(opts);
		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.preparePlugins(productionDependencies, opts.nodeModulesData.platform, opts.nodeModulesData.projectData, opts.nodeModulesData.projectFilesConfig);
	}

	public async prepareJSNodeModules(opts: INodeModulesBuilderData): Promise<void> {
		const productionDependencies = this.intialPrepareNodeModulesIfRequired(opts);
		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.prepareJSPlugins(productionDependencies, opts.nodeModulesData.platform, opts.nodeModulesData.projectData, opts.nodeModulesData.projectFilesConfig);
	}

	private intialPrepareNodeModulesIfRequired(opts: INodeModulesBuilderData): IDependencyData[] {
		const { nodeModulesData } = opts;
		const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(nodeModulesData.projectData.projectDir);

		if (opts.copyNodeModules && !nodeModulesData.appFilesUpdaterOptions.bundle) {
			this.initialPrepareNodeModules(opts, productionDependencies);
		}

		return productionDependencies;
	}

	private initialPrepareNodeModules(opts: INodeModulesBuilderData, productionDependencies: IDependencyData[]): void {
		const { nodeModulesData, release } = opts;

		if (!this.$fs.exists(nodeModulesData.absoluteOutputPath)) {
			// Force copying if the destination doesn't exist.
			nodeModulesData.lastModifiedTime = null;
		}

		const tnsModulesCopy: TnsModulesCopy = this.$injector.resolve(TnsModulesCopy, {
			outputRoot: nodeModulesData.absoluteOutputPath
		});

		tnsModulesCopy.copyModules({ dependencies: productionDependencies, release });
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
