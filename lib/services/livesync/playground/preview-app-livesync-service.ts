import * as path from "path";
import { FilePayload, Device, FilesPayload } from "nativescript-preview-sdk";
import { PreviewSdkEventNames } from "./preview-app-constants";
import { APP_FOLDER_NAME, APP_RESOURCES_FOLDER_NAME, TNS_MODULES_FOLDER_NAME } from "../../../constants";
const isTextOrBinary = require('istextorbinary');

export class PreviewAppLiveSyncService implements IPreviewAppLiveSyncService {
	private excludedFileExtensions = [".ts", ".sass", ".scss", ".less"];
	private excludedFiles = [".DS_Store"];

	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $hooksService: IHooksService,
		private $logger: ILogger,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService,
		private $previewSdkService: IPreviewSdkService,
		private $previewAppPluginsService: IPreviewAppPluginsService,
		private $projectFilesManager: IProjectFilesManager,
		private $projectFilesProvider: IProjectFilesProvider) { }

	public initialize(data: IPreviewAppLiveSyncData) {
		this.$previewSdkService.initialize(async (device: Device) => {
			if (!device) {
				this.$errors.failWithoutHelp("Sending initial preview files without a specified device is not supported.");
			}

			const filesToSyncMap: IDictionary<string[]> = {};
			let promise = Promise.resolve<FilesPayload>(null);
			const startSyncFilesTimeout = async (platform: string) => {
				await promise
					.then(async () => {
						const projectData = this.$projectDataService.getProjectData(data.projectDir);
						promise = this.applyChanges(this.$platformsData.getPlatformData(platform, projectData), projectData, filesToSyncMap[platform]);
						await promise;
					});
				filesToSyncMap[platform] = [];
			};
			await this.$hooksService.executeBeforeHooks("preview-sync", {
				hookArgs: {
					projectData: this.$projectDataService.getProjectData(data.projectDir),
					config: {
						env: data.env,
						platform: device.platform,
						appFilesUpdaterOptions: data.appFilesUpdaterOptions,
					},
					externals: this.$previewAppPluginsService.getExternalPlugins(device),
					filesToSyncMap,
					startSyncFilesTimeout: startSyncFilesTimeout.bind(this)
				}
			});
			await this.$previewAppPluginsService.comparePluginsOnDevice(data, device);
			const payloads = await this.syncFilesForPlatformSafe(data, device.platform);

			return payloads;
		});
	}

	public async syncFiles(data: IPreviewAppLiveSyncData, files?: string[]): Promise<void> {
		this.showWarningsForNativeFiles(files);

		for (const device of this.$previewSdkService.connectedDevices) {
			await this.$previewAppPluginsService.comparePluginsOnDevice(data, device);
		}

		const platforms = _(this.$previewSdkService.connectedDevices)
			.map(device => device.platform)
			.uniq()
			.value();

		for (const platform of platforms) {
			await this.syncFilesForPlatformSafe(data, platform, files);
		}
	}

	public async stopLiveSync(): Promise<void> {
		this.$previewSdkService.stop();
	}

	private async syncFilesForPlatformSafe(data: IPreviewAppLiveSyncData, platform: string, files?: string[]): Promise<FilesPayload> {
		this.$logger.info(`Start syncing changes for platform ${platform}.`);

		try {
			const { appFilesUpdaterOptions, env, projectDir } = data;
			const projectData = this.$projectDataService.getProjectData(projectDir);
			const platformData = this.$platformsData.getPlatformData(platform, projectData);
			await this.preparePlatform(platform, appFilesUpdaterOptions, env, projectData);

			let result: FilesPayload = null;
			if (files && files.length) {
				result = await this.applyChanges(platformData, projectData, files);
			} else {
				result = await this.getFilesPayload(platformData, projectData);
			}

			this.$logger.info(`Successfully synced changes for platform ${platform}.`);

			return result;
		} catch (err) {
			this.$logger.warn(`Unable to apply changes for platform ${platform}. Error is: ${err}, ${JSON.stringify(err, null, 2)}.`);
		}
	}

	private async applyChanges(platformData: IPlatformData, projectData: IProjectData, files: string[]): Promise<FilesPayload> {
		const payloads = this.getFilesPayload(platformData, projectData, _(files).uniq().value());
		await this.$previewSdkService.applyChanges(payloads);

		return payloads;
	}

	private getFilesPayload(platformData: IPlatformData, projectData: IProjectData, files?: string[]): FilesPayload {
		const appFolderPath = path.join(projectData.projectDir, APP_FOLDER_NAME);
		const platformsAppFolderPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);

		if (files && files.length) {
			files = files.map(file => path.join(platformsAppFolderPath, path.relative(appFolderPath, file)));
		} else {
			files = this.$projectFilesManager.getProjectFiles(platformsAppFolderPath);
		}

		const filesToTransfer = files
			.filter(file => file.indexOf(TNS_MODULES_FOLDER_NAME) === -1)
			.filter(file => file.indexOf(APP_RESOURCES_FOLDER_NAME) === -1)
			.filter(file => !_.includes(this.excludedFiles, path.basename(file)))
			.filter(file => !_.includes(this.excludedFileExtensions, path.extname(file)));

		this.$logger.trace(`Transferring ${filesToTransfer.join("\n")}.`);

		const payloads = filesToTransfer
			.map(file => {
				const projectFileInfo = this.$projectFilesProvider.getProjectFileInfo(file, platformData.normalizedPlatformName, null);
				const relativePath = path.relative(platformsAppFolderPath, file);
				const filePayload: FilePayload = {
					event: PreviewSdkEventNames.CHANGE_EVENT_NAME,
					file: path.join(path.dirname(relativePath), projectFileInfo.onDeviceFileName),
					binary: isTextOrBinary.isBinarySync(file),
					fileContents: ""
				};

				if (filePayload.binary) {
					const bitmap = <string>this.$fs.readFile(file);
					const base64 = Buffer.from(bitmap).toString('base64');
					filePayload.fileContents = base64;
				} else {
					filePayload.fileContents = this.$fs.readText(path.join(path.dirname(projectFileInfo.filePath), projectFileInfo.onDeviceFileName));
				}

				return filePayload;
			});

		return { files: payloads, platform: platformData.normalizedPlatformName.toLowerCase() };
	}

	private async preparePlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, env: Object, projectData: IProjectData): Promise<void> {
		const nativePrepare = { skipNativePrepare: true };
		const config = <IPlatformOptions>{};
		const platformTemplate = <string>null;
		const prepareInfo = {
			platform,
			appFilesUpdaterOptions,
			env,
			projectData,
			nativePrepare,
			config,
			platformTemplate,
			skipCopyTnsModules: true,
			skipCopyAppResourcesFiles: true
		};
		await this.$platformService.preparePlatform(prepareInfo);
	}

	private showWarningsForNativeFiles(files: string[]): void {
		_.filter(files, file => file.indexOf(APP_RESOURCES_FOLDER_NAME) > -1)
			.forEach(file => this.$logger.warn(`Unable to apply changes from ${APP_RESOURCES_FOLDER_NAME} folder. You need to build your application in order to make changes in ${APP_RESOURCES_FOLDER_NAME} folder.`));
	}
}
$injector.register("previewAppLiveSyncService", PreviewAppLiveSyncService);
