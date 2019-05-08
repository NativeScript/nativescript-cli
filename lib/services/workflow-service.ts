import * as helpers from "../common/helpers";
import * as path from "path";
import * as semver from "semver";
import { EOL } from "os";
import { LoggerConfigData } from "../constants";

export class WorkflowService implements IWorkflowService {
	private legacyWorkflowDeprecationMessage = `With the upcoming NativeScript 6.0 the Webpack workflow will become the only way of building apps.
More info about the reasons for this change and how to migrate your project can be found in the link below:
<TODO: add link here>`;
	private webpackWorkflowConfirmMessage = `Do you want to switch your app to the Webpack workflow?`;

	constructor(private $bundleValidatorHelper: IBundleValidatorHelper,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $packageManager: INodePackageManager,
		private $projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		private $options: IOptions
	) {
	}

	public async handleLegacyWorkflow(options: IHandleLegacyWorkflowOptions): Promise<void> {
		const { projectDir, settings, skipWarnings, force } = options;
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
		let hasSwitched = force;
		if (force || helpers.isInteractive()) {
			if (!force) {
				this.$logger.info();
				this.$logger.printMarkdown(`
__Improve your project by switching to the Webpack workflow.__

\`${this.legacyWorkflowDeprecationMessage}\``);
				hasSwitched = await this.$prompter.confirm(this.webpackWorkflowConfirmMessage, () => true);
			}

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
		const legacyWorkflowWarning = `You are using the Legacy Workflow.${EOL}${EOL}${this.legacyWorkflowDeprecationMessage}`;

		this.$logger.warn(legacyWorkflowWarning, { [LoggerConfigData.wrapMessageWithBorders]: true });
	}

	private showNoBundleWarning() {
		const legacyWorkflowWarning = `You are using the '--no-bundle' flag which is switching to the Legacy Workflow.${EOL}${EOL}${this.legacyWorkflowDeprecationMessage}`;

		this.$logger.warn(legacyWorkflowWarning, { [LoggerConfigData.wrapMessageWithBorders]: true });
	}

	private async ensureWebpackPluginInstalled(projectData: IProjectData) {
		const hmrOutOfBetaWebpackPluginVersion = "0.21.0";
		const webpackPluginName = "nativescript-dev-webpack";
		const webpackConfigFileName = "webpack.config.js";
		const validWebpackPluginTags = ["*", "latest", "next", "rc"];

		let isInstalledVersionSupported = true;
		const installedVersion = this.$bundleValidatorHelper.getBundlerDependencyVersion(projectData, webpackPluginName);
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
				this.$fs.rename(webpackConfigPath, `${webpackConfigPath}.bak`);
				this.$logger.warn(`The 'nativescript-dev-webpack' plugin was updated and your '${webpackConfigFileName}' was replaced. You can find your old '${webpackConfigPath}' in '${webpackConfigPath}.bak'.`);
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
