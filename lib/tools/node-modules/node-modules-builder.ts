import * as shelljs from "shelljs";
import { TnsModulesCopy, NpmPluginPrepare } from "./node-modules-dest-copy";

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(private $fs: IFileSystem,
		private $injector: IInjector,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder
	) { }

	public async prepareNodeModules(opts: INodeModulesBuilderData): Promise<void> {
		const productionDependencies = this.initialPrepareNodeModules(opts);
		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.preparePlugins(productionDependencies, opts.nodeModulesData.platform, opts.nodeModulesData.projectData, opts.nodeModulesData.projectFilesConfig);
	}

	public async prepareJSNodeModules(opts: INodeModulesBuilderData): Promise<void> {
		const productionDependencies = this.initialPrepareNodeModules(opts);
		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.prepareJSPlugins(productionDependencies, opts.nodeModulesData.platform, opts.nodeModulesData.projectData, opts.nodeModulesData.projectFilesConfig);
	}

	public cleanNodeModules(absoluteOutputPath: string): void {
		shelljs.rm("-rf", absoluteOutputPath);
	}

	private initialPrepareNodeModules(opts: INodeModulesBuilderData): IDependencyData[] {
		const { nodeModulesData, release } = opts;
		const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(nodeModulesData.projectData.projectDir);

		if (!this.$fs.exists(nodeModulesData.absoluteOutputPath)) {
			// Force copying if the destination doesn't exist.
			nodeModulesData.lastModifiedTime = null;
		}

		if (!nodeModulesData.appFilesUpdaterOptions.bundle) {
			const tnsModulesCopy: TnsModulesCopy = this.$injector.resolve(TnsModulesCopy, {
				outputRoot: nodeModulesData.absoluteOutputPath
			});
			tnsModulesCopy.copyModules({ dependencies: productionDependencies, release});
		} else {
			this.cleanNodeModules(nodeModulesData.absoluteOutputPath);
		}

		return productionDependencies;
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
