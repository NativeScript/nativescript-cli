import {
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
	ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
} from "../constants";
import {
	canExecuteCommandBase,
	injectPlatformCommandServices,
	platformArgument,
} from "./command-base";
import { DeployCommandHelper } from "../helpers/deploy-command-helper";
import { hasValidAndroidSigning } from "../common/helpers";
import { IMigrateController } from "../definitions/migrate";
import { IErrors } from "../common/declarations";
import {
	booleanOption,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { registerCommandDefinition } from "../common/services/command-definition-adapter";

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
	setup() {
		const services = {
			...injectPlatformCommandServices(),
			$errors: inject<IErrors>("errors"),
			$mobileHelper: inject<Mobile.IMobileHelper>("mobileHelper"),
			$deployCommandHelper: inject<DeployCommandHelper>("deployCommandHelper"),
			$migrateController: inject<IMigrateController>("migrateController"),
		};
		services.$projectData.initializeProjectData();

		return services;
	},
	async canExecute(context, services): Promise<boolean> {
		const platform = context.args[0];

		if (!context.options.force) {
			await services.$migrateController.validate({
				projectDir: services.$projectData.projectDir,
				platforms: [platform],
			});
		}

		if (!platform) {
			return false;
		}

		if (
			services.$mobileHelper.isAndroidPlatform(platform) &&
			(context.options.release || context.options.aab) &&
			!hasValidAndroidSigning(context.options)
		) {
			if (context.options.release) {
				services.$errors.failWithHelp(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			} else {
				services.$errors.failWithHelp(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
			}
		}

		return canExecuteCommandBase(services, platform, {
			validateOptions: true,
		});
	},
	async run(context, services): Promise<void> {
		await services.$deployCommandHelper.deploy(context.args[0]);
	},
});

registerCommandDefinition(deployCommandDefinition);
