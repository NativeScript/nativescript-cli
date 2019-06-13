import * as util from "util";
import { BundleValidatorMessages } from "../constants";
import { VersionValidatorHelper } from "./version-validator-helper";
import { WEBPACK_PLUGIN_NAME } from "../constants";

export class BundleValidatorHelper extends VersionValidatorHelper implements IBundleValidatorHelper {
	private bundlersMap: IStringDictionary = {
		webpack: WEBPACK_PLUGIN_NAME
	};

	constructor(protected $errors: IErrors,
		protected $options: IOptions) {
		super();
	}

	public validate(projectData: IProjectData, minSupportedVersion?: string): void {
		const currentVersion = this.getBundlerDependencyVersion(projectData);
		if (!currentVersion) {
			this.$errors.failWithoutHelp(BundleValidatorMessages.MissingBundlePlugin);
		}

		const shouldThrowError = minSupportedVersion && this.isValidVersion(currentVersion) && this.isVersionLowerThan(currentVersion, minSupportedVersion);
		if (shouldThrowError) {
			this.$errors.failWithoutHelp(util.format(BundleValidatorMessages.NotSupportedVersion, minSupportedVersion));
		}
	}

	public getBundlerDependencyVersion(projectData: IProjectData, bundlerName?: string): string {
		let dependencyVersion = null;
		const bundlePluginName = bundlerName || this.bundlersMap[this.$options.bundle];
		const bundlerVersionInDependencies = projectData.dependencies && projectData.dependencies[bundlePluginName];
		const bundlerVersionInDevDependencies = projectData.devDependencies && projectData.devDependencies[bundlePluginName];
		dependencyVersion = bundlerVersionInDependencies || bundlerVersionInDevDependencies;

		return dependencyVersion;

	}
}

$injector.register("bundleValidatorHelper", BundleValidatorHelper);
