export class DeviceAppDataFactory implements Mobile.IDeviceAppDataFactory {
	constructor(private $deviceAppDataProvider: Mobile.IDeviceAppDataProvider,
		private $injector: IInjector,
		private $options: ICommonOptions) { }

	create<T>(appIdentifier: string, platform: string, device: Mobile.IDevice, liveSyncOptions?: { isForCompanionApp: boolean }): T {
		const factoryRules = this.$deviceAppDataProvider.createFactoryRules();
		const isForCompanionApp = (liveSyncOptions && liveSyncOptions.isForCompanionApp) || this.$options.companion;
		const ctor = (<any>factoryRules[platform])[isForCompanionApp ? "companion" : "vanilla"];
		return this.$injector.resolve(ctor, { _appIdentifier: appIdentifier, device: device, platform: platform });
	}
}
$injector.register("deviceAppDataFactory", DeviceAppDataFactory);
