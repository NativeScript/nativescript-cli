import * as path from "path";
import { FilePayload, Device } from "nativescript-preview-sdk";
import { PreviewSdkEventNames } from "./preview-app-constants";
import { APP_FOLDER_NAME, APP_RESOURCES_FOLDER_NAME, TNS_MODULES_FOLDER_NAME } from "../../../constants";
const isTextOrBinary = require('istextorbinary');

export class PreviewAppLiveSyncService implements IPreviewAppLiveSyncService {
	private excludedFileExtensions = [".ts", ".sass", ".scss", ".less"];
	private excludedFiles = [".DS_Store"];

	constructor(private $fs: IFileSystem,
		private $hooksService: IHooksService,
		private $logger: ILogger,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService,
		private $previewSdkService: IPreviewSdkService,
		private $previewAppPluginsService: IPreviewAppPluginsService,
		private $projectFilesManager: IProjectFilesManager,
		private $projectFilesProvider: IProjectFilesProvider) { }

	public initialize() {
		this.$previewSdkService.initialize();
	}

	public async initialSync(data: IPreviewAppLiveSyncData): Promise<void> {
		this.$previewSdkService.on(PreviewSdkEventNames.DEVICE_CONNECTED, async (device: Device) => {
			this.$logger.trace("Found connected device", device);
			const filesToSyncMap: IDictionary<string[]> = {};
			let promise = Promise.resolve();
			const startSyncFilesTimeout = async (platform: string) => {
				promise
					.then(async () => {
						promise = this.syncFilesForPlatformSafe(data, platform, filesToSyncMap[platform]);
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
					filesToSyncMap,
				 	startSyncFilesTimeout: startSyncFilesTimeout.bind(this)
				}
            });
			await this.$previewAppPluginsService.comparePluginsOnDevice(device);
			await this.syncFilesForPlatformSafe(data, device.platform);
		});
	}

	public async syncFiles(data: IPreviewAppLiveSyncData, files?: string[]): Promise<void> {
		this.showWarningsForNativeFiles(files);

		for (const device of this.$previewSdkService.connectedDevices) {
			await this.$previewAppPluginsService.comparePluginsOnDevice(device);
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
		this.$previewSdkService.removeAllListeners();
		this.$previewSdkService.stop();
	}

	private async syncFilesForPlatformSafe(data: IPreviewAppLiveSyncData, platform: string, files?: string[]): Promise<void> {
		this.$logger.info(`Start syncing changes for platform ${platform}.`);

		try {
			const { appFilesUpdaterOptions, env, projectDir } = data;
			const projectData = this.$projectDataService.getProjectData(projectDir);
			await this.preparePlatform(platform, appFilesUpdaterOptions, env, projectData);

			// TODO: This should be refactored after implementing platform param in pubnub's meta data.
			const devices = this.$previewSdkService.connectedDevices.filter(device => device.platform === platform);
			for (const device of devices) {
				await this.applyChanges(projectData, device, files);
			}

			this.$logger.info(`Successfully synced changes for platform ${platform}.`);
		} catch (err) {
			this.$logger.warn(`Unable to apply changes for platform ${platform}. Error is: ${err}, ${JSON.stringify(err, null, 2)}.`);
		}
	}

	private async applyChanges(projectData: IProjectData, device: Device, files: string[]) {
		const platformData = this.$platformsData.getPlatformData(device.platform, projectData);
		const payloads = this.getFilePayloads(platformData, projectData, _(files).uniq().value());
		await this.$previewSdkService.applyChanges(payloads, device.id);
	}

	private getFilePayloads(platformData: IPlatformData, projectData: IProjectData, files?: string[]): FilePayload[] {
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
				const extName = path.extname(relativePath);
				const baseName = projectFileInfo.onDeviceFileName.split(extName)[0];
				const newFileName = `${baseName}.${platformData.normalizedPlatformName.toLowerCase()}${extName}`;

				const filePayload: FilePayload = {
					event: PreviewSdkEventNames.CHANGE_EVENT_NAME,
					file: path.join(path.dirname(relativePath), newFileName),
					binary: isTextOrBinary.isBinarySync(file),
					fileContents: ""
				};

				if (filePayload.binary) {
					const bitmap =  <string>this.$fs.readFile(file);
					const base64 = new Buffer(bitmap).toString('base64');
					filePayload.fileContents = base64;
				} else {
					filePayload.fileContents = this.$fs.readText(path.join(path.dirname(projectFileInfo.filePath), projectFileInfo.onDeviceFileName));
				}

				return filePayload;
			});

		return payloads;
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
		if (files && files.length) {
			for (const file of files) {
				if (file.indexOf(APP_RESOURCES_FOLDER_NAME) > -1) {
					this.$logger.warn(`Unable to apply changes from ${APP_RESOURCES_FOLDER_NAME} folder. You need to build your application in order to make changes in ${APP_RESOURCES_FOLDER_NAME} folder.`);
				}
			}
		}
	}
}
$injector.register("previewAppLiveSyncService", PreviewAppLiveSyncService);
