import { InjectionToken } from "../di/injection-token";
import type { CommandContext } from "../define-command";

/**
 * The context of the command invocation that is running. Provided by a child
 * injector the adapter builds per invocation, so it resolves inside `setup`,
 * `canExecute`, `run`, `postRun` and `shortcuts` — and nowhere else. A service
 * registered on the root injector never sees it.
 */
export const COMMAND_CONTEXT = new InjectionToken<CommandContext<any>>(
	"commandContext",
);
