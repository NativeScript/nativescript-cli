import * as path from "path";

export class IOSExtensionsService implements IIOSExtensionsService {
	constructor(private $fs: IFileSystem,
		private $pbxprojDomXcode: IPbxprojDomXcode) {
	}

	public async addExtensionsFromPath(extensionsFolderPath: string, projectData: IProjectData, platformData: IPlatformData, projectPath: string, project: IXcode.project): Promise<void> {
		const targetUuids: string[] = [];
		if (!this.$fs.exists(extensionsFolderPath)) {
			return;
		}

		this.$fs.readDirectory(extensionsFolderPath)
			.filter(fileName => {
				const filePath = path.join(extensionsFolderPath, fileName);
				const stats = this.$fs.getFsStats(filePath);

				return stats.isDirectory() && !fileName.startsWith(".");
			})
			.forEach(extensionFolder => {
				const targetUuid = this.addExtensionToProject(extensionsFolderPath, extensionFolder, project, projectData, platformData);
				targetUuids.push(targetUuid);
			});

		this.$fs.writeFile(projectPath, project.writeSync({omitEmptyValues: true}));
		this.prepareExtensionSigning(targetUuids, projectData, projectPath);
	}

	private addExtensionToProject(extensionsFolderPath: string, extensionFolder: string, project: IXcode.project, projectData: IProjectData, platformData: IPlatformData): string {
		const extensionPath = path.join(extensionsFolderPath, extensionFolder);
		const extensionRelativePath = path.relative(platformData.projectRoot, extensionPath);
		const files = this.$fs.readDirectory(extensionPath)
				.filter(filePath => !filePath.startsWith("."))
				.map(filePath => path.join(extensionPath, filePath));
		const group: INativeSourceCodeGroup = { name: extensionFolder, path: extensionPath, files};
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

		project.addPbxGroup(group.files, group.name, group.path, null, { isMain: true, target: target.uuid, filesRelativeToProject: true });
		project.addBuildProperty("PRODUCT_BUNDLE_IDENTIFIER", `${projectData.projectIdentifiers.ios}.${extensionFolder}`, "Debug", extensionFolder);
		project.addBuildProperty("PRODUCT_BUNDLE_IDENTIFIER", `${projectData.projectIdentifiers.ios}.${extensionFolder}`, "Release", extensionFolder);
		project.addToHeaderSearchPaths(group.path, target.pbxNativeTarget.productName);

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

	public removeExtensions(project: IXcode.project, projectPath: string): void {
		project.removeTargetsByProductType("com.apple.product-type.app-extension");
		this.$fs.writeFile(projectPath, project.writeSync({omitEmptyValues: true}));
	}
}

$injector.register("iOSExtensionsService", IOSExtensionsService);
