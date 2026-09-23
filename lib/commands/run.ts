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
import { IPlatformValidationService } from "../declarations";
import { IMigrateController } from "../definitions/migrate";
import { IProjectDataService } from "../definitions/project";
import {
	DevicePlatformName,
	IKeyShortcutService,
	KeyShortcut,
	keyShortcuts,
	restartShortcut,
	watcherShortcut,
} from "../services/key-shortcuts";
import { platformSigningOptions, provideProject } from "./command-base";
import { ProjectData } from "../contracts/project-data";

const runCommandOptions = {
	...platformSigningOptions,
	force: booleanOption(),
	release: booleanOption(),
	aab: booleanOption(),
	keyStorePath: stringOption(),
	keyStorePassword: stringOption(),
	keyStoreAlias: stringOption(),
	keyStoreAliasPassword: stringOption(),
} satisfies CommandOptionsSchema;

type RunCommandContext = CommandContext<typeof runCommandOptions>;

/**
 * Which `$devicePlatformsConstants` entry a command runs for. The constants
 * stay the source of truth for the platform spelling.
 */
type RunPlatform = "iOS" | "Android" | "visionOS";

const runPlatformName = (
	context: RunCommandContext,
	platform: RunPlatform,
): string =>
	context.injector.get<Mobile.IDevicePlatformsConstants>(
		"devicePlatformsConstants",
	)[platform];

async function canExecuteRunCommand(
	context: RunCommandContext,
	platform: string,
): Promise<boolean> {
	const $devicePlatformsConstants =
		context.injector.get<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		);
	const $errors = context.injector.get<IErrors>("errors");
	const $liveSyncCommandHelper = context.injector.get<ILiveSyncCommandHelper>(
		"liveSyncCommandHelper",
	);
	const $migrateController =
		context.injector.get<IMigrateController>("migrateController");

	if (context.args.length) {
		$errors.failWithHelp(ERROR_NO_VALID_SUBCOMMAND_FORMAT, "run");
	}

	const $projectData = context.injector.get(ProjectData);
	const platforms = platform
		? [platform]
		: [$devicePlatformsConstants.Android, $devicePlatformsConstants.iOS];

	if (!context.options.force) {
		await $migrateController.validate({
			projectDir: $projectData.projectDir,
			platforms,
		});
	}

	await $liveSyncCommandHelper.validatePlatform(platform);

	return true;
}

async function runRunCommand(
	context: RunCommandContext,
	platform: string,
): Promise<void> {
	const $keyShortcutService =
		context.injector.get<IKeyShortcutService>("keyShortcutService");
	const $liveSyncCommandHelper = context.injector.get<ILiveSyncCommandHelper>(
		"liveSyncCommandHelper",
	);

	await $liveSyncCommandHelper.executeCommandLiveSync(
		platform,
		<ILiveSyncCommandHelperAdditionalOptions>{},
	);

	if (process.env.NS_IS_INTERACTIVE) {
		$keyShortcutService.attach({
			context: {
				platform: <DevicePlatformName>platform,
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
function runCommandShortcuts(
	context: RunCommandContext,
	platform: string,
): KeyShortcut[] {
	if (process.env.NS_IS_INTERACTIVE) {
		// A `ns start` child is driven over IPC through the table `run` attaches
		// for itself; a second attach would replace it.
		return [];
	}

	return [
		restartShortcut({ platform: <DevicePlatformName>platform }),
		restartShortcut({ platform: <DevicePlatformName>platform, full: true }),
		restartShortcut({
			platform: <DevicePlatformName>platform,
			forceRebuildNativeApp: true,
		}),
		watcherShortcut(),
	];
}

export const runCommandDefinition = defineCommand({
	name: "run|*all",
	description: "Runs your project on all connected devices and emulators.",
	options: runCommandOptions,
	// The base rejects arguments itself, with the sub-command message.
	params: "any",
	providers: [provideProject()],
	/**
	 * Undefined for `run|*all`, which targets every platform, except off macOS
	 * where only Android can be built. It is settled here, once per invocation,
	 * because `canExecute` and `run` have to agree on the platform.
	 */
	setup(context: RunCommandContext): string {
		const $hostInfo = inject<IHostInfo>("hostInfo");

		return $hostInfo.isDarwin ? undefined : runPlatformName(context, "Android");
	},
	canExecute: canExecuteRunCommand,
	run: runRunCommand,
	shortcuts: runCommandShortcuts,
});

async function canExecuteApplePlatformRunCommand(
	context: RunCommandContext,
	platform: string,
): Promise<boolean> {
	const $platformValidationService =
		context.injector.get<IPlatformValidationService>(
			"platformValidationService",
		);
	const $projectDataService =
		context.injector.get<IProjectDataService>("projectDataService");

	const projectData = $projectDataService.getProjectData();

	if (
		!$platformValidationService.isPlatformSupportedForOS(platform, projectData)
	) {
		context.fail(
			`Applications for platform ${platform} can not be built on this OS`,
			{ help: false },
		);
	}

	const result =
		(await canExecuteRunCommand(context, platform)) &&
		(await $platformValidationService.validateOptions(
			context.options.provision,
			context.options.teamId,
			projectData,
			platform.toLowerCase(),
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
		params: "any",
		providers: [provideProject()],
		canExecute: (context: RunCommandContext) =>
			canExecuteApplePlatformRunCommand(
				context,
				runPlatformName(context, platform),
			),
		run: (context: RunCommandContext) =>
			runRunCommand(context, runPlatformName(context, platform)),
		shortcuts: (context: RunCommandContext) =>
			runCommandShortcuts(context, runPlatformName(context, platform)),
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
	params: "any",
	providers: [provideProject()],
	async canExecute(context: RunCommandContext): Promise<boolean> {
		const $platformValidationService = inject<IPlatformValidationService>(
			"platformValidationService",
		);
		const $projectData = inject(ProjectData);
		const platform = runPlatformName(context, "Android");

		// The base verdict is dropped rather than combined with the checks below;
		// the base only ever returns true or throws, so the Android command has
		// always relied on it for its side effects alone.
		await canExecuteRunCommand(context, platform);

		if (
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

		if (
			(context.options.release || context.options.aab) &&
			!hasValidAndroidSigning(context.options)
		) {
			if (context.options.release) {
				context.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			} else {
				context.fail(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
			}
		}

		return $platformValidationService.validateOptions(
			context.options.provision,
			context.options.teamId,
			$projectData,
			platform.toLowerCase(),
		);
	},
	run: (context: RunCommandContext) =>
		runRunCommand(context, runPlatformName(context, "Android")),
	shortcuts: (context: RunCommandContext) =>
		runCommandShortcuts(context, runPlatformName(context, "Android")),
});
