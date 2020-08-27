import { IProjectData } from "../../definitions/project";
import { IAndroidResourcesMigrationService } from "../../declarations";
import { ICommand, ICommandParameter } from "../../common/definitions/commands";
import { IErrors } from "../../common/declarations";
import { injector } from "../../common/yok";

export class ResourcesUpdateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $projectData: IProjectData,
		private $errors: IErrors,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$androidResourcesMigrationService.migrate(
			this.$projectData.getAppResourcesDirectoryPath()
		);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			// Command defaults to migrating the Android App_Resources, unless explicitly specified
			args = ["android"];
		}

		for (const platform of args) {
			if (!this.$androidResourcesMigrationService.canMigrate(platform)) {
				this.$errors.fail(
					`The ${platform} does not need to have its resources updated.`
				);
			}

			if (
				this.$androidResourcesMigrationService.hasMigrated(
					this.$projectData.getAppResourcesDirectoryPath()
				)
			) {
				this.$errors.fail(
					"The App_Resources have already been updated for the Android platform."
				);
			}
		}

		return true;
	}
}

injector.registerCommand("resources|update", ResourcesUpdateCommand);
