export abstract class BundleBase {
	constructor(protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $options: IOptions) {
		this.$projectData.initializeProjectData();
	}

	protected validateBundling(): void {
		if (this.$options.bundle && !this.$projectData.devDependencies[this.$options.bundle] && !this.$projectData.dependencies[this.$options.bundle]) {
			this.$errors.fail("Passing --bundle requires a bundling plugin.");
		}
	}
}
