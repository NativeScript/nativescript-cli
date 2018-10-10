import * as shelljs from "shelljs";
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
		const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(opts.nodeModulesData.projectData.projectDir);

		if (opts.copyNodeModules) {
			this.initialPrepareNodeModules(opts, productionDependencies);
		}

		return productionDependencies;
	}

	public cleanNodeModules(absoluteOutputPath: string): void {
		shelljs.rm("-rf", absoluteOutputPath);
	}

	private initialPrepareNodeModules(opts: INodeModulesBuilderData, productionDependencies: IDependencyData[]): IDependencyData[] {
		const { nodeModulesData, release } = opts;

		if (!this.$fs.exists(nodeModulesData.absoluteOutputPath)) {
			// Force copying if the destination doesn't exist.
			nodeModulesData.lastModifiedTime = null;
		}

		if (!nodeModulesData.appFilesUpdaterOptions.bundle) {
			const tnsModulesCopy: TnsModulesCopy = this.$injector.resolve(TnsModulesCopy, {
				outputRoot: nodeModulesData.absoluteOutputPath
			});
			tnsModulesCopy.copyModules({ dependencies: productionDependencies, release });
		} else {
			this.cleanNodeModules(nodeModulesData.absoluteOutputPath);
		}

		return productionDependencies;
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
