import { $injector } from "../definitions/yok";

export class DevicePlatformsConstants implements Mobile.IDevicePlatformsConstants {
	public iOS = "iOS";
	public Android = "Android";
}
$injector.register("devicePlatformsConstants", DevicePlatformsConstants);
