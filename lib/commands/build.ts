import {
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
	AndroidAppBundleMessages,
} from "../constants";
import {
	canExecuteCommandBase,
	injectPlatformCommandServices,
	IPlatformCommandServices,
	validatePlatformOptions,
} from "./command-base";
import { hasValidAndroidSigning } from "../common/helpers";
import { IAndroidBundleValidatorHelper } from "../declarations";
import { IBuildController, IBuildDataService } from "../definitions/build";
import { IMigrateController } from "../definitions/migrate";
import { IErrors } from "../common/declarations";
import {
	booleanOption,
	CommandName,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";

/**
 * Which `$devicePlatformsConstants` entry a command builds for. The constants
 * stay the source of truth for the platform spelling.
 */
type BuildPlatform = "iOS" | "Android" | "visionOS";

const buildCommandOptions = {
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

interface IBuildCommandServices extends IPlatformCommandServices {
	platform: string;
	isAndroid: boolean;
	$errors: IErrors;
	$logger: ILogger;
	$buildController: IBuildController;
	$buildDataService: IBuildDataService;
	$migrateController: IMigrateController;
	$androidBundleValidatorHelper: IAndroidBundleValidatorHelper;
}

const defineBuildCommand = <const TName extends CommandName>(
	name: TName,
	buildPlatform: BuildPlatform,
) =>
	defineCommand({
		name,
		description: "Builds the project for the selected target platform.",
		options: buildCommandOptions,
		arguments: "none",
		setup(): IBuildCommandServices {
			const devicePlatformsConstants = inject<Mobile.IDevicePlatformsConstants>(
				"devicePlatformsConstants",
			);
			const platform = devicePlatformsConstants[buildPlatform];
			const isAndroid = devicePlatformsConstants.isAndroid(platform);
			const services = {
				...injectPlatformCommandServices(),
				platform,
				isAndroid,
				$errors: inject<IErrors>("errors"),
				$logger: inject<ILogger>("logger"),
				$buildController: inject<IBuildController>("buildController"),
				$buildDataService: inject<IBuildDataService>("buildDataService"),
				$migrateController: inject<IMigrateController>("migrateController"),
				// Only the android build checks the runtime version.
				$androidBundleValidatorHelper: isAndroid
					? inject<IAndroidBundleValidatorHelper>(
							"androidBundleValidatorHelper",
						)
					: null,
			};
			services.$projectData.initializeProjectData();

			return services;
		},
		async canExecute(context, services): Promise<boolean> {
			const { platform } = services;

			if (!context.options.force) {
				await services.$migrateController.validate({
					projectDir: services.$projectData.projectDir,
					platforms: [platform],
				});
			}

			if (services.isAndroid) {
				services.$androidBundleValidatorHelper.validateRuntimeVersion(
					services.$projectData,
				);
			} else if (
				!services.$platformValidationService.isPlatformSupportedForOS(
					platform,
					services.$projectData,
				)
			) {
				services.$errors.fail(
					`Applications for platform ${platform} can not be built on this OS`,
				);
			}

			if (!(await canExecuteCommandBase(services, platform))) {
				return false;
			}

			if (
				services.isAndroid &&
				context.options.release &&
				!hasValidAndroidSigning(context.options)
			) {
				services.$errors.failWithHelp(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			}

			return validatePlatformOptions(services, platform);
		},
		async run(context, services): Promise<string> {
			const buildData = services.$buildDataService.getBuildData(
				services.$projectData.projectDir,
				services.platform.toLowerCase(),
				services.$options,
			);
			const outputPath =
				await services.$buildController.prepareAndBuild(buildData);

			if (services.isAndroid && context.options.aab) {
				services.$logger.info(
					AndroidAppBundleMessages.ANDROID_APP_BUNDLE_DOCS_MESSAGE,
				);

				if (context.options.release) {
					services.$logger.info(
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
