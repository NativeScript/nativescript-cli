import { EventEmitter } from "events";
import { stripVTControlCharacters } from "node:util";
import { color } from "../color";
import { RunOnDeviceEvents } from "../constants";
import { IChildProcess } from "../common/declarations";
import { Injector } from "../common/di/injector";
import {
	envSwitchIsOn,
	IKeyShortcutService,
	KeyContextBase,
	KeyContextExtras,
	KeyShortcut,
	KeyShortcutRegistration,
	KeyShortcutRegistry,
} from "../common/contracts/key-shortcuts";
import { runCommand } from "../common/services/command-definition-adapter";
import { injector } from "../common/yok";
import { IProjectDataService } from "../definitions/project";
import { IStartService } from "../definitions/start-service";

/** A terminal in raw mode delivers this byte instead of raising SIGINT. */
const CTRL_C = "\u0003";
const HELP_KEY = "?";
const WORKFLOW_GROUP = "Development Workflow";

/**
 * Session events that end a burst of output; the hint is repeated after them
 * so it sits below the latest sync rather than scrolled out of view.
 */
const HINT_EVENTS: string[] = [
	RunOnDeviceEvents.runOnDeviceStarted,
	RunOnDeviceEvents.runOnDeviceExecuted,
	RunOnDeviceEvents.runOnDeviceError,
];
/** Several devices report the same sync within this window; print once. */
const HINT_DEBOUNCE_MS = 200;

// The shortcut vocabulary lives with the registry contract, so that the
// command API can type a `shortcuts` field without reaching into this module.
export type {
	IKeyShortcutService,
	KeyContextBase,
	KeyContextExtras,
	KeyShortcut,
	KeyShortcutRegistration,
};
export { KeyShortcutRegistry };

const helpShortcut: KeyShortcut = {
	key: HELP_KEY,
	description: "Show this help",
	group: WORKFLOW_GROUP,
	action: (ctx) =>
		ctx.injector.get<IKeyShortcutService>("keyShortcutService").printHelp(),
};

/**
 * Later entries replace earlier ones by key, keeping the position the key was
 * first declared at so help stays ordered; `?` is reserved and cannot be
 * replaced. Dropping `action` removes a shortcut outright — it disappears from
 * help and the key goes inert.
 */
export function resolveShortcuts<TContext extends KeyContextBase>(
	shortcuts: KeyShortcut<TContext>[],
	ctx: TContext,
): KeyShortcut<TContext>[] {
	const byKey = new Map<string, KeyShortcut<TContext>>();

	for (const shortcut of shortcuts) {
		if (shortcut.key === HELP_KEY) {
			continue;
		}
		byKey.set(shortcut.key, shortcut);
	}

	byKey.set(HELP_KEY, helpShortcut);

	return Array.from(byKey.values()).filter(
		(shortcut) =>
			shortcut.action !== undefined && (!shortcut.when || shortcut.when(ctx)),
	);
}

/**
 * Reading the entry back rather than restating it is what keeps a redefinition
 * from drifting away from the help text it replaces.
 */
export function findShortcut<TContext extends KeyContextBase>(
	shortcuts: KeyShortcut<TContext>[],
	key: string,
): KeyShortcut<TContext> {
	const shortcut = shortcuts.find((candidate) => candidate.key === key);
	if (!shortcut) {
		throw new Error(`No key shortcut is defined for '${key}'.`);
	}

	return shortcut;
}

/**
 * Raw mode outlives the process that set it, so a CI runner or a redirected
 * stdin must never get it; `NS_KEY_SHORTCUTS=false` is the manual opt-out.
 */
export function keyShortcutsEnabled(): boolean {
	const setting = process.env.NS_KEY_SHORTCUTS;
	if (setting !== undefined) {
		return envSwitchIsOn(setting);
	}

	if (process.env.CI || process.env.JENKINS_HOME) {
		return false;
	}

	return !!process.stdin.isTTY;
}

/**
 * The names `devicePlatformsConstants` hands out, read off the constants
 * rather than spelled again here.
 */
export type DevicePlatformName = {
	[
		K in keyof Mobile.IDevicePlatformsConstants
	]: Mobile.IDevicePlatformsConstants[K] extends string ? K : never;
}[keyof Mobile.IDevicePlatformsConstants];

export type KeyProcessType = "start" | "run";

/** What the NativeScript shortcuts below ask about, beyond the base context. */
export interface NsKeyContext extends KeyContextBase {
	/** The platform being watched; unset while `ns start` owns the terminal. */
	platform?: DevicePlatformName;
	processType: KeyProcessType;
}

const onPlatform =
	(platform: DevicePlatformName) =>
	(ctx: NsKeyContext): boolean =>
		!ctx.platform || ctx.platform === platform;

const duringStart =
	(platform: DevicePlatformName) =>
	(ctx: NsKeyContext): boolean =>
		ctx.processType === "start" && onPlatform(platform)(ctx);

const launch =
	(run: (startService: IStartService) => Promise<void>) =>
	(ctx: NsKeyContext): Promise<void> =>
		run(ctx.injector.get<IStartService>("startService"));

/** The devices of the running session, narrowed to one platform. */
const sessionDevicesOnPlatform = (
	ctx: NsKeyContext,
	projectDir: string,
	platform: DevicePlatformName,
): string[] => {
	const $devicesService =
		ctx.injector.get<Mobile.IDevicesService>("devicesService");
	const onPlatform = $devicesService
		.getDevicesForPlatform(platform)
		.map((device) => device.deviceInfo.identifier);

	return ctx.injector
		.get<IRunController>("runController")
		.getDeviceDescriptors({ projectDir })
		.map((descriptor) => descriptor.identifier)
		.filter((identifier) => onPlatform.includes(identifier));
};

const restartApp = async (
	ctx: NsKeyContext,
	platform: DevicePlatformName,
): Promise<void> => {
	const $runController = ctx.injector.get<IRunController>("runController");
	const { projectDir } = ctx.injector
		.get<IProjectDataService>("projectDataService")
		.getProjectData();
	const target = platform || ctx.platform;
	if (!target) {
		await $runController.restartApplication({ projectDir });
		return;
	}

	// An empty list would mean "every device" to the run controller.
	const deviceIdentifiers = sessionDevicesOnPlatform(ctx, projectDir, target);
	if (!deviceIdentifiers.length) {
		console.info(`There is no ${target} device in the running session.`);
		return;
	}

	await $runController.restartApplication({ projectDir, deviceIdentifiers });
};

const restart = async (
	ctx: NsKeyContext,
	platform: DevicePlatformName,
	forceRebuildNativeApp: boolean,
): Promise<void> => {
	const $liveSyncCommandHelper = ctx.injector.get<ILiveSyncCommandHelper>(
		"liveSyncCommandHelper",
	);
	const target = platform || ctx.platform;
	const devices = await $liveSyncCommandHelper.getDeviceInstances(target);

	await $liveSyncCommandHelper.executeLiveSyncOperation(devices, target, <
		ILiveSyncCommandHelperAdditionalOptions
	>{
		restartLiveSync: true,
		...(forceRebuildNativeApp
			? { skipNativePrepare: false, forceRebuildNativeApp: true }
			: {}),
	});
};

const toggleFileWatcher = async (ctx: NsKeyContext): Promise<void> => {
	const $prepareController =
		ctx.injector.get<IPrepareController>("prepareController");

	try {
		const paused = await $prepareController.toggleFileWatcher();
		process.stdout.write(
			paused
				? color.gray("Paused watching file changes... Press 'w' to resume.")
				: color.bgGreen("Resumed watching file changes"),
		);
	} catch (e) {}
};

const cleanProject = async (ctx: NsKeyContext): Promise<void> => {
	const $childProcess = ctx.injector.get<IChildProcess>("childProcess");
	const $liveSyncCommandHelper = ctx.injector.get<ILiveSyncCommandHelper>(
		"liveSyncCommandHelper",
	);

	await $liveSyncCommandHelper.stop();

	const clean = $childProcess.spawn("ns", ["clean"]);
	clean.stdout.on("data", (data: Buffer) => {
		process.stdout.write(data);
		if (
			data.toString().includes("Project successfully cleaned.") ||
			data.toString().includes("Project unsuccessfully cleaned.")
		) {
			clean.kill("SIGINT");
		}
	});
};

export interface RestartShortcutOptions {
	/** Declares `R`: prepares the project again before restarting the app. */
	full?: boolean;
	/** Declares `B`: rebuilds the native app whether or not it changed. */
	forceRebuildNativeApp?: boolean;
	/** Restricts the restart to one platform; unset takes it from the context. */
	platform?: DevicePlatformName;
	/**
	 * Replaces the restart itself, keeping the key and its help text — for a
	 * caller whose restart has to carry state the shared one knows nothing of,
	 * such as an attached debug session.
	 */
	restart?(): Promise<void>;
}

/**
 * One rung of the restart ladder: `r` restarts the running app and nothing
 * else, `R` prepares the project again first, `B` also rebuilds the native
 * app whether or not anything changed.
 */
export function restartShortcut(
	options: RestartShortcutOptions = {},
): KeyShortcut<NsKeyContext> {
	const force = options.forceRebuildNativeApp === true;
	const full = force || options.full === true;

	return {
		key: force ? "B" : full ? "R" : "r",
		description: force
			? "Rebuild native app and restart"
			: full
				? "Re-prepare and restart the app (rebuilds native app if needed)"
				: "Restart the app",
		group: WORKFLOW_GROUP,
		action: (ctx) =>
			options.restart
				? options.restart()
				: full
					? restart(ctx, options.platform, force)
					: restartApp(ctx, options.platform),
	};
}

/** Pauses and resumes the file watcher. */
export function watcherShortcut(): KeyShortcut<NsKeyContext> {
	return {
		key: "w",
		description: "Toggle file watcher",
		group: WORKFLOW_GROUP,
		action: toggleFileWatcher,
	};
}

const IDE_SHORTCUTS: {
	[K in DevicePlatformName]: { key: string; description: string };
} = {
	Android: { key: "A", description: "Open project in Android Studio" },
	iOS: { key: "I", description: "Open project in Xcode" },
	visionOS: { key: "V", description: "Open project in Xcode" },
};

/** Opens the platform's native project in the IDE that builds it. */
export function openIdeShortcut(
	platform: DevicePlatformName,
): KeyShortcut<NsKeyContext> {
	const { key, description } = IDE_SHORTCUTS[platform];

	return {
		key,
		description,
		group: platform,
		when: onPlatform(platform),
		action: () => runCommand(`open|${platform.toLowerCase()}`),
	};
}

/**
 * The shortcuts every interactive process shares. `ns start` appends its own
 * entries on top of these; the `ns run` children it spawns use them as they
 * are, driven over IPC.
 */
export function keyShortcuts(): KeyShortcut<NsKeyContext>[] {
	return [
		{
			key: "a",
			description: "Run Android app",
			group: "Android",
			when: duringStart("Android"),
			action: launch((startService) => startService.runAndroid()),
		},
		openIdeShortcut("Android"),
		{
			key: "i",
			description: "Run iOS app",
			group: "iOS",
			when: duringStart("iOS"),
			action: launch((startService) => startService.runIOS()),
		},
		openIdeShortcut("iOS"),
		{
			key: "v",
			description: "Run visionOS app",
			group: "visionOS",
			when: duringStart("visionOS"),
			action: launch((startService) => startService.runVisionOS()),
		},
		openIdeShortcut("visionOS"),
		restartShortcut(),
		restartShortcut({ full: true }),
		restartShortcut({ forceRebuildNativeApp: true }),
		watcherShortcut(),
		{
			key: "c",
			description: "Clean project",
			group: WORKFLOW_GROUP,
			action: cleanProject,
		},
		{
			key: "n",
			description: "Install dependencies",
			group: WORKFLOW_GROUP,
			action: () => runCommand("install"),
		},
	];
}

export class KeyShortcutService implements IKeyShortcutService {
	/** The batch `attach` registered, disposed when it is replaced or detached. */
	private attachedShortcuts: KeyShortcutRegistration;
	private context: KeyContextBase;
	private running: boolean = false;
	private attached: boolean = false;
	private hintSource: EventEmitter;
	private hintTimer: NodeJS.Timeout;

	constructor(
		private $injector: Injector,
		private $logger: ILogger,
		private $keyShortcutRegistry: KeyShortcutRegistry,
	) {}

	public attach<TContext extends KeyContextBase = KeyContextBase>(options: {
		context?: KeyContextExtras<TContext>;
		shortcuts: KeyShortcut<TContext>[];
	}): boolean {
		this.detach();

		this.context = { ...options.context, injector: this.$injector };
		this.attachedShortcuts = this.$keyShortcutRegistry.add(
			...options.shortcuts,
		);

		const stdin = process.stdin;
		if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
			// Keys reach a spawned `ns run` over IPC; its stdin is not a terminal.
			process.on("message", this.onMessage);
			this.attached = true;

			return true;
		}

		if (!keyShortcutsEnabled()) {
			this.releaseShortcuts();
			return false;
		}

		stdin.setRawMode(false);
		stdin.setRawMode(true);
		stdin.resume();
		stdin.on("data", this.onData);
		process.once("exit", this.onExit);
		this.attached = true;
		this.repeatHintAfterSyncs();

		return true;
	}

	public detach(): void {
		this.releaseShortcuts();

		if (!this.attached) {
			return;
		}
		this.attached = false;
		this.stopRepeatingHint();

		process.off("message", this.onMessage);
		process.off("exit", this.onExit);

		const stdin = process.stdin;
		stdin.off("data", this.onData);
		if (stdin.isTTY && typeof stdin.setRawMode === "function") {
			stdin.setRawMode(false);
			stdin.pause();
		}
	}

	public printHelp(): void {
		const printedGroups: { [group: string]: boolean } = {};
		const lines: string[] = [];

		for (const shortcut of this.resolve()) {
			if (shortcut.group && !printedGroups[shortcut.group]) {
				printedGroups[shortcut.group] = true;
				lines.push(` \n${color.underline(color.bold(shortcut.group))}\n`);
			}
			lines.push(`   ${color.bold(shortcut.key)} — ${shortcut.description}`);
		}

		console.info(
			[
				"",
				`  The CLI is ${color.underline(
					`interactive`,
				)}, you can press the following keys any time (make sure the terminal has focus).`,
				"",
				...lines,
				"",
			].join("\n"),
		);
	}

	/** One compact line where the full table would drown the output. */
	public printHint(): void {
		if (!process.stdin.isTTY) {
			return;
		}

		console.info(color.dim(` › press ${HELP_KEY} to list shortcuts`));
	}

	/**
	 * The run controller is optional here: the engine also serves commands
	 * that never start a session, and the tests build it without one.
	 */
	private repeatHintAfterSyncs(): void {
		const runController = this.$injector.get<EventEmitter>("runController", {
			optional: true,
		});
		if (!runController || typeof runController.on !== "function") {
			return;
		}

		this.hintSource = runController;
		for (const event of HINT_EVENTS) {
			runController.on(event, this.onSyncSettled);
		}
	}

	private stopRepeatingHint(): void {
		clearTimeout(this.hintTimer);
		this.hintTimer = undefined;

		if (!this.hintSource) {
			return;
		}
		for (const event of HINT_EVENTS) {
			this.hintSource.off(event, this.onSyncSettled);
		}
		this.hintSource = undefined;
	}

	private onSyncSettled = (): void => {
		clearTimeout(this.hintTimer);
		this.hintTimer = setTimeout(() => {
			this.hintTimer = undefined;
			this.printHint();
		}, HINT_DEBOUNCE_MS);
		// A pending hint must not be what keeps the CLI alive.
		this.hintTimer.unref?.();
	};

	/**
	 * Help and dispatch each read the registry through this one function, so a
	 * `when` that changes while the process runs — or an entry registered after
	 * the attach — moves both together.
	 */
	private resolve(): KeyShortcut[] {
		return resolveShortcuts(this.$keyShortcutRegistry.entries(), this.context);
	}

	private releaseShortcuts(): void {
		if (!this.attachedShortcuts) {
			return;
		}

		this.attachedShortcuts.dispose();
		this.attachedShortcuts = undefined;
	}

	private onData = (data: Buffer): void => {
		void this.dispatch(data.toString());
	};

	private onMessage = (key: string): void => {
		void this.dispatch(key);
	};

	private onExit = (): void => {
		this.detach();
	};

	private async dispatch(key: string): Promise<void> {
		if (key === CTRL_C) {
			this.interrupt();
			return;
		}

		if (this.running) {
			return;
		}

		const shortcut = this.resolve().find((candidate) => candidate.key === key);
		if (!shortcut) {
			process.stdout.write(key);
			return;
		}

		this.running = true;
		try {
			if (!shortcut.quiet) {
				this.announce(shortcut);
			}

			await shortcut.action(this.context);
		} catch (e) {
			this.$logger.error(e.message);
		} finally {
			this.running = false;
			if (process.stdin.setRawMode) {
				process.stdin.resume();
			}
		}
	}

	private interrupt(): void {
		this.detach();
		// Raw mode turned the interrupt into a byte; re-raise it so the default
		// disposition, rather than this process, decides what happens.
		process.kill(process.pid, "SIGINT");
	}

	private announce(shortcut: KeyShortcut): void {
		const line = ` ${color.dim("→")} ${color.bold(shortcut.key)} — ${
			shortcut.description
		}`;
		const lineLength = stripVTControlCharacters(line).length - 1;
		console.log(color.dim(` ┌${"─".repeat(lineLength)}┐`));
		console.log(line + color.dim(" │"));
		console.log(color.dim(` └${"─".repeat(lineLength)}┘`));
		console.log("");
	}
}

injector.register("keyShortcutService", KeyShortcutService);
