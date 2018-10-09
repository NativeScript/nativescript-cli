import * as semver from "semver";
import * as util from "util";
import { BundleValidatorMessages } from "../constants";

export class BundleValidatorHelper implements IBundleValidatorHelper {
	private bundlersMap: IStringDictionary = {
		webpack: "nativescript-dev-webpack"
	};

	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions) {
		this.$projectData.initializeProjectData();
	}

	public validate(minSupportedVersion?: string): void {
		if (this.$options.bundle) {
			const bundlePluginName = this.bundlersMap[this.$options.bundle];
			const bundlerVersionInDependencies = this.$projectData.dependencies && this.$projectData.dependencies[bundlePluginName];
			const bundlerVersionInDevDependencies = this.$projectData.devDependencies && this.$projectData.devDependencies[bundlePluginName];
			if (!bundlePluginName || (!bundlerVersionInDependencies && !bundlerVersionInDevDependencies)) {
				this.$errors.fail(BundleValidatorMessages.MissingBundlePlugin);
			}

			if (minSupportedVersion) {
				const currentVersion = bundlerVersionInDependencies || bundlerVersionInDevDependencies;
				const shouldSkipCheck = !semver.valid(currentVersion) && !semver.validRange(currentVersion);
				if (!shouldSkipCheck) {
					const isBundleSupported = semver.gte(semver.coerce(currentVersion), semver.coerce(minSupportedVersion));
					if (!isBundleSupported) {
						this.$errors.failWithoutHelp(util.format(BundleValidatorMessages.NotSupportedVersion, minSupportedVersion));
					}
				}
			}
		}
	}
}

$injector.register("bundleValidatorHelper", BundleValidatorHelper);
