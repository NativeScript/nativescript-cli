import minimatch = require("minimatch");
import * as constants from "../constants";
import * as path from "path";
import { ProjectFilesProviderBase } from "../common/services/project-files-provider-base";

export class ProjectFilesProvider extends ProjectFilesProviderBase {
	constructor(private $platformsData: IPlatformsData,
		$mobileHelper: Mobile.IMobileHelper,
		$options: IOptions) {
		super($mobileHelper, $options);
	}

	private static INTERNAL_NONPROJECT_FILES = ["**/*.ts"];

	public mapFilePath(filePath: string, platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): string {
		const platformData = this.$platformsData.getPlatformData(platform.toLowerCase(), projectData);
		const parsedFilePath = this.getPreparedFilePath(filePath, projectFilesConfig);
		let mappedFilePath = "";
		if (parsedFilePath.indexOf(constants.NODE_MODULES_FOLDER_NAME) > -1) {
			const relativePath = path.relative(path.join(projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME), parsedFilePath);
			mappedFilePath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, constants.TNS_MODULES_FOLDER_NAME, relativePath);
		} else {
			mappedFilePath = path.join(platformData.appDestinationDirectoryPath, path.relative(projectData.projectDir, parsedFilePath));
		}

		const appResourcesDirectoryPath = projectData.getAppResourcesDirectoryPath();
		const platformSpecificAppResourcesDirectoryPath = path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName);
		if (parsedFilePath.indexOf(appResourcesDirectoryPath) > -1 && parsedFilePath.indexOf(platformSpecificAppResourcesDirectoryPath) === -1) {
			return null;
		}

		if (parsedFilePath.indexOf(platformSpecificAppResourcesDirectoryPath) > -1) {
			const appResourcesRelativePath = path.relative(path.join(projectData.getAppResourcesDirectoryPath(),
				platformData.normalizedPlatformName), parsedFilePath);
			mappedFilePath = path.join(platformData.platformProjectService.getAppResourcesDestinationDirectoryPath(projectData), appResourcesRelativePath);
		}

		return mappedFilePath;
	}

	public isFileExcluded(filePath: string): boolean {
		return !!_.find(ProjectFilesProvider.INTERNAL_NONPROJECT_FILES, (pattern) => minimatch(filePath, pattern, { nocase: true }));
	}
}
$injector.register("projectFilesProvider", ProjectFilesProvider);
