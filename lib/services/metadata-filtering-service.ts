import * as path from "path";
import * as os from "os";
import { MetadataFilteringConstants } from "../constants";

export class MetadataFilteringService implements IMetadataFilteringService {
	constructor(private $fs: IFileSystem,
		private $pluginsService: IPluginsService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformsDataService: IPlatformsDataService,
		private $logger: ILogger) { }

	public generateMetadataFilters(projectData: IProjectData, platform: string): void {
		this.generateWhitelist(projectData, platform);
		this.generateBlacklist(projectData, platform);
	}

	private generateWhitelist(projectData: IProjectData, platform: string): void {
		const platformsDirPath = this.getPlatformsDirPath(projectData, platform);
		const pathToWhitelistFile = path.join(platformsDirPath, MetadataFilteringConstants.WHITELIST_FILE_NAME);
		this.$fs.deleteFile(pathToWhitelistFile);

		const nativeApiConfiguration = this.getNativeApiConfigurationForPlatform(projectData, platform);
		if (nativeApiConfiguration) {
			const whitelistedItems: string[] = [];
			if (nativeApiConfiguration["whitelist-plugins-usages"]) {
				const plugins = this.$pluginsService.getAllProductionPlugins(projectData);
				for (const pluginData of plugins) {
					const pathToPlatformsDir = pluginData.pluginPlatformsFolderPath(platform);
					const pathToPluginsMetadataConfig = path.join(pathToPlatformsDir, MetadataFilteringConstants.NATIVE_API_USAGE_FILE_NAME);
					if (this.$fs.exists(pathToPluginsMetadataConfig)) {
						const pluginConfig: INativeApiUsagePluginConfiguration = this.$fs.readJson(pathToPluginsMetadataConfig) || {};
						this.$logger.trace(`Adding content of ${pathToPluginsMetadataConfig} to whitelisted items of metadata filtering: ${JSON.stringify(pluginConfig, null, 2)}`);
						const itemsToAdd = pluginConfig.uses || [];
						if (itemsToAdd.length) {
							whitelistedItems.push(`// Added from: ${pathToPluginsMetadataConfig}`);
							whitelistedItems.push(...itemsToAdd);
							whitelistedItems.push(`// Finished part from ${pathToPluginsMetadataConfig}${os.EOL}`);
						}
					}
				}
			}

			const applicationWhitelistedItems = nativeApiConfiguration.whitelist || [];
			if (applicationWhitelistedItems.length) {
				this.$logger.trace(`Adding content from application to whitelisted items of metadata filtering: ${JSON.stringify(applicationWhitelistedItems, null, 2)}`);

				whitelistedItems.push(`// Added from application`);
				whitelistedItems.push(...applicationWhitelistedItems);
				whitelistedItems.push(`// Finished part from application${os.EOL}`);
			}

			if (whitelistedItems.length) {
				this.$fs.writeFile(pathToWhitelistFile, whitelistedItems.join(os.EOL));
			}
		}
	}

	private generateBlacklist(projectData: IProjectData, platform: string): void {
		const platformsDirPath = this.getPlatformsDirPath(projectData, platform);
		const pathToBlacklistFile = path.join(platformsDirPath, MetadataFilteringConstants.BLACKLIST_FILE_NAME);
		this.$fs.deleteFile(pathToBlacklistFile);

		const nativeApiConfiguration = this.getNativeApiConfigurationForPlatform(projectData, platform);
		if (nativeApiConfiguration) {
			const blacklistedItems: string[] = nativeApiConfiguration.blacklist || [];

			if (blacklistedItems.length) {
				this.$fs.writeFile(pathToBlacklistFile, blacklistedItems.join(os.EOL));
			}
		} else {
			this.$logger.trace(`There's no application configuration for metadata filtering for platform ${platform}. Full metadata will be generated.`);
		}
	}

	private getNativeApiConfigurationForPlatform(projectData: IProjectData, platform: string): INativeApiUsageConfiguartion {
		let config: INativeApiUsageConfiguartion = null;
		const pathToApplicationConfigurationFile = this.getPathToApplicationConfigurationForPlatform(projectData, platform);
		if (this.$fs.exists(pathToApplicationConfigurationFile)) {
			config = this.$fs.readJson(pathToApplicationConfigurationFile);
		}

		return config;
	}

	private getPlatformsDirPath(projectData: IProjectData, platform: string): string {
		const platformData = this.$platformsDataService.getPlatformData(platform, projectData);
		return platformData.projectRoot;
	}

	private getPathToApplicationConfigurationForPlatform(projectData: IProjectData, platform: string): string {
		return path.join(projectData.appResourcesDirectoryPath, this.$mobileHelper.normalizePlatformName(platform), MetadataFilteringConstants.NATIVE_API_USAGE_FILE_NAME);
	}
}

$injector.register("metadataFilteringService", MetadataFilteringService);
