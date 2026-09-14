import { canExecuteCommandBase } from "./command-base";
import {
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import { IProjectData } from "../definitions/project";
import { IErrors } from "../common/declarations";
import {
	Command,
	CommandOptionsSchema,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";

const addPlatformCommandOptions = {
	frameworkPath: stringOption(),
} satisfies CommandOptionsSchema;

export class AddPlatformCommand extends Command({
	name: "platform|add",
	description:
		"Configures the current project to target the selected platform.",
	options: addPlatformCommandOptions,
	arguments: "any",
}) {
	private $errors = inject<IErrors>("errors");
	private $platformCommandHelper = inject<IPlatformCommandHelper>(
		"platformCommandHelper",
	);
	private $platformValidationService = inject<IPlatformValidationService>(
		"platformValidationService",
	);
	private $projectData = inject<IProjectData>("projectData");

	constructor() {
		super();
		this.$projectData.initializeProjectData();
	}

	public async canExecute(): Promise<boolean> {
		const args = this.args;
		if (!args || args.length === 0) {
			this.$errors.failWithHelp(
				"No platform specified. Please specify a platform to add.",
			);
		}

		let canExecute = true;
		for (const arg of args) {
			this.$platformValidationService.validatePlatform(arg, this.$projectData);

			if (
				!this.$platformValidationService.isPlatformSupportedForOS(
					arg,
					this.$projectData,
				)
			) {
				this.$errors.fail(
					`Applications for platform ${arg} cannot be built on this OS`,
				);
			}

			// The assignment overwrites the previous platform's verdict, so only the
			// last one decides.
			canExecute = await canExecuteCommandBase(this.context, arg);
		}

		return canExecute;
	}

	public async run(): Promise<void> {
		await this.$platformCommandHelper.addPlatforms(
			this.args,
			this.$projectData,
			this.options.frameworkPath,
		);
	}
}
