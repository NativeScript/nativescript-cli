import * as path from "path";

export enum BuildNames {
	debug = "Debug",
	release = "Release"
}

export interface IXcodeTargetBuildConfigurationProperty {
	name: string;
	value: any;
	buildNames?: BuildNames[];
}

export abstract class NativeTargetServiceBase {
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

	protected getTargetDirectories(folderPath: string): string[] {
		return this.$fs.readDirectory(folderPath)
			.filter(fileName => {
				const filePath = path.join(folderPath, fileName);
				const stats = this.$fs.getFsStats(filePath);

				return stats.isDirectory() && !fileName.startsWith(".");
			});
	}

	protected setXcodeTargetBuildConfigurationProperties(properties: IXcodeTargetBuildConfigurationProperty[], targetName: string, project: IXcode.project): void {
		properties.forEach(property => {
			const buildNames = property.buildNames || [BuildNames.debug, BuildNames.release];
			buildNames.forEach((buildName) => {
				project.addBuildProperty(property.name, property.value, buildName, targetName);
			});
		});
	}

	protected setConfigurationsFromJsonFile(jsonPath: string, targetUuid: string, targetName: string, project: IXcode.project) {
		if (this.$fs.exists(jsonPath)) {
			const configurationJson = this.$fs.readJson(jsonPath) || {};

			_.forEach(configurationJson.frameworks, framework => {
				project.addFramework(
					framework,
					{ target: targetUuid }
				);
			});

			if (configurationJson.assetcatalogCompilerAppiconName) {
				project.addToBuildSettings("ASSETCATALOG_COMPILER_APPICON_NAME", configurationJson.assetcatalogCompilerAppiconName,  targetUuid);
			}

			if (configurationJson.targetBuildConfigurationProperties) {
				const properties: IXcodeTargetBuildConfigurationProperty[] = [];
				_.forEach(configurationJson.targetBuildConfigurationProperties, (value, name: string) => properties.push({value, name}));
				this.setXcodeTargetBuildConfigurationProperties(properties, targetName, project);
			}
		}
	}
}
