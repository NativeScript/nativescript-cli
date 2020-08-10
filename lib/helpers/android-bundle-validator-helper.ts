import * as util from "util";
import { AndroidBundleValidatorMessages, PlatformTypes } from "../constants";
import { VersionValidatorHelper } from "./version-validator-helper";
import * as semver from "semver";
import { IProjectDataService, IProjectData } from "../definitions/project";
import { IOptions, IAndroidBundleValidatorHelper } from "../declarations";
import { IBuildData, IAndroidBuildData } from "../definitions/build";
import { IErrors } from "../common/declarations";
import { $injector } from "../common/definitions/yok";

export class AndroidBundleValidatorHelper extends VersionValidatorHelper implements IAndroidBundleValidatorHelper {
	public static MIN_RUNTIME_VERSION = "5.0.0";
	public static MIN_ANDROID_WITH_AAB_SUPPORT = "4.4.0";

	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions,
		protected $projectDataService: IProjectDataService,
		private $mobileHelper: Mobile.IMobileHelper) {
		super();
	}

	public validateNoAab(): void {
		if (this.$options.aab) {
			this.$errors.failWithHelp(AndroidBundleValidatorMessages.AAB_NOT_SUPPORTED_BY_COMMNAND_MESSAGE);
		}
	}

	public validateRuntimeVersion(projectData: IProjectData): void {
		if (this.$options.aab) {
      const runtimePackage = this.$projectDataService.getRuntimePackage(projectData.projectDir, PlatformTypes.android);
			const androidRuntimeVersion = runtimePackage ? runtimePackage.version : "";
			const shouldThrowError = androidRuntimeVersion &&
				this.isValidVersion(androidRuntimeVersion) &&
				this.isVersionLowerThan(androidRuntimeVersion, AndroidBundleValidatorHelper.MIN_RUNTIME_VERSION);

			if (shouldThrowError) {
				this.$errors.fail(util.format(AndroidBundleValidatorMessages.NOT_SUPPORTED_RUNTIME_VERSION, AndroidBundleValidatorHelper.MIN_RUNTIME_VERSION));
			}
		}
	}

	public validateDeviceApiLevel(device: Mobile.IDevice, buildData: IBuildData): void {
		if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
			const androidBuildData = <IAndroidBuildData>buildData;
			if (androidBuildData.androidBundle) {
				if (!!device.deviceInfo.version &&
					semver.lt(semver.coerce(device.deviceInfo.version), AndroidBundleValidatorHelper.MIN_ANDROID_WITH_AAB_SUPPORT)) {
					this.$errors.fail(util.format(
						AndroidBundleValidatorMessages.NOT_SUPPORTED_ANDROID_VERSION,
						device.deviceInfo.identifier,
						device.deviceInfo.version,
						AndroidBundleValidatorHelper.MIN_ANDROID_WITH_AAB_SUPPORT));
				}
			}
		}
	}
}

$injector.register("androidBundleValidatorHelper", AndroidBundleValidatorHelper);
