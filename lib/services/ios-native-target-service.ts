import * as path from "path";
import * as _ from "lodash";
import {
	IIOSNativeTargetService,
	IProjectData,
	IXcodeTargetBuildConfigurationProperty,
	BuildNames,
} from "../definitions/project";
import { IPlatformData } from "../definitions/platform";
import { IFileSystem } from "../common/declarations";
import { injector } from "../common/yok";

export class IOSNativeTargetService implements IIOSNativeTargetService {
	constructor(
		protected $fs: IFileSystem,
		protected $pbxprojDomXcode: IPbxprojDomXcode
	) {}

	public addTargetToProject(
		targetRootPath: string,
		targetFolder: string,
		targetType: string,
		project: IXcode.project,
		platformData: IPlatformData,
		parentTarget?: string
	): IXcode.target {
		const targetPath = path.join(targetRootPath, targetFolder);
		const targetRelativePath = path.relative(
			platformData.projectRoot,
			targetPath
		);
		const files = this.$fs
			.readDirectory(targetPath)
			.filter((filePath) => !filePath.startsWith("."))
			.map((filePath) => path.join(targetPath, filePath));
		const target = project.addTarget(
			targetFolder,
			targetType,
			targetRelativePath,
			parentTarget
		);
		project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);
		project.addBuildPhase(
			[],
			"PBXResourcesBuildPhase",
			"Resources",
			target.uuid
		);
		project.addBuildPhase(
			[],
			"PBXFrameworksBuildPhase",
			"Frameworks",
			target.uuid
		);

		project.addPbxGroup(files, targetFolder, targetPath, null, {
			isMain: true,
			target: target.uuid,
			filesRelativeToProject: true,
		});
		project.addToHeaderSearchPaths(
			targetPath,
			target.pbxNativeTarget.productName
		);
		return target;
	}

	public prepareSigning(
		targetUuids: string[],
		projectData: IProjectData,
		projectPath: string
	): void {
		const xcode = this.$pbxprojDomXcode.Xcode.open(projectPath);
		const signing = xcode.getSigning(projectData.projectName);
		if (signing !== undefined) {
			_.forEach(targetUuids, (targetUuid) => {
				if (signing.style === "Automatic") {
					xcode.setAutomaticSigningStyleByTargetKey(targetUuid, signing.team);
				} else {
					for (const config in signing.configurations) {
						const signingConfiguration = signing.configurations[config];
						xcode.setManualSigningStyleByTargetKey(
							targetUuid,
							signingConfiguration
						);
						break;
					}
				}
			});
		}
		xcode.save();
	}

	public getTargetDirectories(folderPath: string): string[] {
		return this.$fs.readDirectory(folderPath).filter((fileName) => {
			const filePath = path.join(folderPath, fileName);
			const stats = this.$fs.getFsStats(filePath);

			return stats.isDirectory() && !fileName.startsWith(".");
		});
	}

	public setXcodeTargetBuildConfigurationProperties(
		properties: IXcodeTargetBuildConfigurationProperty[],
		targetName: string,
		project: IXcode.project
	): void {
		properties.forEach((property) => {
			const buildNames = property.buildNames || [
				BuildNames.debug,
				BuildNames.release,
			];
			buildNames.forEach((buildName) => {
				project.addBuildProperty(
					property.name,
					property.value,
					buildName,
					targetName
				);
			});
		});
	}

	public setConfigurationsFromJsonFile(
		jsonPath: string,
		targetUuid: string,
		targetName: string,
		project: IXcode.project
	): void {
		if (this.$fs.exists(jsonPath)) {
			const configurationJson = this.$fs.readJson(jsonPath) || {};

			_.forEach(configurationJson.frameworks, (framework) => {
				project.addFramework(framework, { target: targetUuid });
			});

			if (configurationJson.assetcatalogCompilerAppiconName) {
				project.addToBuildSettings(
					"ASSETCATALOG_COMPILER_APPICON_NAME",
					configurationJson.assetcatalogCompilerAppiconName,
					targetUuid
				);
			}

			if (configurationJson.targetBuildConfigurationProperties) {
				const properties: IXcodeTargetBuildConfigurationProperty[] = [];
				_.forEach(
					configurationJson.targetBuildConfigurationProperties,
					(value, name: string) => properties.push({ value, name })
				);
				this.setXcodeTargetBuildConfigurationProperties(
					properties,
					targetName,
					project
				);
			}
		}
	}
}

injector.register("iOSNativeTargetService", IOSNativeTargetService);
