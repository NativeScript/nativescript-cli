import * as helpers from "../common/helpers";
import * as path from "path";
import * as semver from "semver";

export class WorkflowService implements IWorkflowService {
	constructor(private $bundleValidatorHelper: IBundleValidatorHelper,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $packageManager: INodePackageManager,
		private $projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		private $options: IOptions
	) {
	}

	public async handleLegacyWorkflow(projectDir: string, settings: IWebpackWorkflowSettings, force?: boolean): Promise<void> {
		if (!settings.bundle || force) {
			const projectData = this.$projectDataService.getProjectData(projectDir);
			if (projectData.useLegacyWorkflow === null || projectData.useLegacyWorkflow === undefined || force) {
				const hasSwitched = await this.handleWebpackWorkflowSwitch(projectData, force);
				if (hasSwitched) {
					this.$options.bundle = "webpack";
					this.$options.hmr = !settings.release;
					if (typeof (settings.bundle) === "boolean") {
						settings.bundle = true;
					} else {
						settings.bundle = this.$options.bundle;
					}
					settings.useHotModuleReload = this.$options.hmr;
				}
			} else if (projectData.useLegacyWorkflow === true) {
				this.showLegacyWorkflowWarning();
			} else {
				this.showNoBundleWarning();
			}
		}
	}

	private async handleWebpackWorkflowSwitch(projectData: IProjectData, force: boolean): Promise<boolean> {
		let hasSwitched = false;
		if (force || helpers.isInteractive()) {
			hasSwitched = force || await this.$prompter.confirm("Please use webpack!", () => true);
			if (hasSwitched) {
				this.$projectDataService.setUseLegacyWorkflow(projectData.projectDir, false);
				await this.ensureWebpackPluginInstalled(projectData);
			} else {
				this.$projectDataService.setUseLegacyWorkflow(projectData.projectDir, true);
				await this.showLegacyWorkflowWarning();
			}
		} else {
			await this.showLegacyWorkflowWarning();
		}

		return hasSwitched;
	}

	private async showLegacyWorkflowWarning() {
		this.$logger.warn("WARNINGGGGG LEGACY TRUE!!!");
	}

	private showNoBundleWarning() {
		this.$logger.warn("WARNINGGGGG NO BUNDLE!!!");
	}

	private async ensureWebpackPluginInstalled(projectData: IProjectData) {
		const hmrOutOfBetaWebpackPluginVersion = "0.21.0";
		const webpackPluginName = "nativescript-dev-webpack";
		const webpackConfigFileName = "webpack.config.js";
		const validWebpackPluginTags = ["*", "latest", "next", "rc"];

		let isInstalledVersionSupported = true;
		const installedVersion = this.$bundleValidatorHelper.getBundlerDependencyVersion(webpackPluginName);
		// TODO: use trace
		this.$logger.info(`Updating to webpack workflow: Found ${webpackPluginName} v${installedVersion}`);
		if (validWebpackPluginTags.indexOf(installedVersion) === -1) {
			const isInstalledVersionValid = !!semver.valid(installedVersion) || !!semver.coerce(installedVersion);
			isInstalledVersionSupported =
				isInstalledVersionValid && semver.gte(semver.coerce(installedVersion), hmrOutOfBetaWebpackPluginVersion);
			this.$logger.info(`Updating to webpack workflow: Is installedVersion valid: ${isInstalledVersionValid}`);
		}

		this.$logger.info(`Updating to webpack workflow: Is installedVersion supported: ${isInstalledVersionSupported}`);
		if (!isInstalledVersionSupported) {
			const webpackConfigPath = path.join(projectData.projectDir, webpackConfigFileName);
			if (this.$fs.exists(webpackConfigPath)) {
				this.$logger.info(`Your Webpack config was stored to .bak!!`);
				this.$fs.rename(webpackConfigPath, `${webpackConfigPath}.bak`);
			}

			const installResult = await this.$packageManager.install(`${webpackPluginName}@latest`, projectData.projectDir, {
				'save-dev': true,
				'save-exact': true,
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts: false,
			});
			this.$logger.info(`Updating to webpack workflow: The ${webpackPluginName} was updated to v${installResult.version}`);
		}
	}
}

$injector.register("workflowService", WorkflowService);
