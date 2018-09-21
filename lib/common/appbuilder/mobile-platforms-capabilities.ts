export class MobilePlatformsCapabilities implements Mobile.IPlatformsCapabilities {
	private platformCapabilities: IDictionary<Mobile.IPlatformCapabilities>;

	public getPlatformNames(): string[] {
		return _.keys(this.getAllCapabilities());
	}

	public getAllCapabilities(): IDictionary<Mobile.IPlatformCapabilities> {
		this.platformCapabilities = this.platformCapabilities || {
			iOS: {
				wirelessDeploy: true,
				cableDeploy: true,
				companion: true,
				hostPlatformsForDeploy: ["win32", "darwin"]
			},
			Android: {
				wirelessDeploy: true,
				cableDeploy: true,
				companion: true,
				hostPlatformsForDeploy: ["win32", "darwin", "linux"]
			},
			WP8: {
				wirelessDeploy: true,
				cableDeploy: false,
				companion: true,
				hostPlatformsForDeploy: ["win32"]
			}
		};

		return this.platformCapabilities;
	}
}
$injector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
