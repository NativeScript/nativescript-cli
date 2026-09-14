import { stripVTControlCharacters } from "node:util";
import { color } from "../color";
import { IChildProcess } from "../common/declarations";
import { Injector } from "../common/di/injector";
import { runCommand } from "../common/services/command-definition-adapter";
import { injector } from "../common/yok";
import { IStartService } from "../definitions/start-service";

/** A terminal in raw mode delivers this byte instead of raising SIGINT. */
const CTRL_C = "\u0003";
const HELP_KEY = "?";
const WORKFLOW_GROUP = "Development Workflow";

/**
 * What every shortcut can count on. The context carries state; capabilities
 * come from the injector. Callers extend it with the dimensions their own
 * tables ask about — nothing here inspects the context beyond handing it to
 * `when` and `action`.
 */
export interface KeyContextBase {
	injector: Injector;
}

/** The half of a context its caller owns; the service provides the rest. */
export type KeyContextExtras<TContext extends KeyContextBase> = Omit<
	TContext,
	keyof KeyContextBase
>;

export interface KeyShortcut<TContext extends KeyContextBase = KeyContextBase> {
	key: string;
	description: string;
	group?: string;
	/** Availability AND help visibility — one verdict feeds both. */
	when?(ctx: TContext): boolean;
	action?(ctx: TContext): void | Promise<void>;
	/**
	 * Suppresses the keypress banner. Set by shortcuts that hand the key to a
	 * child process, which announces and runs it itself.
	 */
	quiet?: boolean;
}

export interface IKeyShortcutService {
	/** Returns false when the terminal cannot take raw mode. */
	attach<TContext extends KeyContextBase = KeyContextBase>(options: {
		context?: KeyContextExtras<TContext>;
		shortcuts: KeyShortcut<TContext>[];
	}): boolean;
	detach(): void;
	printHelp(): void;
}

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

const OFF_VALUES = ["0", "false", "off", "no"];

/**
 * Raw mode outlives the process that set it, so a CI runner or a redirected
 * stdin must never get it; `NS_KEY_SHORTCUTS=false` is the manual opt-out.
 */
export function keyShortcutsEnabled(): boolean {
	const setting = process.env.NS_KEY_SHORTCUTS;
	if (setting !== undefined) {
		return !OFF_VALUES.includes(setting.toLowerCase());
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

const restart = async (
	ctx: NsKeyContext,
	forceRebuildNativeApp: boolean,
): Promise<void> => {
	const $liveSyncCommandHelper = ctx.injector.get<ILiveSyncCommandHelper>(
		"liveSyncCommandHelper",
	);
	const devices = await $liveSyncCommandHelper.getDeviceInstances(ctx.platform);

	await $liveSyncCommandHelper.executeLiveSyncOperation(devices, ctx.platform, <
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
		{
			key: "A",
			description: "Open project in Android Studio",
			group: "Android",
			when: onPlatform("Android"),
			action: () => runCommand("open|android"),
		},
		{
			key: "i",
			description: "Run iOS app",
			group: "iOS",
			when: duringStart("iOS"),
			action: launch((startService) => startService.runIOS()),
		},
		{
			key: "I",
			description: "Open project in Xcode",
			group: "iOS",
			when: onPlatform("iOS"),
			action: () => runCommand("open|ios"),
		},
		{
			key: "v",
			description: "Run visionOS app",
			group: "visionOS",
			when: duringStart("visionOS"),
			action: launch((startService) => startService.runVisionOS()),
		},
		{
			key: "V",
			description: "Open project in Xcode",
			group: "visionOS",
			when: onPlatform("visionOS"),
			action: () => runCommand("open|visionos"),
		},
		{
			key: "r",
			description: "Rebuild native app if needed and restart",
			group: WORKFLOW_GROUP,
			action: (ctx) => restart(ctx, false),
		},
		{
			key: "R",
			description: "Force rebuild native app and restart",
			group: WORKFLOW_GROUP,
			action: (ctx) => restart(ctx, true),
		},
		{
			key: "w",
			description: "Toggle file watcher",
			group: WORKFLOW_GROUP,
			action: toggleFileWatcher,
		},
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
	/** The table as the caller declared it; `when` is applied per read. */
	private shortcuts: KeyShortcut<any>[] = [];
	private context: KeyContextBase;
	private running: boolean = false;
	private attached: boolean = false;

	constructor(
		private $injector: Injector,
		private $logger: ILogger,
	) {}

	public attach<TContext extends KeyContextBase = KeyContextBase>(options: {
		context?: KeyContextExtras<TContext>;
		shortcuts: KeyShortcut<TContext>[];
	}): boolean {
		this.detach();

		this.context = { ...options.context, injector: this.$injector };
		this.shortcuts = options.shortcuts;

		const stdin = process.stdin;
		if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
			// Keys reach a spawned `ns run` over IPC; its stdin is not a terminal.
			process.on("message", this.onMessage);
			this.attached = true;

			return true;
		}

		if (!keyShortcutsEnabled()) {
			return false;
		}

		stdin.setRawMode(false);
		stdin.setRawMode(true);
		stdin.resume();
		stdin.on("data", this.onData);
		process.once("exit", this.onExit);
		this.attached = true;

		return true;
	}

	public detach(): void {
		if (!this.attached) {
			return;
		}
		this.attached = false;

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

	/**
	 * Help and dispatch each read the table through this one function, so a
	 * `when` that changes while the process runs moves both together.
	 */
	private resolve(): KeyShortcut[] {
		return resolveShortcuts(this.shortcuts, this.context);
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
