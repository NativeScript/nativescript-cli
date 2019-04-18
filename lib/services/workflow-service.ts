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

	public async handleLegacyWorkflow(projectDir: string, settings: IWebpackWorkflowSettings, skipWarnings?: boolean, force?: boolean): Promise<void> {
		if (!settings.bundle || force) {
			const projectData = this.$projectDataService.getProjectData(projectDir);
			if (typeof (projectData.useLegacyWorkflow) !== "boolean" || force) {
				const hasSwitched = await this.handleWebpackWorkflowSwitch(projectData, skipWarnings, force);
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
			} else if (!skipWarnings && projectData.useLegacyWorkflow === true) {
				this.showLegacyWorkflowWarning();
			} else if (!skipWarnings && projectData.useLegacyWorkflow === false) {
				this.showNoBundleWarning();
			}
		}
	}

	private async handleWebpackWorkflowSwitch(projectData: IProjectData, skipWarnings: boolean, force: boolean): Promise<boolean> {
		let hasSwitched = false;
		if (force || helpers.isInteractive()) {
			hasSwitched = force || await this.$prompter.confirm("Please use webpack!", () => true);
			if (hasSwitched) {
				this.$projectDataService.setUseLegacyWorkflow(projectData.projectDir, false);
				await this.ensureWebpackPluginInstalled(projectData);
			} else {
				this.$projectDataService.setUseLegacyWorkflow(projectData.projectDir, true);
			}
		} else if (!skipWarnings) {
			await this.showLegacyWorkflowWarning();
		}

		return hasSwitched;
	}

	private showLegacyWorkflowWarning() {
		this.$logger.warn("TODO: <Add a legacy workflow warning here>");
	}

	private showNoBundleWarning() {
		this.$logger.warn("TODO: <Add a `--no-bundle` workflow warning here>");
	}

	private async ensureWebpackPluginInstalled(projectData: IProjectData) {
		const hmrOutOfBetaWebpackPluginVersion = "0.21.0";
		const webpackPluginName = "nativescript-dev-webpack";
		const webpackConfigFileName = "webpack.config.js";
		const validWebpackPluginTags = ["*", "latest", "next", "rc"];

		let isInstalledVersionSupported = true;
		const installedVersion = this.$bundleValidatorHelper.getBundlerDependencyVersion(webpackPluginName);
		this.$logger.trace(`Updating to webpack workflow: Found ${webpackPluginName} v${installedVersion}`);
		if (validWebpackPluginTags.indexOf(installedVersion) === -1) {
			const isInstalledVersionValid = !!semver.valid(installedVersion) || !!semver.coerce(installedVersion);
			isInstalledVersionSupported =
				isInstalledVersionValid && semver.gte(semver.coerce(installedVersion), hmrOutOfBetaWebpackPluginVersion);
			this.$logger.trace(`Updating to webpack workflow: Is installed version valid?: ${isInstalledVersionValid}`);
		}

		this.$logger.trace(`Updating to webpack workflow: Is installed version supported?: ${isInstalledVersionSupported}`);
		if (!isInstalledVersionSupported) {
			const webpackConfigPath = path.join(projectData.projectDir, webpackConfigFileName);
			if (this.$fs.exists(webpackConfigPath)) {
				this.$logger.info(`<TODO: Add a webpack cofnig backup info here>`);
				this.$fs.rename(webpackConfigPath, `${webpackConfigPath}.bak`);
			}

			const installResult = await this.$packageManager.install(`${webpackPluginName}@latest`, projectData.projectDir, {
				'save-dev': true,
				'save-exact': true,
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts: false,
			});
			this.$logger.trace(`Updating to webpack workflow: The ${webpackPluginName} was updated to v${installResult.version}`);
		}
	}
}

$injector.register("workflowService", WorkflowService);
