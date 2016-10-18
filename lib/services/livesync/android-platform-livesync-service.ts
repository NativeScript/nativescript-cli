import {PlatformLiveSyncServiceBase} from "./platform-livesync-service-base";

class AndroidPlatformLiveSyncService extends PlatformLiveSyncServiceBase {
	constructor(_liveSyncData: ILiveSyncData,
		protected $devicesService: Mobile.IDevicesService,
		protected $mobileHelper: Mobile.IMobileHelper,
		protected $logger: ILogger,
		protected $options: IOptions,
		protected $deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		protected $fs: IFileSystem,
		protected $injector: IInjector,
		protected $projectFilesManager: IProjectFilesManager,
		protected $projectFilesProvider: IProjectFilesProvider,
		protected $platformService: IPlatformService,
		protected $liveSyncProvider: ILiveSyncProvider) {
		super(_liveSyncData, $devicesService, $mobileHelper, $logger, $options, $deviceAppDataFactory, $fs, $injector, $projectFilesManager, $projectFilesProvider, $platformService, $liveSyncProvider);
	}

	public fullSync(postAction?: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): IFuture<void> {
		return (() => {
			let appIdentifier = this.liveSyncData.appIdentifier;
			let platform = this.liveSyncData.platform;
			let projectFilesPath = this.liveSyncData.projectFilesPath;
			let canExecute = this.getCanExecuteAction(platform, appIdentifier);
			let action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {
					let deviceLiveSyncService = this.resolveDeviceSpecificLiveSyncService(platform, device);
					let deviceAppData = this.$deviceAppDataFactory.create(appIdentifier, this.$mobileHelper.normalizePlatformName(platform), device);

					deviceLiveSyncService.beforeLiveSyncAction(deviceAppData).wait();;

					let installed = this.tryInstallApplication(device, deviceAppData).wait();
					let localToDevicePaths = this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, this.liveSyncData.excludedProjectDirsAndFiles);
					let afterSyncAction: () => IFuture<void>;

					if (installed) {
						deviceLiveSyncService.afterInstallApplicationAction(deviceAppData, localToDevicePaths).wait();
						afterSyncAction = () => device.applicationManager.tryStartApplication(deviceAppData.appIdentifier);
					} else {
						this.transferFiles(deviceAppData, localToDevicePaths, this.liveSyncData.projectFilesPath, true).wait();
						afterSyncAction = () => this.refreshApplication(deviceAppData, localToDevicePaths);
					}

					if (postAction) {
						this.finishLivesync(deviceAppData).wait();
						return postAction(deviceAppData, localToDevicePaths).wait();
					}

					afterSyncAction().wait();
					this.finishLivesync(deviceAppData).wait();
				}).future<void>()();
			};
			this.$devicesService.execute(action, canExecute).wait();
		}).future<void>()();
	}
}

$injector.register("androidPlatformLiveSyncServiceLocator", {factory: AndroidPlatformLiveSyncService});
