import * as constants from "../constants";
import * as path from "path";
import * as shell from "shelljs";
import * as temp from "temp";
import { PreparePlatformService } from "./prepare-platform-service";

temp.track();

export class PreparePlatformJSService extends PreparePlatformService implements IPreparePlatformNativeService {

	constructor($fs: IFileSystem,
		$xmlValidator: IXmlValidator,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $npm: INodePackageManager) {
		super($fs, $xmlValidator);
	}

	public async addPlatform(platformData: IPlatformData, frameworkDir: string, installedVersion: string, projectData: IProjectData, config: IPlatformOptions, platformTemplate: string, ): Promise<void> {
		const customTemplateOptions = await this.getPathToPlatformTemplate(platformTemplate, platformData.frameworkPackageName, projectData.projectDir);
		config.pathToTemplate = customTemplateOptions && customTemplateOptions.pathToTemplate;

		const frameworkPackageNameData: any = { version: installedVersion };
		if (customTemplateOptions) {
			frameworkPackageNameData.template = customTemplateOptions.selectedTemplate;
		}

		this.$projectDataService.setNSValue(projectData.projectDir, platformData.frameworkPackageName, frameworkPackageNameData);
	}

	public async preparePlatform(platform: string, platformData: IPlatformData, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectData: IProjectData, platformSpecificData: IPlatformSpecificData, changesInfo?: IProjectChangesInfo, filesToSync?: Array<String>, projectFilesConfig?: IProjectFilesConfig): Promise<void> {
		if (!changesInfo || changesInfo.appFilesChanged) {
			await this.copyAppFiles(platformData, appFilesUpdaterOptions, projectData);

			// remove the App_Resources folder from the app/assets as here we're applying other files changes.
			const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			const appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
			if (this.$fs.exists(appResourcesDirectoryPath)) {
				this.$fs.deleteDirectory(appResourcesDirectoryPath);
			}
		}

		if (!changesInfo || changesInfo.modulesChanged) {
			await this.copyTnsModules(platform, platformData, projectData, projectFilesConfig);
		}
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
				const npmInstallResult = await this.$npm.install(selectedTemplate, tempDir, {
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

	private async copyTnsModules(platform: string, platformData: IPlatformData, projectData: IProjectData, projectFilesConfig?: IProjectFilesConfig): Promise<void> {
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;

		try {
			const tnsModulesDestinationPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
			// Process node_modules folder
			await this.$nodeModulesBuilder.prepareJSNodeModules(tnsModulesDestinationPath, platform, lastModifiedTime, projectData, projectFilesConfig);
		} catch (error) {
			this.$logger.debug(error);
			shell.rm("-rf", appDestinationDirectoryPath);
			this.$errors.failWithoutHelp(`Processing node_modules failed. ${error}`);
		}
	}
}

$injector.register("preparePlatformJSService", PreparePlatformJSService);
