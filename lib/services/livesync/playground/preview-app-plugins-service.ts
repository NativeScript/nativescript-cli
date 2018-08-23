import * as path from "path";
import * as semver from "semver";
import { Device } from "nativescript-preview-sdk";

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
				this.$logger.warn(`Plugin ${localPlugin} is not included in preview app and will not work.`);
			}

			if (devicePluginVersion && semver.gt(semver.coerce(localPluginVersion), semver.coerce(devicePluginVersion))) {
				this.$logger.warn(`Plugin ${localPlugin} has local version ${localPluginVersion} but preview app has ${devicePluginVersion} version of plugin. Some functionalities may not work.`);
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
