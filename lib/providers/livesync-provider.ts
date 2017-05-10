import * as path from "path";
import * as temp from "temp";
import { TNS_MODULES_FOLDER_NAME } from "../constants";

export class LiveSyncProvider implements ILiveSyncProvider {
	constructor(private $androidLiveSyncServiceLocator: { factory: Function },
		private $iosLiveSyncServiceLocator: { factory: Function },
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $logger: ILogger,
		private $options: IOptions,
		private $mobileHelper: Mobile.IMobileHelper,
		private $fs: IFileSystem) { }

	private static FAST_SYNC_FILE_EXTENSIONS = [".css", ".xml", ".html"];

	private deviceSpecificLiveSyncServicesCache: IDictionary<any> = {};
	public get deviceSpecificLiveSyncServices(): IDictionary<any> {
		return {
			android: (_device: Mobile.IDevice, $injector: IInjector) => {
				if (!this.deviceSpecificLiveSyncServicesCache[_device.deviceInfo.identifier]) {
					this.deviceSpecificLiveSyncServicesCache[_device.deviceInfo.identifier] = $injector.resolve(this.$androidLiveSyncServiceLocator.factory, { _device: _device });
				}

				return this.deviceSpecificLiveSyncServicesCache[_device.deviceInfo.identifier];
			},
			ios: (_device: Mobile.IDevice, $injector: IInjector) => {
				if (!this.deviceSpecificLiveSyncServicesCache[_device.deviceInfo.identifier]) {
					this.deviceSpecificLiveSyncServicesCache[_device.deviceInfo.identifier] = $injector.resolve(this.$iosLiveSyncServiceLocator.factory, { _device: _device });
				}

				return this.deviceSpecificLiveSyncServicesCache[_device.deviceInfo.identifier];
			}
		};
	}

	public async buildForDevice(device: Mobile.IDevice, projectData: IProjectData): Promise<string> {
		let buildConfig: IBuildConfig = {
			buildForDevice: !device.isEmulator,
			projectDir: this.$options.path,
			release: this.$options.release,
			teamId: this.$options.teamId,
			device: this.$options.device,
			provision: this.$options.provision,
		};

		await this.$platformService.buildPlatform(device.deviceInfo.platform, buildConfig, projectData);
		let platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		if (device.isEmulator) {
			return this.$platformService.getLatestApplicationPackageForEmulator(platformData, buildConfig).packageName;
		}

		return this.$platformService.getLatestApplicationPackageForDevice(platformData, buildConfig).packageName;
	}

	public async preparePlatformForSync(platform: string, provision: any, projectData: IProjectData): Promise<void> {
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
		await this.$platformService.preparePlatform(platform, appFilesUpdaterOptions, this.$options.platformTemplate, projectData, this.$options);
	}

	public canExecuteFastSync(filePath: string, projectData: IProjectData, platform: string): boolean {
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		let fastSyncFileExtensions = LiveSyncProvider.FAST_SYNC_FILE_EXTENSIONS.concat(platformData.fastLivesyncFileExtensions);
		return _.includes(fastSyncFileExtensions, path.extname(filePath));
	}

	public async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): Promise<void> {
		if (this.$mobileHelper.isAndroidPlatform(deviceAppData.platform) || !deviceAppData.deviceSyncZipPath || !isFullSync) {
			await deviceAppData.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
		} else {
			temp.track();
			let tempZip = temp.path({ prefix: "sync", suffix: ".zip" });
			let tempApp = temp.mkdirSync("app");
			this.$logger.trace("Creating zip file: " + tempZip);
			this.$fs.copyFile(path.join(path.dirname(projectFilesPath), "app/*"), tempApp);

			if (!this.$options.syncAllFiles) {
				this.$logger.info("Skipping node_modules folder! Use the syncAllFiles option to sync files from this folder.");
				this.$fs.deleteDirectory(path.join(tempApp, TNS_MODULES_FOLDER_NAME));
			}

			await this.$fs.zipFiles(tempZip, this.$fs.enumerateFilesInDirectorySync(tempApp), (res) => {
				return path.join("app", path.relative(tempApp, res));
			});

			await deviceAppData.device.fileSystem.transferFiles(deviceAppData, [{
				getLocalPath: () => tempZip,
				getDevicePath: () => deviceAppData.deviceSyncZipPath,
				getRelativeToProjectBasePath: () => "../sync.zip",
				deviceProjectRootPath: await deviceAppData.getDeviceProjectRootPath()
			}]);
		}
	}
}
$injector.register("liveSyncProvider", LiveSyncProvider);
