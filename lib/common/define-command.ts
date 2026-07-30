/**
 * The declarative command API. Types and pure factories only — this module is
 * re-exported from `nativescript/contracts` and must stay side-effect-free, so
 * it may not import lib/common/yok (whose import creates global.$injector).
 * The runtime bridge onto the legacy registry lives in
 * lib/common/services/command-definition-adapter.
 */

/**
 * Symbol.for so that a definition produced by one copy of the CLI is still
 * recognised by another — extensions bundle their own node_modules.
 */
export const COMMAND_DEFINITION_MARKER = Symbol.for(
	"nativescript:cli:commandDefinition",
);

export type CommandOptionType = "boolean" | "string" | "number" | "array";

export interface ICommandOptionSpec<TValue = any> {
	type: CommandOptionType;
	/** Value used when the flag is absent from the command line. */
	default?: TValue;
	/** Single-dash shorthand, e.g. `-o` for `--output`. */
	alias?: string | string[];
	/** Keeps the value out of analytics and logs. Defaults to false. */
	hasSensitiveValue?: boolean;
	description?: string;
}

/** The parts of an option spec a caller supplies; `type` comes from the helper. */
export type CommandOptionSpecInit<TValue = any> = Omit<
	ICommandOptionSpec<TValue>,
	"type"
>;

export interface ICommandOptionsSchema {
	[optionName: string]: ICommandOptionSpec;
}

export type CommandOptionValues<TSchema extends ICommandOptionsSchema> = {
	[K in keyof TSchema]: TSchema[K] extends ICommandOptionSpec<infer TValue>
		? TValue
		: any;
};

export interface ICommandContext<
	TSchema extends ICommandOptionsSchema = ICommandOptionsSchema,
> {
	/** Positional arguments, after the command name has been consumed. */
	args: string[];
	/** Current value of every option declared in the schema, and nothing else. */
	options: CommandOptionValues<TSchema>;
}

export interface ICommandDefinition<
	TSchema extends ICommandOptionsSchema = ICommandOptionsSchema,
> {
	/** `"widget|add"`; `|` separates hierarchy levels. Several names alias one command. */
	name: string | string[];
	description?: string;
	options?: TSchema;
	/**
	 * `"none"` (the default) rejects positional arguments; `"any"` accepts them.
	 * Anything finer belongs in `canExecute`.
	 */
	arguments?: "none" | "any";
	canExecute?(context: ICommandContext<TSchema>): Promise<boolean> | boolean;
	disableAnalytics?: boolean;
	enableHooks?: boolean;
	run(context: ICommandContext<TSchema>): Promise<void> | void;
}

const optionSpec = <TValue>(
	type: CommandOptionType,
	init: CommandOptionSpecInit<TValue>,
): ICommandOptionSpec<TValue> => ({ ...init, type });

export const booleanOption = (
	init: CommandOptionSpecInit<boolean> = {},
): ICommandOptionSpec<boolean> => optionSpec("boolean", init);

export const stringOption = (
	init: CommandOptionSpecInit<string> = {},
): ICommandOptionSpec<string> => optionSpec("string", init);

export const numberOption = (
	init: CommandOptionSpecInit<number> = {},
): ICommandOptionSpec<number> => optionSpec("number", init);

export const arrayOption = (
	init: CommandOptionSpecInit<string[]> = {},
): ICommandOptionSpec<string[]> => optionSpec("array", init);

export function defineCommand<TSchema extends ICommandOptionsSchema>(
	definition: ICommandDefinition<TSchema>,
): ICommandDefinition<TSchema> {
	const marked: ICommandDefinition<TSchema> = { ...definition };
	(<any>marked)[COMMAND_DEFINITION_MARKER] = true;
	return marked;
}

export function isCommandDefinition(value: any): value is ICommandDefinition {
	return !!value && (<any>value)[COMMAND_DEFINITION_MARKER] === true;
}
