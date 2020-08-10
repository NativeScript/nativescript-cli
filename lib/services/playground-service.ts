import { IProjectDataService, IProjectData } from "../definitions/project";
import { IPlaygroundService, IFileSystem, IUserSettingsService, IPlaygroundInfo } from "../common/declarations";

export class PlaygroundService implements IPlaygroundService {
	constructor(private $fs: IFileSystem,
		private $projectDataService: IProjectDataService,
		private $userSettingsService: IUserSettingsService) { }

	public async getPlaygroundInfo(projectDir?: string): Promise<IPlaygroundInfo> {
		const projectData = this.getProjectData(projectDir);
		if (projectData) {
			const projectFileContent = this.$fs.readJson(projectData.projectFilePath);
			if (this.hasPlaygroundKey(projectFileContent)) {
				const id = projectFileContent.nativescript.playground.id;
				let usedTutorial = projectFileContent.nativescript.playground.usedTutorial || false;

				// In case when usedTutorial=true is already saved in userSettings file, we shouldn't overwrite it
				const playgroundInfo = await this.getPlaygroundInfoFromUserSettingsFile();
				if (playgroundInfo && playgroundInfo.usedTutorial) {
					usedTutorial = true;
				}

				delete projectFileContent.nativescript.playground;
				this.$fs.writeJson(projectData.projectFilePath, projectFileContent);

				const result = { id , usedTutorial };
				await this.$userSettingsService.saveSettings(<any>{playground: result});
				return result;
			}
		}

		return this.getPlaygroundInfoFromUserSettingsFile();
	}

	private getProjectData(projectDir: string): IProjectData {
		try {
			return this.$projectDataService.getProjectData(projectDir);
		} catch (e) {
			// in case command is executed in non-project folder
			return null;
		}
	}

	private hasPlaygroundKey(projectFileContent: any): boolean {
		return projectFileContent && projectFileContent.nativescript && projectFileContent.nativescript.playground && projectFileContent.nativescript.playground.id;
	}

	private async getPlaygroundInfoFromUserSettingsFile(): Promise<IPlaygroundInfo> {
		return this.$userSettingsService.getSettingValue<IPlaygroundInfo>("playground");
	}
}
$injector.register('playgroundService', PlaygroundService);
