export class BundleValidatorHelper implements IBundleValidatorHelper {
	private bundlersMap: IStringDictionary = {
		webpack: "nativescript-dev-webpack"
	};

	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions) {
		this.$projectData.initializeProjectData();
	}

	public validate(): void {
		if (this.$options.bundle) {
			const bundlePluginName = this.bundlersMap[this.$options.bundle];
			const hasBundlerPluginAsDependency = this.$projectData.dependencies && this.$projectData.dependencies[bundlePluginName];
			const hasBundlerPluginAsDevDependency = this.$projectData.devDependencies && this.$projectData.devDependencies[bundlePluginName];
			if (!bundlePluginName || (!hasBundlerPluginAsDependency && !hasBundlerPluginAsDevDependency)) {
				this.$errors.fail("Passing --bundle requires a bundling plugin. No bundling plugin found or the specified bundling plugin is invalid.");
			}
		}
	}
}

$injector.register("bundleValidatorHelper", BundleValidatorHelper);
