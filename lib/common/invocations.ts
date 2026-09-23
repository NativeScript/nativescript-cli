import { AsyncLocalStorage } from "node:async_hooks";
import { getCurrentInjector } from "./di/inject";
import type { Injector } from "./di/injector";

/**
 * On globalThis under a `Symbol.for` key, as the injection context is: a hook
 * or extension may load a second copy of this module, and its lookups must
 * see the invocations the running copy opened.
 */
const INVOCATIONS_SLOT = Symbol.for("nativescript:cli:invocations");

interface IInvocations {
	/** The invocation whose asynchronous flow the caller is in. */
	context: AsyncLocalStorage<Injector>;
	/** Every invocation opened and not yet closed, innermost last. */
	open: Injector[];
}

function invocations(): IInvocations {
	const g = <any>globalThis;
	if (!g[INVOCATIONS_SLOT]) {
		g[INVOCATIONS_SLOT] = <IInvocations>{
			context: new AsyncLocalStorage<Injector>(),
			open: [],
		};
	}
	return g[INVOCATIONS_SLOT];
}

/**
 * The injector of the invocation running now, for code that resolves by name
 * outside any injection context — a hook, a plugin's callback. Tried in order:
 * the synchronous injection context; the invocation whose asynchronous flow
 * the caller is in; the most recently opened invocation still running, for a
 * callback that lost its asynchronous context (an emitter another invocation
 * registered, a library timer); then null, and the caller's own fallback,
 * which for the legacy facade is the process-wide injector.
 */
export function currentInvocationInjector(): Injector | null {
	const { context, open } = invocations();
	return (
		getCurrentInjector() || context.getStore() || open[open.length - 1] || null
	);
}

/** Runs `fn` with `injector` as the invocation of its asynchronous flow. */
export function runInInvocation<T>(injector: Injector, fn: () => T): T {
	return invocations().context.run(injector, fn);
}

/**
 * Records an opened invocation; the returned function closes it. The first
 * invocation of the process — the command line's own — stays open for the
 * life of the process: a long-lived command's callbacks keep resolving
 * through it after its run has returned.
 */
export function openInvocation(injector: Injector): () => void {
	const { open } = invocations();
	open.push(injector);
	return (): void => {
		const index = open.lastIndexOf(injector);
		if (index > 0) {
			open.splice(index, 1);
		}
	};
}

/** How many invocations are open; what a dispatch trims back to when it ends. */
export function openInvocationCount(): number {
	return invocations().open.length;
}

/**
 * Closes every invocation opened since the count was `depth`. An in-process
 * dispatch bounds the invocations it opens: a command asked only whether it
 * could run never executes, so nothing else would close what that check
 * opened, and an invocation a dispatch opened is never the command line's
 * own, so the first-stays rule of `openInvocation` does not apply here.
 */
export function closeInvocationsAbove(depth: number): void {
	const { open } = invocations();
	open.length = Math.min(depth, open.length);
}
