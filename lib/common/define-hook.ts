/**
 * The typed hook-authoring API. Kept import-free so that a hook (or an
 * extension carrying its own copy of the CLI) can load it without booting a
 * second runtime — importing lib/common/yok creates global.$injector.
 */

/**
 * `Symbol.for` rather than a module-local symbol: an extension may resolve a
 * duplicated copy of the CLI from its own node_modules, and the running CLI
 * still has to recognize definitions minted by that copy.
 *
 * Assigned as a plain enumerable property so that `{ ...definition }` keeps the
 * marker; symbols stay invisible to Object.keys/for..in/JSON either way.
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

export interface HookContext<TPayload = any> {
	/**
	 * The payload of the operation being hooked. Its shape depends on the hook
	 * point, and it is the caller's own object: mutating it is a supported
	 * channel for influencing the operation. Hook points fired by command
	 * dispatch carry no payload at all, hence `undefined`.
	 */
	payload: TPayload | undefined;

	/**
	 * Registers a middleware around the method this hook point decorates.
	 * Available only to before-hooks of the hook points that fold middlewares
	 * around a method; elsewhere it throws rather than dropping the middleware.
	 */
	wrap(middleware: HookMiddleware): void;

	/**
	 * Ends the handler and fails the command with `message`.
	 *
	 * Typed `never` because it stops the handler by throwing, so nothing after
	 * the call runs.
	 */
	fail(message: string): never;

	/**
	 * Ends the handler and logs `message` as a warning; the command continues.
	 *
	 * Typed `never` because it stops the handler by throwing, so nothing after
	 * the call runs — only the command outlives it.
	 */
	skip(message: string): never;
}

export type HookHandler<TPayload = any> = (
	ctx: HookContext<TPayload>,
) => void | Promise<void>;

/** The object bag accepted by `defineHook`. */
export interface HookDefinitionInput<TPayload = any> {
	/** Hook point, in the hyphen convention: `before-prepare`, `after-watch`. */
	name: string;
	run: HookHandler<TPayload>;
}

export interface HookDefinition<TPayload = any> {
	/** Hook point, in the hyphen convention: `before-prepare`, `after-watch`. */
	readonly name: string;
	readonly run: HookHandler<TPayload>;
}

export interface HookInvocation<TPayload = any> {
	context: HookContext<TPayload>;
	/** Populated by `ctx.wrap()` while the handler runs. */
	middlewares: HookMiddleware[];
}

const DEFINITION_FIELDS = ["name", "run"];

const ACCEPTED_FORMS =
	'defineHook({ name: "before-prepare", run: (ctx) => {} }) or ' +
	'defineHook("before-prepare", (ctx) => {})';

function describeDefinition(name: any): string {
	return typeof name === "string" && name.length
		? JSON.stringify(name)
		: "<unnamed>";
}

function failToDefine(message: string): never {
	throw new Error(`${message} Accepted forms: ${ACCEPTED_FORMS}.`);
}

export function defineHook<TPayload = any>(
	definition: HookDefinitionInput<TPayload>,
): HookDefinition<TPayload>;
export function defineHook<TPayload = any>(
	name: string,
	run: HookHandler<TPayload>,
): HookDefinition<TPayload>;
export function defineHook<TPayload = any>(
	nameOrDefinition: string | HookDefinitionInput<TPayload>,
	run?: HookHandler<TPayload>,
): HookDefinition<TPayload> {
	const input = normalizeDefinitionInput(nameOrDefinition, run);
	const definition: any = { name: input.name, run: input.run };
	definition[HOOK_DEFINITION_MARKER] = true;

	return definition;
}

function normalizeDefinitionInput<TPayload>(
	nameOrDefinition: string | HookDefinitionInput<TPayload>,
	run?: HookHandler<TPayload>,
): HookDefinitionInput<TPayload> {
	if (typeof nameOrDefinition === "string") {
		if (!nameOrDefinition.length) {
			failToDefine("defineHook() requires a non-empty hook point name.");
		}

		if (typeof run !== "function") {
			failToDefine(
				`defineHook(${describeDefinition(nameOrDefinition)}) requires a handler function as its second argument.`,
			);
		}

		return { name: nameOrDefinition, run };
	}

	if (
		!nameOrDefinition ||
		typeof nameOrDefinition !== "object" ||
		Array.isArray(nameOrDefinition)
	) {
		failToDefine("defineHook() was called with an unsupported argument.");
	}

	const unknownFields = Object.keys(nameOrDefinition).filter(
		(field) => DEFINITION_FIELDS.indexOf(field) === -1,
	);
	if (unknownFields.length) {
		failToDefine(
			`defineHook(${describeDefinition(nameOrDefinition.name)}) received unknown ` +
				`field${unknownFields.length > 1 ? "s" : ""} ` +
				`${unknownFields.map((field) => JSON.stringify(field)).join(", ")}. ` +
				`Supported fields: ${DEFINITION_FIELDS.map((field) => JSON.stringify(field)).join(", ")}.`,
		);
	}

	if (typeof nameOrDefinition.name !== "string" || !nameOrDefinition.name) {
		failToDefine(
			'defineHook() requires a non-empty "name" naming the hook point.',
		);
	}

	if (typeof nameOrDefinition.run !== "function") {
		failToDefine(
			`defineHook(${describeDefinition(nameOrDefinition.name)}) requires "run" to be a function.`,
		);
	}

	return { name: nameOrDefinition.name, run: nameOrDefinition.run };
}

export function isHookDefinition<TPayload = any>(
	value: any,
): value is HookDefinition<TPayload> {
	return (
		!!value &&
		(typeof value === "object" || typeof value === "function") &&
		value[HOOK_DEFINITION_MARKER] === true &&
		typeof value.run === "function" &&
		typeof value.name === "string"
	);
}

export interface HookInvocationOptions {
	/** The hook point the definition runs at; used in diagnostics. */
	hookName: string;
	/**
	 * Whether the caller folds the collected middlewares around a method. Only
	 * the `@hook`-decorated before-points do; everywhere else `ctx.wrap()` has
	 * nothing to wrap and says so instead of silently dropping the middleware.
	 */
	consumesMiddlewares?: boolean;
}

/**
 * Derives the context from the raw hook argument bag: the `hookArgs` wrapper
 * when the hook point supplies one, the bag itself for hook points that pass
 * their keys at the top level, and nothing when there is no payload.
 */
export function createHookInvocation<TPayload = any>(
	hookArguments: any,
	options: HookInvocationOptions,
): HookInvocation<TPayload> {
	const { hookName, consumesMiddlewares } = options;
	const middlewares: HookMiddleware[] = [];
	const context: HookContext<TPayload> = {
		payload: derivePayload(hookArguments),
		wrap(middleware: HookMiddleware): void {
			if (!consumesMiddlewares) {
				throw new Error(
					`ctx.wrap() is not available at the "${hookName}" hook point: nothing folds the middleware around a method there, so it would never run.`,
				);
			}

			if (typeof middleware !== "function") {
				throw new Error(
					`ctx.wrap() expects a function at the "${hookName}" hook point.`,
				);
			}

			middlewares.push(middleware);
		},
		fail(message: string): never {
			throw new Error(hookMessage(message, hookName, "fail"));
		},
		skip(message: string): never {
			const error: any = new Error(hookMessage(message, hookName, "skip"));
			// The pair the hooks service checks for to downgrade a rejection.
			error.stopExecution = false;
			error.errorAsWarning = true;
			throw error;
		},
	};

	return { context, middlewares };
}

function hookMessage(
	message: string,
	hookName: string,
	method: string,
): string {
	return typeof message === "string" && message.trim().length
		? message
		: `The "${hookName}" hook called ctx.${method}() without a message.`;
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
