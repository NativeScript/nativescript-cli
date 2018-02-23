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
			filesToSync: copyAppFilesData.filesToSync,
			filesToRemove: copyAppFilesData.filesToRemove
		};
		appUpdater.updateApp(appUpdaterOptions, copyAppFilesData.projectData);
	}
}
