import {
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
	AndroidAppBundleMessages,
} from "../constants";
import {
	canExecuteCommandBase,
	platformSigningOptions,
	provideProject,
	validatePlatformOptions,
} from "./command-base";
import { hasValidAndroidSigning } from "../common/helpers";
import {
	IAndroidBundleValidatorHelper,
	IOptions,
	IPlatformValidationService,
} from "../declarations";
import { IBuildController, IBuildDataService } from "../definitions/build";
import { IMigrateController } from "../definitions/migrate";
import {
	booleanOption,
	CommandName,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { ProjectData } from "../contracts/project-data";

/**
 * Which `$devicePlatformsConstants` entry a command builds for. The constants
 * stay the source of truth for the platform spelling.
 */
type BuildPlatform = "iOS" | "Android" | "visionOS";

const buildCommandOptions = {
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

const defineBuildCommand = <const TName extends CommandName>(
	name: TName,
	buildPlatform: BuildPlatform,
) =>
	defineCommand({
		name,
		description: "Builds the project for the selected target platform.",
		options: buildCommandOptions,
		params: "none",
		providers: [provideProject()],
		async canExecute(context): Promise<boolean> {
			const $devicePlatformsConstants =
				inject<Mobile.IDevicePlatformsConstants>("devicePlatformsConstants");
			const $migrateController =
				inject<IMigrateController>("migrateController");
			const $platformValidationService = inject<IPlatformValidationService>(
				"platformValidationService",
			);
			const $projectData = inject(ProjectData);
			const platform = $devicePlatformsConstants[buildPlatform];
			const isAndroid = $devicePlatformsConstants.isAndroid(platform);
			// Only the android build checks the runtime version.
			const $androidBundleValidatorHelper = isAndroid
				? inject<IAndroidBundleValidatorHelper>("androidBundleValidatorHelper")
				: null;

			if (!context.options.force) {
				await $migrateController.validate({
					projectDir: $projectData.projectDir,
					platforms: [platform],
				});
			}

			if (isAndroid) {
				$androidBundleValidatorHelper.validateRuntimeVersion($projectData);
			} else if (
				!$platformValidationService.isPlatformSupportedForOS(
					platform,
					$projectData,
				)
			) {
				context.fail(
					`Applications for platform ${platform} can not be built on this OS`,
					{ help: false },
				);
			}

			if (!(await canExecuteCommandBase(context, platform))) {
				return false;
			}

			if (
				isAndroid &&
				context.options.release &&
				!hasValidAndroidSigning(context.options)
			) {
				context.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			}

			return validatePlatformOptions(context, platform);
		},
		async run(context): Promise<string> {
			const $buildController = inject<IBuildController>("buildController");
			const $buildDataService = inject<IBuildDataService>("buildDataService");
			const $devicePlatformsConstants =
				inject<Mobile.IDevicePlatformsConstants>("devicePlatformsConstants");
			const $logger = inject<ILogger>("logger");
			const $options = inject<IOptions>("options");
			const $projectData = inject(ProjectData);
			const platform = $devicePlatformsConstants[buildPlatform];
			const isAndroid = $devicePlatformsConstants.isAndroid(platform);

			const buildData = $buildDataService.getBuildData(
				$projectData.projectDir,
				platform.toLowerCase(),
				$options,
			);
			const outputPath = await $buildController.prepareAndBuild(buildData);

			if (isAndroid && context.options.aab) {
				$logger.info(AndroidAppBundleMessages.ANDROID_APP_BUNDLE_DOCS_MESSAGE);

				if (context.options.release) {
					$logger.info(
						AndroidAppBundleMessages.ANDROID_APP_BUNDLE_PUBLISH_DOCS_MESSAGE,
					);
				}
			}

			return outputPath;
		},
	});

export const iosBuildCommand = defineBuildCommand("build|ios", "iOS");

export const androidBuildCommand = defineBuildCommand(
	"build|android",
	"Android",
);

export const visionBuildCommand = defineBuildCommand(
	["build|vision", "build|visionos"],
	"visionOS",
);
