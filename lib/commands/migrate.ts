import { IProjectData } from "../definitions/project";
import { IMigrateController, IMigrationData } from "../definitions/migrate";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";

export class MigrateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $migrateController: IMigrateController,
		private $staticConfig: Config.IStaticConfig,
		private $projectData: IProjectData,
		private $logger: ILogger
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const migrationData: IMigrationData = {
			projectDir: this.$projectData.projectDir,
			platforms: [
				this.$devicePlatformsConstants.Android,
				this.$devicePlatformsConstants.iOS
			]
		};
		const shouldMigrateResult =
			await this.$migrateController.shouldMigrate(migrationData);

		if (!shouldMigrateResult) {
			const cliVersion = this.$staticConfig.version;
			this.$logger.printMarkdown(
				`__Project is compatible with NativeScript \`v${cliVersion}\`__`
			);
			return;
		}

		await this.$migrateController.migrate(migrationData);
	}
}

injector.registerCommand("migrate", MigrateCommand);
