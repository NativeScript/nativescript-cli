import * as util from "util";
import { AndroidBundleValidatorMessages, TNS_ANDROID_RUNTIME_NAME, SCOPED_ANDROID_RUNTIME_NAME } from "../constants";
import { VersionValidatorHelper } from "./version-validator-helper";
import * as semver from "semver";

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
      let androidRuntimeInfo: any;
      if (projectData.isLegacy) {
        androidRuntimeInfo = this.$projectDataService.getNSValue(projectData.projectDir, TNS_ANDROID_RUNTIME_NAME);
      } else {
        androidRuntimeInfo = this.$projectDataService.getDevDependencyValue(projectData.projectDir, SCOPED_ANDROID_RUNTIME_NAME);
      }
			const androidRuntimeVersion = androidRuntimeInfo ? androidRuntimeInfo.version : "";
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
