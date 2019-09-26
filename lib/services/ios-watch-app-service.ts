import * as path from "path";
import { IOSDeviceTargets, IOS_WATCHAPP_FOLDER, IOS_WATCHAPP_EXTENSION_FOLDER, IOSNativeTargetProductTypes, IOSNativeTargetTypes } from "../constants";

export class IOSWatchAppService implements IIOSWatchAppService {
	private static WATCH_APP_IDENTIFIER = "watchkitapp";
	private static WACTCH_EXTENSION_IDENTIFIER = "watchkitextension";
	constructor(protected $fs: IFileSystem,
		protected $pbxprojDomXcode: IPbxprojDomXcode,
		protected $xcode: IXcode,
		private $iOSNativeTargetService: IIOSNativeTargetService) {
	}

	public async addWatchAppFromPath({watchAppFolderPath, projectData, platformData, pbxProjPath}: IAddWatchAppFromPathOptions): Promise<boolean> {
		const targetUuids: string[] = [];
		const appPath = path.join(watchAppFolderPath, IOS_WATCHAPP_FOLDER);
		const extensionPath = path.join(watchAppFolderPath, IOS_WATCHAPP_EXTENSION_FOLDER);

		if (!this.$fs.exists(appPath) || !this.$fs.exists(extensionPath)) {
			return false;
		}

		const appFolder = this.$iOSNativeTargetService.getTargetDirectories(appPath)[0];
		const extensionFolder = this.$iOSNativeTargetService.getTargetDirectories(extensionPath)[0];

		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();

		const watchApptarget = this.$iOSNativeTargetService.addTargetToProject(appPath, appFolder, IOSNativeTargetTypes.watchApp, project, platformData, project.getFirstTarget().uuid);
		this.configureTarget(
			appFolder,
			path.join(appPath, appFolder),
			`${projectData.projectIdentifiers.ios}.${IOSWatchAppService.WATCH_APP_IDENTIFIER}`,
			"watchapp.json",
			watchApptarget,
			project
		);
		targetUuids.push(watchApptarget.uuid);

		const watchExtensionTarget = this.$iOSNativeTargetService.addTargetToProject(extensionPath, extensionFolder, IOSNativeTargetTypes.watchExtension, project, platformData, watchApptarget.uuid);
		this.configureTarget(
			extensionFolder,
			path.join(extensionPath, extensionFolder),
			`${projectData.projectIdentifiers.ios}.${IOSWatchAppService.WATCH_APP_IDENTIFIER}.${IOSWatchAppService.WACTCH_EXTENSION_IDENTIFIER}`,
			"extension.json",
			watchExtensionTarget,
			project);
		targetUuids.push(watchExtensionTarget.uuid);

		this.$fs.writeFile(pbxProjPath, project.writeSync({omitEmptyValues: true}));
		this.$iOSNativeTargetService.prepareSigning(targetUuids, projectData, pbxProjPath);

		return true;
	}

	public removeWatchApp({pbxProjPath}: IRemoveWatchAppOptions): void {
		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();
		project.removeTargetsByProductType(IOSNativeTargetProductTypes.watchApp);
		project.removeTargetsByProductType(IOSNativeTargetProductTypes.watchExtension);
		this.$fs.writeFile(pbxProjPath, project.writeSync({omitEmptyValues: true}));
	}

	public hasWatchApp(platformData: IPlatformData, projectData: IProjectData): boolean {
		const watchAppPath = path.join(
			projectData.getAppResourcesDirectoryPath(),
			platformData.normalizedPlatformName,
			IOS_WATCHAPP_FOLDER
		);

		return this.$fs.exists(watchAppPath);
	}

	private configureTarget(targetName: string, targetPath: string, identifier: string, configurationFileName: string, target: IXcode.target, project: IXcode.project) {
		const targetConfigurationJsonPath = path.join(targetPath, configurationFileName);

		const identifierParts = identifier.split(".");
		identifierParts.pop();
		const wkAppBundleIdentifier = identifierParts.join(".");

		this.$iOSNativeTargetService.setXcodeTargetBuildConfigurationProperties([
			{name: "PRODUCT_BUNDLE_IDENTIFIER", value: identifier},
			{name: "SDKROOT", value: "watchos"},
			{name: "TARGETED_DEVICE_FAMILY", value: IOSDeviceTargets.watchos},
			{name: "WATCHOS_DEPLOYMENT_TARGET", value: 5.2},
			{name: "WK_APP_BUNDLE_IDENTIFIER", value: wkAppBundleIdentifier}
		], targetName, project);

		this.$iOSNativeTargetService.setConfigurationsFromJsonFile(targetConfigurationJsonPath, target.uuid, targetName, project);
		project.addToHeaderSearchPaths(targetPath, target.pbxNativeTarget.productName);
	}
}

$injector.register("iOSWatchAppService", IOSWatchAppService);
