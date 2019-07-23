import * as helpers from "../helpers";
import * as shell from "shelljs";
import * as temp from "temp";

export class MobileHelper implements Mobile.IMobileHelper {
	private static DEVICE_PATH_SEPARATOR = "/";

	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	public get platformNames(): string[] {
		return [this.$devicePlatformsConstants.iOS, this.$devicePlatformsConstants.Android];
	}

	public isAndroidPlatform(platform: string): boolean {
		return !!(platform && (this.$devicePlatformsConstants.Android.toLowerCase() === platform.toLowerCase()));
	}

	public isiOSPlatform(platform: string): boolean {
		return !!(platform && (this.$devicePlatformsConstants.iOS.toLowerCase() === platform.toLowerCase()));
	}

	public normalizePlatformName(platform: string): string {
		if (this.isAndroidPlatform(platform)) {
			return "Android";
		} else if (this.isiOSPlatform(platform)) {
			return "iOS";
		}

		return undefined;
	}

	public validatePlatformName(platform: string): string {
		if (!platform) {
			this.$errors.failWithHelp("No device platform specified.");
		}

		const normalizedPlatform = this.normalizePlatformName(platform);
		if (!normalizedPlatform || !_.includes(this.platformNames, normalizedPlatform)) {
			this.$errors.fail("'%s' is not a valid device platform. Valid platforms are %s.",
				platform, helpers.formatListOfNames(this.platformNames));
		}

		return normalizedPlatform;
	}

	public buildDevicePath(...args: string[]): string {
		return this.correctDevicePath(args.join(MobileHelper.DEVICE_PATH_SEPARATOR));
	}

	public correctDevicePath(filePath: string): string {
		return helpers.stringReplaceAll(filePath, '\\', '/');
	}

	public isiOSTablet(deviceName: string): boolean {
		return deviceName && deviceName.toLowerCase().indexOf("ipad") !== -1;
	}

	public async getDeviceFileContent(device: Mobile.IDevice, deviceFilePath: string, projectData: IProjectData): Promise<string> {
		temp.track();
		const uniqueFilePath = temp.path({ suffix: ".tmp" });
		const platform = device.deviceInfo.platform.toLowerCase();
		try {
			await device.fileSystem.getFile(deviceFilePath, projectData.projectIdentifiers[platform], uniqueFilePath);
		} catch (e) {
			return null;
		}

		if (this.$fs.exists(uniqueFilePath)) {
			const text = this.$fs.readText(uniqueFilePath);
			shell.rm(uniqueFilePath);
			return text;
		}

		return null;
	}
}
$injector.register("mobileHelper", MobileHelper);
