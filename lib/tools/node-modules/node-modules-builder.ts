import * as shelljs from "shelljs";
import { TnsModulesCopy, NpmPluginPrepare } from "./node-modules-dest-copy";
import { NodeModulesDependenciesBuilder } from "./node-modules-dependencies-builder";

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(private $fs: IFileSystem,
		private $injector: IInjector,
		private $options: IOptions
	) { }

	public async prepareNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime: Date, projectData: IProjectData): Promise<void> {
		if (!this.$fs.exists(absoluteOutputPath)) {
			// Force copying if the destination doesn't exist.
			lastModifiedTime = null;
		}

		let dependenciesBuilder = this.$injector.resolve(NodeModulesDependenciesBuilder, {});
		let productionDependencies = dependenciesBuilder.getProductionDependencies(projectData.projectDir);

		if (!this.$options.bundle) {
			const tnsModulesCopy = this.$injector.resolve(TnsModulesCopy, {
				outputRoot: absoluteOutputPath
			});
			tnsModulesCopy.copyModules(productionDependencies, platform);
		} else {
			this.cleanNodeModules(absoluteOutputPath, platform);
		}

		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.preparePlugins(productionDependencies, platform, projectData);
	}

	public cleanNodeModules(absoluteOutputPath: string, platform: string): void {
		shelljs.rm("-rf", absoluteOutputPath);
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
