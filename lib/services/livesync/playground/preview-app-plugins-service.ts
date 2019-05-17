import * as path from "path";
import * as semver from "semver";
import * as util from "util";
import { Device } from "nativescript-preview-sdk";
import { PluginComparisonMessages } from "./preview-app-constants";
import { NODE_MODULES_DIR_NAME } from "../../../common/constants";
import { PLATFORMS_DIR_NAME, PACKAGE_JSON_FILE_NAME } from "../../../constants";

export class PreviewAppPluginsService implements IPreviewAppPluginsService {
	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $pluginsService: IPluginsService) { }

	public getPluginsUsageWarnings(data: IPreviewAppLiveSyncData, device: Device): string[] {
		if (!device) {
			this.$errors.failWithoutHelp("No device provided.");
		}

		if (!device.previewAppVersion) {
			this.$errors.failWithoutHelp("No version of preview app provided.");
		}

		const devicePlugins = this.getDevicePlugins(device);
		const localPlugins = this.getLocalPlugins(data.projectDir);
		const warnings = _.keys(localPlugins)
			.map(localPlugin => {
				const localPluginVersion = localPlugins[localPlugin];
				const devicePluginVersion = devicePlugins[localPlugin];
				return this.getWarningForPlugin(data, localPlugin, localPluginVersion, devicePluginVersion, device);
			})
			.filter(item => !!item);

		return warnings;
	}

	public async comparePluginsOnDevice(data: IPreviewAppLiveSyncData, device: Device): Promise<void> {
		const warnings = this.getPluginsUsageWarnings(data, device);
		_.map(warnings, warning => this.$logger.warn(warning));
	}

	public getExternalPlugins(device: Device): string[] {
		const devicePlugins = this.getDevicePlugins(device);
		const result = _.keys(devicePlugins)
			// The core theme links are custom and
			// should be handled by webpack during build.
			.filter(plugin => plugin !== "nativescript-theme-core");

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

	private getLocalPlugins(projectDir: string): IStringDictionary {
		const projectFilePath = path.join(projectDir, PACKAGE_JSON_FILE_NAME);
		try {
			return this.$fs.readJson(projectFilePath).dependencies;
		} catch (err) {
			this.$logger.trace(`Error while parsing ${projectFilePath}. Error is ${err.message}`);
			return {};
		}
	}

	private getWarningForPlugin(data: IPreviewAppLiveSyncData, localPlugin: string, localPluginVersion: string, devicePluginVersion: string, device: Device): string {
		const pluginPackageJsonPath = path.join(data.projectDir, NODE_MODULES_DIR_NAME, localPlugin, PACKAGE_JSON_FILE_NAME);
		const isNativeScriptPlugin = this.$pluginsService.isNativeScriptPlugin(pluginPackageJsonPath);
		const shouldCompare = isNativeScriptPlugin && this.hasNativeCode(localPlugin, device.platform, data.projectDir);

		return shouldCompare ? this.getWarningForPluginCore(localPlugin, localPluginVersion, devicePluginVersion, device.id) : null;
	}

	private getWarningForPluginCore(localPlugin: string, localPluginVersion: string, devicePluginVersion: string, deviceId: string): string {
		this.$logger.trace(`Comparing plugin ${localPlugin} with localPluginVersion ${localPluginVersion} and devicePluginVersion ${devicePluginVersion}`);

		if (!devicePluginVersion) {
			return util.format(PluginComparisonMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, localPlugin, deviceId);
		}

		const shouldSkipCheck = !semver.valid(localPluginVersion) && !semver.validRange(localPluginVersion);
		if (shouldSkipCheck) {
			return null;
		}

		const localPluginVersionData = semver.coerce(localPluginVersion);
		const devicePluginVersionData = semver.coerce(devicePluginVersion);

		if (localPluginVersionData.major !== devicePluginVersionData.major) {
			return util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION, localPlugin, localPluginVersion, devicePluginVersion);
		} else if (localPluginVersionData.minor > devicePluginVersionData.minor) {
			return util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_GREATHER_MINOR_VERSION, localPlugin, localPluginVersion, devicePluginVersion);
		}

		return null;
	}

	private hasNativeCode(localPlugin: string, platform: string, projectDir: string): boolean {
		const nativeFolderPath = path.join(projectDir, NODE_MODULES_DIR_NAME, localPlugin, PLATFORMS_DIR_NAME, platform.toLowerCase());
		return this.$fs.exists(nativeFolderPath) && !this.$fs.isEmptyDir(nativeFolderPath);
	}
}
$injector.register("previewAppPluginsService", PreviewAppPluginsService);
