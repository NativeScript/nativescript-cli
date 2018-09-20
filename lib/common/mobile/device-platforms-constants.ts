export class DevicePlatformsConstants implements Mobile.IDevicePlatformsConstants {
	public iOS = "iOS";
	public Android = "Android";
	public WP8 = "WP8";
}
$injector.register("devicePlatformsConstants", DevicePlatformsConstants);
