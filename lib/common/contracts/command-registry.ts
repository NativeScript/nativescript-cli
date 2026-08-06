import { Contract } from "../di/contract";
import type { ICommand } from "../definitions/commands";

export interface DeferredCommandOptions {
	/**
	 * Names the registrant in conflict and failure reports. Re-registering the
	 * same command under the same owner is a no-op rather than a conflict.
	 */
	owner: string;
	/** Where the implementation comes from; named when loading it fails. */
	source: string;
	/**
	 * Runs on first resolution of the command. It must leave a real resolver on
	 * the command name — by exporting a definition the caller registers, or by
	 * registering the command itself.
	 */
	load: () => void;
}

/** Why a deferred registration did not take effect. */
export type DeferredCommandRejection =
	/** The name can never be dispatched; `detail` says why. */
	| { reason: "invalid-name"; detail: string }
	/** Another owner registered the same command first. */
	| { reason: "claimed"; owner: string }
	/** The CLI itself provides the command. */
	| { reason: "built-in" }
	/** The name is in use as the dispatcher for subcommands under it. */
	| { reason: "subcommand-parent" }
	/**
	 * The name's direct parent is a command of its own, so no dispatcher can be
	 * built for it and the name could never be reached.
	 */
	| { reason: "parent-is-command"; parent: string };

/**
 * Outcome of a deferred registration. Callers branch on `rejection.reason`
 * rather than on message text, so the wording of the report stays theirs.
 */
export interface DeferredCommandResult {
	registered: boolean;
	/** Set exactly when `registered` is false. */
	rejection?: DeferredCommandRejection;
}

/**
 * The command-registry face of the injector facade. Transitional contract: it
 * mirrors what consumers call today, so that extracting the registry from the
 * facade later is a provider swap for this token, not a consumer migration.
 * Members slated for replacement keep their deprecation markers.
 */
@Contract({ name: "commandRegistry" })
export abstract class CommandRegistry {
	/**
	 * @deprecated Path-based command registration; use registerDeferredCommand,
	 * which routes without loading and reports conflicts structurally.
	 */
	abstract requireCommand(names: string | string[], file: string): void;
	abstract registerCommand(names: string | string[], resolver: any): void;
	/**
	 * Claims a command name for an owner without loading anything: routing —
	 * including the dispatcher of a hierarchical parent — is built from the name
	 * alone, and `load` runs only when that one command is resolved.
	 */
	abstract registerDeferredCommand(
		name: string,
		options: DeferredCommandOptions,
	): DeferredCommandResult;
	abstract resolveCommand(name: string): ICommand;
	abstract getRegisteredCommandsNames(includeDev: boolean): string[];
	abstract getChildrenCommandsNames(commandName: string): string[];
	abstract buildHierarchicalCommand(
		parentCommandName: string,
		commandLineArguments: string[],
	): any;
	/** Side-effecting: fails with help output on a bad subcommand. */
	abstract isValidHierarchicalCommand(
		commandName: string,
		commandArguments: string[],
	): Promise<boolean>;
	abstract isDefaultCommand(commandName: string): boolean;
}
