import type { Injector } from "./injector";
import type { ProviderToken } from "./providers";

// Sync-only by design (no AsyncLocalStorage): `current` is restored in a
// finally, so inject() is valid in field initializers, constructor bodies and
// provider factories — and never after an await. Self-inject the Injector for
// later lookups.
let current: Injector | null = null;

export function inject<T = any>(token: ProviderToken<T>): T {
	if (!current) {
		throw new Error(
			"inject() can only be called from an injection context — a field " +
				"initializer, a constructor, or a provider factory running under " +
				"runInInjectionContext(). It is not valid after an await; inject " +
				"the Injector itself and use injector.get() for late lookups.",
		);
	}
	return current.get(token);
}

export function runInInjectionContext<T>(injector: Injector, fn: () => T): T {
	const previous = current;
	current = injector;
	try {
		return fn();
	} finally {
		current = previous;
	}
}
