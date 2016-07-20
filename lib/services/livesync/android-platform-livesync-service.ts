import {PlatformLiveSyncServiceBase} from "./platform-livesync-service-base";

class AndroidPlatformLiveSyncService extends PlatformLiveSyncServiceBase {
	constructor(_liveSyncData: ILiveSyncData,
		protected $devicesService: Mobile.IDevicesService,
		protected $mobileHelper: Mobile.IMobileHelper,
		protected $logger: ILogger,
		protected $options: ICommonOptions,
		protected $deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		protected $fs: IFileSystem,
		protected $injector: IInjector,
		protected $projectFilesManager: IProjectFilesManager,
		protected $projectFilesProvider: IProjectFilesProvider,
		protected $liveSyncProvider: ILiveSyncProvider) {
		super(_liveSyncData, $devicesService, $mobileHelper, $logger, $options, $deviceAppDataFactory, $fs, $injector, $projectFilesManager, $projectFilesProvider, $liveSyncProvider);
	}

	public fullSync(): IFuture<void> {
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

					if (installed) {
						deviceLiveSyncService.afterInstallApplicationAction(deviceAppData, localToDevicePaths).wait();

						device.applicationManager.tryStartApplication(deviceAppData.appIdentifier).wait();
					} else {
						this.transferFiles(deviceAppData, localToDevicePaths, this.liveSyncData.projectFilesPath, true).wait();
						this.refreshApplication(deviceAppData, localToDevicePaths, this.liveSyncData.forceExecuteFullSync).wait();
					}
				}).future<void>()();
			};
			this.$devicesService.execute(action, canExecute).wait();
		}).future<void>()();
	}

	protected getCanExecuteActionCore(platform: string, appIdentifier: string): (dev: Mobile.IDevice) => boolean {
		return (device: Mobile.IDevice) => true;
	}
}

$injector.register("androidPlatformLiveSyncServiceLocator", {factory: AndroidPlatformLiveSyncService});
