// `Symbol.for` so a duplicated CLI copy in an extensions tree marks thunks
// with the same key this copy reads — mirrors the CONTRACT_NAME reasoning.
const FORWARD_REF = Symbol.for("nativescript:di:forwardRef");

/**
 * Defers a token reference until the container reads it — for provider arrays
 * evaluated at module load, where a class declared later in the file (TDZ) or
 * reached through a circular import is not yet a usable binding. Same
 * semantics as Angular's forwardRef; resolved at registration and lookup.
 *
 * This defers *references*, not construction: it cannot break an
 * instantiation cycle between two services. For that, inject the Injector and
 * resolve late.
 */
export function forwardRef<T>(fn: () => T): T {
	(<any>fn)[FORWARD_REF] = true;
	return <any>fn;
}

export function resolveForwardRef<T>(token: T): T {
	if (typeof token === "function" && (<any>token)[FORWARD_REF] === true) {
		return (<any>token)();
	}
	return token;
}
