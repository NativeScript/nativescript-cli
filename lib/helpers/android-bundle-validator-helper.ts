import { AAB_NOT_SUPPORTED_BY_COMMNAND_MESSAGE } from "../constants";

export class AndroidBundleValidatorHelper implements IAndroidBundleValidatorHelper {
	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions) {
	}

	public validateNoAab(minSupportedVersion?: string): void {
		if(this.$options.aab) {
			this.$errors.fail(AAB_NOT_SUPPORTED_BY_COMMNAND_MESSAGE);
		}
	}
}

$injector.register("androidBundleValidatorHelper", AndroidBundleValidatorHelper);
