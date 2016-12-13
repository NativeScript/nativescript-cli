export class EmulatorSettingsService implements Mobile.IEmulatorSettingsService {
	private static REQURED_ANDROID_APILEVEL = 17;

	constructor(private $injector: IInjector) { }

	public canStart(platform: string): boolean {
		let platformService = this.$injector.resolve("platformService"); // this should be resolved here due to cyclic dependency

		let installedPlatforms = platformService.getInstalledPlatforms();
		return _.includes(installedPlatforms, platform.toLowerCase());
	}

	public get minVersion(): number {
		return EmulatorSettingsService.REQURED_ANDROID_APILEVEL;
	}
}
$injector.register("emulatorSettingsService", EmulatorSettingsService);
