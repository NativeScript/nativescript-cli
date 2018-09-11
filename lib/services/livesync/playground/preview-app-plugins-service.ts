import * as path from "path";
import * as semver from "semver";
import * as util from "util";
import { Device } from "nativescript-preview-sdk";
import { PreviewAppMessages } from "./preview-app-constants";

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

			if (!devicePluginVersion) {
				this.$logger.warn(util.format(PreviewAppMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, localPlugin, device.id));
			}

			if (devicePluginVersion && semver.gt(semver.coerce(localPluginVersion), semver.coerce(devicePluginVersion))) {
				this.$logger.warn(util.format(PreviewAppMessages.PLUGIN_WITH_LOWER_VERSION_IN_PREVIEW_APP, localPlugin, localPluginVersion, device.id, devicePluginVersion));
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
