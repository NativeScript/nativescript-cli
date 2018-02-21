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
		const appSourceDirectoryPath = path.join(copyAppFilesData.projectData.projectDir, constants.APP_FOLDER_NAME);

		const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, copyAppFilesData.appFilesUpdaterOptions, this.$fs);
		appUpdater.updateApp(sourceFiles => {
			this.$xmlValidator.validateXmlFiles(sourceFiles);
		}, copyAppFilesData.projectData, copyAppFilesData.filesToSync);
	}
}
