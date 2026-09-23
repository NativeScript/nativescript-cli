/**
 * The name is stored under a `Symbol.for` key deliberately: extensions install
 * into their own node_modules tree, so a duplicated copy of this module (and
 * of any contract class) must write and read the same property key. A unique
 * `Symbol()` would make duplicate copies mutually invisible and break the
 * name-fallback lookup in `Injector.get()`.
 */
export const CONTRACT_NAME = Symbol.for("nativescript:di:contractName");

/** Same `Symbol.for` reasoning as CONTRACT_NAME. */
export const PROVIDED_IN = Symbol.for("nativescript:di:providedIn");

export interface IContractOptions {
	/**
	 * Canonical token name, without the `$` prefix. Must be an explicit string
	 * literal — never derive it from `class.name`, which changes under
	 * minification.
	 */
	name: string;
	/**
	 * The scope every implementation of the contract lives in, unless the
	 * implementation or its provider says otherwise. See `ProviderScope`.
	 */
	providedIn?: string;
}

/**
 * Marks a class with the scope its instances live in — `"invocation"` for a
 * service that reads the invocation's option groups or context. Read when the
 * class is registered, by class or by name.
 */
export function ProvidedIn(scope: string): (target: Function) => void {
	return (target: Function): void => {
		Object.defineProperty(target, PROVIDED_IN, {
			value: scope,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	};
}

/** Own-property read, as for the contract name. */
export function getProvidedIn(target: any): string | undefined {
	if (
		typeof target === "function" &&
		Object.prototype.hasOwnProperty.call(target, PROVIDED_IN)
	) {
		return (<any>target)[PROVIDED_IN];
	}
	return undefined;
}

// Per module instance on purpose: a duplicated CLI copy in an extensions tree
// carries its own registry, so contracts redeclared by another copy never
// false-positive here.
const mintedNames = new Map<string, object>();

function describeOwner(owner: object): string {
	if (typeof owner === "function") {
		return `contract '${owner.name || "<anonymous>"}'`;
	}
	return "an injection token";
}

/**
 * Claims a token name for `owner`. Both `@Contract` and `InjectionToken` mint
 * here so the two kinds share one namespace: a contract and a token that claim
 * the same name would be two tokens silently aliasing one registration.
 */
export function mintTokenName(name: string, owner: object): void {
	const existing = mintedNames.get(name);
	if (existing && existing !== owner) {
		throw new Error(
			`Token name '${name}' is already used by ${describeOwner(existing)}. ` +
				`Token names must be unique — a duplicate silently aliases two tokens.`,
		);
	}
	mintedNames.set(name, owner);
}

/**
 * Marks an abstract class as a DI token. The decorated class resolves by
 * object identity first and by its name on a miss, so duplicated copies of a
 * contract remain interchangeable across node_modules trees.
 */
export function Contract(
	options: IContractOptions,
): (target: Function) => void {
	const { name, providedIn } = options;
	return (target: Function): void => {
		mintTokenName(name, target);
		Object.defineProperty(target, CONTRACT_NAME, {
			value: name,
			writable: false,
			enumerable: false,
			configurable: false,
		});
		if (providedIn !== undefined) {
			ProvidedIn(providedIn)(target);
		}
	};
}

/**
 * Reads the decorator-set name. Own-property check only: an implementation
 * class extending a contract inherits the property, but must not itself act
 * as a token.
 */
export function getContractName(token: any): string | undefined {
	if (
		typeof token === "function" &&
		Object.prototype.hasOwnProperty.call(token, CONTRACT_NAME)
	) {
		return (<any>token)[CONTRACT_NAME];
	}
	return undefined;
}

/**
 * Test seam — the duplicate-name registry (contracts and injection tokens
 * alike) otherwise persists per process.
 */
export function clearMintedContractNames(): void {
	mintedNames.clear();
}
