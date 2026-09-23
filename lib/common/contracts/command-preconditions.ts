import { InjectionToken } from "../di/injection-token";
import type { CommandContext } from "../define-command";

/**
 * A check on the environment a command runs in - a project to be inside, a
 * platform to be added, an account to be logged into - as opposed to a check
 * on its arguments, which is `canExecute`. It runs when the invocation opens,
 * before `setup` and before the arguments policy, in the invocation's
 * injection context, and a throw fails the invocation.
 */
export type CommandPrecondition = (
	context: CommandContext<any>,
) => void | Promise<void>;

/**
 * Multi token: each `{ provide: COMMAND_PRECONDITIONS, multi: true, ... }` in
 * a command's `providers` contributes one precondition, and they run in the
 * order they were declared.
 */
export const COMMAND_PRECONDITIONS = new InjectionToken<CommandPrecondition[]>(
	"commandPreconditions",
);
