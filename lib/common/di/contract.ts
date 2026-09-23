/**
 * The name is stored under a `Symbol.for` key deliberately: extensions install
 * into their own node_modules tree, so a duplicated copy of this module (and
 * of any contract class) must write and read the same property key. A unique
 * `Symbol()` would make duplicate copies mutually invisible and break the
 * name-fallback lookup in `Injector.get()`.
 */
export const CONTRACT_NAME = Symbol.for("nativescript:di:contractName");

export interface IContractOptions {
	/**
	 * Canonical token name, without the `$` prefix. Must be an explicit string
	 * literal — never derive it from `class.name`, which changes under
	 * minification.
	 */
	name: string;
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
	const { name } = options;
	return (target: Function): void => {
		mintTokenName(name, target);
		Object.defineProperty(target, CONTRACT_NAME, {
			value: name,
			writable: false,
			enumerable: false,
			configurable: false,
		});
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
