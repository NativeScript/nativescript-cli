export abstract class LiveSyncServiceBase<T extends Mobile.IDevice> {
	protected get device(): T {
		return <T>(this._device);
	}

	constructor(private _device: Mobile.IDevice) { }

	public refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], canExecuteFastSync?: boolean): IFuture<void> {
		if (canExecuteFastSync) {
			return this.reloadPage(deviceAppData);
		}

		return this.restartApplication(deviceAppData);
	}

	protected abstract restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void>;
	protected abstract reloadPage(deviceAppData: Mobile.IDeviceAppData): IFuture<void>;
}
