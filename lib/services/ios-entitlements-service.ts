import * as path from "path";
import * as constants from "../constants";
import { PlistSession } from "plist-merge-patch";

export class IOSEntitlementsService {
	constructor(private $fs: IFileSystem,
		private $injector: IInjector,
		private $logger: ILogger) {
	}

	private getDefaultEntitlementsName() : string {
		return "app.entitlements";
	}

	private getDefaultAppEntitlementsPath(projectData: IProjectData) : string {
		let entitlementsName = this.getDefaultEntitlementsName();
		let entitlementsPath = path.join(projectData.projectDir,
			constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME,
			constants.IOS_PLATFORM_NORMALIZED_NAME,
			entitlementsName);
		return entitlementsPath;
	}

	private getPlatformsEntitlementsPath(projectData: IProjectData) : string {
		return path.join(projectData.platformsDir, constants.IOS_PLATFORM_NAME,
			projectData.projectName, projectData.projectName + ".entitlements");
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

		// Start with a default empty entitlements file.
		session.patch({
				name: "Default entitlements file",
				read: () =>
					`<?xml version="1.0" encoding="UTF-8"?>
					<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
					<plist version="1.0">
					</plist>`
			});

		let allPlugins = await this.getAllInstalledPlugins(projectData);
		for (let plugin of allPlugins) {
			let pluginInfoPlistPath = path.join(plugin.pluginPlatformsFolderPath(constants.IOS_PLATFORM_NAME), this.getDefaultEntitlementsName());
			makePatch(pluginInfoPlistPath);
		}

		// for older ios-app-templates or if has been deleted.
		let appEntitlementsPath = this.getDefaultAppEntitlementsPath(projectData);
		if (this.$fs.exists(appEntitlementsPath)) {
			makePatch(appEntitlementsPath);
		}

		let plistContent = session.build();
		this.$logger.trace("App.entitlements: Write to: " + this.getPlatformsEntitlementsPath(projectData));
		this.$fs.writeFile(this.getPlatformsEntitlementsPath(projectData), plistContent);
		return;
	}

	public async patchXcconfigFile(projectData: IProjectData) {
		//CODE_SIGN_ENTITLEMENTS = fgomobile/fgomobile.entitlements
		//let entitlementsRelativePath = path.join(projectData.projectName, projectData.projectName + ".entitlements");

		return;
	}

	private getAllInstalledPlugins(projectData: IProjectData): Promise<IPluginData[]> {
		return (<IPluginsService>this.$injector.resolve("pluginsService")).getAllInstalledPlugins(projectData);
	}
}

$injector.register("iOSEntitlementsService", IOSEntitlementsService);
