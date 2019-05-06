import * as path from "path";
import { NODE_MODULES_FOLDER_NAME, NativePlatformStatus, PACKAGE_JSON_FILE_NAME, APP_GRADLE_FILE_NAME, BUILD_XCCONFIG_FILE_NAME } from "../constants";
import { getHash, hook } from "../common/helpers";
import { PreparePlatformData } from "./workflow/workflow-data-service";

const prepareInfoFileName = ".nsprepareinfo";

class ProjectChangesInfo implements IProjectChangesInfo {

	public appResourcesChanged: boolean;
	public modulesChanged: boolean;
	public configChanged: boolean;
	public packageChanged: boolean;
	public nativeChanged: boolean;
	public signingChanged: boolean;
	public nativePlatformStatus: NativePlatformStatus;

	public get hasChanges(): boolean {
		return this.packageChanged ||
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
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $fs: IFileSystem,
		private $logger: ILogger,
		public $hooksService: IHooksService) {
	}

	public get currentChanges(): IProjectChangesInfo {
		return this._changesInfo;
	}

	@hook("checkForChanges")
	public async checkForChanges(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<IProjectChangesInfo> {
		this._changesInfo = new ProjectChangesInfo();
		const isNewPrepareInfo = await this.ensurePrepareInfo(platformData, projectData, preparePlatformData);
		if (!isNewPrepareInfo) {
			this._newFiles = 0;

			this._changesInfo.packageChanged = this.isProjectFileChanged(projectData.projectDir, platformData);

			const platformResourcesDir = path.join(projectData.appResourcesDirectoryPath, platformData.normalizedPlatformName);
			this._changesInfo.appResourcesChanged = this.containsNewerFiles(platformResourcesDir, null, projectData);
			/*done because currently all node_modules are traversed, a possible improvement could be traversing only the production dependencies*/
			this._changesInfo.nativeChanged = this.containsNewerFiles(
				path.join(projectData.projectDir, NODE_MODULES_FOLDER_NAME),
				path.join(projectData.projectDir, NODE_MODULES_FOLDER_NAME, "tns-ios-inspector"),
				projectData,
				this.fileChangeRequiresBuild);

			this.$logger.trace(`Set nativeChanged to ${this._changesInfo.nativeChanged}.`);

			if (this._newFiles > 0 || this._changesInfo.nativeChanged) {
				this.$logger.trace(`Setting modulesChanged to true, newFiles: ${this._newFiles}, nativeChanged: ${this._changesInfo.nativeChanged}`);
				this._changesInfo.modulesChanged = true;
			}

			if (platformData.platformNameLowerCase === this.$devicePlatformsConstants.iOS.toLowerCase()) {
				this._changesInfo.configChanged = this.filesChanged([path.join(platformResourcesDir, platformData.configurationFileName),
				path.join(platformResourcesDir, "LaunchScreen.storyboard"),
				path.join(platformResourcesDir, BUILD_XCCONFIG_FILE_NAME)
				]);
			} else {
				this._changesInfo.configChanged = this.filesChanged([
					path.join(platformResourcesDir, platformData.configurationFileName),
					path.join(platformResourcesDir, APP_GRADLE_FILE_NAME)
				]);
			}

			this.$logger.trace(`Set value of configChanged to ${this._changesInfo.configChanged}`);
		}

		if (!preparePlatformData.nativePrepare || !preparePlatformData.nativePrepare.skipNativePrepare) {
			await platformData.platformProjectService.checkForChanges(this._changesInfo, preparePlatformData, projectData);
		}

		if (preparePlatformData.release !== this._prepareInfo.release) {
			this.$logger.trace(`Setting all setting to true. Current options are: `, preparePlatformData, " old prepare info is: ", this._prepareInfo);
			this._changesInfo.appResourcesChanged = true;
			this._changesInfo.modulesChanged = true;
			this._changesInfo.configChanged = true;
			this._prepareInfo.release = preparePlatformData.release;
		}
		if (this._changesInfo.packageChanged) {
			this.$logger.trace("Set modulesChanged to true as packageChanged is true");
			this._changesInfo.modulesChanged = true;
		}
		if (this._changesInfo.modulesChanged || this._changesInfo.appResourcesChanged) {
			this.$logger.trace(`Set configChanged to true, current value of moduleChanged is: ${this._changesInfo.modulesChanged}, appResourcesChanged is: ${this._changesInfo.appResourcesChanged}`);
			this._changesInfo.configChanged = true;
		}
		if (this._changesInfo.hasChanges) {
			this._prepareInfo.changesRequireBuild = this._changesInfo.changesRequireBuild;
			this._prepareInfo.time = new Date().toString();
			if (this._prepareInfo.changesRequireBuild) {
				this._prepareInfo.changesRequireBuildTime = this._prepareInfo.time;
			}

			this._prepareInfo.projectFileHash = this.getProjectFileStrippedHash(projectData.projectDir, platformData);
		}

		this._changesInfo.nativePlatformStatus = this._prepareInfo.nativePlatformStatus;

		this.$logger.trace("checkForChanges returns", this._changesInfo);
		return this._changesInfo;
	}

	public getPrepareInfoFilePath(platformData: IPlatformData): string {
		const prepareInfoFilePath = path.join(platformData.projectRoot, prepareInfoFileName);

		return prepareInfoFilePath;
	}

	public getPrepareInfo(platformData: IPlatformData): IPrepareInfo {
		const prepareInfoFilePath = this.getPrepareInfoFilePath(platformData);
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

	public savePrepareInfo(platformData: IPlatformData): void {
		const prepareInfoFilePath = this.getPrepareInfoFilePath(platformData);
		this.$fs.writeJson(prepareInfoFilePath, this._prepareInfo);
	}

	public setNativePlatformStatus(platformData: IPlatformData, addedPlatform: IAddedNativePlatform): void {
		this._prepareInfo = this._prepareInfo || this.getPrepareInfo(platformData);
		if (this._prepareInfo && addedPlatform.nativePlatformStatus === NativePlatformStatus.alreadyPrepared) {
			this._prepareInfo.nativePlatformStatus = addedPlatform.nativePlatformStatus;
		} else {
			this._prepareInfo = {
				nativePlatformStatus: addedPlatform.nativePlatformStatus
			};
		}

		this.savePrepareInfo(platformData);
	}

	private async ensurePrepareInfo(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<boolean> {
		this._prepareInfo = this.getPrepareInfo(platformData);
		if (this._prepareInfo) {
			const prepareInfoFile = path.join(platformData.projectRoot, prepareInfoFileName);
			this._outputProjectMtime = this.$fs.getFsStats(prepareInfoFile).mtime.getTime();
			this._outputProjectCTime = this.$fs.getFsStats(prepareInfoFile).ctime.getTime();
			return false;
		}

		const nativePlatformStatus = (!preparePlatformData.nativePrepare || !preparePlatformData.nativePrepare.skipNativePrepare) ?
			NativePlatformStatus.requiresPrepare : NativePlatformStatus.requiresPlatformAdd;
		this._prepareInfo = {
			time: "",
			nativePlatformStatus,
			release: preparePlatformData.release,
			changesRequireBuild: true,
			projectFileHash: this.getProjectFileStrippedHash(projectData.projectDir, platformData),
			changesRequireBuildTime: null
		};

		this._outputProjectMtime = 0;
		this._outputProjectCTime = 0;
		this._changesInfo = this._changesInfo || new ProjectChangesInfo();
		this._changesInfo.appResourcesChanged = true;
		this._changesInfo.modulesChanged = true;
		this._changesInfo.configChanged = true;
		return true;
	}

	private getProjectFileStrippedHash(projectDir: string, platformData: IPlatformData): string {
		const projectFilePath = path.join(projectDir, PACKAGE_JSON_FILE_NAME);
		const projectFileContents = this.$fs.readJson(projectFilePath);
		_(this.$devicePlatformsConstants)
			.keys()
			.map(k => k.toLowerCase())
			.difference([platformData.platformNameLowerCase])
			.each(otherPlatform => {
				delete projectFileContents.nativescript[`tns-${otherPlatform}`];
			});

		return getHash(JSON.stringify(projectFileContents));
	}

	private isProjectFileChanged(projectDir: string, platformData: IPlatformData): boolean {
		const projectFileStrippedContentsHash = this.getProjectFileStrippedHash(projectDir, platformData);
		const prepareInfo = this.getPrepareInfo(platformData);
		return projectFileStrippedContentsHash !== prepareInfo.projectFileHash;
	}

	private filesChanged(files: string[]): boolean {
		for (const file of files) {
			if (this.$fs.exists(file)) {
				const fileStats = this.$fs.getFsStats(file);
				if (fileStats.mtime.getTime() >= this._outputProjectMtime || fileStats.ctime.getTime() >= this._outputProjectCTime) {
					return true;
				}
			}
		}

		return false;
	}

	private containsNewerFiles(dir: string, skipDir: string, projectData: IProjectData, processFunc?: (filePath: string, projectData: IProjectData) => boolean): boolean {
		const dirName = path.basename(dir);
		this.$logger.trace(`containsNewerFiles will check ${dir}`);
		if (_.startsWith(dirName, '.')) {
			this.$logger.trace(`containsNewerFiles returns false for ${dir} as its name starts with dot (.) .`);
			return false;
		}

		const dirFileStat = this.$fs.getFsStats(dir);
		if (this.isFileModified(dirFileStat, dir)) {
			this.$logger.trace(`containsNewerFiles returns true for ${dir} as the dir itself has been modified.`);
			return true;
		}

		const files = this.$fs.readDirectory(dir);
		for (const file of files) {
			const filePath = path.join(dir, file);
			if (filePath === skipDir) {
				continue;
			}

			const fileStats = this.$fs.getFsStats(filePath);
			const changed = this.isFileModified(fileStats, filePath);

			if (changed) {
				this.$logger.trace(`File ${filePath} has been changed.`);
				if (processFunc) {
					this._newFiles++;
					this.$logger.trace(`Incremented the newFiles counter. Current value is ${this._newFiles}`);
					const filePathRelative = path.relative(projectData.projectDir, filePath);
					if (processFunc.call(this, filePathRelative, projectData)) {
						this.$logger.trace(`containsNewerFiles returns true for ${dir}. The modified file is ${filePath}`);
						return true;
					}
				} else {
					this.$logger.trace(`containsNewerFiles returns true for ${dir}. The modified file is ${filePath}`);
					return true;
				}
			}

			if (fileStats.isDirectory()) {
				if (this.containsNewerFiles(filePath, skipDir, projectData, processFunc)) {
					this.$logger.trace(`containsNewerFiles returns true for ${dir}.`);
					return true;
				}
			}
		}

		this.$logger.trace(`containsNewerFiles returns false for ${dir}.`);
		return false;
	}

	private isFileModified(filePathStat: IFsStats, filePath: string): boolean {
		let changed = filePathStat.mtime.getTime() >= this._outputProjectMtime ||
			filePathStat.ctime.getTime() >= this._outputProjectCTime;

		if (!changed) {
			const lFileStats = this.$fs.getLsStats(filePath);
			changed = lFileStats.mtime.getTime() >= this._outputProjectMtime ||
				lFileStats.ctime.getTime() >= this._outputProjectCTime;
		}

		return changed;
	}

	private fileChangeRequiresBuild(file: string, projectData: IProjectData) {
		if (path.basename(file) === PACKAGE_JSON_FILE_NAME) {
			return true;
		}
		const projectDir = projectData.projectDir;
		if (_.startsWith(path.join(projectDir, file), projectData.appResourcesDirectoryPath)) {
			return true;
		}
		if (_.startsWith(file, NODE_MODULES_FOLDER_NAME)) {
			let filePath = file;
			while (filePath !== NODE_MODULES_FOLDER_NAME) {
				filePath = path.dirname(filePath);
				const fullFilePath = path.join(projectDir, path.join(filePath, PACKAGE_JSON_FILE_NAME));
				if (this.$fs.exists(fullFilePath)) {
					const json = this.$fs.readJson(fullFilePath);
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
