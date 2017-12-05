export abstract class BundleBase {
	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions) {
		this.$projectData.initializeProjectData();
	}

	protected validateBundling(): void {
		const bundlerPluginName = "nativescript-dev-webpack";
		if (!this.$projectData.devDependencies[bundlerPluginName] && !this.$projectData.dependencies[bundlerPluginName] && this.$options.bundle) {
			this.$errors.fail("Passing --bundle requires a bundling plugin.");
		}
	}
}
