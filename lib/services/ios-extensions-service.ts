import * as path from "path";

export class IOSExtensionsService implements IIOSExtensionsService {
	constructor(private $fs: IFileSystem,
		private $pbxprojDomXcode: IPbxprojDomXcode,
		private $xcode: IXcode) {
	}

	public async addExtensionsFromPath({extensionsFolderPath, projectData, platformData, pbxProjPath}: IAddExtensionsFromPathOptions): Promise<boolean> {
		const targetUuids: string[] = [];
		let addedExtensions = false;
		if (!this.$fs.exists(extensionsFolderPath)) {
			return false;
		}
		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();
		this.$fs.readDirectory(extensionsFolderPath)
			.filter(fileName => {
				const filePath = path.join(extensionsFolderPath, fileName);
				const stats = this.$fs.getFsStats(filePath);

				return stats.isDirectory() && !fileName.startsWith(".");
			})
			.forEach(extensionFolder => {
				const targetUuid = this.addExtensionToProject(extensionsFolderPath, extensionFolder, project, projectData, platformData);
				targetUuids.push(targetUuid);
				addedExtensions = true;
			});

		this.$fs.writeFile(pbxProjPath, project.writeSync({omitEmptyValues: true}));
		this.prepareExtensionSigning(targetUuids, projectData, pbxProjPath);

		return addedExtensions;
	}

	private addExtensionToProject(extensionsFolderPath: string, extensionFolder: string, project: IXcode.project, projectData: IProjectData, platformData: IPlatformData): string {
		const extensionPath = path.join(extensionsFolderPath, extensionFolder);
		const extensionRelativePath = path.relative(platformData.projectRoot, extensionPath);
		const files = this.$fs.readDirectory(extensionPath)
				.filter(filePath => !filePath.startsWith("."))
				.map(filePath => path.join(extensionPath, filePath));
		const target = project.addTarget(extensionFolder, 'app_extension', extensionRelativePath);
		project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
		project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
		project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);

		const extJsonPath = path.join(extensionsFolderPath, extensionFolder, "extension.json");
		if (this.$fs.exists(extJsonPath)) {
			const extensionJson = this.$fs.readJson(extJsonPath);
			_.forEach(extensionJson.frameworks, framework => {
				project.addFramework(
					framework,
					{ target: target.uuid }
				);
			});
			if (extensionJson.assetcatalogCompilerAppiconName) {
				project.addToBuildSettings("ASSETCATALOG_COMPILER_APPICON_NAME", extensionJson.assetcatalogCompilerAppiconName, target.uuid);
			}
		}

		project.addPbxGroup(files, extensionFolder, extensionPath, null, { isMain: true, target: target.uuid, filesRelativeToProject: true });
		project.addBuildProperty("PRODUCT_BUNDLE_IDENTIFIER", `${projectData.projectIdentifiers.ios}.${extensionFolder}`, "Debug", extensionFolder);
		project.addBuildProperty("PRODUCT_BUNDLE_IDENTIFIER", `${projectData.projectIdentifiers.ios}.${extensionFolder}`, "Release", extensionFolder);
		project.addToHeaderSearchPaths(extensionPath, target.pbxNativeTarget.productName);

		return target.uuid;
	}

	private prepareExtensionSigning(targetUuids: string[], projectData:IProjectData, projectPath: string) {
		const xcode = this.$pbxprojDomXcode.Xcode.open(projectPath);
		const signing = xcode.getSigning(projectData.projectName);
		if (signing !== undefined) {
			_.forEach(targetUuids, targetUuid => {
				if (signing.style === "Automatic") {
					xcode.setAutomaticSigningStyleByTargetKey(targetUuid, signing.team);
				} else {
					for (const config in signing.configurations) {
						const signingConfiguration = signing.configurations[config];
						xcode.setManualSigningStyleByTargetKey(targetUuid, signingConfiguration);
						break;
					}
				}
			});
		}
		xcode.save();
	}

	public removeExtensions({pbxProjPath}: IRemoveExtensionsOptions): void {
		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();
		project.removeTargetsByProductType("com.apple.product-type.app-extension");
		this.$fs.writeFile(pbxProjPath, project.writeSync({omitEmptyValues: true}));
	}
}

$injector.register("iOSExtensionsService", IOSExtensionsService);
