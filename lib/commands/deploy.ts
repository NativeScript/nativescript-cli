import {
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
	ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
} from "../constants";
import { canExecuteCommandBase, platformArgument } from "./command-base";
import { DeployCommandHelper } from "../helpers/deploy-command-helper";
import { hasValidAndroidSigning } from "../common/helpers";
import { IMigrateController } from "../definitions/migrate";
import { IProjectData } from "../definitions/project";
import { IErrors } from "../common/declarations";
import {
	booleanOption,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";

const deployCommandOptions = {
	watch: booleanOption({ default: false }),
	hmr: booleanOption({ default: false }),
	force: booleanOption(),
	release: booleanOption(),
	aab: booleanOption(),
	keyStorePath: stringOption(),
	keyStorePassword: stringOption(),
	keyStoreAlias: stringOption(),
	keyStoreAliasPassword: stringOption(),
} satisfies CommandOptionsSchema;

export const deployCommandDefinition = defineCommand({
	name: "deploy",
	description: "Builds and deploys the project to a connected device.",
	options: deployCommandOptions,
	arguments: [platformArgument],
	async canExecute(context): Promise<boolean> {
		const $errors = inject<IErrors>("errors");
		const $migrateController = inject<IMigrateController>("migrateController");
		const $mobileHelper = inject<Mobile.IMobileHelper>("mobileHelper");
		const $projectData = inject<IProjectData>("projectData");
		$projectData.initializeProjectData();

		const platform = context.args[0];

		if (!context.options.force) {
			await $migrateController.validate({
				projectDir: $projectData.projectDir,
				platforms: [platform],
			});
		}

		if (!platform) {
			return false;
		}

		if (
			$mobileHelper.isAndroidPlatform(platform) &&
			(context.options.release || context.options.aab) &&
			!hasValidAndroidSigning(context.options)
		) {
			if (context.options.release) {
				$errors.failWithHelp(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			} else {
				$errors.failWithHelp(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
			}
		}

		return canExecuteCommandBase(context, platform, {
			validateOptions: true,
		});
	},
	async run(context): Promise<void> {
		const $deployCommandHelper = inject<DeployCommandHelper>(
			"deployCommandHelper",
		);
		const $projectData = inject<IProjectData>("projectData");
		$projectData.initializeProjectData();

		await $deployCommandHelper.deploy(context.args[0]);
	},
});
