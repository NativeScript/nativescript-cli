import { IProjectData } from "./project";

/**
 * Describes service used to generate necessary files to filter the native metadata generation.
 */
interface INativeApiUsageConfiguration {
	/**
	 * Defines if the content of plugins' native-api-usage files will be used and included in the whitelist content.
	 */
	["whitelist-plugins-usages"]: boolean;

	/**
	 * Defines APIs which will be inlcuded in the metadata.
	 */
	whitelist: string[];

	/**
	 * Defines APIs which will be excluded from the metadata.
	 */
	blacklist: string[];
}

/**
 * Describes the content of plugin's native-api-usage.json file located in `<path to plugin>/platforms/<platform> directory.
 */
interface INativeApiUsagePluginConfiguration {
	/**
	 * Defines APIs which are used by the plugin and which should be whitelisted by the application using this plugin.
	 */
	uses: string[];
}

/**
 * Describes service used to generate neccesary files to filter the metadata generation.
 */
interface IMetadataFilteringService {
	/**
	 * Cleans old metadata filters and creates new ones for the current project and platform.
	 * @param {IProjectData} projectData Information about the current project.
	 * @param {string} platform The platform for which metadata should be generated.
	 * @returns {void}
	 */
	generateMetadataFilters(projectData: IProjectData, platform: string): void;
}
