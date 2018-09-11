import * as path from "path";
import * as semver from "semver";
import * as util from "util";
import { Device } from "nativescript-preview-sdk";
import { PluginComparisonMessages } from "./preview-app-constants";

export class PreviewAppPluginsService implements IPreviewAppPluginsService {
	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectData: IProjectData) { }

	public async comparePluginsOnDevice(device: Device): Promise<void> {
		const devicePlugins = this.getDevicePlugins(device);
		const localPlugins = this.getLocalPlugins();

		_.keys(localPlugins).forEach(localPlugin => {
			const localPluginVersion = localPlugins[localPlugin];
			const devicePluginVersion = devicePlugins[localPlugin];

			this.$logger.trace(`Comparing plugin ${localPlugin} with localPluginVersion ${localPluginVersion} and devicePluginVersion ${devicePluginVersion}`);

			if (devicePluginVersion) {
				const localPluginVersionData = semver.coerce(localPluginVersion);
				const devicePluginVersionData = semver.coerce(devicePluginVersion);

				if (localPluginVersionData.major !== devicePluginVersionData.major) {
					this.$logger.warn(util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION, localPlugin, localPluginVersion, devicePluginVersion));
				}

				if (localPluginVersionData.major === devicePluginVersionData.major && localPluginVersionData.minor > devicePluginVersionData.minor) {
					this.$logger.warn(util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_GREATHER_MINOR_VERSION, localPlugin, localPluginVersion, devicePluginVersion));
				}
			} else {
				this.$logger.warn(util.format(PluginComparisonMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, localPlugin, device.id));
			}
		});
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
}
$injector.register("previewAppPluginsService", PreviewAppPluginsService);
