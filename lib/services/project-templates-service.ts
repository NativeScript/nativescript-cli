import * as path from "path";
import * as temp from "temp";
import * as constants from "../constants";
temp.track();

export class ProjectTemplatesService implements IProjectTemplatesService {

	public constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $npmInstallationManager: INpmInstallationManager) { }

	public async prepareTemplate(originalTemplateName: string, projectDir: string): Promise<string> {
		let realTemplatePath: string;
		// support <reserved_name>@<version> syntax
		let data = originalTemplateName.split("@"),
			name = data[0],
			version = data[1];

		if (constants.RESERVED_TEMPLATE_NAMES[name.toLowerCase()]) {
			realTemplatePath = await this.prepareNativeScriptTemplate(constants.RESERVED_TEMPLATE_NAMES[name.toLowerCase()], version, projectDir);
		} else {
			// Use the original template name, specified by user as it may be case-sensitive.
			realTemplatePath = await this.prepareNativeScriptTemplate(originalTemplateName, version, projectDir);
		}

		//this removes dependencies from templates so they are not copied to app folder
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
}
$injector.register("projectTemplatesService", ProjectTemplatesService);
