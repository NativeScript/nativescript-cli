import * as path from "path";
import { NativeTargetServiceBase } from "./ios-native-target-service-base";
import { IOSDeviceTargets, IOS_WATCHAPP_FOLDER, IOS_WATCHAPP_EXTENSION_FOLDER, IOSNativeTargetProductTypes, IOSNativeTargetTypes } from "../constants";

export class IOSWatchAppService extends NativeTargetServiceBase implements IIOSWatchAppService {
	private static WATCH_APP_IDENTIFIER = "watchkitapp";
	private static WACTCH_EXTENSION_IDENTIFIER = "watchkitextension";
	constructor(protected $fs: IFileSystem,
		protected $pbxprojDomXcode: IPbxprojDomXcode,
		protected $xcode: IXcode) {
			super($fs, $pbxprojDomXcode, $xcode);
	}

	public async addWatchAppFromPath({watchAppFolderPath, projectData, platformData, pbxProjPath}: IAddWatchAppFromPathOptions): Promise<boolean> {
		const targetUuids: string[] = [];

		if (!this.$fs.exists(watchAppFolderPath)) {
			return false;
		}

		const appPath = path.join(watchAppFolderPath, IOS_WATCHAPP_FOLDER);
		const appFolder = this.getTargetDirectories(appPath)[0];

		const extensionPath = path.join(watchAppFolderPath, IOS_WATCHAPP_EXTENSION_FOLDER);
		const extensionFolder = this.getTargetDirectories(extensionPath)[0];

		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();

		const watchApptarget = this.addTargetToProject(appPath, appFolder, IOSNativeTargetTypes.watchApp, project, platformData, project.getFirstTarget().uuid);
		this.configureTarget(
			appFolder,
			path.join(appPath, appFolder),
			`${projectData.projectIdentifiers.ios}.${IOSWatchAppService.WATCH_APP_IDENTIFIER}`,
			"watchapp.json",
			watchApptarget,
			project
		);
		targetUuids.push(watchApptarget.uuid);

		const watchExtensionTarget = this.addTargetToProject(extensionPath, extensionFolder, IOSNativeTargetTypes.watchExtension, project, platformData, watchApptarget.uuid);
		this.configureTarget(
			extensionFolder,
			path.join(extensionPath, extensionFolder),
			`${projectData.projectIdentifiers.ios}.${IOSWatchAppService.WATCH_APP_IDENTIFIER}.${IOSWatchAppService.WACTCH_EXTENSION_IDENTIFIER}`,
			"extension.json",
			watchExtensionTarget,
			project);
		targetUuids.push(watchExtensionTarget.uuid);

		this.$fs.writeFile(pbxProjPath, project.writeSync({omitEmptyValues: true}));
		this.prepareSigning(targetUuids, projectData, pbxProjPath);

		return true;
	}

	public removeWatchApp({pbxProjPath}: IRemoveWatchAppOptions): void {
		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();
		project.removeTargetsByProductType(IOSNativeTargetProductTypes.watchApp);
		project.removeTargetsByProductType(IOSNativeTargetProductTypes.watchExtension);
		this.$fs.writeFile(pbxProjPath, project.writeSync({omitEmptyValues: true}));
	}

	private configureTarget(targetName: string, targetPath: string, identifier: string, configurationFileName: string, target: IXcode.target, project: IXcode.project) {
		const targetConfigurationJsonPath = path.join(targetPath, configurationFileName);

		const identifierParts = identifier.split(".");
		identifierParts.pop();
		const wkAppBundleIdentifier = identifierParts.join(".");

		this.setXcodeTargetBuildConfigurationProperties([
			{name: "PRODUCT_BUNDLE_IDENTIFIER", value: identifier},
			{name: "SDKROOT", value: "watchos"},
			{name: "TARGETED_DEVICE_FAMILY", value: IOSDeviceTargets.watchos},
			{name: "WATCHOS_DEPLOYMENT_TARGET", value: 5.2},
			{name: "WK_APP_BUNDLE_IDENTIFIER", value: wkAppBundleIdentifier}
		], targetName, project);

		this.setConfigurationsFromJsonFile(targetConfigurationJsonPath, target.uuid, targetName, project);
		project.addToHeaderSearchPaths(targetPath, target.pbxNativeTarget.productName);
	}
}

$injector.register("iOSWatchAppService", IOSWatchAppService);
