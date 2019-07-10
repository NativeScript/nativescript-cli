export class MigrateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $migrateController: IMigrateController,
		private $projectData: IProjectData,
		private $errors: IErrors) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$migrateController.migrate({ projectDir: this.$projectData.projectDir });
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const shouldMigrateResult = await this.$migrateController.shouldMigrate({ projectDir: this.$projectData.projectDir });

		if (!shouldMigrateResult) {
			this.$errors.failWithoutHelp('Project is compatible with NativeScript "v6.0.0". To get the latest NativesScript packages execute "tns update".');
		}

		return true;
	}
}

$injector.registerCommand("migrate", MigrateCommand);
