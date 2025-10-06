import * as path from "path";
import {
	NativePlatformStatus,
	PACKAGE_JSON_FILE_NAME,
	APP_GRADLE_FILE_NAME,
	BUILD_XCCONFIG_FILE_NAME,
	PLATFORMS_DIR_NAME,
	CONFIG_FILE_NAME_JS,
	CONFIG_FILE_NAME_TS,
	CONFIG_NS_FILE_NAME,
} from "../constants";
import { getHash, hook } from "../common/helpers";
import {
	INodeModulesDependenciesBuilder,
	IPlatformData,
} from "../definitions/platform";
import { IProjectData } from "../definitions/project";
import { IFileSystem, IHooksService, IFsStats } from "../common/declarations";
import {
	IProjectChangesInfo,
	IPrepareInfo,
	IAddedNativePlatform,
} from "../definitions/project-changes";
import * as _ from "lodash";
import { injector } from "../common/yok";
import { IOptions } from "../declarations";

const prepareInfoFileName = ".nsprepareinfo";

class ProjectChangesInfo implements IProjectChangesInfo {
	public appResourcesChanged: boolean;
	public configChanged: boolean;
	public nsConfigChanged: boolean;
	public nativeChanged: boolean;
	public signingChanged: boolean;
	public nativePlatformStatus: NativePlatformStatus;

	public get hasChanges(): boolean {
		return (
			this.nativeChanged ||
			this.appResourcesChanged ||
			this.configChanged ||
			this.signingChanged
		);
	}

	public get changesRequireBuild(): boolean {
		return this.appResourcesChanged || this.nativeChanged;
	}

	public get changesRequirePrepare(): boolean {
		return this.appResourcesChanged || this.signingChanged;
	}
}

export class ProjectChangesService implements IProjectChangesService {
	private _changesInfo: IProjectChangesInfo;
	private _prepareInfo: IPrepareInfo;
	private _outputProjectMtime: number;
	private _outputProjectCTime: number;

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $options: IOptions,
		public $hooksService: IHooksService,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder
	) {}

	public get currentChanges(): IProjectChangesInfo {
		return this._changesInfo;
	}

	@hook("checkForChanges")
	public async checkForChanges(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData,
	): Promise<IProjectChangesInfo> {
		this._changesInfo = new ProjectChangesInfo();
		const isNewPrepareInfo = await this.ensurePrepareInfo(
			platformData,
			projectData,
			prepareData
		);
		if (!isNewPrepareInfo) {
			let platformResourcesDir = path.join(
				projectData.appResourcesDirectoryPath,
				platformData.normalizedPlatformName
			);

			if (
				!this.$fs.exists(platformResourcesDir) &&
				platformData.platformNameLowerCase ===
					this.$devicePlatformsConstants.visionOS.toLowerCase()
			) {
				platformResourcesDir = path.join(
					projectData.appResourcesDirectoryPath,
					this.$devicePlatformsConstants.iOS
				);
			}

			this._changesInfo.appResourcesChanged = this.containsNewerFiles(
				platformResourcesDir,
				projectData
			);

			this.$nodeModulesDependenciesBuilder
				.getProductionDependencies(
					projectData.projectDir,
					projectData.ignoredDependencies
				)
				.filter(
					(dep) =>
						dep.nativescript &&
						this.$fs.exists(
							path.join(
								dep.directory,
								PLATFORMS_DIR_NAME,
								platformData.platformNameLowerCase
							)
						)
				)
				.forEach((dep) => {
					this._changesInfo.nativeChanged =
						this._changesInfo.nativeChanged ||
						this.containsNewerFiles(
							path.join(
								dep.directory,
								PLATFORMS_DIR_NAME,
								platformData.platformNameLowerCase
							),
							projectData
						) ||
						this.isFileModified(
							path.join(dep.directory, PACKAGE_JSON_FILE_NAME)
						);
				});

			if (!this._changesInfo.nativeChanged) {
				this._prepareInfo.projectFileHash = this.getProjectFileStrippedHash(
					projectData.projectDir,
					platformData
				);
				this._changesInfo.nativeChanged = this.isProjectFileChanged(
					projectData.projectDir,
					platformData
				);
			}

			// If this causes too much rebuilds of the plugins or uncecessary builds for Android, move overrideCocoapods to prepareInfo.
			this._changesInfo.nsConfigChanged = this.filesChanged([
				path.join(projectData.projectDir, CONFIG_FILE_NAME_JS),
				path.join(projectData.projectDir, CONFIG_FILE_NAME_TS),
				path.join(projectData.projectDir, CONFIG_NS_FILE_NAME),
			]);
			this._changesInfo.nativeChanged =
				this._changesInfo.nativeChanged || this._changesInfo.nsConfigChanged;

			this.$logger.trace(
				`Set nativeChanged to ${this._changesInfo.nativeChanged}.`
			);

			if (
				platformData.platformNameLowerCase ===
				this.$devicePlatformsConstants.iOS.toLowerCase()
			) {
				this._changesInfo.configChanged = this.filesChanged([
					path.join(platformResourcesDir, platformData.configurationFileName),
					path.join(platformResourcesDir, "LaunchScreen.storyboard"),
					path.join(platformResourcesDir, BUILD_XCCONFIG_FILE_NAME),
				]);
			} else {
				this._changesInfo.configChanged = this.filesChanged([
					path.join(platformResourcesDir, platformData.configurationFileName),
					path.join(platformResourcesDir, APP_GRADLE_FILE_NAME),
				]);
			}

			this.$logger.trace(
				`Set value of configChanged to ${this._changesInfo.configChanged}`
			);
		}

		if (
			!prepareData.nativePrepare ||
			!prepareData.nativePrepare.skipNativePrepare
		) {
			await platformData.platformProjectService.checkForChanges(
				this._changesInfo,
				prepareData,
				projectData
			);
		}

		if (!!prepareData.release !== !!this._prepareInfo.release) {
			this.$logger.trace(
				`Setting all setting to true. Current options are: `,
				prepareData,
				" old prepare info is: ",
				this._prepareInfo
			);
			this._changesInfo.appResourcesChanged = true;
			this._changesInfo.configChanged = true;
			this._prepareInfo.release = prepareData.release;
		}
		if (this._changesInfo.appResourcesChanged) {
			this.$logger.trace(
				`Set configChanged to true, appResourcesChanged is: ${this._changesInfo.appResourcesChanged}`
			);
			this._changesInfo.configChanged = true;
		}
		if (this._changesInfo.hasChanges) {
			this._prepareInfo.changesRequireBuild =
				this._changesInfo.changesRequireBuild;
			this._prepareInfo.time = new Date().toString();
			if (this._prepareInfo.changesRequireBuild) {
				this._prepareInfo.changesRequireBuildTime = this._prepareInfo.time;
			}
		}

		this._changesInfo.nativePlatformStatus =
			this._prepareInfo.nativePlatformStatus;

		this.$logger.trace("checkForChanges returns", this._changesInfo);
		return this._changesInfo;
	}

	public getPrepareInfoFilePath(platformData: IPlatformData): string {
		const prepareInfoFilePath = path.join(
			platformData.projectRoot,
			prepareInfoFileName
		);

		return prepareInfoFilePath;
	}

	public getPrepareInfo(platformData: IPlatformData): IPrepareInfo {
		if (this.$options.hostProjectPath) {
			// TODO: always prepare for now until we decide where to keep the .nsprepareinfo file when embedding
			return null;
		}

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

	public async savePrepareInfo(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData
	): Promise<void> {
		if (!this._prepareInfo) {
			await this.ensurePrepareInfo(platformData, projectData, prepareData);
		}

		if (this.$options.hostProjectPath) {
			// TODO: do not save for now until we decide where to keep the .nsprepareinfo file when embedding
			return null;
		}

		const prepareInfoFilePath = this.getPrepareInfoFilePath(platformData);
		this.$fs.writeJson(prepareInfoFilePath, this._prepareInfo);
	}

	public async setNativePlatformStatus(
		platformData: IPlatformData,
		projectData: IProjectData,
		addedPlatform: IAddedNativePlatform
	): Promise<void> {
		this._prepareInfo = this._prepareInfo || this.getPrepareInfo(platformData);
		if (
			this._prepareInfo &&
			addedPlatform.nativePlatformStatus ===
				NativePlatformStatus.alreadyPrepared
		) {
			this._prepareInfo.nativePlatformStatus =
				addedPlatform.nativePlatformStatus;
		} else {
			this._prepareInfo = {
				nativePlatformStatus: addedPlatform.nativePlatformStatus,
			};
		}

		await this.savePrepareInfo(platformData, projectData, null);
	}

	private async ensurePrepareInfo(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData
	): Promise<boolean> {
		this._prepareInfo = this.getPrepareInfo(platformData);
		if (this._prepareInfo) {
			const prepareInfoFile = path.join(
				platformData.projectRoot,
				prepareInfoFileName
			);
			this._outputProjectMtime = this.$fs
				.getFsStats(prepareInfoFile)
				.mtime.getTime();
			this._outputProjectCTime = this.$fs
				.getFsStats(prepareInfoFile)
				.ctime.getTime();
			return false;
		}

		const nativePlatformStatus =
			!prepareData.nativePrepare || !prepareData.nativePrepare.skipNativePrepare
				? NativePlatformStatus.requiresPrepare
				: NativePlatformStatus.requiresPlatformAdd;
		this._prepareInfo = {
			time: "",
			nativePlatformStatus,
			release: prepareData.release,
			changesRequireBuild: true,
			projectFileHash: this.getProjectFileStrippedHash(
				projectData.projectDir,
				platformData
			),
			changesRequireBuildTime: null,
		};

		this._outputProjectMtime = 0;
		this._outputProjectCTime = 0;
		this._changesInfo = this._changesInfo || new ProjectChangesInfo();
		this._changesInfo.appResourcesChanged = true;
		this._changesInfo.configChanged = true;
		this._changesInfo.nativeChanged = true;
		this._changesInfo.nsConfigChanged = true;
		return true;
	}

	private getProjectFileStrippedHash(
		projectDir: string,
		platformData: IPlatformData
	): string {
		const projectFilePath = path.join(projectDir, PACKAGE_JSON_FILE_NAME);
		const projectFileContents = this.$fs.readJson(projectFilePath);

		const relevantProperties = ["dependencies"];

		const projectFileStrippedContents = _.pick(
			projectFileContents,
			relevantProperties
		);

		// _(this.$devicePlatformsConstants)
		// 	.keys()
		// 	.map(k => k.toLowerCase())
		// 	.difference([platformData.platformNameLowerCase])
		// 	.each(otherPlatform => {
		// 		delete projectFileContents.nativescript[`tns-${otherPlatform}`];
		// 	});

		return getHash(JSON.stringify(projectFileStrippedContents));
	}

	private isProjectFileChanged(
		projectDir: string,
		platformData: IPlatformData
	): boolean {
		const projectFileStrippedContentsHash = this.getProjectFileStrippedHash(
			projectDir,
			platformData
		);
		const prepareInfo = this.getPrepareInfo(platformData);
		return projectFileStrippedContentsHash !== prepareInfo.projectFileHash;
	}

	private filesChanged(files: string[]): boolean {
		for (const file of files) {
			if (this.$fs.exists(file)) {
				const fileStats = this.$fs.getFsStats(file);
				if (
					fileStats.mtime.getTime() >= this._outputProjectMtime ||
					fileStats.ctime.getTime() >= this._outputProjectCTime
				) {
					return true;
				}
			}
		}

		return false;
	}

	private containsNewerFiles(dir: string, projectData: IProjectData): boolean {
		const dirName = path.basename(dir);
		this.$logger.trace(`containsNewerFiles will check ${dir}`);
		if (_.startsWith(dirName, ".")) {
			return false;
		}

		if (this.isFileModified(dir)) {
			this.$logger.trace(
				`containsNewerFiles returns true for ${dir} as the dir itself has been modified.`
			);
			return true;
		}

		const files = this.$fs.readDirectory(dir);
		for (const file of files) {
			const filePath = path.join(dir, file);

			const fileStats = this.$fs.getFsStats(filePath);
			const changed = this.isFileModified(filePath, fileStats);

			if (changed) {
				this.$logger.trace(
					`containsNewerFiles returns true for ${dir}. The modified file is ${filePath}`
				);
				return true;
			}

			if (fileStats.isDirectory()) {
				if (this.containsNewerFiles(filePath, projectData)) {
					this.$logger.trace(`containsNewerFiles returns true for ${dir}.`);
					return true;
				}
			}
		}

		return false;
	}

	private isFileModified(filePath: string, filePathStats?: IFsStats): boolean {
		filePathStats = filePathStats || this.$fs.getFsStats(filePath);
		let changed =
			filePathStats.mtime.getTime() >= this._outputProjectMtime ||
			filePathStats.ctime.getTime() >= this._outputProjectCTime;

		if (!changed) {
			const lFileStats = this.$fs.getLsStats(filePath);
			changed =
				lFileStats.mtime.getTime() >= this._outputProjectMtime ||
				lFileStats.ctime.getTime() >= this._outputProjectCTime;
		}

		return changed;
	}
}
injector.register("projectChangesService", ProjectChangesService);
