import { ERROR_NO_VALID_SUBCOMMAND_FORMAT } from "../common/constants";
import { IErrors, IHostInfo } from "../common/declarations";
import {
	booleanOption,
	CommandContext,
	CommandName,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { hasValidAndroidSigning } from "../common/helpers";
import {
	ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
} from "../constants";
import { IOptions, IPlatformValidationService } from "../declarations";
import { IMigrateController } from "../definitions/migrate";
import { IProjectData, IProjectDataService } from "../definitions/project";
import {
	DevicePlatformName,
	IKeyShortcutService,
	KeyShortcut,
	keyShortcuts,
	restartShortcut,
	watcherShortcut,
} from "../services/key-shortcuts";

const runCommandOptions = {
	force: booleanOption(),
	release: booleanOption(),
	aab: booleanOption(),
	keyStorePath: stringOption(),
	keyStorePassword: stringOption(),
	keyStoreAlias: stringOption(),
	keyStoreAliasPassword: stringOption(),
} satisfies CommandOptionsSchema;

export type RunCommandContext = CommandContext<typeof runCommandOptions>;

export interface IRunCommandServices {
	/**
	 * Undefined for `run|*all`, which targets every platform. `canExecute`
	 * narrows it to Android off macOS, and `run` reads whatever it settled on.
	 */
	platform: string;
	$devicePlatformsConstants: Mobile.IDevicePlatformsConstants;
	$errors: IErrors;
	$hostInfo: IHostInfo;
	$keyShortcutService: IKeyShortcutService;
	$liveSyncCommandHelper: ILiveSyncCommandHelper;
	$migrateController: IMigrateController;
	$options: IOptions;
	$platformValidationService: IPlatformValidationService;
	$projectData: IProjectData;
	$projectDataService: IProjectDataService;
}

export function setupRunCommand(): IRunCommandServices {
	return {
		platform: undefined,
		$devicePlatformsConstants: inject<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		),
		$errors: inject<IErrors>("errors"),
		$hostInfo: inject<IHostInfo>("hostInfo"),
		$keyShortcutService: inject<IKeyShortcutService>("keyShortcutService"),
		$liveSyncCommandHelper: inject<ILiveSyncCommandHelper>(
			"liveSyncCommandHelper",
		),
		$migrateController: inject<IMigrateController>("migrateController"),
		$options: inject<IOptions>("options"),
		$platformValidationService: inject<IPlatformValidationService>(
			"platformValidationService",
		),
		$projectData: inject<IProjectData>("projectData"),
		$projectDataService: inject<IProjectDataService>("projectDataService"),
	};
}

type RunPlatform = "iOS" | "Android" | "visionOS";

const setupPlatformRunCommand =
	(platform: RunPlatform) => (): IRunCommandServices => {
		const services = setupRunCommand();
		services.platform = services.$devicePlatformsConstants[platform];

		return services;
	};

export async function canExecuteRunCommand(
	context: RunCommandContext,
	services: IRunCommandServices,
): Promise<boolean> {
	if (context.args.length) {
		services.$errors.failWithHelp(ERROR_NO_VALID_SUBCOMMAND_FORMAT, "run");
	}

	if (!services.platform && !services.$hostInfo.isDarwin) {
		services.platform = services.$devicePlatformsConstants.Android;
	}

	services.$projectData.initializeProjectData();
	const platforms = services.platform
		? [services.platform]
		: [
				services.$devicePlatformsConstants.Android,
				services.$devicePlatformsConstants.iOS,
			];

	if (!context.options.force) {
		await services.$migrateController.validate({
			projectDir: services.$projectData.projectDir,
			platforms,
		});
	}

	await services.$liveSyncCommandHelper.validatePlatform(services.platform);

	return true;
}

export async function runRunCommand(
	context: RunCommandContext,
	services: IRunCommandServices,
): Promise<void> {
	await services.$liveSyncCommandHelper.executeCommandLiveSync(
		services.platform,
		<ILiveSyncCommandHelperAdditionalOptions>{},
	);

	if (process.env.NS_IS_INTERACTIVE) {
		services.$keyShortcutService.attach({
			context: {
				platform: <DevicePlatformName>services.platform,
				processType: "run",
			},
			shortcuts: keyShortcuts(),
		});
	}
}

/**
 * Restarting and pausing the watcher are the shortcuts a standalone run owns
 * outright; the launch and clean keys belong to the parent that respawns
 * things, which is why the `ns start` table is not reused here.
 */
export function runCommandShortcuts(
	context: RunCommandContext,
	services: IRunCommandServices,
): KeyShortcut[] {
	if (process.env.NS_IS_INTERACTIVE) {
		// A `ns start` child is driven over IPC through the table `run` attaches
		// for itself; a second attach would replace it.
		return [];
	}

	const platform = <DevicePlatformName>services.platform;

	return [
		restartShortcut({ platform }),
		restartShortcut({ platform, full: true }),
		restartShortcut({ platform, forceRebuildNativeApp: true }),
		watcherShortcut(),
	];
}

export const runCommandDefinition = defineCommand({
	name: "run|*all",
	description: "Runs your project on all connected devices and emulators.",
	options: runCommandOptions,
	// The base rejects arguments itself, with the sub-command message.
	arguments: "any",
	setup: setupRunCommand,
	canExecute: canExecuteRunCommand,
	run: runRunCommand,
	shortcuts: runCommandShortcuts,
});

async function canExecuteApplePlatformRunCommand(
	context: RunCommandContext,
	services: IRunCommandServices,
): Promise<boolean> {
	const projectData = services.$projectDataService.getProjectData();

	if (
		!services.$platformValidationService.isPlatformSupportedForOS(
			services.platform,
			projectData,
		)
	) {
		services.$errors.fail(
			`Applications for platform ${services.platform} can not be built on this OS`,
		);
	}

	const result =
		(await canExecuteRunCommand(context, services)) &&
		(await services.$platformValidationService.validateOptions(
			services.$options.provision,
			services.$options.teamId,
			projectData,
			services.platform.toLowerCase(),
		));
	return result;
}

const defineApplePlatformRunCommand = <const TName extends CommandName>(
	name: TName,
	platform: "iOS" | "visionOS",
) =>
	defineCommand({
		name,
		description: "Runs your project on a connected Apple device or simulator.",
		options: runCommandOptions,
		arguments: "any",
		setup: setupPlatformRunCommand(platform),
		canExecute: canExecuteApplePlatformRunCommand,
		run: runRunCommand,
		shortcuts: runCommandShortcuts,
	});

export const iosRunCommand = defineApplePlatformRunCommand("run|ios", "iOS");

export const visionRunCommand = defineApplePlatformRunCommand(
	["run|vision", "run|visionos"],
	"visionOS",
);

export const androidRunCommand = defineCommand({
	name: "run|android",
	description: "Runs your project on a connected Android device or emulator.",
	options: runCommandOptions,
	arguments: "any",
	setup: setupPlatformRunCommand("Android"),
	async canExecute(
		context: RunCommandContext,
		services: IRunCommandServices,
	): Promise<boolean> {
		// The base verdict is dropped rather than combined with the checks below;
		// the base only ever returns true or throws, so the Android command has
		// always relied on it for its side effects alone.
		await canExecuteRunCommand(context, services);

		if (
			!services.$platformValidationService.isPlatformSupportedForOS(
				services.$devicePlatformsConstants.Android,
				services.$projectData,
			)
		) {
			services.$errors.fail(
				`Applications for platform ${services.$devicePlatformsConstants.Android} can not be built on this OS`,
			);
		}

		if (
			(context.options.release || context.options.aab) &&
			!hasValidAndroidSigning(context.options)
		) {
			if (context.options.release) {
				services.$errors.failWithHelp(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			} else {
				services.$errors.failWithHelp(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
			}
		}

		return services.$platformValidationService.validateOptions(
			services.$options.provision,
			services.$options.teamId,
			services.$projectData,
			services.$devicePlatformsConstants.Android.toLowerCase(),
		);
	},
	run: runRunCommand,
	shortcuts: runCommandShortcuts,
});
