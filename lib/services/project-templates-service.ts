import * as path from "path";
import * as temp from "temp";
import * as constants from "../constants";
temp.track();

export class ProjectTemplatesService implements IProjectTemplatesService {

	public constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $npm: INodePackageManager,
		private $npmInstallationManager: INpmInstallationManager,
		private $analyticsService: IAnalyticsService) { }

	public prepareTemplate(originalTemplateName: string, projectDir: string): IFuture<string> {
		return ((): string => {
			let templateName = originalTemplateName || constants.RESERVED_TEMPLATE_NAMES["default"],
				version: string = null;

			if (originalTemplateName) {
				// support <reserved_name>@<version> syntax
				let data = originalTemplateName.split("@"),
					name = data[0];

				version = data[1];

				templateName = constants.RESERVED_TEMPLATE_NAMES[name.toLowerCase()] || name;
			}

			this.$analyticsService.track("Template used for project creation", templateName).wait();

			const realTemplatePath = this.prepareNativeScriptTemplate(templateName, version, projectDir).wait();

			if (realTemplatePath) {
				//this removes dependencies from templates so they are not copied to app folder
				this.$fs.deleteDirectory(path.join(realTemplatePath, constants.NODE_MODULES_FOLDER_NAME));
				return realTemplatePath;
			}

			this.$errors.failWithoutHelp("Unable to find the template in temp directory. " +
				`Please open an issue at https://github.com/NativeScript/nativescript-cli/issues and send the output of the same command executed with --log trace.`);
		}).future<string>()();
	}

	/**
	 * Install verified NativeScript template in the npm cache.
	 * The "special" here is that npmInstallationManager will check current CLI version and will instal best matching version of the template.
	 * For example in case CLI is version 10.12.8, npmInstallationManager will try to find latest 10.12.x version of the template.
	 * @param {string} templateName The name of the verified NativeScript template.
	 * @param {string} version The version of the template specified by user.
	 * @return {string} Path to the directory where the template is installed.
	 */
	private prepareNativeScriptTemplate(templateName: string, version?: string, projectDir?: string): IFuture<string> {
		this.$logger.trace(`Using NativeScript verified template: ${templateName} with version ${version}.`);
		return this.$npmInstallationManager.install(templateName, projectDir, { version: version, dependencyType: "save" });
	}
}
$injector.register("projectTemplatesService", ProjectTemplatesService);
