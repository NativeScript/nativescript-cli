import * as path from "path";
import { NODE_MODULES_FOLDER_NAME } from "../constants";

const prepareInfoFileName = ".nsprepareinfo";

class ProjectChangesInfo implements IProjectChangesInfo {

	public appFilesChanged: boolean;
	public appResourcesChanged: boolean;
	public modulesChanged: boolean;
	public configChanged: boolean;
	public packageChanged: boolean;
	public nativeChanged: boolean;
	public signingChanged: boolean;

	public get hasChanges(): boolean {
		return this.packageChanged ||
			this.appFilesChanged ||
			this.appResourcesChanged ||
			this.modulesChanged ||
			this.configChanged ||
			this.signingChanged;
	}

	public get changesRequireBuild(): boolean {
		return this.packageChanged ||
			this.appResourcesChanged ||
			this.nativeChanged;
	}

	public get changesRequirePrepare(): boolean {
		return this.appResourcesChanged ||
			this.signingChanged;
	}
}

export class ProjectChangesService implements IProjectChangesService {

	private _changesInfo: IProjectChangesInfo;
	private _prepareInfo: IPrepareInfo;
	private _newFiles: number = 0;
	private _outputProjectMtime: number;
	private _outputProjectCTime: number;

	constructor(
		private $platformsData: IPlatformsData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $fs: IFileSystem) {
	}

	public get currentChanges(): IProjectChangesInfo {
		return this._changesInfo;
	}

	public checkForChanges(platform: string, projectData: IProjectData, projectChangesOptions: IProjectChangesOptions): IProjectChangesInfo {
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		this._changesInfo = new ProjectChangesInfo();
		if (!this.ensurePrepareInfo(platform, projectData, projectChangesOptions)) {
			this._newFiles = 0;
			this._changesInfo.appFilesChanged = this.containsNewerFiles(projectData.appDirectoryPath, projectData.appResourcesDirectoryPath, projectData);
			this._changesInfo.packageChanged = this.filesChanged([path.join(projectData.projectDir, "package.json")]);
			this._changesInfo.appResourcesChanged = this.containsNewerFiles(projectData.appResourcesDirectoryPath, null, projectData);
			/*done because currently all node_modules are traversed, a possible improvement could be traversing only the production dependencies*/
			this._changesInfo.nativeChanged = this.containsNewerFiles(
				path.join(projectData.projectDir, NODE_MODULES_FOLDER_NAME),
				path.join(projectData.projectDir, NODE_MODULES_FOLDER_NAME, "tns-ios-inspector"),
				projectData,
				this.fileChangeRequiresBuild);
			if (this._newFiles > 0) {
				this._changesInfo.modulesChanged = true;
			}
			let platformResourcesDir = path.join(projectData.appResourcesDirectoryPath, platformData.normalizedPlatformName);
			if (platform === this.$devicePlatformsConstants.iOS.toLowerCase()) {
				this._changesInfo.configChanged = this.filesChanged([path.join(platformResourcesDir, platformData.configurationFileName),
					path.join(platformResourcesDir, "LaunchScreen.storyboard"),
					path.join(platformResourcesDir, "build.xcconfig")
				]);
			} else {
				this._changesInfo.configChanged = this.filesChanged([
					path.join(platformResourcesDir, platformData.configurationFileName),
					path.join(platformResourcesDir, "app.gradle")
				]);
			}
		}

		let projectService = platformData.platformProjectService;
		projectService.checkForChanges(this._changesInfo, projectChangesOptions, projectData);

		if (projectChangesOptions.bundle !== this._prepareInfo.bundle || projectChangesOptions.release !== this._prepareInfo.release) {
			this._changesInfo.appFilesChanged = true;
			this._changesInfo.appResourcesChanged = true;
			this._changesInfo.modulesChanged = true;
			this._changesInfo.configChanged = true;
			this._prepareInfo.release = projectChangesOptions.release;
			this._prepareInfo.bundle = projectChangesOptions.bundle;
		}
		if (this._changesInfo.packageChanged) {
			this._changesInfo.modulesChanged = true;
		}
		if (this._changesInfo.modulesChanged || this._changesInfo.appResourcesChanged) {
			this._changesInfo.configChanged = true;
		}
		if (this._changesInfo.hasChanges) {
			this._prepareInfo.changesRequireBuild = this._changesInfo.changesRequireBuild;
			this._prepareInfo.time = new Date().toString();
			if (this._prepareInfo.changesRequireBuild) {
				this._prepareInfo.changesRequireBuildTime = this._prepareInfo.time;
			}
		}
		return this._changesInfo;
	}

	public getPrepareInfoFilePath(platform: string, projectData: IProjectData): string {
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		let prepareInfoFilePath = path.join(platformData.projectRoot, prepareInfoFileName);
		return prepareInfoFilePath;
	}

	public getPrepareInfo(platform: string, projectData: IProjectData): IPrepareInfo {
		let prepareInfoFilePath = this.getPrepareInfoFilePath(platform, projectData);
		let prepareInfo: IPrepareInfo = null;
		if (this.$fs.exists(prepareInfoFilePath)) {
			try {
				prepareInfo = this.$fs.readJson(prepareInfoFilePath);
			} catch (e) {
				prepareInfo = null;
			}
		}
		return prepareInfo;
	}

	public savePrepareInfo(platform: string, projectData: IProjectData): void {
		let prepareInfoFilePath = this.getPrepareInfoFilePath(platform, projectData);
		this.$fs.writeJson(prepareInfoFilePath, this._prepareInfo);
	}

	private ensurePrepareInfo(platform: string, projectData: IProjectData, projectChangesOptions: IProjectChangesOptions): boolean {
		this._prepareInfo = this.getPrepareInfo(platform, projectData);
		if (this._prepareInfo) {
			let platformData = this.$platformsData.getPlatformData(platform, projectData);
			let prepareInfoFile = path.join(platformData.projectRoot, prepareInfoFileName);
			this._outputProjectMtime = this.$fs.getFsStats(prepareInfoFile).mtime.getTime();
			this._outputProjectCTime = this.$fs.getFsStats(prepareInfoFile).ctime.getTime();
			return false;
		}
		this._prepareInfo = {
			time: "",
			bundle: projectChangesOptions.bundle,
			release: projectChangesOptions.release,
			changesRequireBuild: true,
			changesRequireBuildTime: null
		};
		this._outputProjectMtime = 0;
		this._outputProjectCTime = 0;
		this._changesInfo.appFilesChanged = true;
		this._changesInfo.appResourcesChanged = true;
		this._changesInfo.modulesChanged = true;
		this._changesInfo.configChanged = true;
		return true;
	}

	private filesChanged(files: string[]): boolean {
		for (let file of files) {
			if (this.$fs.exists(file)) {
				let fileStats = this.$fs.getFsStats(file);
				if (fileStats.mtime.getTime() >= this._outputProjectMtime || fileStats.ctime.getTime() >= this._outputProjectCTime) {
					return true;
				}
			}
		}
		return false;
	}

	private containsNewerFiles(dir: string, skipDir: string, projectData: IProjectData, processFunc?: (filePath: string, projectData: IProjectData) => boolean): boolean {
		let files = this.$fs.readDirectory(dir);
		for (let file of files) {
			let filePath = path.join(dir, file);
			if (filePath === skipDir) {
				continue;
			}

			let fileStats = this.$fs.getFsStats(filePath);

			let changed = fileStats.mtime.getTime() >= this._outputProjectMtime || fileStats.ctime.getTime() >= this._outputProjectCTime;
			if (!changed) {
				let lFileStats = this.$fs.getLsStats(filePath);
				changed = lFileStats.mtime.getTime() >= this._outputProjectMtime || lFileStats.ctime.getTime() >= this._outputProjectCTime;
			}

			if (changed) {
				if (processFunc) {
					this._newFiles++;
					let filePathRelative = path.relative(projectData.projectDir, filePath);
					if (processFunc.call(this, filePathRelative, projectData)) {
						return true;
					}
				} else {
					return true;
				}
			}

			if (fileStats.isDirectory()) {
				if (this.containsNewerFiles(filePath, skipDir, projectData, processFunc)) {
					return true;
				}
			}
		}
		return false;
	}

	private fileChangeRequiresBuild(file: string, projectData: IProjectData) {
		if (path.basename(file) === "package.json") {
			return true;
		}
		let projectDir = projectData.projectDir;
		if (_.startsWith(path.join(projectDir, file), projectData.appResourcesDirectoryPath)) {
			return true;
		}
		if (_.startsWith(file, NODE_MODULES_FOLDER_NAME)) {
			let filePath = file;
			while (filePath !== NODE_MODULES_FOLDER_NAME) {
				filePath = path.dirname(filePath);
				let fullFilePath = path.join(projectDir, path.join(filePath, "package.json"));
				if (this.$fs.exists(fullFilePath)) {
					let json = this.$fs.readJson(fullFilePath);
					if (json["nativescript"] && _.startsWith(file, path.join(filePath, "platforms"))) {
						return true;
					}
				}
			}
		}
		return false;
	}
}
$injector.register("projectChangesService", ProjectChangesService);
