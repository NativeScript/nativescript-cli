import { Contract } from "../di/contract";
import type { Injector } from "../di/injector";

/**
 * What every shortcut can count on. The context carries state; capabilities
 * come from the injector. Callers extend it with the dimensions their own
 * tables ask about — nothing in the engine inspects the context beyond handing
 * it to `when` and `action`.
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
	printHint(): void;
}

/** What `add` hands back; the only way to take a registration out again. */
export interface KeyShortcutRegistration {
	dispose(): void;
}

/**
 * The shortcuts the running process answers to. Registrations are owned by
 * whoever made them: attaching and detaching the engine disposes only the
 * batch attach itself registered, so entries a lifecycle registered on its own
 * survive until that lifecycle disposes them.
 */
@Contract({ name: "keyShortcutRegistry" })
export abstract class KeyShortcutRegistry {
	/** Later registrations shadow earlier ones per key; disposing restores what was shadowed. */
	abstract add(...shortcuts: KeyShortcut[]): KeyShortcutRegistration;
	/**
	 * Every entry in registration order. The dedupe by key is the reader's, so
	 * that a disposal exposes what it shadowed without the registry tracking it.
	 */
	abstract entries(): KeyShortcut[];
}

const OFF_VALUES = ["0", "false", "off", "no"];

/** Reads an env switch by the convention `NS_KEY_SHORTCUTS` established. */
export function envSwitchIsOn(value: string): boolean {
	return value !== undefined && !OFF_VALUES.includes(value.toLowerCase());
}

/**
 * Whether a command's declared `shortcuts` are attached when it runs. Off
 * unless `NS_COMMAND_SHORTCUTS` says otherwise: a command that takes the
 * terminal into raw mode and stays resident is not what a plain `ns run` or
 * `ns debug` has ever done.
 */
export function commandShortcutsEnabled(): boolean {
	return envSwitchIsOn(process.env.NS_COMMAND_SHORTCUTS);
}
