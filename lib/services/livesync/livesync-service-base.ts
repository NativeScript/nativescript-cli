export abstract class LiveSyncServiceBase<T extends Mobile.IDevice> {
	protected get device(): T {
		return <T>(this._device);
	}

	constructor(private _device: Mobile.IDevice,
		private $liveSyncProvider: ILiveSyncProvider) { }

	public refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], forceExecuteFullSync: boolean): IFuture<void> {
		let canExecuteFastSync = !forceExecuteFullSync && localToDevicePaths &&
			_.all(localToDevicePaths, localToDevicePath => this.$liveSyncProvider.canExecuteFastSync(localToDevicePath.getLocalPath(), deviceAppData.platform));
		if (canExecuteFastSync) {
			return this.reloadPage(deviceAppData);
		}

		return this.restartApplication(deviceAppData);
	}

	protected abstract restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void>;
	protected abstract reloadPage(deviceAppData: Mobile.IDeviceAppData): IFuture<void>;
}
