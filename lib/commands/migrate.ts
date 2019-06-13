export class MigrateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $migrateController: IMigrateController,
		private $projectData: IProjectData) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$migrateController.migrate({projectDir: this.$projectData.projectDir});
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!await this.$migrateController.shouldMigrate({ projectDir: this.$projectData.projectDir })) {
			throw new Error('Project is already migrated. To get the latest NativesScript packages execute "tns update".');
		}

		return true;
	}
}

$injector.registerCommand("migrate", MigrateCommand);
