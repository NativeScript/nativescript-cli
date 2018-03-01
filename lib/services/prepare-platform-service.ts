import * as constants from "../constants";
import * as path from "path";
import { AppFilesUpdater } from "./app-files-updater";

export class PreparePlatformService {
	// Type with hooks needs to have either $hooksService or $injector injected.
	// In order to stop TypeScript from failing for not used $hooksService, use it here.
	private get _hooksService(): IHooksService {
		return this.$hooksService;
	}

	constructor(protected $fs: IFileSystem,
		private $hooksService: IHooksService,
		private $xmlValidator: IXmlValidator) {
	}

	protected async copyAppFiles(copyAppFilesData: ICopyAppFilesData): Promise<void> {
		copyAppFilesData.platformData.platformProjectService.ensureConfigurationFileInAppResources(copyAppFilesData.projectData);
		const appDestinationDirectoryPath = path.join(copyAppFilesData.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

		// Copy app folder to native project
		this.$fs.ensureDirectoryExists(appDestinationDirectoryPath);

		const appUpdater = new AppFilesUpdater(copyAppFilesData.projectData.appDirectoryPath, appDestinationDirectoryPath, copyAppFilesData.appFilesUpdaterOptions, this.$fs);
		const appUpdaterOptions: IUpdateAppOptions = {
			beforeCopyAction: sourceFiles => {
				this.$xmlValidator.validateXmlFiles(sourceFiles);
			},
			filesToRemove: copyAppFilesData.filesToRemove
		};
		// TODO: consider passing filesToSync in appUpdaterOptions
		// this would currently lead to the following problem: imagine changing two files rapidly one after the other (transpilation for example)
		// the first file would trigger the whole LiveSync process and the second will be queued
		// after the first LiveSync is done the .nsprepare file is written and the second file is later on wrongly assumed as having been prepared
		// because .nsprepare was written after both file changes
		appUpdater.updateApp(appUpdaterOptions, copyAppFilesData.projectData);
	}
}
