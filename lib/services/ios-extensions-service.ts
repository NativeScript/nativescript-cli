import * as path from "path";
import {
	IOSNativeTargetProductTypes,
	IOSNativeTargetTypes
} from "../constants";
import {
	IIOSNativeTargetService,
	IIOSExtensionsService,
	IAddExtensionsFromPathOptions,
	IRemoveExtensionsOptions,
	IProjectData
} from "../definitions/project";
import { IFileSystem } from "../common/declarations";
import { injector } from "../common/yok";

export class IOSExtensionsService implements IIOSExtensionsService {
	constructor(
		protected $fs: IFileSystem,
		protected $pbxprojDomXcode: IPbxprojDomXcode,
		protected $xcode: IXcode,
		private $iOSNativeTargetService: IIOSNativeTargetService
	) {}

	public async addExtensionsFromPath({
		extensionsFolderPath,
		projectData,
		platformData,
		pbxProjPath
	}: IAddExtensionsFromPathOptions): Promise<boolean> {
		const targetUuids: string[] = [];
		let addedExtensions = false;
		if (!this.$fs.exists(extensionsFolderPath)) {
			return false;
		}
		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();
		this.$iOSNativeTargetService
			.getTargetDirectories(extensionsFolderPath)
			.forEach((extensionFolder) => {
				const target = this.$iOSNativeTargetService.addTargetToProject(
					extensionsFolderPath,
					extensionFolder,
					IOSNativeTargetTypes.appExtension,
					project,
					platformData
				);
				this.configureTarget(
					extensionFolder,
					path.join(extensionsFolderPath, extensionFolder),
					target,
					project,
					projectData
				);
				targetUuids.push(target.uuid);
				addedExtensions = true;
			});

		this.$fs.writeFile(
			pbxProjPath,
			project.writeSync({ omitEmptyValues: true })
		);
		this.$iOSNativeTargetService.prepareSigning(
			targetUuids,
			projectData,
			pbxProjPath
		);

		return addedExtensions;
	}

	private configureTarget(
		extensionName: string,
		extensionPath: string,
		target: IXcode.target,
		project: IXcode.project,
		projectData: IProjectData
	) {
		const extJsonPath = path.join(extensionPath, "extension.json");

		this.$iOSNativeTargetService.setXcodeTargetBuildConfigurationProperties(
			[
				{
					name: "PRODUCT_BUNDLE_IDENTIFIER",
					value: `${projectData.projectIdentifiers.ios}.${extensionName}`
				}
			],
			extensionName,
			project
		);

		this.$iOSNativeTargetService.setConfigurationsFromJsonFile(
			extJsonPath,
			target.uuid,
			extensionName,
			project
		);
	}

	public removeExtensions({ pbxProjPath }: IRemoveExtensionsOptions): void {
		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();
		project.removeTargetsByProductType(
			IOSNativeTargetProductTypes.appExtension
		);
		this.$fs.writeFile(
			pbxProjPath,
			project.writeSync({ omitEmptyValues: true })
		);
	}
}

injector.register("iOSExtensionsService", IOSExtensionsService);
