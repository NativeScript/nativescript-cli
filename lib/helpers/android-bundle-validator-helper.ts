import * as util from "util";
import { AndroidBundleValidatorMessages, TNS_ANDROID_RUNTIME_NAME } from "../constants";
import { VersionValidatorHelper } from "./version-validator-helper";

export class AndroidBundleValidatorHelper extends VersionValidatorHelper implements IAndroidBundleValidatorHelper {
	public static MIN_RUNTIME_VERSION = "5.0.0";

	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions,
		protected $projectDataService: IProjectDataService) {
		super();
	}

	public validateNoAab(): void {
		if (this.$options.aab) {
			this.$errors.failWithHelp(AndroidBundleValidatorMessages.AAB_NOT_SUPPORTED_BY_COMMNAND_MESSAGE);
		}
	}

	public validateRuntimeVersion(projectData: IProjectData): void {
		if (this.$options.aab) {
			const androidRuntimeInfo = this.$projectDataService.getNSValue(projectData.projectDir, TNS_ANDROID_RUNTIME_NAME);
			const androidRuntimeVersion = androidRuntimeInfo ? androidRuntimeInfo.version : "";
			const shouldThrowError = androidRuntimeVersion &&
				this.isValidVersion(androidRuntimeVersion) &&
				this.isVersionLowerThan(androidRuntimeVersion, AndroidBundleValidatorHelper.MIN_RUNTIME_VERSION);

			if (shouldThrowError) {
				this.$errors.fail(util.format(AndroidBundleValidatorMessages.NOT_SUPPORTED_RUNTIME_VERSION, AndroidBundleValidatorHelper.MIN_RUNTIME_VERSION));
			}
		}
	}
}

$injector.register("androidBundleValidatorHelper", AndroidBundleValidatorHelper);
