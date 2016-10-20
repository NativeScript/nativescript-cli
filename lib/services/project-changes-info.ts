import * as path from "path";

const prepareInfoFileName = ".nsprepareinfo";

export interface IPrepareInfo {
	time: string;
	bundle: boolean;
	release: boolean;
}

export class ProjectChangesInfo {

	public get hasChanges(): boolean {
		return this.appFilesChanged || this.appResourcesChanged || this.modulesChanged || this.configChanged;
	}

	public appFilesChanged: boolean = false;
	public appResourcesChanged: boolean = false;
	public modulesChanged: boolean = false;
	public configChanged: boolean = false;
	public prepareInfo: IPrepareInfo;

	constructor(platform: string,
		private force: boolean,
		private skipModulesAndResources: boolean,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $options: IOptions,
		private $fs: IFileSystem) {

			let platformData = this.$platformsData.getPlatformData(platform);
			let buildInfoFile = path.join(platformData.projectRoot, prepareInfoFileName);

			if (force || !this.$fs.exists(buildInfoFile).wait()) {
				this.appFilesChanged = true;
				this.appResourcesChanged = true;
				this.modulesChanged = true;
				this.configChanged = true;
				this.prepareInfo = { time: "", bundle: $options.bundle, release: $options.release };
			} else {
				let outputProjectMtime = this.$fs.getFsStats(buildInfoFile).wait().mtime.getTime();
				this.prepareInfo = this.$fs.readJson(buildInfoFile).wait();
				this.appFilesChanged = this.containsNewerFiles(this.$projectData.appDirectoryPath, this.$projectData.appResourcesDirectoryPath, outputProjectMtime);
				if (!skipModulesAndResources) {
					this.appResourcesChanged = this.containsNewerFiles(this.$projectData.appResourcesDirectoryPath, null, outputProjectMtime);
					this.modulesChanged = this.containsNewerFiles(path.join(this.$projectData.projectDir, "node_modules"), null, outputProjectMtime);
					let platformResourcesDir = path.join(this.$projectData.appResourcesDirectoryPath, platformData.normalizedPlatformName);
					if (platform === this.$devicePlatformsConstants.iOS.toLowerCase()) {
						this.configChanged = this.filesChanged([
							this.$options.baseConfig || path.join(platformResourcesDir, platformData.configurationFileName),
							path.join(platformResourcesDir, "LaunchScreen.storyboard"),
							path.join(platformResourcesDir, "build.xcconfig")
						], outputProjectMtime);
					} else {
						this.configChanged = this.filesChanged([
							path.join(platformResourcesDir, platformData.configurationFileName),
							path.join(platformResourcesDir, "app.gradle")
						], outputProjectMtime);
					}
				}

				if (this.$options.bundle !== this.prepareInfo.bundle) {
					this.modulesChanged = true;
					this.prepareInfo.bundle = this.$options.bundle;
				}
				if (this.$options.release !== this.prepareInfo.release) {
					this.appFilesChanged = true;
					this.appResourcesChanged = true;
					this.modulesChanged = true;
					this.configChanged = true;
					this.prepareInfo.release = this.$options.release;
				}
				if (this.modulesChanged || this.appResourcesChanged) {
					this.configChanged = true;
				}
			}

			if (this.hasChanges) {
				this.prepareInfo.time = new Date().toString();
				this.$fs.writeJson(buildInfoFile, this.prepareInfo).wait();
			}
	}

	private filesChanged(files: string[], mtime: number): boolean {
		for (let file of files) {
			if (this.$fs.exists(file).wait()) {
				let fileStats = this.$fs.getFsStats(file).wait();
				if (fileStats.mtime.getTime() > mtime) {
					return true;
				}
			}
		}
		return false;
	}

	private containsNewerFiles(dir: string, skipDir: string, mtime: number): boolean {
		let files = this.$fs.readDirectory(dir).wait();
		for (let file of files) {
			let filePath = path.join(dir, file);
			if (filePath === skipDir) {
				continue;
			}
			let fileStats = this.$fs.getFsStats(filePath).wait();
			if (fileStats.mtime.getTime() > mtime) {
				return true;
			}
			if (fileStats.isDirectory()) {
				if (this.containsNewerFiles(filePath, skipDir, mtime)) {
					return true;
				}
			}
		}
		return false;
	}
}
