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
			const hasBundlerPluginAsDependency = this.$projectData.dependencies && this.$projectData.dependencies[bundlePluginName];
			const hasBundlerPluginAsDevDependency = this.$projectData.devDependencies && this.$projectData.devDependencies[bundlePluginName];
			if (!bundlePluginName || (!hasBundlerPluginAsDependency && !hasBundlerPluginAsDevDependency)) {
				this.$errors.fail(BundleValidatorMessages.MissingBundlePlugin);
			}

			if (minSupportedVersion) {
				const currentVersion = hasBundlerPluginAsDependency || hasBundlerPluginAsDevDependency;
				const isBundleSupported = semver.gte(semver.coerce(currentVersion), semver.coerce(minSupportedVersion));
				if (!isBundleSupported) {
					this.$errors.fail(util.format(BundleValidatorMessages.NotSupportedVersion, minSupportedVersion));
				}
			}
		}
	}
}

$injector.register("bundleValidatorHelper", BundleValidatorHelper);
