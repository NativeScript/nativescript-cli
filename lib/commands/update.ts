export class UpdateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public static readonly SHOULD_MIGRATE_PROJECT_MESSAGE = 'This project is not compatible with the current NativeScript version and cannot be updated. Use "tns migrate" to make your project compatible.';
	public static readonly PROJECT_UP_TO_DATE_MESSAGE = 'This project is up to date.';

	constructor(
		private $updateController: IUpdateController,
		private $migrateController: IMigrateController,
		private $options: IOptions,
		private $errors: IErrors,
		private $projectData: IProjectData) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$updateController.update({projectDir: this.$projectData.projectDir, version: args[0], frameworkPath: this.$options.frameworkPath});
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (await this.$migrateController.shouldMigrate({projectDir: this.$projectData.projectDir})) {
			this.$errors.failWithoutHelp(UpdateCommand.SHOULD_MIGRATE_PROJECT_MESSAGE);
		}

		if (!await this.$updateController.shouldUpdate({projectDir:this.$projectData.projectDir, version: args[0]})) {
			this.$errors.failWithoutHelp(UpdateCommand.PROJECT_UP_TO_DATE_MESSAGE);
		}

		return args.length < 2 && this.$projectData.projectDir !== "";
	}
}

$injector.registerCommand("update", UpdateCommand);
