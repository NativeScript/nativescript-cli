import * as path from "path";
import * as temp from "temp";
import * as constants from "../constants";
import {EOL} from "os";
temp.track();

export class ProjectTemplatesService implements IProjectTemplatesService {
	private static RESERVED_TEMPLATE_NAMES: IStringDictionary = {
		"default": "tns-template-hello-world",
		"tsc": "tns-template-hello-world-ts",
		"typescript": "tns-template-hello-world-ts",
		"ng": "tns-template-hello-world-ng",
		"angular": "tns-template-hello-world-ng"
	};

	public constructor(private $errors: IErrors,
						private $fs: IFileSystem,
						private $logger: ILogger,
						private $npm: INodePackageManager,
						private $npmInstallationManager: INpmInstallationManager) { }

	public get defaultTemplatePath(): IFuture<string> {
		return this.prepareNativeScriptTemplate(ProjectTemplatesService.RESERVED_TEMPLATE_NAMES["default"]);
	}

	public prepareTemplate(originalTemplateName: string): IFuture<string> {
		return ((): string => {
			let realTemplatePath: string;
			if(originalTemplateName) {
				let templateName = originalTemplateName.toLowerCase();

				// support <reserved_name>@<version> syntax
				let [name, version] = templateName.split("@");
				if(ProjectTemplatesService.RESERVED_TEMPLATE_NAMES[name]) {
					realTemplatePath = this.prepareNativeScriptTemplate(ProjectTemplatesService.RESERVED_TEMPLATE_NAMES[name], version).wait();
				} else {
					let tempDir = temp.mkdirSync("nativescript-template-dir");
					try {
						// Use the original template name, specified by user as it may be case-sensitive.
						this.$npm.install(originalTemplateName, tempDir, {production: true, silent: true}).wait();
					} catch(err) {
						this.$logger.trace(err);
						this.$errors.failWithoutHelp(`Unable to use template ${originalTemplateName}. Make sure you've specified valid name, github URL or path to local dir.` +
													`${EOL}Error is: ${err.message}.`);
					}

					realTemplatePath = this.getTemplatePathFromTempDir(tempDir).wait();
				}
			} else {
				realTemplatePath = this.defaultTemplatePath.wait();
			}

			if(realTemplatePath) {
				this.$fs.deleteDirectory(path.join(realTemplatePath, constants.NODE_MODULES_FOLDER_NAME)).wait();
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
	private prepareNativeScriptTemplate(templateName: string, version?: string): IFuture<string> {
		this.$logger.trace(`Using NativeScript verified template: ${templateName} with version ${version}.`);
		return this.$npmInstallationManager.install(templateName, {version: version});
	}

	private getTemplatePathFromTempDir(tempDir: string): IFuture<string> {
		return ((): string => {
			let templatePath: string;
			let tempDirContents = this.$fs.readDirectory(tempDir).wait();
			this.$logger.trace(`TempDir contents: ${tempDirContents}.`);

			// We do not know the name of the package that will be installed, so after installation to temp dir,
			// there should be node_modules dir there and its only subdir should be our package.
			// In case there's some other dir instead of node_modules, consider it as our package.
			if(tempDirContents && tempDirContents.length === 1) {
				let tempDirSubdir = _.first(tempDirContents);
				if(tempDirSubdir === constants.NODE_MODULES_FOLDER_NAME) {
					let templateDirName = _.first(this.$fs.readDirectory(path.join(tempDir, constants.NODE_MODULES_FOLDER_NAME)).wait());
					if(templateDirName) {
						templatePath = path.join(tempDir, tempDirSubdir, templateDirName);
					}
				} else {
					templatePath = path.join(tempDir, tempDirSubdir);
				}
			}

			return templatePath;
		}).future<string>()();
	}
}
$injector.register("projectTemplatesService", ProjectTemplatesService);
