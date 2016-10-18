import {PlatformLiveSyncServiceBase} from "./platform-livesync-service-base";

class IOSPlatformLiveSyncService extends PlatformLiveSyncServiceBase {
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
					let deviceAppData = this.$deviceAppDataFactory.create(appIdentifier, this.$mobileHelper.normalizePlatformName(platform), device);
					let installed = this.tryInstallApplication(device, deviceAppData).wait();
					let localToDevicePaths = this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, this.liveSyncData.excludedProjectDirsAndFiles);
					let afterSyncAction: () => IFuture<void>;

					this.transferFiles(deviceAppData, localToDevicePaths, this.liveSyncData.projectFilesPath, true).wait();

					if(installed) {
						afterSyncAction = () => device.applicationManager.tryStartApplication(deviceAppData.appIdentifier);
					} else {
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

$injector.register("iosPlatformLiveSyncServiceLocator", {factory: IOSPlatformLiveSyncService});
