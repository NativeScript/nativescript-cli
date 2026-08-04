import { annotate } from "../helpers";
import { getContractName } from "./contract";
import { resolveForwardRef } from "./forward-ref";
import { runInInjectionContext } from "./inject";
import type { Provider, ProviderToken, Type } from "./providers";

type TokenKey = string | Function;

export interface InjectOptions {
	/** Resolve to null instead of throwing when the token is not registered. */
	optional?: boolean;
	/** Resolve at this injector's level only — no parent fallthrough. */
	self?: boolean;
	/**
	 * Start resolution at the parent — escapes a child scope's shadowing
	 * entry (e.g. a hook payload key that collides with a service name).
	 */
	skipSelf?: boolean;
}

type ProviderKind = "value" | "class" | "factory" | "lazyClass" | "legacyClass";

interface IProviderRecord {
	displayName: string;
	kind?: ProviderKind;
	shared: boolean;
	useValue?: any;
	useClass?: Type<any>;
	useFactory?: () => any;
	useLazyClass?: () => Type<any>;
	useLegacyClass?: Function;
	/**
	 * Deferred side-effect loader (Yok's require path). Consumed on first
	 * resolution; it is expected to register a real resolver onto this record.
	 */
	pendingLoader?: () => void;
	/** Every produced instance is retained, transients included — dispose() walks them. */
	instances: any[];
	constructing: boolean;
}

// Shared across the whole injector tree so cycle reports show the full path
// even when resolution hops between parent and child scopes.
const resolutionStack: string[] = [];

export class Injector {
	private providers = new Map<TokenKey, IProviderRecord>();
	private instantiationOrder: any[] = [];

	constructor(
		providers: Provider[] = [],
		private parent?: Injector,
	) {
		this.register({ provide: <any>Injector, useValue: this });
		this.register(providers);
	}

	/**
	 * Resolution is two-step per injector level: the token itself, then its
	 * decorator-set name — and only on a full local miss does lookup delegate
	 * to the parent. The per-level order is what lets a child scope's
	 * string-keyed entry (a per-call override, a hook payload) shadow a parent
	 * provider for class-token consumers too.
	 *
	 * `ctorArguments` is the legacy per-call bag: raw Yok semantics (own-key
	 * check, no `$` normalization), applied only to the construction the call
	 * itself triggers — it never propagates to nested resolutions.
	 */
	// T defaults to any so string tokens (which give inference no source and
	// would otherwise land on unknown) stay ergonomic during the migration.
	public get<T = any>(token: ProviderToken<T>): T;
	public get<T = any>(
		token: ProviderToken<T>,
		options: InjectOptions & { optional: true },
	): T | null;
	public get<T = any>(token: ProviderToken<T>, options: InjectOptions): T;
	public get<T = any>(
		token: ProviderToken<T>,
		options?: InjectOptions,
	): T | null {
		if (options && options.self && options.skipSelf) {
			throw new Error("inject options cannot combine self and skipSelf");
		}
		token = resolveForwardRef(token);
		const found = this.findRecord(token, options);
		if (!found) {
			if (options && options.optional) {
				return null;
			}
			throw new Error("unable to resolve " + displayNameOf(token));
		}
		return found.owner.instantiate(found.record);
	}

	/**
	 * The legacy facade's channel for Yok's `resolve(name, bag)` sites: the
	 * bag applies to the construction this call itself triggers, with raw
	 * own-key semantics, and never propagates to nested resolutions. Not part
	 * of the public API — new code passes per-call providers to
	 * createInstance instead.
	 */
	protected getWithLegacyArguments(
		token: ProviderToken,
		ctorArguments?: { [key: string]: any },
	): any {
		token = resolveForwardRef(token);
		const found = this.findRecord(token);
		if (!found) {
			throw new Error("unable to resolve " + displayNameOf(token));
		}
		return found.owner.instantiate(found.record, ctorArguments);
	}

	public createChild(providers: Provider[] = []): Injector {
		return new Injector(providers, this);
	}

	/**
	 * Constructs a class that need not be registered, resolving its annotated
	 * parameters against this injector (plus the given per-call providers,
	 * which shadow one level deep only). Products are deliberately NOT
	 * retained for disposal — Yok never retained by-class resolutions either.
	 */
	public createInstance<T = any>(
		cls: Type<T> | Function,
		providers: Provider[] = [],
		ctorArguments?: { [key: string]: any },
	): T {
		const scope = providers.length ? this.createChild(providers) : this;
		return scope.constructLegacy(cls, ctorArguments);
	}

	/** Merge-mutate: re-registering a key updates the existing record in place. */
	public register(providers: Provider | Provider[]): void {
		const list = Array.isArray(providers) ? providers : [providers];
		for (const provider of list) {
			const keys = this.keysFor(provider.provide);
			let record: IProviderRecord | undefined;
			for (const key of keys) {
				record = this.providers.get(key);
				if (record) {
					break;
				}
			}
			if (!record) {
				record = {
					displayName: displayNameOf(provider.provide),
					shared: true,
					instances: [],
					constructing: false,
				};
			}
			this.applyProvider(record, provider);
			for (const key of keys) {
				this.providers.set(key, record);
			}
		}
	}

	/** Own-level string keys, optionally filtered by prefix — feeds command-name enumeration. */
	public getRegisteredNames(prefix: string = ""): string[] {
		const names: string[] = [];
		for (const key of this.providers.keys()) {
			if (typeof key === "string" && key.startsWith(prefix)) {
				names.push(key);
			}
		}
		return names;
	}

	public has(token: ProviderToken): boolean {
		return !!this.findRecord(token);
	}

	/** First cached instance for a token, without triggering construction. */
	public peek(token: ProviderToken): any {
		const found = this.findRecord(token);
		return found ? found.record.instances[0] : undefined;
	}

	/** Deletes the local record under every key that aliases it. */
	public remove(token: ProviderToken): void {
		const record = this.findRecordLocal(token);
		if (!record) {
			return;
		}
		const keys: TokenKey[] = [];
		for (const [key, value] of this.providers) {
			if (value === record) {
				keys.push(key);
			}
		}
		for (const key of keys) {
			this.providers.delete(key);
		}
	}

	/**
	 * Reverse instantiation order, then registration-provided values. Sync,
	 * like Yok's — the exit paths that call this do not await it.
	 */
	public dispose(exclude: any[] = []): void {
		const seen = new Set<any>(exclude);
		const disposeOne = (instance: any) => {
			if (!instance || seen.has(instance) || instance === this) {
				return;
			}
			seen.add(instance);
			if (typeof instance.dispose === "function") {
				instance.dispose();
			}
		};

		for (let i = this.instantiationOrder.length - 1; i >= 0; i--) {
			disposeOne(this.instantiationOrder[i]);
		}
		for (const record of new Set(this.providers.values())) {
			for (const instance of record.instances) {
				disposeOne(instance);
			}
		}
	}

	private keysFor(token: ProviderToken): TokenKey[] {
		token = resolveForwardRef(token);
		if (typeof token === "string") {
			return [normalizeName(token)];
		}
		const name = getContractName(token);
		return name !== undefined ? [token, name] : [token];
	}

	private applyProvider(record: IProviderRecord, provider: Provider): void {
		record.shared = provider.shared === undefined ? true : provider.shared;

		if ("useLazyRequire" in provider) {
			record.pendingLoader = provider.useLazyRequire;
			return;
		}

		record.useValue = undefined;
		record.useClass = undefined;
		record.useFactory = undefined;
		record.useLazyClass = undefined;
		record.useLegacyClass = undefined;

		if ("useValue" in provider) {
			record.kind = "value";
			record.useValue = provider.useValue;
			if (record.shared) {
				record.instances[0] = provider.useValue;
			} else {
				record.instances.push(provider.useValue);
			}
		} else if ("useClass" in provider) {
			record.kind = "class";
			record.useClass = provider.useClass;
		} else if ("useFactory" in provider) {
			record.kind = "factory";
			record.useFactory = provider.useFactory;
		} else if ("useLazyClass" in provider) {
			record.kind = "lazyClass";
			record.useLazyClass = provider.useLazyClass;
		} else if ("useLegacyClass" in provider) {
			record.kind = "legacyClass";
			record.useLegacyClass = provider.useLegacyClass;
		}
	}

	private findRecordLocal(token: ProviderToken): IProviderRecord | undefined {
		token = resolveForwardRef(token);
		if (typeof token === "string") {
			return this.providers.get(normalizeName(token));
		}
		const direct = this.providers.get(token);
		if (direct) {
			return direct;
		}
		const name = getContractName(token);
		return name !== undefined ? this.providers.get(name) : undefined;
	}

	// self/skipSelf apply to the entry level only: the parent walk below is
	// always an ordinary full lookup from that injector on.
	private findRecord(
		token: ProviderToken,
		options?: InjectOptions,
	): { record: IProviderRecord; owner: Injector } | undefined {
		if (!options || !options.skipSelf) {
			const local = this.findRecordLocal(token);
			if (local) {
				return { record: local, owner: this };
			}
			if (options && options.self) {
				return undefined;
			}
		}
		return this.parent ? this.parent.findRecord(token) : undefined;
	}

	private instantiate(
		record: IProviderRecord,
		ctorArguments?: { [key: string]: any },
	): any {
		if (record.pendingLoader) {
			const loader = record.pendingLoader;
			// Cleared only after a successful run so a failing loader (missing
			// module, broken require) is retried on the next resolution.
			loader();
			record.pendingLoader = undefined;
		}

		if (record.shared && record.instances.length) {
			return record.instances[0];
		}

		if (
			record.kind === undefined ||
			(record.kind === "value" && !record.shared)
		) {
			throw new Error("no resolver registered for " + record.displayName);
		}

		if (record.kind === "value") {
			return record.instances[0];
		}

		if (record.constructing) {
			const cyclePath = resolutionStack.concat(record.displayName).join(" -> ");
			throw new Error(
				`Cyclic dependency detected on dependency '${record.displayName}'. Resolution path: ${cyclePath}`,
			);
		}

		record.constructing = true;
		resolutionStack.push(record.displayName);
		let instance: any;
		try {
			instance = this.construct(record, ctorArguments);
		} finally {
			resolutionStack.pop();
			record.constructing = false;
		}

		record.instances.push(instance);
		this.instantiationOrder.push(instance);
		return instance;
	}

	private construct(
		record: IProviderRecord,
		ctorArguments?: { [key: string]: any },
	): any {
		switch (record.kind) {
			case "class":
				return runInInjectionContext(this, () => new record.useClass());
			case "factory":
				return runInInjectionContext(this, () => record.useFactory());
			case "lazyClass": {
				if (!record.useClass) {
					record.useClass = record.useLazyClass();
				}
				const cls = record.useClass;
				return runInInjectionContext(this, () => new cls());
			}
			case "legacyClass":
				return this.constructLegacy(record.useLegacyClass, ctorArguments);
		}
	}

	private constructLegacy(
		ctor: any,
		ctorArguments?: { [key: string]: any },
	): any {
		annotate(ctor);

		const resolvedArgs = ctor.$inject.args.map((paramName: string) =>
			ctorArguments &&
			Object.prototype.hasOwnProperty.call(ctorArguments, paramName)
				? ctorArguments[paramName]
				: this.get(paramName),
		);

		const name = ctor.$inject.name;
		return runInInjectionContext(this, () =>
			name && name[0] === name[0].toUpperCase()
				? new ctor(...resolvedArgs)
				: ctor.apply(null, resolvedArgs),
		);
	}
}

function normalizeName(name: string): string {
	return name[0] === "$" ? name.slice(1) : name;
}

function displayNameOf(token: ProviderToken): string {
	if (typeof token === "string") {
		return normalizeName(token);
	}
	return getContractName(token) || token.name || "<anonymous class>";
}
