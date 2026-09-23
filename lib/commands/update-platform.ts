import * as _ from "lodash";
import {
	IOptions,
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import {
	IPlatformEnvironmentRequirements,
	ICheckEnvironmentRequirementsInput,
} from "../definitions/platform";
import { Command } from "../common/define-command";
import { inject } from "../common/di";
import { ProjectData } from "../contracts/project-data";
import { provideProject } from "./command-base";

export class UpdatePlatformCommand extends Command({
	name: "platform|update",
	description: "Updates the NativeScript runtime for the specified platform.",
	params: "any",
	providers: [provideProject()],
}) {
	private $options = inject<IOptions>("options");
	private $platformEnvironmentRequirements =
		inject<IPlatformEnvironmentRequirements>("platformEnvironmentRequirements");
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
				"No platform specified. Please specify platforms to update.",
			);
		}

		_.each(args, (arg) => {
			const platform = arg.split("@")[0];
			this.$platformValidationService.validatePlatform(
				platform,
				this.$projectData,
			);
		});

		for (const arg of args) {
			const [platform, versionToBeInstalled] = arg.split("@");
			const checkEnvironmentRequirementsInput: ICheckEnvironmentRequirementsInput =
				{
					platform,
					options: this.$options,
				};
			// If version is not specified, we know the command will install the latest compatible Android runtime.
			// The latest compatible Android runtime supports Java version, so we do not need to pass it here.
			// Passing projectDir to the @nativescript/doctor validation will cause it to check the runtime from the current package.json
			// So in this case, where we do not want to validate the runtime, just do not pass both projectDir and runtimeVersion.
			if (versionToBeInstalled) {
				checkEnvironmentRequirementsInput.projectDir =
					this.$projectData.projectDir;
				checkEnvironmentRequirementsInput.runtimeVersion = versionToBeInstalled;
			}

			await this.$platformEnvironmentRequirements.checkEnvironmentRequirements(
				checkEnvironmentRequirementsInput,
			);
		}

		return true;
	}

	public async run(): Promise<void> {
		await this.$platformCommandHelper.updatePlatforms(
			this.args,
			this.$projectData,
		);
	}
}
