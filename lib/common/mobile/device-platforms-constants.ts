import { injector } from "../yok";

export class DevicePlatformsConstants
	implements Mobile.IDevicePlatformsConstants
{
	public iOS = "iOS";
	public Android = "Android";
	public visionOS = "visionOS";
	public Windows = "Windows";

	public isiOS(value: string) {
		return value.toLowerCase() === this.iOS.toLowerCase();
	}

	public isAndroid(value: string) {
		return value.toLowerCase() === this.Android.toLowerCase();
	}

	public isvisionOS(value: string) {
		return value.toLowerCase() === this.visionOS.toLowerCase();
	}

	public isWindows(value: string) {
		return value.toLowerCase() === this.Windows.toLowerCase();
	}
}
injector.register("devicePlatformsConstants", DevicePlatformsConstants);
