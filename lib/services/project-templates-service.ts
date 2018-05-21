import * as path from "path";
import * as temp from "temp";
import * as constants from "../constants";
import { format } from "util";
temp.track();

export class ProjectTemplatesService implements IProjectTemplatesService {

	public constructor(private $analyticsService: IAnalyticsService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $npmInstallationManager: INpmInstallationManager,
		private $errors: IErrors) { }

	public async prepareTemplate(originalTemplateName: string, projectDir: string): Promise<ITemplateData> {
		// support <reserved_name>@<version> syntax
		const data = originalTemplateName.split("@"),
			name = data[0],
			version = data[1];

		const templateName = constants.RESERVED_TEMPLATE_NAMES[name.toLowerCase()] || name;

		const templatePath = await this.prepareNativeScriptTemplate(templateName, version, projectDir);

		await this.$analyticsService.track("Template used for project creation", templateName);

		const templateNameToBeTracked = this.getTemplateNameToBeTracked(templateName, templatePath);
		const templateVersion = this.getTemplateVersion(templatePath);
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

		// this removes dependencies from templates so they are not copied to app folder
		this.$fs.deleteDirectory(path.join(templatePath, constants.NODE_MODULES_FOLDER_NAME));

		return { templatePath, templateVersion };
	}

	public getTemplateVersion(templatePath: string): string {
		this.$logger.trace(`Checking the NativeScript version of the template located at ${templatePath}.`);
		const pathToPackageJson = path.join(templatePath, constants.PACKAGE_JSON_FILE_NAME);
		if (this.$fs.exists(pathToPackageJson)) {
			const packageJsonContent = this.$fs.readJson(pathToPackageJson);
			const templateVersionFromPackageJson: string = packageJsonContent && packageJsonContent.nativescript && packageJsonContent.nativescript.templateVersion;

			if (templateVersionFromPackageJson) {
				this.$logger.trace(`The template ${templatePath} has version ${templateVersionFromPackageJson}.`);

				if (_.values(constants.TemplateVersions).indexOf(templateVersionFromPackageJson) === -1) {
					this.$errors.failWithoutHelp(format(constants.ProjectTemplateErrors.InvalidTemplateVersionStringFormat, templatePath, templateVersionFromPackageJson));
				}

				return templateVersionFromPackageJson;
			}
		}

		const defaultVersion = constants.TemplateVersions.v1;
		this.$logger.trace(`The template ${templatePath} does not specify version or we were unable to find out the version. Using default one ${defaultVersion}`);
		return defaultVersion;
	}

	/**
	 * Install verified NativeScript template in the npm cache.
	 * The "special" here is that npmInstallationManager will check current CLI version and will instal best matching version of the template.
	 * For example in case CLI is version 10.12.8, npmInstallationManager will try to find latest 10.12.x version of the template.
	 * @param {string} templateName The name of the verified NativeScript template.
	 * @param {string} version The version of the template specified by user.
	 * @return {string} Path to the directory where the template is installed.
	 */
	private async prepareNativeScriptTemplate(templateName: string, version?: string, projectDir?: string): Promise<string> {
		this.$logger.trace(`Using NativeScript verified template: ${templateName} with version ${version}.`);
		return this.$npmInstallationManager.install(templateName, projectDir, { version: version, dependencyType: "save" });
	}

	private getTemplateNameToBeTracked(templateName: string, realTemplatePath: string): string {
		try {
			if (this.$fs.exists(templateName)) {
				// local template is used
				const pathToPackageJson = path.join(realTemplatePath, constants.PACKAGE_JSON_FILE_NAME);
				let templateNameToTrack = path.basename(templateName);
				if (this.$fs.exists(pathToPackageJson)) {
					const templatePackageJsonContent = this.$fs.readJson(pathToPackageJson);
					templateNameToTrack = templatePackageJsonContent.name;
				}

				return `${constants.ANALYTICS_LOCAL_TEMPLATE_PREFIX}${templateNameToTrack}`;
			}

			return templateName;
		} catch (err) {
			this.$logger.trace(`Unable to get template name to be tracked, error is: ${err}`);
		}
	}
}
$injector.register("projectTemplatesService", ProjectTemplatesService);
