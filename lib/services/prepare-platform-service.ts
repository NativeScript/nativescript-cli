import * as constants from "../constants";
import * as path from "path";
import { AppFilesUpdater } from "./app-files-updater";
import { EventEmitter } from "events";

export class PreparePlatformService extends EventEmitter {

	constructor(protected $fs: IFileSystem,
		private $xmlValidator: IXmlValidator) {
		super();
	}

	protected async copyAppFiles(platformData: IPlatformData, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectData: IProjectData): Promise<void> {
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

		// Copy app folder to native project
		this.$fs.ensureDirectoryExists(appDestinationDirectoryPath);
		const appSourceDirectoryPath = path.join(projectData.projectDir, constants.APP_FOLDER_NAME);

		const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, appFilesUpdaterOptions, this.$fs);
		appUpdater.updateApp(sourceFiles => {
			this.$xmlValidator.validateXmlFiles(sourceFiles);
		});
	}
}
