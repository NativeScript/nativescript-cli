import * as _ from "lodash";
import {
	IOptions,
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import { IPlatformEnvironmentRequirements } from "../definitions/platform";
import {
	Command,
	CommandOptionsSchema,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { ProjectData } from "../contracts/project-data";
import { provideProject } from "./command-base";

const platformCleanCommandOptions = {
	frameworkPath: stringOption(),
} satisfies CommandOptionsSchema;

export class PlatformCleanCommand extends Command({
	name: "platform|clean",
	description: "Removes and adds again the selected platform.",
	options: platformCleanCommandOptions,
	params: "any",
	providers: [provideProject()],
}) {
	private $options = inject<IOptions>("options");
	private $platformCommandHelper = inject<IPlatformCommandHelper>(
		"platformCommandHelper",
	);
	private $platformValidationService = inject<IPlatformValidationService>(
		"platformValidationService",
	);
	private $platformEnvironmentRequirements =
		inject<IPlatformEnvironmentRequirements>("platformEnvironmentRequirements");
	private $projectData = inject(ProjectData);

	public async canExecute(): Promise<boolean> {
		const args = this.args;
		if (!args || args.length === 0) {
			this.context.fail(
				"No platform specified. Please specify a platform to clean.",
			);
		}

		_.each(args, (platform) => {
			this.$platformValidationService.validatePlatform(
				platform,
				this.$projectData,
			);
		});

		for (const platform of args) {
			this.$platformValidationService.validatePlatformInstalled(
				platform,
				this.$projectData,
			);

			const currentRuntimeVersion =
				this.$platformCommandHelper.getCurrentPlatformVersion(
					platform,
					this.$projectData,
				);
			await this.$platformEnvironmentRequirements.checkEnvironmentRequirements({
				platform,
				projectDir: this.$projectData.projectDir,
				runtimeVersion: currentRuntimeVersion,
				options: this.$options,
			});
		}

		return true;
	}

	public async run(): Promise<void> {
		await this.$platformCommandHelper.cleanPlatforms(
			this.args,
			this.$projectData,
			this.options.frameworkPath,
		);
	}
}
