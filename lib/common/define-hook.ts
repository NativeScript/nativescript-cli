/**
 * The typed hook-authoring API. Kept import-free so that a hook (or an
 * extension carrying its own copy of the CLI) can load it without booting a
 * second runtime — importing lib/common/yok creates global.$injector.
 */

/**
 * `Symbol.for` rather than a module-local symbol: an extension may resolve a
 * duplicated copy of the CLI from its own node_modules, and the running CLI
 * still has to recognize definitions minted by that copy.
 */
export const HOOK_DEFINITION_MARKER = Symbol.for(
	"nativescript:cli:hookDefinition",
);

/**
 * Wraps the method the hook point decorates. `next` continues the chain — call
 * it with `args` to run the original, or skip it to short-circuit.
 */
export type HookMiddleware = (
	args: any[],
	next: (...args: any[]) => any,
) => any;

export interface IHookContext {
	/**
	 * The payload of the operation being hooked. Its shape depends on the hook
	 * point, and it is the caller's own object: mutating it is a supported
	 * channel for influencing the operation.
	 */
	payload: any;

	/** Registers a middleware around the method this hook point decorates. */
	wrap(middleware: HookMiddleware): void;

	/**
	 * Stops the hook. With `asWarning`, the CLI logs the message and continues
	 * the command; otherwise the command fails.
	 */
	abort(message: string, opts?: { asWarning?: boolean }): never;
}

export type HookHandler = (ctx: IHookContext) => void | Promise<void>;

export interface IHookDefinition {
	/** Hook point, in the hyphen convention: `before-prepare`, `after-watch`. */
	readonly name: string;
	readonly handler: HookHandler;
}

export interface IHookInvocation {
	context: IHookContext;
	/** Populated by `ctx.wrap()` while the handler runs. */
	middlewares: HookMiddleware[];
}

export function defineHook(
	name: string,
	handler: HookHandler,
): IHookDefinition {
	const definition: IHookDefinition = { name, handler };
	Object.defineProperty(definition, HOOK_DEFINITION_MARKER, { value: true });
	return definition;
}

export function isHookDefinition(value: any): boolean {
	return (
		!!value &&
		(typeof value === "object" || typeof value === "function") &&
		value[HOOK_DEFINITION_MARKER] === true &&
		typeof value.handler === "function"
	);
}

/**
 * Derives the context from the raw hook argument bag: the `hookArgs` wrapper
 * when the hook point supplies one, the bag itself for hook points that pass
 * their keys at the top level, and nothing when there is no payload.
 */
export function createHookInvocation(hookArguments: any): IHookInvocation {
	const middlewares: HookMiddleware[] = [];
	const context: IHookContext = {
		payload: derivePayload(hookArguments),
		wrap(middleware: HookMiddleware): void {
			middlewares.push(middleware);
		},
		abort(message: string, opts?: { asWarning?: boolean }): never {
			const error: any = new Error(message);
			if (opts && opts.asWarning) {
				// The pair the hooks service checks for to downgrade a rejection.
				error.stopExecution = false;
				error.errorAsWarning = true;
			}
			throw error;
		},
	};

	return { context, middlewares };
}

function derivePayload(hookArguments: any): any {
	if (!hookArguments || typeof hookArguments !== "object") {
		return undefined;
	}

	if ("hookArgs" in hookArguments) {
		return hookArguments["hookArgs"];
	}

	return Object.keys(hookArguments).length ? hookArguments : undefined;
}
