import { injector } from "../yok";

export class DevicePlatformsConstants
	implements Mobile.IDevicePlatformsConstants
{
	public iOS = "iOS";
	public Android = "Android";
	public visionOS = "visionOS";
	public macOS = "macOS";

	public isiOS(value: string) {
		return value.toLowerCase() === this.iOS.toLowerCase();
	}

	public isAndroid(value: string) {
		return value.toLowerCase() === this.Android.toLowerCase();
	}

	public isvisionOS(value: string) {
		return value.toLowerCase() === this.visionOS.toLowerCase();
	}

	public ismacOS(value: string) {
		return value.toLowerCase() === this.macOS.toLowerCase();
	}
}
injector.register("devicePlatformsConstants", DevicePlatformsConstants);
