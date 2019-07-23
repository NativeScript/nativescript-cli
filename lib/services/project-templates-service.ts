import * as path from "path";
import * as temp from "temp";
import * as constants from "../constants";
import { format } from "util";
import { performanceLog } from "../common/decorators";
temp.track();

export class ProjectTemplatesService implements IProjectTemplatesService {
	private templatePackageContents: IDictionary<any> = {};

	public constructor(private $analyticsService: IAnalyticsService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $packageInstallationManager: IPackageInstallationManager,
		private $pacoteService: IPacoteService,
		private $errors: IErrors,
		private $packageManager: INodePackageManager) { }

	@performanceLog()
	public async prepareTemplate(templateValue: string, projectDir: string): Promise<ITemplateData> {
		if (!templateValue) {
			templateValue = constants.RESERVED_TEMPLATE_NAMES["default"];
		}

		const templateNameParts = await this.$packageManager.getPackageNameParts(templateValue);
		templateValue = constants.RESERVED_TEMPLATE_NAMES[templateNameParts.name] || templateNameParts.name;

		const version = templateNameParts.version || await this.$packageInstallationManager.getLatestCompatibleVersionSafe(templateValue);
		const fullTemplateName = await this.$packageManager.getPackageFullName({ name: templateValue, version: version });

		const templatePackageJsonContent = await this.getTemplatePackageJsonContent(fullTemplateName);
		const templateVersion = await this.getTemplateVersion(fullTemplateName);

		let templatePath = null;
		if (templateVersion === constants.TemplateVersions.v1) {
			templatePath = await this.prepareNativeScriptTemplate(templateValue, version, projectDir);
			// this removes dependencies from templates so they are not copied to app folder
			this.$fs.deleteDirectory(path.join(templatePath, constants.NODE_MODULES_FOLDER_NAME));
		}

		const templateNameToBeTracked = this.getTemplateNameToBeTracked(templateValue, templatePackageJsonContent);
		if (templateNameToBeTracked) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: constants.TrackActionNames.CreateProject,
				isForDevice: null,
				additionalData: templateNameToBeTracked
			});

			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: constants.TrackActionNames.UsingTemplate,
				additionalData: `${templateNameToBeTracked}${constants.AnalyticsEventLabelDelimiter}${templateVersion}`
			});
		}

		return { templateName: templateValue, templatePath, templateVersion, templatePackageJsonContent, version };
	}

	private async getTemplateVersion(templateName: string): Promise<string> {
		const packageJsonContent = await this.getTemplatePackageJsonContent(templateName);
		const templateVersionFromPackageJson: string = packageJsonContent && packageJsonContent.nativescript && packageJsonContent.nativescript.templateVersion;
		if (templateVersionFromPackageJson) {
			this.$logger.trace(`The template ${templateName} has version ${templateVersionFromPackageJson}.`);

			if (_.values(constants.TemplateVersions).indexOf(templateVersionFromPackageJson) === -1) {
				this.$errors.fail(format(constants.ProjectTemplateErrors.InvalidTemplateVersionStringFormat, templateName, templateVersionFromPackageJson));
			}

			return templateVersionFromPackageJson;
		}

		return constants.TemplateVersions.v1;
	}

	private async getTemplatePackageJsonContent(templateName: string): Promise<ITemplatePackageJsonContent> {
		if (!this.templatePackageContents[templateName]) {
			this.templatePackageContents[templateName] = await this.$pacoteService.manifest(templateName, { fullMetadata: true });
		}

		return this.templatePackageContents[templateName];
	}

	/**
	 * Install verified NativeScript template in the npm cache.
	 * The "special" here is that packageInstallationManager will check current CLI version and will instal best matching version of the template.
	 * For example in case CLI is version 10.12.8, packageInstallationManager will try to find latest 10.12.x version of the template.
	 * @param {string} templateName The name of the verified NativeScript template.
	 * @param {string} version The version of the template specified by user.
	 * @return {string} Path to the directory where the template is installed.
	 */
	private async prepareNativeScriptTemplate(templateName: string, version?: string, projectDir?: string): Promise<string> {
		this.$logger.trace(`Using NativeScript verified template: ${templateName} with version ${version}.`);
		return this.$packageInstallationManager.install(templateName, projectDir, { version: version, dependencyType: "save" });
	}

	private getTemplateNameToBeTracked(templateName: string, packageJsonContent: any): string {
		try {
			if (this.$fs.exists(templateName)) {
				const templateNameToBeTracked = (packageJsonContent && packageJsonContent.name) || path.basename(templateName);
				return `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateNameToBeTracked}`;
			}

			return templateName;
		} catch (err) {
			this.$logger.trace(`Unable to get template name to be tracked, error is: ${err}`);
		}
	}
}
$injector.register("projectTemplatesService", ProjectTemplatesService);
