export class EmulatorSettingsService implements Mobile.IEmulatorSettingsService {
	private static REQURED_ANDROID_APILEVEL = 17;

	constructor(private $injector: IInjector) { }

	public canStart(platform: string): IFuture<boolean> {
		return (() => {
			let platformService = this.$injector.resolve("platformService"); // this should be resolved here due to cyclic dependency

			let installedPlatforms = platformService.getInstalledPlatforms().wait();
			return _.contains(installedPlatforms, platform.toLowerCase());
		}).future<boolean>()();
	}

	public get minVersion(): number {
		return EmulatorSettingsService.REQURED_ANDROID_APILEVEL;
	}
}
$injector.register("emulatorSettingsService", EmulatorSettingsService);
