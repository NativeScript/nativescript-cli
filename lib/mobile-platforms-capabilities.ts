export class MobilePlatformsCapabilities implements Mobile.IPlatformsCapabilities {
	private platformCapabilities: IDictionary<Mobile.IPlatformCapabilities>;

	constructor(private $errors: IErrors) { }

	public getPlatformNames(): string[]{
		return _.keys(this.getAllCapabilities());
	}

	public getAllCapabilities(): IDictionary<Mobile.IPlatformCapabilities> {
		this.platformCapabilities = this.platformCapabilities || {
			iOS: {
				wirelessDeploy: false,
				cableDeploy: true,
				companion: false,
				hostPlatformsForDeploy: ["darwin"]
			},
			Android: {
				wirelessDeploy: false,
				cableDeploy: true,
				companion: false,
				hostPlatformsForDeploy: ["win32", "darwin", "linux"]
			}
		};

		return this.platformCapabilities;
	}
}
$injector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
