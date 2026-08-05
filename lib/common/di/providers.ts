export type Type<T> = new (...args: any[]) => T;
export type AbstractType<T> = abstract new (...args: any[]) => T;

export type ProviderToken<T = any> = string | Type<T> | AbstractType<T>;

interface IBaseProvider<T> {
	provide: ProviderToken<T>;
	/** Defaults to true. `false` constructs a fresh instance per resolution. */
	shared?: boolean;
}

export interface IClassProvider<T> extends IBaseProvider<T> {
	useClass: Type<T>;
}

export interface IValueProvider<T> extends IBaseProvider<T> {
	useValue: T;
}

export interface IFactoryProvider<T> extends IBaseProvider<T> {
	useFactory: () => T;
}

/** The loader runs on first resolution only — module loading stays deferred. */
export interface ILazyClassProvider<T> extends IBaseProvider<T> {
	useLazyClass: () => Type<T>;
}

/**
 * Yok-style resolver constructed via annotate(): parameters are resolved by
 * name, and lowercase/anonymous functions are invoked as factories rather
 * than new-ed.
 */
export interface ILegacyClassProvider extends IBaseProvider<any> {
	useLegacyClass: Function;
}

/**
 * Deferred side-effect loader (Yok's `require(name, path)`): running it is
 * expected to register the real resolver onto this same record. Container
 * internals only — a record left with nothing but a loader resolves to an
 * error, so it is deliberately kept out of `Provider`.
 */
export interface ILazyRequireProvider extends IBaseProvider<any> {
	useLazyRequire: () => void;
}

export type Provider<T = any> =
	| IClassProvider<T>
	| IValueProvider<T>
	| IFactoryProvider<T>
	| ILazyClassProvider<T>
	| ILegacyClassProvider;

/** The provider forms the container accepts, including the unpublished ones. */
export type InternalProvider<T = any> = Provider<T> | ILazyRequireProvider;

/** Enforces at compile time that the implementation satisfies the token. */
export const provide = <T>(
	token: AbstractType<T> | string,
	impl: Type<T>,
): Provider<T> => ({ provide: token, useClass: impl });

export const provideLazy = <T>(
	token: AbstractType<T> | string,
	load: () => Type<T>,
): Provider<T> => ({ provide: token, useLazyClass: load });
