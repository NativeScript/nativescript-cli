import * as path from "path";

export abstract class NativeTargetServiceBase implements IIOSNativeTargetServiceBase {
	constructor(protected $fs: IFileSystem,
		protected $pbxprojDomXcode: IPbxprojDomXcode,
		protected $xcode: IXcode) {
	}

	protected addTargetToProject(extensionsFolderPath: string, extensionFolder: string, targetType: string, project: IXcode.project, platformData: IPlatformData, parentTarget?: string): IXcode.target {
		const extensionPath = path.join(extensionsFolderPath, extensionFolder);
		const extensionRelativePath = path.relative(platformData.projectRoot, extensionPath);
		const files = this.$fs.readDirectory(extensionPath)
				.filter(filePath => !filePath.startsWith("."))
				.map(filePath => path.join(extensionPath, filePath));
		const target = project.addTarget(extensionFolder, targetType, extensionRelativePath, parentTarget);
		project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
		project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
		project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);

		project.addPbxGroup(files, extensionFolder, extensionPath, null, { isMain: true, target: target.uuid, filesRelativeToProject: true });
		project.addToHeaderSearchPaths(extensionPath, target.pbxNativeTarget.productName);
		return target;
	}

	protected prepareSigning(targetUuids: string[], projectData:IProjectData, projectPath: string) {
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
}
