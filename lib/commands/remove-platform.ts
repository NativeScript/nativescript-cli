import * as _ from "lodash";
import { IProjectData } from "../definitions/project";
import {
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import { IErrors } from "../common/declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export const removePlatformCommandDefinition = defineCommand({
	name: "platform|remove",
	description:
		"Removes the selected platform from the platforms that the project currently targets.",
	arguments: "any",
	async canExecute(context): Promise<boolean> {
		const $errors = inject<IErrors>("errors");
		const $platformValidationService = inject<IPlatformValidationService>(
			"platformValidationService",
		);
		const $projectData = inject<IProjectData>("projectData");
		$projectData.initializeProjectData();

		const args = context.args;
		if (!args || args.length === 0) {
			$errors.failWithHelp(
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
		const $projectData = inject<IProjectData>("projectData");
		$projectData.initializeProjectData();

		return $platformCommandHelper.removePlatforms(context.args, $projectData);
	},
});
