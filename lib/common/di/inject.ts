import type { Injector, InjectOptions } from "./injector";
import type { ProviderToken } from "./providers";

/**
 * The injection context lives on globalThis under a `Symbol.for` key rather
 * than in a module-local variable: a hook or extension module can resolve a
 * DIFFERENT copy of this file than the one the running CLI set the context
 * through (a nested nativescript install, or a project-local copy under a
 * globally-run CLI), and a module-local slot would make that copy's inject()
 * throw despite being synchronously inside a valid context.
 */
const CONTEXT_SLOT = Symbol.for("nativescript:di:injectionContext");

interface IInjectionContextFrame {
	injector: Injector;
	/** Identifies which loaded copy of this module set the frame. */
	owner: object;
}

// One per loaded copy of this module — the cross-copy detection marker.
const COPY_ID = {};

let reportedCrossCopyUse = false;

function currentFrame(): IInjectionContextFrame | null {
	return (<any>globalThis)[CONTEXT_SLOT] || null;
}

export function inject<T = any>(token: ProviderToken<T>): T;
export function inject<T = any>(
	token: ProviderToken<T>,
	options: InjectOptions & { optional: true },
): T | null;
export function inject<T = any>(
	token: ProviderToken<T>,
	options: InjectOptions,
): T;
export function inject<T = any>(
	token: ProviderToken<T>,
	options?: InjectOptions,
): T | null {
	const frame = currentFrame();
	if (!frame) {
		throw new Error(
			"inject() can only be called from an injection context — a field " +
				"initializer, a constructor, or a provider factory running under " +
				"runInInjectionContext(). It is not valid after an await; inject " +
				"the Injector itself and use injector.get() for late lookups.",
		);
	}

	if (frame.owner !== COPY_ID && !reportedCrossCopyUse) {
		reportedCrossCopyUse = true;
		const logger = frame.injector.get("logger", { optional: true });
		if (logger) {
			logger.warn(
				`A second copy of the NativeScript CLI (${__dirname}) is serving ` +
					`inject() in this process. This works, but loads the CLI twice; ` +
					`extensions and projects should declare nativescript as a ` +
					`peerDependency so the running copy is shared.`,
			);
		}
	}

	return frame.injector.get(token, options);
}

export function runInInjectionContext<T>(injector: Injector, fn: () => T): T {
	const g = <any>globalThis;
	const previous = g[CONTEXT_SLOT];
	g[CONTEXT_SLOT] = <IInjectionContextFrame>{ injector, owner: COPY_ID };
	try {
		return fn();
	} finally {
		g[CONTEXT_SLOT] = previous;
	}
}
