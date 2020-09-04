import { IProjectData } from "../definitions/project";
import { IMigrateController } from "../definitions/migrate";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";

export class MigrateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $migrateController: IMigrateController,
		private $projectData: IProjectData,
		private $logger: ILogger
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const migrationData = {
			projectDir: this.$projectData.projectDir,
			platforms: [
				this.$devicePlatformsConstants.Android,
				this.$devicePlatformsConstants.iOS,
			],
		};
		const shouldMigrateResult = await this.$migrateController.shouldMigrate(
			migrationData
		);

		if (!shouldMigrateResult) {
			this.$logger.printMarkdown(
				'__Project is compatible with NativeScript "v7.0.0". To get the latest NativeScript packages execute "ns update".__'
			);
			return;
		}
		// else if (shouldMigrateResult.shouldMigrate === ShouldMigrate.ADVISED) {
		// 	// todo: this shouldn't be here, because this is already the `ns migrate` path.
		// 	this.$logger.printMarkdown(
		// 		'__Project should work with NativeScript "v7.0.0" but a migration is advised. Run ns migrate to migrate.__'
		// 	);
		// 	return;
		// }

		await this.$migrateController.migrate(migrationData);
	}
}

injector.registerCommand("migrate", MigrateCommand);
