import { IProjectData } from "../definitions/project";
import { IOptions } from "../declarations";
import { IMigrateController } from "../definitions/migrate";
import { IErrors } from "../common/declarations";

import { ICommand, ICommandParameter } from "../common/definitions/commands";

export class UpdateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public static readonly SHOULD_MIGRATE_PROJECT_MESSAGE = 'This project is not compatible with the current NativeScript version and cannot be updated. Use "ns migrate" to make your project compatible.';
	public static readonly PROJECT_UP_TO_DATE_MESSAGE = 'This project is up to date.';

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $updateController: IUpdateController,
		private $migrateController: IMigrateController,
		private $options: IOptions,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectData: IProjectData,
		private $markingModeService: IMarkingModeService) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		if (this.$options.markingMode) {
			await this.$markingModeService.handleMarkingModeFullDeprecation({ projectDir: this.$projectData.projectDir, forceSwitch: true });
			return;
		}

		if (!await this.$updateController.shouldUpdate({ projectDir: this.$projectData.projectDir, version: args[0] })) {
			this.$logger.printMarkdown(`__${UpdateCommand.PROJECT_UP_TO_DATE_MESSAGE}__`);
			return;
		}

		await this.$updateController.update({ projectDir: this.$projectData.projectDir, version: args[0], frameworkPath: this.$options.frameworkPath });
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const shouldMigrate = await this.$migrateController.shouldMigrate({
			projectDir: this.$projectData.projectDir,
			platforms: [this.$devicePlatformsConstants.Android, this.$devicePlatformsConstants.iOS],
			allowInvalidVersions: true
		});

		if (shouldMigrate) {
			this.$errors.fail(UpdateCommand.SHOULD_MIGRATE_PROJECT_MESSAGE);
		}

		return args.length < 2 && this.$projectData.projectDir !== "";
	}
}

$injector.registerCommand("update", UpdateCommand);
