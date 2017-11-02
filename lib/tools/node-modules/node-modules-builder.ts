import * as shelljs from "shelljs";
import { TnsModulesCopy, NpmPluginPrepare } from "./node-modules-dest-copy";

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(private $fs: IFileSystem,
		private $injector: IInjector,
		private $options: IOptions,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder
	) { }

	public async prepareNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime: Date, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): Promise<void> {
		const productionDependencies = this.initialPrepareNodeModules(absoluteOutputPath, platform, lastModifiedTime, projectData);
		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.preparePlugins(productionDependencies, platform, projectData, projectFilesConfig);
	}

	public async prepareJSNodeModules(jsNodeModulesData: IJsNodeModulesData): Promise<void> {
		const productionDependencies = this.initialPrepareNodeModules(jsNodeModulesData.absoluteOutputPath, jsNodeModulesData.platform, jsNodeModulesData.lastModifiedTime, jsNodeModulesData.projectData);
		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.prepareJSPlugins(productionDependencies, jsNodeModulesData.platform, jsNodeModulesData.projectData, jsNodeModulesData.projectFilesConfig);
	}

	public cleanNodeModules(absoluteOutputPath: string, platform: string): void {
		shelljs.rm("-rf", absoluteOutputPath);
	}

	private initialPrepareNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime: Date, projectData: IProjectData, ): IDependencyData[] {
		const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(projectData.projectDir);

		if (!this.$fs.exists(absoluteOutputPath)) {
			// Force copying if the destination doesn't exist.
			lastModifiedTime = null;
		}

		if (!this.$options.bundle) {
			const tnsModulesCopy = this.$injector.resolve(TnsModulesCopy, {
				outputRoot: absoluteOutputPath
			});
			tnsModulesCopy.copyModules(productionDependencies, platform);
		} else {
			this.cleanNodeModules(absoluteOutputPath, platform);
		}

		return productionDependencies;
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
