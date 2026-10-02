import { injector } from "../yok";

export class DevicePlatformsConstants
	implements Mobile.IDevicePlatformsConstants
{
	public iOS = "iOS";
	public Android = "Android";
	public visionOS = "visionOS";
	// Not a runtime of its own: iOS rebuilt against the macOS SDK.
	public Catalyst = "Catalyst";

	public isiOS(value: string) {
		return value.toLowerCase() === this.iOS.toLowerCase();
	}

	public isAndroid(value: string) {
		return value.toLowerCase() === this.Android.toLowerCase();
	}

	public isvisionOS(value: string) {
		return value.toLowerCase() === this.visionOS.toLowerCase();
	}

	public isCatalyst(value: string) {
		return value.toLowerCase() === this.Catalyst.toLowerCase();
	}
}
injector.register("devicePlatformsConstants", DevicePlatformsConstants);
