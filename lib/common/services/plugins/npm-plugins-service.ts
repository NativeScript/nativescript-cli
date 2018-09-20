import { NpmPluginsSource } from "./npm-plugins-source";
import { NpmRegistryPluginsSource } from "./npm-registry-plugins-source";
import { NpmjsPluginsSource } from "./npmjs-plugins-source";

export class NpmPluginsService implements INpmPluginsService {
	constructor(private $injector: IInjector) { }

	public async search(projectDir: string, keywords: string[], modifySearchQuery: (keywords: string[]) => string[]): Promise<IPluginsSource> {
		const query = modifySearchQuery ? modifySearchQuery(keywords) : keywords;

		const pluginsSource = await this.searchCore(NpmjsPluginsSource, projectDir, keywords) ||
			await this.searchCore(NpmRegistryPluginsSource, projectDir, keywords) ||
			await this.preparePluginsSource(NpmPluginsSource, projectDir, query);

		return pluginsSource;
	}

	public async optimizedSearch(projectDir: string, keywords: string[], modifySearchQuery: (keywords: string[]) => string[]): Promise<IPluginsSource> {
		return await this.searchCore(NpmRegistryPluginsSource, projectDir, keywords) || await this.search(projectDir, keywords, modifySearchQuery);
	}

	private async searchCore(pluginsSourceConstructor: Function, projectDir: string, keywords: string[]): Promise<IPluginsSource> {
		const npmPluginsSource = await this.preparePluginsSource(pluginsSourceConstructor, projectDir, keywords);

		return npmPluginsSource.hasPlugins() ? npmPluginsSource : null;
	}

	private async preparePluginsSource(pluginsSourceConstructor: Function, projectDir: string, keywords: string[]): Promise<IPluginsSource> {
		const pluginsSource: IPluginsSource = this.$injector.resolve(pluginsSourceConstructor, { projectDir, keywords });
		await pluginsSource.initialize(projectDir, keywords);
		return pluginsSource;
	}
}

$injector.register("npmPluginsService", NpmPluginsService);
