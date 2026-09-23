import { canExecuteCommandBase, provideProject } from "./command-base";
import {
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import {
	Command,
	CommandOptionsSchema,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { ProjectData } from "../contracts/project-data";

const addPlatformCommandOptions = {
	frameworkPath: stringOption(),
} satisfies CommandOptionsSchema;

export class AddPlatformCommand extends Command({
	name: "platform|add",
	description:
		"Configures the current project to target the selected platform.",
	options: addPlatformCommandOptions,
	arguments: "any",
	providers: [provideProject()],
}) {
	private $platformCommandHelper = inject<IPlatformCommandHelper>(
		"platformCommandHelper",
	);
	private $platformValidationService = inject<IPlatformValidationService>(
		"platformValidationService",
	);
	private $projectData = inject(ProjectData);

	public async canExecute(): Promise<boolean> {
		const args = this.args;
		if (!args || args.length === 0) {
			this.context.fail(
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
				this.context.fail(
					`Applications for platform ${arg} cannot be built on this OS`,
					{ help: false },
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
