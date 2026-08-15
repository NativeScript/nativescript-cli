import { mintTokenName } from "./contract";

/**
 * Mirrors CONTRACT_NAME's `Symbol.for` reasoning: an extension's duplicated
 * copy of this module must read the marker off tokens minted by the running
 * copy, which a unique `Symbol()` would hide.
 */
export const INJECTION_TOKEN_NAME = Symbol.for(
	"nativescript:di:injectionTokenName",
);

/**
 * A typed DI token for a dependency that is not a class — an imported module
 * namespace, a plain value, a function. `@Contract` covers services, which
 * have an abstract class to decorate; this covers everything else.
 *
 * The description doubles as the legacy registry name, exactly as a contract's
 * name does, so a token is a typed alias over the registration it names:
 *
 * ```ts
 * const XCODE = new InjectionToken<typeof import("nativescript-dev-xcode")>(
 * 	"xcode",
 * );
 * inject(XCODE); // finds register("xcode", …) untouched
 * ```
 */
export class InjectionToken<T = any> {
	/**
	 * Phantom, never assigned: with no member mentioning `T` the type parameter
	 * is erased and every token becomes assignable to every other one.
	 */
	declare private readonly resolvedType: T;

	/**
	 * @param description Canonical registry name. A leading `$` is stripped, so
	 * the token always keys the same record the string spellings do.
	 */
	constructor(description: string) {
		const name = description[0] === "$" ? description.slice(1) : description;
		mintTokenName(name, this);
		Object.defineProperty(this, INJECTION_TOKEN_NAME, {
			value: name,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	}

	public get description(): string {
		return (<any>this)[INJECTION_TOKEN_NAME];
	}

	public toString(): string {
		return `InjectionToken(${this.description})`;
	}
}

/**
 * Reads the constructor-set name. Own-property check, and by marker rather
 * than `instanceof`, so tokens minted by a duplicated copy of this module are
 * still recognized.
 */
export function getInjectionTokenName(token: any): string | undefined {
	if (
		token !== null &&
		typeof token === "object" &&
		Object.prototype.hasOwnProperty.call(token, INJECTION_TOKEN_NAME)
	) {
		return token[INJECTION_TOKEN_NAME];
	}
	return undefined;
}
