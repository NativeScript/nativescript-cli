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
		let addedExtensions = false;
		if (!this.$fs.exists(watchAppFolderPath)) {
			return false;
		}
		const project = new this.$xcode.project(pbxProjPath);
		const appPath = path.join(watchAppFolderPath, "watchapp");
		const extensionPath = path.join(watchAppFolderPath, "watchextension");
		project.parseSync();
		const appFolder = this.$fs.readDirectory(appPath)
			.filter(fileName => {
				const filePath = path.join(appPath, fileName);
				const stats = this.$fs.getFsStats(filePath);

				return stats.isDirectory() && !fileName.startsWith(".");
			})[0];

		const extensionFolder = this.$fs.readDirectory(extensionPath)
			.filter(fileName => {
				const filePath = path.join(extensionPath, fileName);
				const stats = this.$fs.getFsStats(filePath);

				return stats.isDirectory() && !fileName.startsWith(".");
			})[0];

		const watchApptarget = this.addTargetToProject(appPath, appFolder, "watch_app", project, platformData, project.getFirstTarget().uuid);
		this.configureTarget(appFolder, path.join(appPath, appFolder), `${projectData.projectIdentifiers.ios}.watchkitapp`, watchApptarget, project);
		targetUuids.push(watchApptarget.uuid);
		const watchExtensionTarget = this.addTargetToProject(extensionPath, extensionFolder, "watch_extension", project, platformData, watchApptarget.uuid);
		this.configureTarget(extensionFolder, path.join(extensionPath, extensionFolder), `${projectData.projectIdentifiers.ios}.watchkitapp.watchkitextension`, watchExtensionTarget, project);
		targetUuids.push(watchExtensionTarget.uuid);
		addedExtensions = true;

		this.$fs.writeFile(pbxProjPath, project.writeSync({omitEmptyValues: true}));
		this.prepareSigning(targetUuids, projectData, pbxProjPath);

		return addedExtensions;
	}

	private configureTarget(targetName: string, targetPath: string, identifier: string, target: IXcode.target, project: IXcode.project) {
		const identifierParts = identifier.split(".");
		identifierParts.pop();
		const wkAppBundleIdentifier = identifierParts.join(".");
		project.addBuildProperty("PRODUCT_BUNDLE_IDENTIFIER", identifier, "Debug", targetName);
		project.addBuildProperty("PRODUCT_BUNDLE_IDENTIFIER", identifier, "Release", targetName);
		project.addBuildProperty("SDKROOT", "watchos", "Debug", targetName);
		project.addBuildProperty("SDKROOT", "watchos", "Release", targetName);
		project.addBuildProperty("TARGETED_DEVICE_FAMILY", 4, "Debug", targetName);
		project.addBuildProperty("TARGETED_DEVICE_FAMILY", 4, "Release", targetName);
		project.addBuildProperty("WATCHOS_DEPLOYMENT_TARGET", 4.1, "Debug", targetName);
		project.addBuildProperty("WATCHOS_DEPLOYMENT_TARGET", 4.1, "Release", targetName);
		project.addBuildProperty("WK_APP_BUNDLE_IDENTIFIER", wkAppBundleIdentifier, "Debug", targetName);
		project.addBuildProperty("WK_APP_BUNDLE_IDENTIFIER", wkAppBundleIdentifier, "Release", targetName);
		project.addToHeaderSearchPaths(targetPath, target.pbxNativeTarget.productName);
	}

	public removeWatchApp({pbxProjPath}: IRemoveWatchAppOptions): void {
		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();
		project.removeTargetsByProductType("com.apple.product-type.application.watchapp2");
		project.removeTargetsByProductType("com.apple.product-type.watchkit2-extension");
		this.$fs.writeFile(pbxProjPath, project.writeSync({omitEmptyValues: true}));
	}
}

$injector.register("iOSWatchAppService", IOSWatchAppService);
