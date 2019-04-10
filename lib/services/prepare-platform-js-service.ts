import * as constants from "../constants";
import * as path from "path";
import * as temp from "temp";
import { hook } from "../common/helpers";
import { PreparePlatformService } from "./prepare-platform-service";
import { performanceLog } from "./../common/decorators";

temp.track();

export class PreparePlatformJSService extends PreparePlatformService implements IPreparePlatformService {

	constructor($fs: IFileSystem,
		$xmlValidator: IXmlValidator,
		$hooksService: IHooksService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService,
		private $packageManager: INodePackageManager) {
		super($fs, $hooksService, $xmlValidator);
	}

	public async addPlatform(info: IAddPlatformInfo): Promise<void> {
		const customTemplateOptions = await this.getPathToPlatformTemplate(info.platformTemplate, info.platformData.frameworkPackageName, info.projectData.projectDir);
		info.config.pathToTemplate = customTemplateOptions && customTemplateOptions.pathToTemplate;

		const frameworkPackageNameData: any = { version: info.installedVersion };
		if (customTemplateOptions) {
			frameworkPackageNameData.template = customTemplateOptions.selectedTemplate;
		}

		this.$projectDataService.setNSValue(info.projectData.projectDir, info.platformData.frameworkPackageName, frameworkPackageNameData);
	}

	@performanceLog()
	@hook('prepareJSApp')
	public async preparePlatform(config: IPreparePlatformJSInfo): Promise<void> {
		// intentionally left blank, keep the support for before-prepareJSApp and after-prepareJSApp hooks
	}

	private async getPathToPlatformTemplate(selectedTemplate: string, frameworkPackageName: string, projectDir: string): Promise<{ selectedTemplate: string, pathToTemplate: string }> {
		if (!selectedTemplate) {
			// read data from package.json's nativescript key
			// check the nativescript.tns-<platform>.template value
			const nativescriptPlatformData = this.$projectDataService.getNSValue(projectDir, frameworkPackageName);
			selectedTemplate = nativescriptPlatformData && nativescriptPlatformData.template;
		}

		if (selectedTemplate) {
			const tempDir = temp.mkdirSync("platform-template");
			this.$fs.writeJson(path.join(tempDir, constants.PACKAGE_JSON_FILE_NAME), {});
			try {
				const npmInstallResult = await this.$packageManager.install(selectedTemplate, tempDir, {
					disableNpmInstall: false,
					frameworkPath: null,
					ignoreScripts: false
				});
				const pathToTemplate = path.join(tempDir, constants.NODE_MODULES_FOLDER_NAME, npmInstallResult.name);
				return { selectedTemplate, pathToTemplate };
			} catch (err) {
				this.$logger.trace("Error while trying to install specified template: ", err);
				this.$errors.failWithoutHelp(`Unable to install platform template ${selectedTemplate}. Make sure the specified value is valid.`);
			}
		}

		return null;
	}
}

$injector.register("preparePlatformJSService", PreparePlatformJSService);
