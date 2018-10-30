import * as util from "util";
import { BundleValidatorMessages } from "../constants";
import { VersionValidatorHelper } from "./version-validator-helper";

export class BundleValidatorHelper extends VersionValidatorHelper implements IBundleValidatorHelper {
	private bundlersMap: IStringDictionary = {
		webpack: "nativescript-dev-webpack"
	};

	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions) {
		super();
		this.$projectData.initializeProjectData();
	}

	public validate(minSupportedVersion?: string): void {
		if (this.$options.bundle) {
			const bundlePluginName = this.bundlersMap[this.$options.bundle];
			const bundlerVersionInDependencies = this.$projectData.dependencies && this.$projectData.dependencies[bundlePluginName];
			const bundlerVersionInDevDependencies = this.$projectData.devDependencies && this.$projectData.devDependencies[bundlePluginName];
			if (!bundlePluginName || (!bundlerVersionInDependencies && !bundlerVersionInDevDependencies)) {
				this.$errors.failWithoutHelp(BundleValidatorMessages.MissingBundlePlugin);
			}

			const currentVersion = bundlerVersionInDependencies || bundlerVersionInDevDependencies;
			const shouldThrowError = minSupportedVersion && this.isValidVersion(currentVersion) && this.isVersionLowerThan(currentVersion, minSupportedVersion);
			if (shouldThrowError) {
					this.$errors.failWithoutHelp(util.format(BundleValidatorMessages.NotSupportedVersion, minSupportedVersion));
			}
		}
	}
}

$injector.register("bundleValidatorHelper", BundleValidatorHelper);
