export abstract class BundleBase {
	private bundlersMap: IStringDictionary = {
		webpack: "nativescript-dev-webpack"
	};

	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions) {
		this.$projectData.initializeProjectData();
	}

	protected validateBundling(): void {
		if (this.$options.bundle) {
			const bundlePluginName = this.bundlersMap[this.$options.bundle];
			if (!bundlePluginName || (!this.$projectData.devDependencies[bundlePluginName] && !this.$projectData.dependencies[bundlePluginName])) {
				this.$errors.fail("Passing --bundle requires a bundling plugin. No bundling plugin found or the specified bundling plugin is invalid.");
			}
		}
	}
}
