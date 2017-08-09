import * as path from "path";
import * as constants from "../constants";
import { PlistSession } from "plist-merge-patch";

export class IOSEntitlementsService {
	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $mobileHelper: Mobile.IMobileHelper,
		private $pluginsService: IPluginsService) {
	}

	public static readonly DefaultEntitlementsName: string = "app.entitlements";

	private getDefaultAppEntitlementsPath(projectData: IProjectData) : string {
		const entitlementsName = IOSEntitlementsService.DefaultEntitlementsName;
		const entitlementsPath = path.join(projectData.projectDir,
			constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME,
			this.$mobileHelper.normalizePlatformName(this.$devicePlatformsConstants.iOS),
			entitlementsName);
		return entitlementsPath;
	}

	public getPlatformsEntitlementsPath(projectData: IProjectData) : string {
		return path.join(projectData.platformsDir, this.$devicePlatformsConstants.iOS.toLowerCase(),
			projectData.projectName, projectData.projectName + ".entitlements");
	}
	public getPlatformsEntitlementsRelativePath(projectData: IProjectData): string {
		return path.join(projectData.projectName, projectData.projectName + ".entitlements");
	}

	public async merge(projectData: IProjectData): Promise<void> {
		let session = new PlistSession({ log: (txt: string) => this.$logger.trace("App.entitlements: " + txt) });

		let projectDir = projectData.projectDir;
		let makePatch = (plistPath: string) => {
			if (!this.$fs.exists(plistPath)) {
				this.$logger.trace("No plist found at: " + plistPath);
				return;
			}

			this.$logger.trace("Schedule merge plist at: " + plistPath);
			session.patch({
				name: path.relative(projectDir, plistPath),
				read: () => this.$fs.readText(plistPath)
			});
		};

		let allPlugins = await this.getAllInstalledPlugins(projectData);
		for (let plugin of allPlugins) {
			let pluginInfoPlistPath = path.join(plugin.pluginPlatformsFolderPath(this.$devicePlatformsConstants.iOS),
				IOSEntitlementsService.DefaultEntitlementsName);
			makePatch(pluginInfoPlistPath);
		}

		let appEntitlementsPath = this.getDefaultAppEntitlementsPath(projectData);
		if (this.$fs.exists(appEntitlementsPath)) {
			makePatch(appEntitlementsPath);
		}

		let plistContent = session.build();
		this.$logger.trace("App.entitlements: Write to: " + this.getPlatformsEntitlementsPath(projectData));
		this.$fs.writeFile(this.getPlatformsEntitlementsPath(projectData), plistContent);
		return;
	}

	private getAllInstalledPlugins(projectData: IProjectData): Promise<IPluginData[]> {
		return this.$pluginsService.getAllInstalledPlugins(projectData);
	}
}

$injector.register("iOSEntitlementsService", IOSEntitlementsService);
