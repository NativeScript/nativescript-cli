import * as path from "path";
import { NativeTargetServiceBase } from "./ios-native-target-service-base";

export class IOSWatchAppService extends NativeTargetServiceBase implements IIOSWatchAppService {
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

		const appPath = path.join(watchAppFolderPath, "watchapp");
		const appFolder = this.getTargetDirectories(appPath)[0];

		const extensionPath = path.join(watchAppFolderPath, "watchextension");
		const extensionFolder = this.getTargetDirectories(extensionPath)[0];

		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();

		const watchApptarget = this.addTargetToProject(appPath, appFolder, "watch_app", project, platformData, project.getFirstTarget().uuid);
		this.configureTarget(
			appFolder,
			path.join(appPath, appFolder),
			`${projectData.projectIdentifiers.ios}.watchkitapp`,
			"watchapp.json",
			watchApptarget,
			project
		);
		targetUuids.push(watchApptarget.uuid);

		const watchExtensionTarget = this.addTargetToProject(extensionPath, extensionFolder, "watch_extension", project, platformData, watchApptarget.uuid);
		this.configureTarget(
			extensionFolder,
			path.join(extensionPath, extensionFolder),
			`${projectData.projectIdentifiers.ios}.watchkitapp.watchkitextension`,
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
		project.removeTargetsByProductType("com.apple.product-type.application.watchapp2");
		project.removeTargetsByProductType("com.apple.product-type.watchkit2-extension");
		this.$fs.writeFile(pbxProjPath, project.writeSync({omitEmptyValues: true}));
	}

	private configureTarget(targetName: string, targetPath: string, identifier: string, configurationFileName: string, target: IXcode.target, project: IXcode.project) {
		const targetConfigurationJsonPath = path.join(targetPath, configurationFileName);
		this.setConfigurationsFromJsonFile(targetConfigurationJsonPath, target.uuid, project);

		const identifierParts = identifier.split(".");
		identifierParts.pop();
		const wkAppBundleIdentifier = identifierParts.join(".");

		this.setXcodeTargetBuildConfigurationProperties([
			{name: "PRODUCT_BUNDLE_IDENTIFIER", value: identifier},
			{name: "SDKROOT", value: "watchos"},
			{name: "TARGETED_DEVICE_FAMILY", value: 4},
			{name: "WATCHOS_DEPLOYMENT_TARGET", value: 4.1},
			{name: "WK_APP_BUNDLE_IDENTIFIER", value: wkAppBundleIdentifier}
		], targetName, project);

		project.addToHeaderSearchPaths(targetPath, target.pbxNativeTarget.productName);
	}
}

$injector.register("iOSWatchAppService", IOSWatchAppService);
