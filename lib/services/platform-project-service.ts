///<reference path="../.d.ts"/>

import path = require("path");
import shell = require("shelljs");
import util = require("util");
import constants = require("./../constants");
import helpers = require("./../common/helpers");

class PlatformProjectService implements IPlatformProjectService {
	private static APP_RESOURCES_FOLDER_NAME = "App_Resources";
	private static PROJECT_FRAMEWORK_DIR = "framework";

	constructor(private $npm: INodePackageManager,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $logger: ILogger,
		private $fs: IFileSystem) { }

	public createProject(platform: string): IFuture<void> {
		return(() => {
			var platformData = this.$platformsData.getPlatformData(platform);
			var platformProjectService = platformData.platformProjectService;

			platformProjectService.validate().wait();

			// Log the values for project
			this.$logger.trace("Creating NativeScript project for the %s platform", platform);
			this.$logger.trace("Path: %s", platformData.projectRoot);
			this.$logger.trace("Package: %s", this.$projectData.projectId);
			this.$logger.trace("Name: %s", this.$projectData.projectName);

			this.$logger.out("Copying template files...");

			// get path to downloaded framework package
			var frameworkDir = this.$npm.install(this.$platformsData.getPlatformData(platform).frameworkPackageName,
				path.join(this.$projectData.platformsDir, platform)).wait();
			frameworkDir = path.join(frameworkDir, PlatformProjectService.PROJECT_FRAMEWORK_DIR);

			platformProjectService.createProject(platformData.projectRoot, frameworkDir).wait();

			// Need to remove unneeded node_modules folder
			this.$fs.deleteDirectory(path.join(this.$projectData.platformsDir, platform, "node_modules")).wait();

			platformProjectService.interpolateData(platformData.projectRoot);
			platformProjectService.executePlatformSpecificAction(platformData.projectRoot);

			this.$logger.out("Project successfully created.");

		}).future<void>()();
	}

	public prepareProject(normalizedPlatformName: string, platforms: string[]): IFuture<void> {
		return (() => {
			var platform = normalizedPlatformName.toLowerCase();
			var assetsDirectoryPath = path.join(this.$projectData.platformsDir, platform, "assets");
			var appResourcesDirectoryPath = path.join(assetsDirectoryPath, constants.APP_FOLDER_NAME, PlatformProjectService.APP_RESOURCES_FOLDER_NAME);
			shell.cp("-r", path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME), assetsDirectoryPath);

			if(this.$fs.exists(appResourcesDirectoryPath).wait()) {
				shell.cp("-r", path.join(appResourcesDirectoryPath, normalizedPlatformName, "*"), path.join(this.$projectData.platformsDir, platform, "res"));
				this.$fs.deleteDirectory(appResourcesDirectoryPath).wait();
			}

			var files = helpers.enumerateFilesInDirectorySync(path.join(assetsDirectoryPath, constants.APP_FOLDER_NAME));
			var platformsAsString = platforms.join("|");

			_.each(files, fileName => {
				var platformInfo = PlatformProjectService.parsePlatformSpecificFileName(path.basename(fileName), platformsAsString);
				var shouldExcludeFile = platformInfo && platformInfo.platform !== platform;
				if(shouldExcludeFile) {
					this.$fs.deleteFile(fileName).wait();
				} else if(platformInfo && platformInfo.onDeviceName) {
					this.$fs.rename(fileName, path.join(path.dirname(fileName), platformInfo.onDeviceName)).wait();
				}
			});

		}).future<void>()();
	}

	private static parsePlatformSpecificFileName(fileName: string, platforms: string): any {
		var regex = util.format("^(.+?)\.(%s)(\..+?)$", platforms);
		var parsed = fileName.toLowerCase().match(new RegExp(regex, "i"));
		if (parsed) {
			return {
				platform: parsed[2],
				onDeviceName: parsed[1] + parsed[3]
			};
		}
		return undefined;
	}

	public buildProject(platform: string): IFuture<void> {
		return (() => {
			var platformData = this.$platformsData.getPlatformData(platform);
			platformData.platformProjectService.buildProject(platformData.projectRoot).wait();
			this.$logger.out("Project successfully built");
		}).future<void>()();
	}
}
$injector.register("platformProjectService", PlatformProjectService);