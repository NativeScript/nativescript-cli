///<reference path="../.d.ts"/>
"use strict";

import minimatch = require("minimatch");
import * as constants from "../constants";
import * as path from "path";

export class ProjectFilesProvider implements IProjectFilesProvider {
	constructor(private $platformsData: IPlatformsData,
		private $projectData: IProjectData) { }

	private static INTERNAL_NONPROJECT_FILES = [ "**/*.ts" ];

	public mapFilePath(filePath: string, platform: string): string {
		let platformData = this.$platformsData.getPlatformData(platform.toLowerCase());
		let projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		let mappedFilePath = path.join(projectFilesPath, path.relative(path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME), filePath));

		let appResourcesDirectoryPath = path.join(constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME);
		let platformSpecificAppResourcesDirectoryPath = path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName);
		if (filePath.indexOf(appResourcesDirectoryPath) > -1 && filePath.indexOf(platformSpecificAppResourcesDirectoryPath) === -1) {
			return null;
		}
		if (filePath.indexOf(platformSpecificAppResourcesDirectoryPath) > -1) {
			let appResourcesRelativePath = path.relative(path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME,
				platformData.normalizedPlatformName), filePath);
			mappedFilePath = path.join(platformData.platformProjectService.getAppResourcesDestinationDirectoryPath().wait(), appResourcesRelativePath);
		}

		return mappedFilePath;
	}

	public isFileExcluded(filePath: string): boolean {
		return !!_.find(ProjectFilesProvider.INTERNAL_NONPROJECT_FILES, (pattern) => minimatch(filePath, pattern, { nocase: true }));
	}
}
$injector.register("projectFilesProvider", ProjectFilesProvider);
