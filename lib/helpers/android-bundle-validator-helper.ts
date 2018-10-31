import * as semver from "semver";
import * as util from "util";
import { AndroidBundleValidatorMessages, TNS_ANDROID_RUNTIME_NAME } from "../constants";

export class AndroidBundleValidatorHelper implements IAndroidBundleValidatorHelper {
	public static MIN_RUNTIME_VERSION = "5.0.0";

	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions,
		protected $projectDataService: IProjectDataService) {
	}

	public validateNoAab(): void {
		if (this.$options.aab) {
			this.$errors.fail(AndroidBundleValidatorMessages.AAB_NOT_SUPPORTED_BY_COMMNAND_MESSAGE);
		}
	}

	public validateRuntimeVersion(projectData: IProjectData): void {
		if (this.$options.aab) {
			const androidRuntimeInfo = this.$projectDataService.getNSValue(projectData.projectDir, TNS_ANDROID_RUNTIME_NAME);
			const androidRuntimeVersion = androidRuntimeInfo ? androidRuntimeInfo.version : "";

			if (androidRuntimeVersion) {
				const shouldSkipCheck = !semver.valid(androidRuntimeVersion) && !semver.validRange(androidRuntimeVersion);
				if (!shouldSkipCheck) {
					const isAndroidBundleSupported = semver.gte(semver.coerce(androidRuntimeVersion), semver.coerce(AndroidBundleValidatorHelper.MIN_RUNTIME_VERSION));
					if (!isAndroidBundleSupported) {
						this.$errors.failWithoutHelp(util.format(AndroidBundleValidatorMessages.RUNTIME_VERSION_TOO_LOW, AndroidBundleValidatorHelper.MIN_RUNTIME_VERSION));
					}
				}
			}
		}
	}
}

$injector.register("androidBundleValidatorHelper", AndroidBundleValidatorHelper);
