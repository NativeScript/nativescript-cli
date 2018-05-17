import * as path from "path";
import * as temp from "temp";
import * as constants from "../constants";
temp.track();

export class ProjectTemplatesService implements IProjectTemplatesService {

	public constructor(private $analyticsService: IAnalyticsService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $npmInstallationManager: INpmInstallationManager) { }

	public async prepareTemplate(originalTemplateName: string, projectDir: string): Promise<string> {
		// support <reserved_name>@<version> syntax
		const data = originalTemplateName.split("@"),
			name = data[0],
			version = data[1];

		const templateName = constants.RESERVED_TEMPLATE_NAMES[name.toLowerCase()] || name;

		const realTemplatePath = await this.prepareNativeScriptTemplate(templateName, version, projectDir);

		await this.$analyticsService.track("Template used for project creation", templateName);

		const templateNameToBeTracked = this.getTemplateNameToBeTracked(templateName, realTemplatePath);
		if (templateNameToBeTracked) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: constants.TrackActionNames.CreateProject,
				isForDevice: null,
				additionalData: templateNameToBeTracked
			});
		}

		// this removes dependencies from templates so they are not copied to app folder
		this.$fs.deleteDirectory(path.join(realTemplatePath, constants.NODE_MODULES_FOLDER_NAME));

		return realTemplatePath;
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
