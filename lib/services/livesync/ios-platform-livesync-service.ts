import {PlatformLiveSyncServiceBase} from "./platform-livesync-service-base";

class IOSPlatformLiveSyncService extends PlatformLiveSyncServiceBase {
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

					if(installed) {
						afterSyncAction = () => device.applicationManager.tryStartApplication(deviceAppData.appIdentifier);
					} else {
						this.transferFiles(deviceAppData, localToDevicePaths, this.liveSyncData.projectFilesPath, true).wait();
						afterSyncAction = () => this.refreshApplication(deviceAppData, localToDevicePaths);
					}

					if (postAction) {
						return postAction(deviceAppData, localToDevicePaths);
					}

					return afterSyncAction();
				}).future<void>()();
			};
			this.$devicesService.execute(action, canExecute).wait();
		}).future<void>()();
	}

	protected getCanExecuteActionCore(platform: string, appIdentifier: string): (dev: Mobile.IDevice) => boolean {
		if (this.$options.emulator) {
			return (device: Mobile.IDevice): boolean => this.$devicesService.isiOSSimulator(device);
		} else {
			let devices = this.$devicesService.getDevicesForPlatform(platform);
			let simulator = _.find(devices, d => this.$devicesService.isiOSSimulator(d));
			if (simulator) {
				let iOSDevices = _.filter(devices, d => d.deviceInfo.identifier !== simulator.deviceInfo.identifier);
				if (iOSDevices && iOSDevices.length) {
					let isApplicationInstalledOnSimulator = simulator.applicationManager.isApplicationInstalled(appIdentifier).wait();
					let isApplicationInstalledOnAllDevices = _.intersection.apply(null, iOSDevices.map(device => device.applicationManager.isApplicationInstalled(appIdentifier).wait()));
					// In case the application is not installed on both device and simulator, syncs only on device.
					if (!isApplicationInstalledOnSimulator && !isApplicationInstalledOnAllDevices) {
						return (device: Mobile.IDevice): boolean => this.$devicesService.isiOSDevice(device);
					}
				}
			}
		}
	}
}

$injector.register("iosPlatformLiveSyncServiceLocator", {factory: IOSPlatformLiveSyncService});
