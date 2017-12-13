import * as shelljs from "shelljs";
import { TnsModulesCopy, NpmPluginPrepare } from "./node-modules-dest-copy";

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(private $fs: IFileSystem,
		private $injector: IInjector,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder
	) { }

	public async prepareNodeModules(nodeModulesData: INodeModulesData): Promise<void> {
		const productionDependencies = this.initialPrepareNodeModules(nodeModulesData);
		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.preparePlugins(productionDependencies, nodeModulesData.platform, nodeModulesData.projectData, nodeModulesData.projectFilesConfig);
	}

	public async prepareJSNodeModules(jsNodeModulesData: INodeModulesData): Promise<void> {
		const productionDependencies = this.initialPrepareNodeModules(jsNodeModulesData);
		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.prepareJSPlugins(productionDependencies, jsNodeModulesData.platform, jsNodeModulesData.projectData, jsNodeModulesData.projectFilesConfig);
	}

	public cleanNodeModules(absoluteOutputPath: string, platform: string): void {
		shelljs.rm("-rf", absoluteOutputPath);
	}

	private initialPrepareNodeModules(nodeModulesData: INodeModulesData): IDependencyData[] {
		const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(nodeModulesData.projectData.projectDir);

		if (!this.$fs.exists(nodeModulesData.absoluteOutputPath)) {
			// Force copying if the destination doesn't exist.
			nodeModulesData.lastModifiedTime = null;
		}

		if (!nodeModulesData.appFilesUpdaterOptions.bundle) {
			const tnsModulesCopy = this.$injector.resolve(TnsModulesCopy, {
				outputRoot: nodeModulesData.absoluteOutputPath
			});
			tnsModulesCopy.copyModules(productionDependencies, nodeModulesData.platform);
		} else {
			this.cleanNodeModules(nodeModulesData.absoluteOutputPath, nodeModulesData.platform);
		}

		return productionDependencies;
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
