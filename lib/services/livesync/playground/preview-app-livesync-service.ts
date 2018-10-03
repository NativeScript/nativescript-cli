import * as path from "path";
import { FilePayload, Device, FilesPayload } from "nativescript-preview-sdk";
import { PreviewSdkEventNames } from "./preview-app-constants";
import { APP_FOLDER_NAME, APP_RESOURCES_FOLDER_NAME, TNS_MODULES_FOLDER_NAME } from "../../../constants";
import { HmrConstants } from "../../../common/constants";
const isTextOrBinary = require('istextorbinary');

export class PreviewAppLiveSyncService implements IPreviewAppLiveSyncService {
	private excludedFileExtensions = [".ts", ".sass", ".scss", ".less"];
	private excludedFiles = [".DS_Store"];
	private deviceInitializationPromise: IDictionary<Promise<FilesPayload>> = {};

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
		private $hmrStatusService: IHmrStatusService,
		private $projectFilesProvider: IProjectFilesProvider) { }

	public async initialize(data: IPreviewAppLiveSyncData): Promise<void> {
		await this.$previewSdkService.initialize(async (device: Device) => {
			if (!device) {
				this.$errors.failWithoutHelp("Sending initial preview files without a specified device is not supported.");
			}

			if (this.deviceInitializationPromise[device.id]) {
				return this.deviceInitializationPromise[device.id];
			}

			this.deviceInitializationPromise[device.id] = this.initializePreviewForDevice(data, device);
			try {
				const payloads = await this.deviceInitializationPromise[device.id];
				return payloads;
			} finally {
				this.deviceInitializationPromise[device.id] = null;
			}
		});
	}

	private async initializePreviewForDevice(data: IPreviewAppLiveSyncData, device: Device): Promise<FilesPayload> {
		const filesToSyncMap: IDictionary<string[]> = {};
		const hmrData: { hash: string; fallbackFiles: IDictionary<string[]> } = {
			hash: "",
			fallbackFiles: {}
		};
		let promise = Promise.resolve<FilesPayload>(null);
		const startSyncFilesTimeout = async (platform: string) => {
			await promise
				.then(async () => {
					const projectData = this.$projectDataService.getProjectData(data.projectDir);
					const platformData = this.$platformsData.getPlatformData(platform, projectData);
					const currentHmrData = _.cloneDeep(hmrData);
					const filesToSync = _.cloneDeep(filesToSyncMap[platform]);
					promise = this.applyChanges(platformData, projectData, filesToSync, data.appFilesUpdaterOptions.useHotModuleReload);
					await promise;

					if (data.appFilesUpdaterOptions.useHotModuleReload && currentHmrData.hash) {
						const devices = _.filter(this.$previewSdkService.connectedDevices, { platform: platform.toLowerCase() });
						_.forEach(devices, async (previewDevice: Device) => {
							const status = await this.$hmrStatusService.awaitHmrStatus(previewDevice.id, currentHmrData.hash);
							if (status === HmrConstants.HMR_ERROR_STATUS) {
								await this.applyChanges(platformData, projectData, currentHmrData.fallbackFiles[platform], false);
							}
						});
					}
				});
			filesToSyncMap[platform] = [];
		};
		await this.$hooksService.executeBeforeHooks("preview-sync", {
			hookArgs: {
				projectData: this.$projectDataService.getProjectData(data.projectDir),
				hmrData,
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
		payloads.deviceId = device.id;
		return payloads;
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
				result = await this.applyChanges(platformData, projectData, files, data.appFilesUpdaterOptions.useHotModuleReload);
				this.$logger.info(`Successfully synced ${result.files.map(filePayload => filePayload.file.yellow)} for platform ${platform}.`);
			} else {
				const hmrMode = data.appFilesUpdaterOptions.useHotModuleReload ? 1 : 0;
				result = await this.getFilesPayload(platformData, projectData, hmrMode);
				this.$logger.info(`Successfully synced changes for platform ${platform}.`);
			}

			return result;
		} catch (err) {
			this.$logger.warn(`Unable to apply changes for platform ${platform}. Error is: ${err}, ${JSON.stringify(err, null, 2)}.`);
		}
	}

	private async applyChanges(platformData: IPlatformData, projectData: IProjectData, files: string[], useHotModuleReload: Boolean, deviceId?: string): Promise<FilesPayload> {
		const hmrMode = useHotModuleReload ? 1 : 0;
		const payloads = this.getFilesPayload(platformData, projectData, hmrMode, _(files).uniq().value(), deviceId);
		await this.$previewSdkService.applyChanges(payloads);

		return payloads;
	}

	private getFilesPayload(platformData: IPlatformData, projectData: IProjectData, hmrMode: number, files?: string[], deviceId?: string): FilesPayload {
		const platformsAppFolderPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);

		if (files && files.length) {
			files = files.map(file => this.$projectFilesProvider.mapFilePath(file, platformData.normalizedPlatformName, projectData));
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

		return { files: payloads, platform: platformData.normalizedPlatformName.toLowerCase(), hmrMode, deviceId};
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
