import { IProjectData } from "../definitions/project";
import { IMigrateController } from "../definitions/migrate";
import { IErrors } from "../common/declarations";
import {
	booleanOption,
	Command,
	CommandOptionsSchema,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";

export const SHOULD_MIGRATE_PROJECT_MESSAGE =
	'This project is not compatible with the current NativeScript version and cannot be updated. Use "ns migrate" to make your project compatible.';
export const PROJECT_UP_TO_DATE_MESSAGE = "This project is up to date.";

const updateCommandOptions = {
	markingMode: booleanOption(),
	frameworkPath: stringOption(),
} satisfies CommandOptionsSchema;

export class UpdateCommand extends Command({
	name: "update",
	description:
		"Updates the project with the latest versions of its NativeScript dependencies.",
	options: updateCommandOptions,
	arguments: "any",
}) {
	private $devicePlatformsConstants = inject<Mobile.IDevicePlatformsConstants>(
		"devicePlatformsConstants",
	);
	private $updateController = inject<IUpdateController>("updateController");
	private $migrateController = inject<IMigrateController>("migrateController");
	private $errors = inject<IErrors>("errors");
	private $logger = inject<ILogger>("logger");
	private $projectData = inject<IProjectData>("projectData");
	private $markingModeService =
		inject<IMarkingModeService>("markingModeService");

	constructor() {
		super();
		this.$projectData.initializeProjectData();
	}

	public async canExecute(): Promise<boolean> {
		const shouldMigrate = await this.$migrateController.shouldMigrate({
			projectDir: this.$projectData.projectDir,
			platforms: [
				this.$devicePlatformsConstants.Android,
				this.$devicePlatformsConstants.iOS,
			],
			loose: true,
		});

		if (shouldMigrate) {
			this.$errors.fail(SHOULD_MIGRATE_PROJECT_MESSAGE);
		}

		return this.args.length < 2 && this.$projectData.projectDir !== "";
	}

	public async run(): Promise<void> {
		if (this.options.markingMode) {
			// ns update --markingMode
			await this.$markingModeService.handleMarkingModeFullDeprecation({
				projectDir: this.$projectData.projectDir,
				forceSwitch: true,
			});
			return;
		}

		if (
			!(await this.$updateController.shouldUpdate({
				projectDir: this.$projectData.projectDir,
				version: this.args[0],
			}))
		) {
			this.$logger.printMarkdown(`__${PROJECT_UP_TO_DATE_MESSAGE}__`);
			return;
		}

		await this.$updateController.update({
			projectDir: this.$projectData.projectDir,
			version: this.args[0],
			frameworkPath: this.options.frameworkPath,
		});
	}
}
