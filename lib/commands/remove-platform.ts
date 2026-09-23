import * as _ from "lodash";
import {
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { ProjectData } from "../contracts/project-data";
import { provideProject } from "./command-base";

export const removePlatformCommandDefinition = defineCommand({
	name: "platform|remove",
	description:
		"Removes the selected platform from the platforms that the project currently targets.",
	arguments: "any",
	providers: [provideProject()],
	async canExecute(context): Promise<boolean> {
		const $platformValidationService = inject<IPlatformValidationService>(
			"platformValidationService",
		);
		const $projectData = inject(ProjectData);

		const args = context.args;
		if (!args || args.length === 0) {
			context.fail(
				"No platform specified. Please specify a platform to remove.",
			);
		}

		_.each(args, (platform) => {
			$platformValidationService.validatePlatform(platform, $projectData);
		});

		return true;
	},
	run(context): Promise<void> {
		const $platformCommandHelper = inject<IPlatformCommandHelper>(
			"platformCommandHelper",
		);
		const $projectData = inject(ProjectData);

		return $platformCommandHelper.removePlatforms(context.args, $projectData);
	},
});
