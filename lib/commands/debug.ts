import { IErrors, ISysInfo } from "../common/declarations";
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
	injectPlatformCommandServices,
	IPlatformCommandServices,
} from "./command-base";
import * as _ from "lodash";

/** Which `$devicePlatformsConstants` entry a command debugs. */
type DebugPlatform = "iOS" | "Android" | "visionOS";

const debugCommandOptions = {
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

export type DebugCommandContext = CommandContext<typeof debugCommandOptions>;

export interface IDebugCommandServices extends IPlatformCommandServices {
	platform: string;
	$cleanupService: ICleanupService;
	$debugController: IDebugController;
	$debugDataService: IDebugDataService;
	$devicePlatformsConstants: Mobile.IDevicePlatformsConstants;
	$devicesService: Mobile.IDevicesService;
	$errors: IErrors;
	$liveSyncCommandHelper: ILiveSyncCommandHelper;
	$migrateController: IMigrateController;
}

export function setupDebugCommand(
	debugPlatform: DebugPlatform,
): IDebugCommandServices {
	const $devicePlatformsConstants = inject<Mobile.IDevicePlatformsConstants>(
		"devicePlatformsConstants",
	);

	return {
		...injectPlatformCommandServices(),
		platform: $devicePlatformsConstants[debugPlatform],
		$cleanupService: inject<ICleanupService>("cleanupService"),
		$debugController: inject<IDebugController>("debugController"),
		$debugDataService: inject<IDebugDataService>("debugDataService"),
		$devicePlatformsConstants,
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$errors: inject<IErrors>("errors"),
		$liveSyncCommandHelper: inject<ILiveSyncCommandHelper>(
			"liveSyncCommandHelper",
		),
		$migrateController: inject<IMigrateController>("migrateController"),
	};
}

export async function canExecuteDebugCommand(
	context: DebugCommandContext,
	services: IDebugCommandServices,
): Promise<boolean> {
	// Keeping the cleanup process alive is what makes a debugger able to stay
	// attached, so it must not happen before the platform-specific checks that
	// run ahead of this function have had their chance to fail the command.
	services.$cleanupService.setShouldDispose(false);

	if (!context.options.force) {
		await services.$migrateController.validate({
			projectDir: services.$projectData.projectDir,
			platforms: [services.platform],
		});
	}

	if (
		!services.$platformValidationService.isPlatformSupportedForOS(
			services.platform,
			services.$projectData,
		)
	) {
		services.$errors.fail(
			`Applications for platform ${services.platform} can not be built on this OS`,
		);
	}

	if (context.options.release) {
		services.$errors.failWithHelp(
			"--release flag is not applicable to this command.",
		);
	}

	return canExecuteCommandBase(services, services.platform, {
		validateOptions: true,
	});
}

export async function runDebugCommand(
	context: DebugCommandContext,
	services: IDebugCommandServices,
): Promise<void> {
	await services.$devicesService.initialize({
		platform: services.platform,
		deviceId: context.options.device,
		emulator: context.options.emulator,
		skipDeviceDetectionInterval: true,
	});

	const selectedDeviceForDebug =
		await services.$devicesService.pickSingleDevice({
			onlyEmulators: context.options.emulator,
			onlyDevices: context.options.forDevice,
			deviceId: context.options.device,
		});

	if (context.options.start) {
		// The debug services read the whole parsed command line, including flags
		// no command declares, so the raw argv is what they get.
		const debugOptions = <IDebugOptions>_.cloneDeep(services.$options.argv);
		const debugData = services.$debugDataService.getDebugData(
			selectedDeviceForDebug.deviceInfo.identifier,
			services.$projectData,
			debugOptions,
		);
		await services.$debugController.printDebugInformation(
			await services.$debugController.startDebug(debugData),
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

	await services.$liveSyncCommandHelper.executeLiveSyncOperation(
		[selectedDeviceForDebug],
		services.platform,
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
		services.$liveSyncCommandHelper.executeLiveSyncOperation(
			[selectedDeviceForDebug],
			services.platform,
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

interface IDebugApplePlatformCommandServices extends IDebugCommandServices {
	$sysInfo: ISysInfo;
}

const setupDebugApplePlatformCommand =
	(debugPlatform: "iOS" | "visionOS") =>
	(): IDebugApplePlatformCommandServices => {
		const services = {
			...setupDebugCommand(debugPlatform),
			$sysInfo: inject<ISysInfo>("sysInfo"),
		};
		services.$projectData.initializeProjectData();

		// Do not dispose ios-device-lib, so the process will remain alive and the debug application (NativeScript Inspector or Chrome DevTools) will be able to connect to the socket.
		// In case we dispose ios-device-lib, the socket will be closed and the code will fail when the debug application tries to read/send data to device socket.
		// That's why the `$ ns debug ios --justlaunch` command will not release the terminal.
		// In case we do not set it to false, the dispose will be called once the command finishes its execution, which will prevent the debugging.
		inject<IIOSDeviceOperations>("iosDeviceOperations").setShouldDispose(false);
		inject<Mobile.IiOSSimulatorLogProvider>(
			"iOSSimulatorLogProvider",
		).setShouldDispose(false);

		return services;
	};

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
		setup: setupDebugApplePlatformCommand(debugPlatform),
		async canExecute(
			context: DebugCommandContext,
			services: IDebugApplePlatformCommandServices,
		): Promise<boolean> {
			if (
				!services.$platformValidationService.isPlatformSupportedForOS(
					services.platform,
					services.$projectData,
				)
			) {
				services.$errors.fail(
					`Applications for platform ${services.platform} can not be built on this OS`,
				);
			}

			if (!isValidTimeoutOption(context.options.timeout)) {
				services.$errors.fail(
					`Timeout option specifies the seconds NativeScript CLI will wait to find the inspector socket port from device's logs. Must be a number.`,
				);
			}

			if (context.options.inspector) {
				const macOSWarning = await services.$sysInfo.getMacOSWarningMessage();
				if (
					macOSWarning &&
					macOSWarning.severity === SystemWarningsSeverity.high
				) {
					services.$errors.fail(
						`You cannot use NativeScript Inspector on this OS. To use it, please update your OS.`,
					);
				}
			}

			return canExecuteDebugCommand(context, services);
		},
		run: runDebugCommand,
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
	setup(): IDebugCommandServices {
		const services = setupDebugCommand("Android");
		services.$projectData.initializeProjectData();

		return services;
	},
	async canExecute(
		context: DebugCommandContext,
		services: IDebugCommandServices,
	): Promise<boolean> {
		const canExecuteBase = await canExecuteDebugCommand(context, services);
		if (canExecuteBase) {
			if (context.options.aab && !hasValidAndroidSigning(context.options)) {
				services.$errors.failWithHelp(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
			}
		}

		return canExecuteBase;
	},
	run: runDebugCommand,
});
