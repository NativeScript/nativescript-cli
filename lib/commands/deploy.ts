import {
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
	ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
} from "../constants";
import {
	canExecuteCommandBase,
	platformArgument,
	platformSigningOptions,
	provideProject,
} from "./command-base";
import { DeployCommandHelper } from "../helpers/deploy-command-helper";
import { hasValidAndroidSigning } from "../common/helpers";
import { IMigrateController } from "../definitions/migrate";
import {
	booleanOption,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { ProjectData } from "../contracts/project-data";

const deployCommandOptions = {
	...platformSigningOptions,
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
	providers: [provideProject()],
	async canExecute(context): Promise<boolean> {
		const $migrateController = inject<IMigrateController>("migrateController");
		const $mobileHelper = inject<Mobile.IMobileHelper>("mobileHelper");
		const $projectData = inject(ProjectData);

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
				context.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			} else {
				context.fail(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
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
		await $deployCommandHelper.deploy(context.args[0]);
	},
});
