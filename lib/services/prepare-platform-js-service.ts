import * as constants from "../constants";
import * as path from "path";
import * as shell from "shelljs";
import * as temp from "temp";
import { hook } from "../common/helpers";
import { PreparePlatformService } from "./prepare-platform-service";
import { TNS_CORE_MODULES } from "../common/constants";

temp.track();

export class PreparePlatformJSService extends PreparePlatformService implements IPreparePlatformService {

	constructor($fs: IFileSystem,
		$xmlValidator: IXmlValidator,
		$hooksService: IHooksService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $npm: INodePackageManager) {
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

	@hook('prepareJSApp')
	public async preparePlatform(config: IPreparePlatformJSInfo): Promise<void> {
		if (!config.changesInfo || config.changesInfo.appFilesChanged || config.changesInfo.changesRequirePrepare) {
			await this.copyAppFiles(config);
			if (!config.skipCopyAppResourcesFiles) {
				this.copyAppResourcesFiles(config);
			}
		}

		if (!config.skipCopyAppResourcesFiles && !this.$fs.exists(path.join(config.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME))) {
			this.copyAppResourcesFiles(config);
		}

		if (config.changesInfo && !config.changesInfo.changesRequirePrepare) {
			// remove the App_Resources folder from the app/assets as here we're applying other files changes.
			const appDestinationDirectoryPath = path.join(config.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			const appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, path.basename(config.projectData.appResourcesDirectoryPath));
			if (this.$fs.exists(appResourcesDirectoryPath)) {
				this.$fs.deleteDirectory(appResourcesDirectoryPath);
			}
		}

		if (!config.changesInfo || config.changesInfo.modulesChanged) {
			if (!config.skipCopyTnsModules) {
				await this.copyTnsModules(config.platform, config.platformData, config.projectData, config.appFilesUpdaterOptions, config.projectFilesConfig);
			}
		}

		if (!config.skipCopyTnsModules && !this.$fs.exists(path.join(config.platformData.appDestinationDirectoryPath, TNS_CORE_MODULES))) {
			await this.copyTnsModules(config.platform, config.platformData, config.projectData, config.appFilesUpdaterOptions, config.projectFilesConfig);
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

	private async copyTnsModules(platform: string, platformData: IPlatformData, projectData: IProjectData, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectFilesConfig?: IProjectFilesConfig): Promise<void> {
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;

		try {
			const absoluteOutputPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
			// Process node_modules folder
			await this.$nodeModulesBuilder.prepareJSNodeModules({
				absoluteOutputPath,
				platform,
				lastModifiedTime,
				projectData,
				appFilesUpdaterOptions,
				projectFilesConfig
			});
		} catch (error) {
			this.$logger.debug(error);
			shell.rm("-rf", appDestinationDirectoryPath);
			this.$errors.failWithoutHelp(`Processing node_modules failed. ${error}`);
		}
	}

	private copyAppResourcesFiles(config: IPreparePlatformJSInfo): void {
		const appDestinationDirectoryPath = path.join(config.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const appResourcesSourcePath = config.projectData.appResourcesDirectoryPath;

		shell.cp("-Rf", appResourcesSourcePath, path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME));
	}
}

$injector.register("preparePlatformJSService", PreparePlatformJSService);
