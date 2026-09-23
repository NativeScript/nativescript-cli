import { ISysInfo } from "../common/declarations";
import { commandShortcutsEnabled } from "../common/contracts/key-shortcuts";
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
import { ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE } from "../constants";
import { IOptions, IPlatformValidationService } from "../declarations";
import { ICleanupService } from "../definitions/cleanup-service";
import {
	IDebugController,
	IDebugDataService,
	IDebugOptions,
} from "../definitions/debug";
import { IMigrateController } from "../definitions/migrate";
import { SystemWarningsSeverity } from "../definitions/system-warnings";
import {
	IKeyShortcutService,
	KeyShortcutRegistry,
	restartShortcut,
	watcherShortcut,
} from "../services/key-shortcuts";
import {
	canExecuteCommandBase,
	platformSigningOptions,
	provideProject,
} from "./command-base";
import * as _ from "lodash";
import { ProjectData } from "../contracts/project-data";

/** Which `$devicePlatformsConstants` entry a command debugs. */
type DebugPlatform = "iOS" | "Android" | "visionOS";

const debugCommandOptions = {
	...platformSigningOptions,
	force: booleanOption(),
	release: booleanOption(),
	aab: booleanOption(),
	start: booleanOption(),
	emulator: booleanOption(),
	forDevice: booleanOption(),
	inspector: booleanOption(),
	device: stringOption(),
	timeout: stringOption(),
	keyStorePath: stringOption(),
	keyStorePassword: stringOption(),
	keyStoreAlias: stringOption(),
	keyStoreAliasPassword: stringOption(),
} satisfies CommandOptionsSchema;

type DebugCommandContext = CommandContext<typeof debugCommandOptions>;

async function canExecuteDebugCommand(
	context: DebugCommandContext,
	debugPlatform: DebugPlatform,
): Promise<boolean> {
	const $cleanupService =
		context.injector.get<ICleanupService>("cleanupService");
	const $devicePlatformsConstants =
		context.injector.get<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		);
	const $migrateController =
		context.injector.get<IMigrateController>("migrateController");
	const $platformValidationService =
		context.injector.get<IPlatformValidationService>(
			"platformValidationService",
		);
	const $projectData = context.injector.get(ProjectData);
	const platform = $devicePlatformsConstants[debugPlatform];

	// Keeping the cleanup process alive is what makes a debugger able to stay
	// attached, so it must not happen before the platform-specific checks that
	// run ahead of this function have had their chance to fail the command.
	$cleanupService.setShouldDispose(false);

	if (!context.options.force) {
		await $migrateController.validate({
			projectDir: $projectData.projectDir,
			platforms: [platform],
		});
	}

	if (
		!$platformValidationService.isPlatformSupportedForOS(platform, $projectData)
	) {
		context.fail(
			`Applications for platform ${platform} can not be built on this OS`,
			{ help: false },
		);
	}

	if (context.options.release) {
		context.fail("--release flag is not applicable to this command.");
	}

	return canExecuteCommandBase(context, platform, {
		validateOptions: true,
	});
}

async function runDebugCommand(
	context: DebugCommandContext,
	debugPlatform: DebugPlatform,
): Promise<void> {
	const $debugController =
		context.injector.get<IDebugController>("debugController");
	const $debugDataService =
		context.injector.get<IDebugDataService>("debugDataService");
	const $devicePlatformsConstants =
		context.injector.get<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		);
	const $devicesService =
		context.injector.get<Mobile.IDevicesService>("devicesService");
	const $liveSyncCommandHelper = context.injector.get<ILiveSyncCommandHelper>(
		"liveSyncCommandHelper",
	);
	const $options = context.injector.get<IOptions>("options");
	const $projectData = context.injector.get(ProjectData);
	const platform = $devicePlatformsConstants[debugPlatform];

	await $devicesService.initialize({
		platform,
		deviceId: context.options.device,
		emulator: context.options.emulator,
		skipDeviceDetectionInterval: true,
	});

	const selectedDeviceForDebug = await $devicesService.pickSingleDevice({
		onlyEmulators: context.options.emulator,
		onlyDevices: context.options.forDevice,
		deviceId: context.options.device,
	});

	if (context.options.start) {
		// The debug services read the whole parsed command line, including flags
		// no command declares, so the raw argv is what they get.
		const debugOptions = <IDebugOptions>_.cloneDeep($options.argv);
		const debugData = $debugDataService.getDebugData(
			selectedDeviceForDebug.deviceInfo.identifier,
			$projectData,
			debugOptions,
		);
		await $debugController.printDebugInformation(
			await $debugController.startDebug(debugData),
		);
		return;
	}

	const liveSyncOptions = (
		additional: Partial<ILiveSyncCommandHelperAdditionalOptions>,
	): ILiveSyncCommandHelperAdditionalOptions => ({
		deviceDebugMap: {
			[selectedDeviceForDebug.deviceInfo.identifier]: true,
		},
		buildPlatform: undefined,
		skipNativePrepare: false,
		...additional,
	});

	await $liveSyncCommandHelper.executeLiveSyncOperation(
		[selectedDeviceForDebug],
		platform,
		liveSyncOptions({}),
	);

	if (!commandShortcutsEnabled()) {
		return;
	}

	// The device map is what keeps the debugger attached across a re-prepare,
	// so the shared restart — which knows nothing of it — cannot stand in here.
	// The plain app restart needs no stand-in: it goes through the run
	// controller, whose persisted descriptor already has debugging enabled.
	const restartDebugSession = (
		forceRebuildNativeApp: boolean = false,
	): Promise<void> =>
		$liveSyncCommandHelper.executeLiveSyncOperation(
			[selectedDeviceForDebug],
			platform,
			liveSyncOptions(<Partial<ILiveSyncCommandHelperAdditionalOptions>>{
				restartLiveSync: true,
				...(forceRebuildNativeApp ? { forceRebuildNativeApp: true } : {}),
			}),
		);

	context.injector.get(KeyShortcutRegistry).add(
		restartShortcut(),
		restartShortcut({ full: true, restart: () => restartDebugSession() }),
		restartShortcut({
			forceRebuildNativeApp: true,
			restart: () => restartDebugSession(true),
		}),
		watcherShortcut(),
	);

	const keyShortcutService =
		context.injector.get<IKeyShortcutService>("keyShortcutService");
	if (keyShortcutService.attach({ shortcuts: [] })) {
		keyShortcutService.printHint();
	}
}

function isValidTimeoutOption(timeout: string): boolean {
	if (!timeout) {
		return true;
	}

	const parsed = parseInt(timeout, 10);
	if (parsed === 0) {
		return true;
	}

	if (!parsed) {
		return false;
	}

	return true;
}

const defineApplePlatformDebugCommand = <const TName extends CommandName>(
	name: TName,
	debugPlatform: "iOS" | "visionOS",
) =>
	defineCommand({
		name,
		description:
			"Debugs your project on a connected Apple device or simulator.",
		options: debugCommandOptions,
		// Arguments have never been rejected here, only ignored.
		arguments: "any",
		providers: [provideProject()],
		async canExecute(context): Promise<boolean> {
			const $devicePlatformsConstants =
				inject<Mobile.IDevicePlatformsConstants>("devicePlatformsConstants");
			const $platformValidationService = inject<IPlatformValidationService>(
				"platformValidationService",
			);
			const $projectData = inject(ProjectData);
			const $sysInfo = inject<ISysInfo>("sysInfo");
			const platform = $devicePlatformsConstants[debugPlatform];

			// Do not dispose ios-device-lib, so the process will remain alive and the debug application (NativeScript Inspector or Chrome DevTools) will be able to connect to the socket.
			// In case we dispose ios-device-lib, the socket will be closed and the code will fail when the debug application tries to read/send data to device socket.
			// That's why the `$ ns debug ios --justlaunch` command will not release the terminal.
			// In case we do not set it to false, the dispose will be called once the command finishes its execution, which will prevent the debugging.
			inject<IIOSDeviceOperations>("iosDeviceOperations").setShouldDispose(
				false,
			);
			inject<Mobile.IiOSSimulatorLogProvider>(
				"iOSSimulatorLogProvider",
			).setShouldDispose(false);

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

			if (!isValidTimeoutOption(context.options.timeout)) {
				context.fail(
					`Timeout option specifies the seconds NativeScript CLI will wait to find the inspector socket port from device's logs. Must be a number.`,
					{ help: false },
				);
			}

			if (context.options.inspector) {
				const macOSWarning = await $sysInfo.getMacOSWarningMessage();
				if (
					macOSWarning &&
					macOSWarning.severity === SystemWarningsSeverity.high
				) {
					context.fail(
						`You cannot use NativeScript Inspector on this OS. To use it, please update your OS.`,
						{ help: false },
					);
				}
			}

			return canExecuteDebugCommand(context, debugPlatform);
		},
		run: (context) => runDebugCommand(context, debugPlatform),
	});

export const iosDebugCommand = defineApplePlatformDebugCommand(
	"debug|ios",
	"iOS",
);

export const visionDebugCommand = defineApplePlatformDebugCommand(
	["debug|vision", "debug|visionos"],
	"visionOS",
);

export const androidDebugCommand = defineCommand({
	name: "debug|android",
	description: "Debugs your project on a connected Android device or emulator.",
	options: debugCommandOptions,
	arguments: "any",
	providers: [provideProject()],
	async canExecute(context): Promise<boolean> {
		const canExecuteBase = await canExecuteDebugCommand(context, "Android");
		if (canExecuteBase) {
			if (context.options.aab && !hasValidAndroidSigning(context.options)) {
				context.fail(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
			}
		}

		return canExecuteBase;
	},
	run: (context) => runDebugCommand(context, "Android"),
});
