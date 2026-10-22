import { Contract } from "../di/contract";
import type { Injector } from "../di/injector";
import type { CommandReference } from "../define-command";

export interface CommandDispatchOptions {
	/**
	 * The injector a definition run as given is compiled against, the way
	 * Angular's `createComponent` takes one. Omitted, the call's own injection
	 * context is used, and the root when there is none. A registered name keeps
	 * the scope it was registered under, so passing one with a name throws.
	 */
	injector?: Injector;
}

/**
 * Dispatches commands inside the running process: the surface a command, a
 * key shortcut or a plugin uses to run or consult another command. The command
 * line's own entry points into the dispatcher are not part of it.
 */
@Contract({ name: "commandsService" })
export abstract class CommandsService {
	/**
	 * Whether the command running now was dispatched in process rather than by
	 * the command line — what tells a command it is borrowing a host process
	 * instead of owning one.
	 */
	abstract readonly isExecutingInProcess: boolean;

	/**
	 * Runs a registered command in the current process. The command gets what a
	 * typed command line gives it — its declared options primed with their
	 * defaults, the arguments policy, `canExecute`, hooks and `postRun` — and a
	 * failure throws instead of exiting, so a process that has to keep running
	 * can catch it. Analytics do not fire: this is not a new CLI invocation.
	 *
	 * `command` is a registered name, looked up in the registry, or a
	 * definition or `Command()` class, which runs as given whether or not it is
	 * registered — the typed way to refer to a command. A parent name is routed
	 * to its subcommand as the command line routes it, and a subcommand fires
	 * its full hook name (`before-open-ios`) as well as its parent's.
	 *
	 * Dispatches nest: one may start from inside a running dispatch, but one
	 * started while another is in flight and not from inside it is rejected.
	 */
	abstract runCommand(
		command: CommandReference,
		args?: string[],
		options?: CommandDispatchOptions,
	): Promise<void>;

	/**
	 * Asks a registered command whether it could run on `args`, without running
	 * it. The command is resolved and its options primed exactly as for
	 * `runCommand`, and its own `canExecute` returns its verdict or throws — an
	 * arguments-policy violation, a setup failure or `ctx.fail`. The child
	 * builds its own setup from its own services, so nothing crosses between
	 * the two but the name and the arguments; pass only the arguments the
	 * child's own `arguments` policy accepts.
	 */
	abstract canExecuteCommand(
		command: CommandReference,
		args?: string[],
		options?: CommandDispatchOptions,
	): Promise<boolean>;
}
