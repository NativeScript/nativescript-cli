import * as path from "path";
import * as semver from "semver";
import * as util from "util";
import { Device } from "nativescript-preview-sdk";
import { PluginComparisonMessages } from "./preview-app-constants";

export class PreviewAppPluginsService implements IPreviewAppPluginsService {
	private previewAppVersionWarnings: IDictionary<string[]> = {};

	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectData: IProjectData) { }

	public async comparePluginsOnDevice(device: Device): Promise<void> {
		if (!this.previewAppVersionWarnings[device.previewAppVersion]) {
			const devicePlugins = this.getDevicePlugins(device);
			const localPlugins = this.getLocalPlugins();
			const warnings = _.keys(localPlugins)
				.map(localPlugin => {
					const localPluginVersion = localPlugins[localPlugin];
					const devicePluginVersion = devicePlugins[localPlugin];
					return this.getWarningForPlugin(localPlugin, localPluginVersion, devicePluginVersion, device.id);
				})
				.filter(item => !!item);
			this.previewAppVersionWarnings[device.previewAppVersion] = warnings;
		}

		this.previewAppVersionWarnings[device.previewAppVersion].map(warning => this.$logger.warn(warning));
	}

	public getExternalPlugins(device: Device): string[] {
		const devicePlugins = this.getDevicePlugins(device);
		const result = _.keys(devicePlugins)
			.filter(plugin => plugin.indexOf("nativescript") !== -1)
			// exclude angular and vue related dependencies as they do not contain
			// any native code. In this way, we will read them from the bundle
			// and improve the app startup time by not reading a lot of
			// files from the file system instead. Also, the core theme links
			// are custom and should be handled by us build time.
			.filter(plugin => !_.includes(["nativescript-angular", "nativescript-vue", "nativescript-intl", "nativescript-theme-core"], plugin));

		result.push(...["tns-core-modules", "tns-core-modules-widgets"]);
		return result;
	}

	private getDevicePlugins(device: Device): IStringDictionary {
		try {
			return JSON.parse(device.plugins);
		} catch (err) {
			this.$logger.trace(`Error while parsing plugins from device ${device.id}. Error is ${err.message}`);
			return {};
		}
	}

	private getLocalPlugins(): IStringDictionary {
		const projectFilePath = path.join(this.$projectData.projectDir, "package.json");
		try {
			return this.$fs.readJson(projectFilePath).dependencies;
		} catch (err) {
			this.$logger.trace(`Error while parsing ${projectFilePath}. Error is ${err.message}`);
			return {};
		}
	}

	private getWarningForPlugin(localPlugin: string, localPluginVersion: string, devicePluginVersion: string, deviceId: string): string {
		this.$logger.trace(`Comparing plugin ${localPlugin} with localPluginVersion ${localPluginVersion} and devicePluginVersion ${devicePluginVersion}`);

		if (devicePluginVersion) {
			const localPluginVersionData = semver.coerce(localPluginVersion);
			const devicePluginVersionData = semver.coerce(devicePluginVersion);

			if (localPluginVersionData.major !== devicePluginVersionData.major) {
				return util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION, localPlugin, localPluginVersion, devicePluginVersion);
			} else if (localPluginVersionData.minor > devicePluginVersionData.minor) {
				return util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_GREATHER_MINOR_VERSION, localPlugin, localPluginVersion, devicePluginVersion);
			}

			return null;
		}

		return util.format(PluginComparisonMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, localPlugin, deviceId);
	}
}
$injector.register("previewAppPluginsService", PreviewAppPluginsService);
