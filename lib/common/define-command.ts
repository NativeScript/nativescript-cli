/**
 * The declarative command API. Types and pure factories only — this module is
 * re-exported from `nativescript/contracts` and must stay side-effect-free, so
 * it may not import lib/common/yok (whose import creates global.$injector).
 * The runtime bridge onto the legacy registry lives in
 * lib/common/services/command-definition-adapter.
 */

import { COMMAND_CONTEXT } from "./contracts/command-context";
import type { KeyShortcut } from "./contracts/key-shortcuts";
import type { IDashedOption, IDictionary } from "./declarations";
import { inject } from "./di/inject";
import { InjectionToken } from "./di/injection-token";
import type { Injector } from "./di/injector";
import type { Provider } from "./di/providers";
import { OptionType } from "./enums";

/**
 * Symbol.for so that a definition produced by one copy of the CLI is still
 * recognised by another — extensions bundle their own node_modules. `unique
 * symbol` so the marker can also be spelled in the branded return type.
 */
export const COMMAND_DEFINITION_MARKER: unique symbol = Symbol.for(
	"nativescript:cli:commandDefinition",
);

export type CommandOptionType =
	"boolean" | "string" | "number" | "array" | "object";

export interface CommandOptionSpec<TValue = any> {
	type: CommandOptionType;
	/** Value used when the flag is absent from the command line. */
	default?: TValue;
	/**
	 * The command line must pass the flag; its absence fails the invocation
	 * before `canExecute`. Not combinable with `default`.
	 */
	required?: boolean;
	/** Single-dash shorthand, e.g. `-o` for `--output`. */
	alias?: string | string[];
	/** Keeps the value out of analytics and logs. Defaults to false. */
	hasSensitiveValue?: boolean;
	/** Reserved for generated help; nothing renders it yet. */
	description?: string;
}

/**
 * A spec whose `default` is required. The required property is what
 * `CommandOptionValues` keys off to drop `| undefined` from the value type, so
 * it may not be relaxed to an optional one.
 */
export interface DefaultedCommandOptionSpec<
	TValue = any,
> extends CommandOptionSpec<TValue> {
	default: TValue;
}

/** A spec marked `required: true`; its value is never `undefined` in a handler. */
export interface RequiredCommandOptionSpec<
	TValue = any,
> extends CommandOptionSpec<TValue> {
	required: true;
}

/** The parts of an option spec a caller supplies; `type` comes from the helper. */
export type CommandOptionSpecInit<TValue = any> = Omit<
	CommandOptionSpec<TValue>,
	"type"
>;

export interface CommandOptionsSchema {
	[optionName: string]: CommandOptionSpec;
}

/**
 * An option the command line omitted is absent at runtime, so only a spec that
 * declares a `default`, or is `required`, yields a value that is always there.
 */
type CommandOptionValue<TSpec> =
	TSpec extends CommandOptionSpec<infer TValue>
		? TSpec extends { default: any } | { required: true }
			? TValue
			: TValue | undefined
		: any;

export type CommandOptionValues<TSchema extends CommandOptionsSchema> = {
	[K in keyof TSchema]: CommandOptionValue<TSchema[K]>;
};

/**
 * Symbol.for, as COMMAND_DEFINITION_MARKER: an extension's copy of this module
 * must recognise a group minted by the running copy.
 */
export const OPTIONS_GROUP_MARKER: unique symbol = Symbol.for(
	"nativescript:cli:optionsGroup",
);

/**
 * A named set of options declared once and used at both ends: a command lists
 * the group under `options` and the parser fills it; a service injects the
 * group and reads the parsed values, typed from the same declaration. The
 * values are provided per invocation, so nothing outside one resolves them.
 * The group's registry name is `options:<name>`.
 */
export class OptionsGroup<
	TSchema extends CommandOptionsSchema = CommandOptionsSchema,
> extends InjectionToken<CommandOptionValues<TSchema>> {
	readonly [OPTIONS_GROUP_MARKER] = true;

	constructor(
		public readonly groupName: string,
		public readonly schema: TSchema,
	) {
		super(`options:${groupName}`);
	}
}

export function isOptionsGroup(value: any): value is OptionsGroup<any> {
	return (
		!!value &&
		typeof value === "object" &&
		(<any>value)[OPTIONS_GROUP_MARKER] === true
	);
}

/** What `options` takes: one schema, or a list of groups and inline schemas. */
export type CommandOptionsInput =
	| CommandOptionsSchema
	| ReadonlyArray<OptionsGroup<any> | CommandOptionsSchema>;

type UnionToIntersection<U> = (
	U extends any ? (member: U) => void : never
) extends (member: infer I) => void
	? I
	: never;

type OptionsSchemaPart<T> =
	T extends OptionsGroup<infer TSchema>
		? TSchema
		: T extends CommandOptionsSchema
			? T
			: never;

/** The one schema an `options` input declares: its groups and inline specs merged. */
export type OptionsSchemaOf<TOptions> = (
	TOptions extends ReadonlyArray<infer TPart>
		? UnionToIntersection<OptionsSchemaPart<TPart>>
		: OptionsSchemaPart<TOptions>
) extends infer TSchema
	? TSchema extends CommandOptionsSchema
		? TSchema
		: {}
	: never;

export type OptionValuesOf<TOptions> = CommandOptionValues<
	OptionsSchemaOf<TOptions>
>;

export interface ResolvedCommandOptions {
	/** Every declared option, groups and inline specs merged, keyed by the long name. */
	schema: CommandOptionsSchema;
	/** The groups in declaration order; each is provided per invocation. */
	groups: OptionsGroup<any>[];
}

const aliasesOf = (alias: string | string[] | undefined): string[] =>
	alias === undefined ? [] : Array.isArray(alias) ? alias : [alias];

const sameOptionSpec = (a: CommandOptionSpec, b: CommandOptionSpec): boolean =>
	a.type === b.type &&
	JSON.stringify(a.default) === JSON.stringify(b.default) &&
	JSON.stringify(aliasesOf(a.alias)) === JSON.stringify(aliasesOf(b.alias)) &&
	a.hasSensitiveValue === b.hasSensitiveValue &&
	a.required === b.required;

/**
 * Merges what `options` declares into one schema. A spelling — a name or an
 * alias — may be declared once, or again with the same spec; two specs for one
 * spelling would leave the parser with one meaning and the other declaration
 * silently wrong, so that is reported instead.
 */
export function resolveCommandOptions(
	options: CommandOptionsInput | undefined,
	report: (problem: string) => never,
	inlineSource: string = "the command's own options",
): ResolvedCommandOptions {
	const parts: { source: string; schema: CommandOptionsSchema }[] = [];
	const groups: OptionsGroup<any>[] = [];
	const list: ReadonlyArray<OptionsGroup<any> | CommandOptionsSchema> =
		options === undefined
			? []
			: Array.isArray(options)
				? options
				: [<CommandOptionsSchema>options];

	for (const part of list) {
		if (isOptionsGroup(part)) {
			if (groups.indexOf(part) === -1) {
				groups.push(part);
				parts.push({
					source: `option group '${part.groupName}'`,
					schema: part.schema,
				});
			}
		} else {
			parts.push({ source: inlineSource, schema: part });
		}
	}

	const schema: CommandOptionsSchema = {};
	const owners: IDictionary<{ optionName: string; source: string }> = {};
	for (const { source, schema: partSchema } of parts) {
		for (const optionName of Object.keys(partSchema)) {
			const spec = partSchema[optionName];
			const existing = schema[optionName];
			if (existing && !sameOptionSpec(existing, spec)) {
				report(
					`option '--${optionName}' is declared by ${owners[optionName].source} and by ${source} with different specs`,
				);
			}
			if (!existing) {
				const owner = owners[optionName];
				if (owner) {
					report(
						`option '--${optionName}' (${source}) is already an alias of '--${owner.optionName}' (${owner.source})`,
					);
				}
				schema[optionName] = spec;
				owners[optionName] = { optionName, source };
			}
			for (const alias of aliasesOf(spec.alias)) {
				const owner = owners[alias];
				if (owner && owner.optionName !== optionName) {
					report(
						`alias '-${alias}' of '--${optionName}' (${source}) is already the spelling of '--${owner.optionName}' (${owner.source})`,
					);
				}
				if (!owner) {
					owners[alias] = { optionName, source };
				}
			}
		}
	}

	return { schema, groups };
}

/** Every spelling a schema answers to: the long names and their aliases. */
export function optionSpellingsOf(schema: CommandOptionsSchema): string[] {
	const spellings: string[] = [];
	for (const optionName of Object.keys(schema)) {
		spellings.push(optionName, ...aliasesOf(schema[optionName].alias));
	}
	return spellings;
}

const DASHED_OPTION_TYPES: IDictionary<OptionType> = {
	boolean: OptionType.Boolean,
	string: OptionType.String,
	number: OptionType.Number,
	array: OptionType.Array,
	object: OptionType.Object,
};

/** The parser's shape of one spec, as `dashedOptions` and the CLI-wide table hold it. */
export function compileOptionSpec(spec: CommandOptionSpec): IDashedOption {
	const dashedOption: IDashedOption = {
		type: DASHED_OPTION_TYPES[spec.type],
		hasSensitiveValue: spec.hasSensitiveValue === true,
	};
	if (spec.default !== undefined) {
		dashedOption.default = spec.default;
	}
	if (spec.alias !== undefined) {
		dashedOption.alias = spec.alias;
	}
	if (spec.description !== undefined) {
		dashedOption.describe = spec.description;
	}
	return dashedOption;
}

export function compileOptionsSchema(
	schema: CommandOptionsSchema,
): IDictionary<IDashedOption> {
	const dashedOptions: IDictionary<IDashedOption> = {};
	for (const optionName of Object.keys(schema)) {
		dashedOptions[optionName] = compileOptionSpec(schema[optionName]);
	}
	return dashedOptions;
}

/**
 * The parsed value of every option in `schema`, read off the option service's
 * per-name accessors, and nothing else.
 */
export function readOptionValues<TSchema extends CommandOptionsSchema>(
	schema: TSchema,
	source: any,
): CommandOptionValues<TSchema> {
	const values: any = {};
	for (const optionName of Object.keys(schema)) {
		values[optionName] = source[optionName];
	}
	return values;
}

const OPTIONS_GROUP_FORM = 'defineOptions("run", { watch: booleanOption() })';

/**
 * Declares an option group: a named schema that is also the token its parsed
 * values are injected by. Validated here, like a command definition, so a bad
 * spec is reported where it was written.
 */
export function defineOptions<TSchema extends CommandOptionsSchema>(
	name: string,
	schema: TSchema,
): OptionsGroup<TSchema> {
	const report = (problem: string): never => {
		throw new Error(
			`Invalid option group ${
				typeof name === "string" && name.trim() ? `'${name}'` : "(unnamed)"
			}: ${problem}. Accepted form: ${OPTIONS_GROUP_FORM}`,
		);
	};

	if (typeof name !== "string" || !name.trim()) {
		report("the name must be a non-empty string");
	}
	if (!isPlainObject(schema)) {
		report("the schema must be an object keyed by the long option name");
	}
	for (const optionName of Object.keys(schema)) {
		validateOptionSpec(report, optionName, schema[optionName]);
	}
	resolveCommandOptions(schema, report, `option group '${name}'`);

	return new OptionsGroup(name, schema);
}

/**
 * Positional parameters keyed by the declaring spec's `name`. A variadic spec
 * always yields an array; a non-variadic optional one is absent when the
 * command line did not reach it.
 */
export interface CommandParamValues {
	[paramName: string]: string | string[];
}

/** @deprecated Use CommandParamValues. */
export type CommandArgumentValues = CommandParamValues;

/**
 * One positional parameter. Specs are matched strictly by position: the first
 * spec takes the first argument, and so on.
 */
export interface ParamSpec<TSchema extends CommandOptionsInput = {}> {
	/** Key under which the value appears on `ctx.params`. */
	name: string;
	/** Defaults to false. A required spec may not follow an optional one. */
	required?: boolean;
	/** Collects every remaining argument as `string[]`. Must be the last spec. */
	variadic?: boolean;
	/** Reserved for generated help; nothing renders it yet. */
	description?: string;
	/** Replaces the default message when a required parameter is missing. */
	errorMessage?: string;
	/** `false` or a message string rejects the value; a string is the message. */
	validate?(
		value: string,
		context: CommandContext<TSchema>,
	): boolean | string | Promise<boolean | string>;
}

/** @deprecated Use ParamSpec. */
export type ArgumentSpec<TSchema extends CommandOptionsInput = {}> =
	ParamSpec<TSchema>;

/**
 * `"none"` rejects positional arguments; `"any"` accepts any number of them;
 * an array declares them one by one.
 */
export type ParamsPolicy<TSchema extends CommandOptionsInput = {}> =
	"none" | "any" | ParamSpec<TSchema>[];

/** @deprecated Use ParamsPolicy. */
export type ArgumentsPolicy<TSchema extends CommandOptionsInput = {}> =
	ParamsPolicy<TSchema>;

export interface CommandFailOptions {
	/**
	 * Print the usage help suggestion after the message. Defaults to true; pass
	 * false when the command line was fine and the environment or project is not.
	 */
	help?: boolean;
}

export interface CommandContext<TSchema extends CommandOptionsInput = {}> {
	/** Positional arguments, after the command name has been consumed. */
	args: string[];
	/** The same arguments keyed by the names the `params` specs declare. */
	params: CommandParamValues;
	/**
	 * Current value of every option the command declares, its groups and inline
	 * specs merged, and nothing else. A group contributed from outside the
	 * command is read by injecting the group.
	 */
	options: OptionValuesOf<TSchema>;
	/**
	 * This invocation's injector, the one `inject()` resolves against before the
	 * first `await`; after it, `inject()` stops working and this is the lookup.
	 */
	injector: Injector;
	/**
	 * Fails the command with `message`, followed by the usage help suggestion
	 * unless `options.help` is false.
	 */
	fail(message: string, options?: CommandFailOptions): never;
}

export interface CommandDefinition<
	TSchema extends CommandOptionsInput = {},
	TResult = void,
	TSetup = void,
> {
	/** `"widget|add"`; `|` separates hierarchy levels. Several names alias one command. */
	name: CommandName;
	description?: string;
	/**
	 * A schema keyed by the long option name, or a list of option groups and
	 * such schemas. One spelling may appear in several parts only with the same
	 * spec; a process-level spelling may not be redeclared at all.
	 */
	options?: TSchema;
	/**
	 * `"none"` (the default) rejects positional arguments; `"any"` accepts any
	 * number; an array declares them positionally, and the values land on
	 * `ctx.params`. Anything finer belongs in `canExecute`, which runs after
	 * this policy.
	 */
	params?: ParamsPolicy<TSchema>;
	/**
	 * Hands options this CLI does not know through to the command instead of
	 * reporting them. Only for commands that forward their command line to
	 * another CLI.
	 */
	allowUnknownOptions?: boolean;
	disableAnalytics?: boolean;
	enableHooks?: boolean;
	/**
	 * Providers added to each invocation's own injector, next to the context,
	 * so a factory or class among them can inject the invocation. They are
	 * built once per invocation, and `ctx.injector` resolves them. A bare
	 * class provides itself, as in Angular.
	 */
	providers?: Provider[];
	/**
	 * Runs once per invocation, before `canExecute`, and its result is handed to
	 * `canExecute`, `run` and `postRun`. Sugar: a command may ignore it and call
	 * `inject()` at the top of `run` instead.
	 */
	setup?(context: CommandContext<TSchema>): TSetup | Promise<TSetup>;
	canExecute?(
		context: CommandContext<TSchema>,
		setupResult: Awaited<TSetup>,
	): Promise<boolean> | boolean;
	run(
		context: CommandContext<TSchema>,
		setupResult: Awaited<TSetup>,
	): TResult | Promise<TResult>;
	/**
	 * The keys the command answers to once `run` has resolved. Attaching keeps
	 * stdin resumed, which keeps the process alive: declaring shortcuts says the
	 * command is resident. Entries close over this command's own context and
	 * setup result; they are attached only for a top-level run, and only while
	 * `NS_COMMAND_SHORTCUTS` is on.
	 */
	shortcuts?(
		context: CommandContext<TSchema>,
		setupResult: Awaited<TSetup>,
	): KeyShortcut[];
	/** Runs after `run` succeeds, with whatever `run` returned. */
	postRun?(
		context: CommandContext<TSchema>,
		result: Awaited<TResult>,
		setupResult: Awaited<TSetup>,
	): Promise<void> | void;
}

/**
 * What `defineCommand` returns: a definition carrying the marker in its type,
 * so `registerCommand` can require a definition that went through
 * define-time validation rather than any object of the right shape.
 */
export type DefinedCommand<
	TSchema extends CommandOptionsInput = {},
	TResult = void,
	TSetup = void,
> = CommandDefinition<TSchema, TResult, TSetup> & {
	readonly [COMMAND_DEFINITION_MARKER]: true;
};

interface IOptionHelper<TValue> {
	(
		init: CommandOptionSpecInit<TValue> & { default: TValue },
	): DefaultedCommandOptionSpec<TValue>;
	(
		init: CommandOptionSpecInit<TValue> & { required: true },
	): RequiredCommandOptionSpec<TValue>;
	(init?: CommandOptionSpecInit<TValue>): CommandOptionSpec<TValue>;
}

const optionHelper = <TValue>(type: CommandOptionType): IOptionHelper<TValue> =>
	<IOptionHelper<TValue>>((init: CommandOptionSpecInit<TValue> = {}) => ({
		...init,
		type,
	}));

export const booleanOption = optionHelper<boolean>("boolean");
export const stringOption = optionHelper<string>("string");
export const numberOption = optionHelper<number>("number");
export const arrayOption = optionHelper<string[]>("array");
/** For flags the parser nests, such as --env.production or --teamId. */
export const objectOption = optionHelper<any>("object");

const DEFINITION_FIELDS = [
	"name",
	"description",
	"options",
	"params",
	"allowUnknownOptions",
	"canExecute",
	"disableAnalytics",
	"enableHooks",
	"providers",
	"setup",
	"run",
	"shortcuts",
	"postRun",
];

const ARGUMENT_SPEC_FIELDS = [
	"name",
	"required",
	"variadic",
	"description",
	"errorMessage",
	"validate",
];

const OPTION_SPEC_FIELDS = [
	"type",
	"default",
	"required",
	"alias",
	"hasSensitiveValue",
	"description",
];

const OPTION_TYPES: CommandOptionType[] = [
	"boolean",
	"string",
	"number",
	"array",
	"object",
];

const ACCEPTED_FORM =
	'defineCommand({ name: "widget|add", run(ctx) { ... } }) — with the ' +
	"optional fields description, options, params, allowUnknownOptions, " +
	"providers, setup, canExecute, shortcuts, postRun, disableAnalytics and " +
	"enableHooks. " +
	'Or the class form, class WidgetAdd extends Command({ name: "widget|add" }) ' +
	"{ run() { ... } }, which declares the same fields except the handlers and " +
	"implements run, and optionally canExecute, postRun and shortcuts, as methods.";

const describeDefinition = (definition: any): string => {
	const name = definition && definition.name;
	if (typeof name === "string" && name.length) {
		return `'${name}'`;
	}

	if (Array.isArray(name) && typeof name[0] === "string" && name[0].length) {
		return `'${name[0]}'`;
	}

	return "an unnamed command";
};

const invalid = (definition: any, problem: string): never => {
	throw new Error(
		`Invalid command definition for ${describeDefinition(definition)}: ` +
			`${problem}. Accepted form: ${ACCEPTED_FORM}`,
	);
};

export function isPlainObject(value: unknown): boolean {
	if (value === null || typeof value !== "object") {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

const validateName = (definition: any): void => {
	const name = definition.name;
	const isUsableName = (value: any) =>
		typeof value === "string" && value.trim().length > 0;

	if (isUsableName(name)) {
		return;
	}

	if (Array.isArray(name) && name.length && name.every(isUsableName)) {
		return;
	}

	invalid(
		definition,
		"'name' must be a non-empty string, or an array of non-empty strings for a command with aliases",
	);
};

const OPTION_HELPERS =
	"booleanOption(), stringOption(), numberOption(), arrayOption() or objectOption()";

const validateOptionSpec = (
	report: (problem: string) => never,
	optionName: string,
	spec: any,
): void => {
	if (!isPlainObject(spec)) {
		report(
			`option '${optionName}' must be declared with one of ${OPTION_HELPERS}`,
		);
	}

	if (OPTION_TYPES.indexOf(spec.type) === -1) {
		report(
			`option '${optionName}' has type '${spec.type}'; the supported types are ${OPTION_TYPES.join(
				", ",
			)} — declare it with one of ${OPTION_HELPERS}`,
		);
	}

	const unknownFields = Object.keys(spec).filter(
		(field) => OPTION_SPEC_FIELDS.indexOf(field) === -1,
	);
	if (unknownFields.length) {
		report(
			`option '${optionName}' has unknown field(s) ${unknownFields
				.map((field) => `'${field}'`)
				.join(", ")}; an option spec accepts ${OPTION_SPEC_FIELDS.join(", ")}`,
		);
	}

	if (spec.required !== undefined && typeof spec.required !== "boolean") {
		report(`option '${optionName}': 'required' must be a boolean`);
	}
	if (spec.required === true && spec.default !== undefined) {
		report(
			`option '${optionName}' is required and has a default; one of the two`,
		);
	}

	const aliasIsUsable =
		spec.alias === undefined ||
		typeof spec.alias === "string" ||
		(Array.isArray(spec.alias) &&
			spec.alias.length > 0 &&
			spec.alias.every((entry: any) => typeof entry === "string"));
	if (!aliasIsUsable) {
		report(
			`option '${optionName}' declares an 'alias' that is neither a string nor a non-empty array of strings`,
		);
	}

	if (
		spec.hasSensitiveValue !== undefined &&
		typeof spec.hasSensitiveValue !== "boolean"
	) {
		report(`option '${optionName}' declares a non-boolean 'hasSensitiveValue'`);
	}

	if (spec.description !== undefined && typeof spec.description !== "string") {
		report(`option '${optionName}' declares a non-string 'description'`);
	}
};

const validateParamSpecs = (definition: any, specs: any[]): void => {
	const seen: string[] = [];
	let optionalSeen: string | null = null;

	for (let index = 0; index < specs.length; index++) {
		const spec = specs[index];
		const position = `argument #${index + 1}`;

		if (!isPlainObject(spec)) {
			invalid(
				definition,
				`${position} of 'params' must be an object declaring at least a 'name'`,
			);
		}

		if (typeof spec.name !== "string" || !spec.name.trim()) {
			invalid(definition, `${position} of 'params' has no usable 'name'`);
		}

		const unknownFields = Object.keys(spec).filter(
			(field) => ARGUMENT_SPEC_FIELDS.indexOf(field) === -1,
		);
		if (unknownFields.length) {
			invalid(
				definition,
				`argument '${spec.name}' has unknown field(s) ${unknownFields
					.map((field) => `'${field}'`)
					.join(
						", ",
					)}; an argument spec accepts ${ARGUMENT_SPEC_FIELDS.join(", ")}`,
			);
		}

		if (seen.indexOf(spec.name) !== -1) {
			invalid(
				definition,
				`'params' declares '${spec.name}' twice; param names key ctx.params and must be unique`,
			);
		}
		seen.push(spec.name);

		for (const flag of ["required", "variadic"]) {
			if (spec[flag] !== undefined && typeof spec[flag] !== "boolean") {
				invalid(
					definition,
					`argument '${spec.name}' declares a non-boolean '${flag}'`,
				);
			}
		}

		for (const text of ["description", "errorMessage"]) {
			if (spec[text] !== undefined && typeof spec[text] !== "string") {
				invalid(
					definition,
					`argument '${spec.name}' declares a non-string '${text}'`,
				);
			}
		}

		if (spec.validate !== undefined && typeof spec.validate !== "function") {
			invalid(
				definition,
				`argument '${spec.name}' has a non-function 'validate'`,
			);
		}

		if (spec.variadic === true && index !== specs.length - 1) {
			invalid(
				definition,
				`argument '${spec.name}' is variadic but is not the last one; a variadic argument collects everything after it`,
			);
		}

		// Positional matching gives an optional argument the slot regardless of
		// what follows, so a later required one could never be satisfied.
		if (spec.required === true && optionalSeen) {
			invalid(
				definition,
				`param '${spec.name}' is required but follows the optional '${optionalSeen}'; required params come first`,
			);
		}

		if (spec.required !== true) {
			optionalSeen = spec.name;
		}
	}
};

const validateDefinition = (definition: any): void => {
	if (!isPlainObject(definition)) {
		invalid(definition, "expected an object");
	}

	if ("arguments" in definition) {
		invalid(
			definition,
			"'arguments' is not a field; positional parameters are declared under 'params' and read from ctx.params",
		);
	}

	const unknownFields = Object.keys(definition).filter(
		(field) => DEFINITION_FIELDS.indexOf(field) === -1,
	);
	if (unknownFields.length) {
		invalid(
			definition,
			`unknown field(s) ${unknownFields
				.map((field) => `'${field}'`)
				.join(", ")}; a definition accepts ${DEFINITION_FIELDS.join(", ")}`,
		);
	}

	validateName(definition);

	if (typeof definition.run !== "function") {
		invalid(definition, "'run' must be a function");
	}

	if (definition.params !== undefined) {
		if (Array.isArray(definition.params)) {
			validateParamSpecs(definition, definition.params);
		} else if (definition.params !== "none" && definition.params !== "any") {
			invalid(
				definition,
				`'params' is '${definition.params}'; it must be "none", "any" or an array of param specs`,
			);
		}
	}

	for (const handler of ["canExecute", "setup", "shortcuts", "postRun"]) {
		if (
			definition[handler] !== undefined &&
			typeof definition[handler] !== "function"
		) {
			invalid(definition, `'${handler}' must be a function`);
		}
	}

	for (const flag of [
		"disableAnalytics",
		"enableHooks",
		"allowUnknownOptions",
	]) {
		if (
			definition[flag] !== undefined &&
			typeof definition[flag] !== "boolean"
		) {
			invalid(definition, `'${flag}' must be a boolean`);
		}
	}

	if (definition.providers !== undefined) {
		const providers = definition.providers;
		const wellFormed =
			Array.isArray(providers) &&
			providers.every(
				(provider: any) =>
					typeof provider === "function" ||
					(isPlainObject(provider) && provider.provide !== undefined),
			);
		if (!wellFormed) {
			invalid(
				definition,
				"'providers' must be an array of providers - classes, or objects with a 'provide' token",
			);
		}
	}

	if (definition.description !== undefined) {
		if (typeof definition.description !== "string") {
			invalid(definition, "'description' must be a string");
		}
	}

	if (definition.options !== undefined) {
		const report = (problem: string): never => invalid(definition, problem);
		const parts: any[] = Array.isArray(definition.options)
			? definition.options
			: [definition.options];
		for (const part of parts) {
			if (isOptionsGroup(part)) {
				continue;
			}
			if (!isPlainObject(part)) {
				report(
					"'options' must be an object keyed by the long option name, or an array of option groups and such objects",
				);
			}
			for (const optionName of Object.keys(part)) {
				validateOptionSpec(report, optionName, part[optionName]);
			}
		}
		resolveCommandOptions(definition.options, report);
	}
};

const HANDLER_FIELDS = ["setup", "canExecute", "run", "postRun", "shortcuts"];

const META_FIELDS = DEFINITION_FIELDS.filter(
	(field) => HANDLER_FIELDS.indexOf(field) === -1,
);

/**
 * Everything defineCommand checks except the handlers, which the class form
 * only has once the subclass is declared, after Command() has returned.
 */
const validateMeta = (meta: any): void => {
	if (!isPlainObject(meta)) {
		invalid(meta, "Command() expects an object");
	}

	const fields = Object.keys(meta);
	const handlers = fields.filter(
		(field) => HANDLER_FIELDS.indexOf(field) !== -1,
	);
	if (handlers.length) {
		invalid(
			meta,
			`Command() was given the handler(s) ${handlers
				.map((field) => `'${field}'`)
				.join(", ")}; in the class form handlers are methods of the class`,
		);
	}

	const unknownFields = fields.filter(
		(field) => META_FIELDS.indexOf(field) === -1,
	);
	if (unknownFields.length) {
		invalid(
			meta,
			`unknown field(s) ${unknownFields
				.map((field) => `'${field}'`)
				.join(", ")}; Command() accepts ${META_FIELDS.join(", ")}`,
		);
	}

	validateDefinition({ ...meta, run: (): void => undefined });
};

/**
 * A definition that carries the name it declares in its own type. `Omit` rather
 * than an intersection: intersecting the declared name with the wider `name` of
 * `CommandDefinition` widens it straight back to `string`.
 */
export type NamedCommand<
	TSchema extends CommandOptionsInput,
	TResult,
	TSetup,
	TName extends CommandName,
> = Omit<DefinedCommand<TSchema, TResult, TSetup>, "name"> & {
	readonly name: TName;
};

/** What a definition's `name` may be: one name, or aliases for one command. */
export type CommandName = string | readonly string[];

/**
 * The names a definition declares, as literal types, so a registration site can
 * be checked against them.
 */
export type CommandNamesOf<TDefinition> = TDefinition extends {
	definition: infer TClassDefinition;
}
	? // A constructor's own `name` is Function.name, so the class form has to be
		// read through its static definition before the `name` branch sees it.
		CommandNamesOf<TClassDefinition>
	: TDefinition extends {
				name: infer TName;
		  }
		? TName extends readonly (infer TAlias)[]
			? TAlias
			: TName
		: never;

export function defineCommand<
	TSchema extends CommandOptionsInput = {},
	TResult = void,
	TSetup = void,
	const TName extends CommandName = CommandName,
>(
	definition: CommandDefinition<TSchema, TResult, TSetup> & { name: TName },
): NamedCommand<TSchema, TResult, TSetup, TName> {
	validateDefinition(definition);

	const marked: any = { ...definition };
	marked[COMMAND_DEFINITION_MARKER] = true;
	return marked;
}

export function isCommandDefinition(
	value: any,
): value is DefinedCommand<any, any, any> {
	return !!value && (<any>value)[COMMAND_DEFINITION_MARKER] === true;
}

/**
 * Marks a constructor produced by `Command()`. Same `Symbol.for` reasoning as
 * COMMAND_DEFINITION_MARKER, and the same reason it is read rather than
 * `instanceof`: an extension bundles its own copy of this module.
 */
export const COMMAND_CLASS_MARKER: unique symbol = Symbol.for(
	"nativescript:cli:commandClass",
);

/** The meta `Command()` was called with, inherited by every subclass. */
const COMMAND_CLASS_META = Symbol.for("nativescript:cli:commandClassMeta");

/** Per-constructor cache of the derived definition; own-property only. */
const COMMAND_CLASS_DEFINITION = Symbol.for(
	"nativescript:command:classDefinition",
);

/**
 * What the class form declares up front: a definition without the handlers,
 * which the class supplies as methods instead.
 */
export type CommandMeta<
	TName extends CommandName = CommandName,
	TSchema extends CommandOptionsInput = {},
> = Omit<
	CommandDefinition<TSchema, any, any>,
	"name" | "setup" | "canExecute" | "run" | "postRun" | "shortcuts"
> & { name: TName };

/**
 * The instance side of the class form. Exported because it names the base of
 * every `Command()` class — a subclass's declaration emit refers to it — not
 * because anything should extend it directly.
 */
export abstract class CommandBase<TSchema extends CommandOptionsInput = {}> {
	/**
	 * The instance is built once per invocation, as that invocation's `setup`,
	 * so the context captured here is the one its own run was handed.
	 */
	protected readonly context: CommandContext<TSchema> = inject(COMMAND_CONTEXT);

	protected get options(): OptionValuesOf<TSchema> {
		return this.context.options;
	}

	protected get args(): string[] {
		return this.context.args;
	}

	abstract run(): unknown;
	canExecute?(): Promise<boolean> | boolean;
	/** Typed off the subclass's own `run` through the polymorphic `this`. */
	postRun?(result: Awaited<ReturnType<this["run"]>>): Promise<void> | void;
	shortcuts?(): KeyShortcut[];
}

/**
 * The static side. An abstract construct signature, so the compiler still
 * requires a subclass to implement `run`, and a named type, so declaration
 * emit for `class X extends Command({ ... })` has something to refer to.
 */
export type CommandClass<
	TName extends CommandName = CommandName,
	TSchema extends CommandOptionsInput = {},
> = (abstract new () => CommandBase<TSchema>) & {
	readonly definition: NamedCommand<TSchema, any, CommandBase<TSchema>, TName>;
	readonly [COMMAND_CLASS_MARKER]: true;
};

/** Either accepted form of a command, as a registration site takes it. */
export type RegisterableCommand =
	DefinedCommand<any, any, any> | CommandClass<any, any>;

export function isCommandClass(value: any): value is CommandClass<any, any> {
	return (
		typeof value === "function" && (<any>value)[COMMAND_CLASS_MARKER] === true
	);
}

const buildClassDefinition = (ctor: any): DefinedCommand<any, any, any> => {
	const meta = ctor[COMMAND_CLASS_META];
	const prototype = ctor.prototype;
	const implementsMethod = (method: string): boolean =>
		typeof prototype[method] === "function";

	if (!implementsMethod("run")) {
		// The base Command() returns is never the author's class, and its
		// local name would only mislead.
		const isFactoryBase = Object.prototype.hasOwnProperty.call(
			ctor,
			COMMAND_CLASS_META,
		);
		invalid(
			meta,
			isFactoryBase
				? "the class returned by Command() implements no 'run' method; extend it with a class that does"
				: ctor.name
					? `the class '${ctor.name}' implements no 'run' method`
					: "an anonymous class implements no 'run' method",
		);
	}

	// The instance IS the setup result, so every handler reaches it as the
	// second argument the adapter already threads through.
	const definition: any = {
		...meta,
		setup: () => new ctor(),
		run: (context: any, instance: any) => instance.run(),
	};

	if (implementsMethod("canExecute")) {
		definition.canExecute = (context: any, instance: any) =>
			instance.canExecute();
	}

	if (implementsMethod("postRun")) {
		definition.postRun = (context: any, result: any, instance: any) =>
			instance.postRun(result);
	}

	if (implementsMethod("shortcuts")) {
		definition.shortcuts = (context: any, instance: any) =>
			instance.shortcuts();
	}

	return defineCommand(definition);
};

/**
 * The definition a `Command()` class stands for, cached on the constructor it
 * was read from. The cache entry is an own property so a class extending
 * another command class never serves its parent's definition.
 */
function classCommandDefinition(ctor: any): DefinedCommand<any, any, any> {
	if (!isCommandClass(ctor)) {
		throw new Error(
			`${describeDefinition(ctor)} is not a command class: it did not come ` +
				`from Command(). Accepted form: ${ACCEPTED_FORM}`,
		);
	}

	const target: any = ctor;
	if (Object.prototype.hasOwnProperty.call(target, COMMAND_CLASS_DEFINITION)) {
		return target[COMMAND_CLASS_DEFINITION];
	}

	const definition = buildClassDefinition(target);
	Object.defineProperty(target, COMMAND_CLASS_DEFINITION, {
		value: definition,
	});

	return definition;
}

/** The definition behind either form, or null for anything else. */
export function toCommandDefinition(
	value: any,
): DefinedCommand<any, any, any> | null {
	if (isCommandClass(value)) {
		return classCommandDefinition(value);
	}

	return isCommandDefinition(value) ? value : null;
}

/**
 * What a dispatcher accepts: a registered command's name, or a definition or
 * class to run as given.
 */
export type CommandReference = string | RegisterableCommand;

/**
 * The class authoring form: sugar over defineCommand, not a second execution
 * path. The returned base carries a `definition` that reads the class it is
 * accessed through, so the subclass — not this base — is what `setup`
 * instantiates, and registration keeps taking definitions only.
 *
 *     export class PlatformClean extends Command({
 *       name: "platform|clean",
 *       options: { frameworkPath: stringOption() },
 *     }) {
 *       private $helper = inject<IPlatformCommandHelper>("platformCommandHelper");
 *       run() { return this.$helper.clean(this.args, this.options.frameworkPath); }
 *     }
 */
export function Command<
	const TName extends CommandName,
	TSchema extends CommandOptionsInput = {},
>(meta: CommandMeta<TName, TSchema>): CommandClass<TName, TSchema> {
	validateMeta(meta);

	abstract class Base extends CommandBase<TSchema> {
		// A getter, because `this` in a static accessor is the constructor the
		// property was read through: that is the only hook that resolves the
		// subclass without the subclass having to name itself.
		static get definition(): DefinedCommand<any, any, any> {
			return classCommandDefinition(this);
		}
	}

	Object.defineProperty(Base, COMMAND_CLASS_MARKER, { value: true });
	Object.defineProperty(Base, COMMAND_CLASS_META, { value: meta });

	return <any>Base;
}
