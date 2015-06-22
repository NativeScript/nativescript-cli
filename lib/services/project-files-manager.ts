///<reference path="../.d.ts"/>
"use strict";
import path = require("path");
import util = require("util");

export class ProjectFilesManager implements IProjectFilesManager {
	constructor(private $fs: IFileSystem,
		private $platformsData: IPlatformsData) { }
	
	public processPlatformSpecificFiles(directoryPath: string, platform: string, excludedDirs?: string[]) {
		return (() => {
			var contents = this.$fs.readDirectory(directoryPath).wait();
			var files: string[] = [];
			
			_.each(contents, fileName => {
				let filePath = path.join(directoryPath, fileName);
				let fsStat = this.$fs.getFsStats(filePath).wait();
				if(fsStat.isDirectory() && (!excludedDirs || (excludedDirs && !_.contains(excludedDirs, fileName)))) {
					this.processPlatformSpecificFilesCore(platform, this.$fs.enumerateFilesInDirectorySync(filePath)).wait();
				} else if(fsStat.isFile()) {
					files.push(filePath);
				}
			});
			this.processPlatformSpecificFilesCore(platform, files).wait();
			
		}).future<void>()();
	}
	
	private processPlatformSpecificFilesCore(platform: string, files: string[]): IFuture<void> {
		// Renames the files that have `platform` as substring and removes the files from other platform
		return (() => {
			_.each(files, fileName => {
				var platformInfo = ProjectFilesManager.parsePlatformSpecificFileName(path.basename(fileName), this.$platformsData.platformsNames);
				var shouldExcludeFile = platformInfo && platformInfo.platform !== platform;
				if (shouldExcludeFile) {
					this.$fs.deleteFile(fileName).wait();
				} else if (platformInfo && platformInfo.onDeviceName) {
					this.$fs.rename(fileName, path.join(path.dirname(fileName), platformInfo.onDeviceName)).wait();
				}
			});
		}).future<void>()();
	}
	
	private static parsePlatformSpecificFileName(fileName: string, platforms: string[]): any {
		var regex = util.format("^(.+?)\\.(%s)(\\..+?)$", platforms.join("|"));
		var parsed = fileName.match(new RegExp(regex, "i"));
		if (parsed) {
			return {
				platform: parsed[2],
				onDeviceName: parsed[1] + parsed[3]
			};
		}
		return undefined;
	}
}
$injector.register("projectFilesManager", ProjectFilesManager);
