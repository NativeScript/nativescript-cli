export abstract class AppBuilderLiveSyncProviderBase implements ILiveSyncProvider {
	constructor(private $androidLiveSyncServiceLocator: { factory: Function },
		private $iosLiveSyncServiceLocator: { factory: Function }) { }

	public get deviceSpecificLiveSyncServices(): IDictionary<any> {
		return {
			android: (_device: Mobile.IDevice, $injector: IInjector): IDeviceLiveSyncService => {
				return $injector.resolve(this.$androidLiveSyncServiceLocator.factory, { _device: _device });
			},
			ios: (_device: Mobile.IDevice, $injector: IInjector): IDeviceLiveSyncService => {
				return $injector.resolve(this.$iosLiveSyncServiceLocator.factory, { _device: _device });
			}
		};
	}

	public abstract buildForDevice(device: Mobile.IDevice): Promise<string>;

	public preparePlatformForSync(platform: string): Promise<void> {
		return;
	}

	public canExecuteFastSync(filePath: string): boolean {
		return false;
	}

	public async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): Promise<void> {
		await deviceAppData.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
	}

}
