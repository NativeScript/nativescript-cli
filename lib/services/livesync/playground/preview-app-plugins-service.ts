import * as path from "path";
import * as semver from "semver";
import * as util from "util";
import { Device } from "nativescript-preview-sdk";
import { PluginComparisonMessages } from "./preview-app-constants";
import { NODE_MODULES_DIR_NAME } from "../../../common/constants";
import { PLATFORMS_DIR_NAME, PACKAGE_JSON_FILE_NAME, TNS_CORE_THEME_NAME, SCOPED_TNS_CORE_THEME_NAME, LoggerConfigData } from "../../../constants";

export class PreviewAppPluginsService implements IPreviewAppPluginsService {
	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $packageInstallationManager: IPackageInstallationManager,
		private $pluginsService: IPluginsService) { }

	public async getPluginsUsageWarnings(data: IPreviewAppLiveSyncData, device: Device): Promise<string[]> {
		if (!device) {
			this.$errors.fail("No device provided.");
		}

		if (!device.previewAppVersion) {
			this.$errors.fail("No version of preview app provided.");
		}

		const devicePlugins = this.getDevicePlugins(device);
		const localPlugins = this.getLocalPlugins(data.projectDir);
		const warnings: string[] = [];
		for (const pluginName in localPlugins) {
			const localPluginVersion = localPlugins[pluginName];
			const devicePluginVersion = devicePlugins[pluginName];
			const pluginWarnings = await this.getWarningForPlugin(data, pluginName, localPluginVersion, devicePluginVersion, device);
			if (pluginWarnings) {
				warnings.push(pluginWarnings);
			}
		}

		return warnings;
	}

	public async comparePluginsOnDevice(data: IPreviewAppLiveSyncData, device: Device): Promise<void> {
		const warnings = await this.getPluginsUsageWarnings(data, device);
		_.map(warnings, warning => this.$logger.warn(warning));

		if (warnings && warnings.length) {
			this.$logger.warn(`In the app are used one or more NativeScript plugins with native dependencies.
Those plugins will not work while building the project via \`$ tns preview\`. Please, use \`$ tns run <platform>\` command instead.`, { [LoggerConfigData.wrapMessageWithBorders]: true });
		}
	}

	public getExternalPlugins(device: Device): string[] {
		const devicePlugins = this.getDevicePlugins(device);
		const themeNamesArray = [TNS_CORE_THEME_NAME, SCOPED_TNS_CORE_THEME_NAME];
		const result = _.keys(devicePlugins)
			// The core theme links are custom and
			// should be handled by webpack during build.
			.filter(plugin => themeNamesArray.indexOf(plugin) === -1);

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

	private async getWarningForPlugin(data: IPreviewAppLiveSyncData, localPlugin: string, localPluginVersion: string, devicePluginVersion: string, device: Device): Promise<string> {
		const pluginPackageJsonPath = path.join(data.projectDir, NODE_MODULES_DIR_NAME, localPlugin, PACKAGE_JSON_FILE_NAME);
		const isNativeScriptPlugin = this.$pluginsService.isNativeScriptPlugin(pluginPackageJsonPath);
		const shouldCompare = isNativeScriptPlugin && this.hasNativeCode(localPlugin, device.platform, data.projectDir);
		let warning = null;
		if (shouldCompare) {
			warning = await this.getWarningForPluginCore(localPlugin, localPluginVersion, devicePluginVersion, device.id);
		}

		return warning;
	}

	private async getWarningForPluginCore(pluginName: string, localPluginVersion: string, devicePluginVersion: string, deviceId: string): Promise<string> {
		this.$logger.trace(`Comparing plugin ${pluginName} with localPluginVersion ${localPluginVersion} and devicePluginVersion ${devicePluginVersion}`);

		if (!devicePluginVersion) {
			return util.format(PluginComparisonMessages.PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP, pluginName, deviceId);
		}

		const shouldSkipCheck = !semver.valid(localPluginVersion) && !semver.validRange(localPluginVersion);
		if (shouldSkipCheck) {
			return null;
		}

		const localPluginVersionData = await this.$packageInstallationManager.getMaxSatisfyingVersionSafe(pluginName, localPluginVersion);
		const devicePluginVersionData = await this.$packageInstallationManager.getMaxSatisfyingVersionSafe(pluginName, devicePluginVersion);

		if (semver.valid(localPluginVersionData) && semver.valid(devicePluginVersionData)) {
			if (semver.major(localPluginVersionData) !== semver.major(devicePluginVersionData)) {
				return util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION, pluginName, localPluginVersion, devicePluginVersion);
			} else if (semver.minor(localPluginVersionData) > semver.minor(devicePluginVersionData)) {
				return util.format(PluginComparisonMessages.LOCAL_PLUGIN_WITH_GREATHER_MINOR_VERSION, pluginName, localPluginVersion, devicePluginVersion);
			}

		}

		return null;
	}

	private hasNativeCode(localPlugin: string, platform: string, projectDir: string): boolean {
		const nativeFolderPath = path.join(projectDir, NODE_MODULES_DIR_NAME, localPlugin, PLATFORMS_DIR_NAME, platform.toLowerCase());
		return this.$fs.exists(nativeFolderPath) && !this.$fs.isEmptyDir(nativeFolderPath);
	}
}
$injector.register("previewAppPluginsService", PreviewAppPluginsService);
