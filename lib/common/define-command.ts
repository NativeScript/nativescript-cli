/**
 * The declarative command API. Types and pure factories only — this module is
 * re-exported from `nativescript/contracts` and must stay side-effect-free, so
 * it may not import lib/common/yok (whose import creates global.$injector).
 * The runtime bridge onto the legacy registry lives in
 * lib/common/services/command-definition-adapter.
 */

/**
 * Symbol.for so that a definition produced by one copy of the CLI is still
 * recognised by another — extensions bundle their own node_modules. `unique
 * symbol` so the marker can also be spelled in the branded return type.
 */
export const COMMAND_DEFINITION_MARKER: unique symbol = Symbol.for(
	"nativescript:cli:commandDefinition",
);

export type CommandOptionType = "boolean" | "string" | "number" | "array";

export interface CommandOptionSpec<TValue = any> {
	type: CommandOptionType;
	/** Value used when the flag is absent from the command line. */
	default?: TValue;
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
 * declares a `default` yields a value that is always there.
 */
type CommandOptionValue<TSpec> =
	TSpec extends CommandOptionSpec<infer TValue>
		? TSpec extends { default: any }
			? TValue
			: TValue | undefined
		: any;

export type CommandOptionValues<TSchema extends CommandOptionsSchema> = {
	[K in keyof TSchema]: CommandOptionValue<TSchema[K]>;
};

export interface CommandContext<TSchema extends CommandOptionsSchema = {}> {
	/** Positional arguments, after the command name has been consumed. */
	args: string[];
	/** Current value of every option declared in the schema, and nothing else. */
	options: CommandOptionValues<TSchema>;
	/** Fails the command with `message` and the usage help suggestion. */
	fail(message: string): never;
}

export interface CommandDefinition<TSchema extends CommandOptionsSchema = {}> {
	/** `"widget|add"`; `|` separates hierarchy levels. Several names alias one command. */
	name: string | string[];
	description?: string;
	options?: TSchema;
	/**
	 * `"none"` (the default) rejects positional arguments; `"any"` accepts them.
	 * Anything finer belongs in `canExecute`, which runs after this policy.
	 */
	arguments?: "none" | "any";
	canExecute?(context: CommandContext<TSchema>): Promise<boolean> | boolean;
	disableAnalytics?: boolean;
	enableHooks?: boolean;
	run(context: CommandContext<TSchema>): Promise<void> | void;
}

/**
 * What `defineCommand` returns: a definition carrying the marker in its type,
 * so `registerCommandDefinition` can require a definition that went through
 * define-time validation rather than any object of the right shape.
 */
export type DefinedCommand<TSchema extends CommandOptionsSchema = {}> =
	CommandDefinition<TSchema> & {
		readonly [COMMAND_DEFINITION_MARKER]: true;
	};

interface IOptionHelper<TValue> {
	(
		init: CommandOptionSpecInit<TValue> & { default: TValue },
	): DefaultedCommandOptionSpec<TValue>;
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

const DEFINITION_FIELDS = [
	"name",
	"description",
	"options",
	"arguments",
	"canExecute",
	"disableAnalytics",
	"enableHooks",
	"run",
];

const OPTION_SPEC_FIELDS = [
	"type",
	"default",
	"alias",
	"hasSensitiveValue",
	"description",
];

const OPTION_TYPES: CommandOptionType[] = [
	"boolean",
	"string",
	"number",
	"array",
];

const ACCEPTED_FORM =
	'defineCommand({ name: "widget|add", run(ctx) { ... } }) — with the ' +
	"optional fields description, options, arguments, canExecute, " +
	"disableAnalytics and enableHooks.";

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

const isPlainObject = (value: any): boolean =>
	!!value && typeof value === "object" && !Array.isArray(value);

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

const validateOptionSpec = (
	definition: any,
	optionName: string,
	spec: any,
): void => {
	if (!isPlainObject(spec)) {
		invalid(
			definition,
			`option '${optionName}' must be declared with one of booleanOption(), stringOption(), numberOption() or arrayOption()`,
		);
	}

	if (OPTION_TYPES.indexOf(spec.type) === -1) {
		invalid(
			definition,
			`option '${optionName}' has type '${spec.type}'; the supported types are ${OPTION_TYPES.join(
				", ",
			)} — declare it with one of booleanOption(), stringOption(), numberOption() or arrayOption()`,
		);
	}

	const unknownFields = Object.keys(spec).filter(
		(field) => OPTION_SPEC_FIELDS.indexOf(field) === -1,
	);
	if (unknownFields.length) {
		invalid(
			definition,
			`option '${optionName}' has unknown field(s) ${unknownFields
				.map((field) => `'${field}'`)
				.join(", ")}; an option spec accepts ${OPTION_SPEC_FIELDS.join(", ")}`,
		);
	}

	const aliasIsUsable =
		spec.alias === undefined ||
		typeof spec.alias === "string" ||
		(Array.isArray(spec.alias) &&
			spec.alias.length > 0 &&
			spec.alias.every((entry: any) => typeof entry === "string"));
	if (!aliasIsUsable) {
		invalid(
			definition,
			`option '${optionName}' declares an 'alias' that is neither a string nor a non-empty array of strings`,
		);
	}

	if (
		spec.hasSensitiveValue !== undefined &&
		typeof spec.hasSensitiveValue !== "boolean"
	) {
		invalid(
			definition,
			`option '${optionName}' declares a non-boolean 'hasSensitiveValue'`,
		);
	}

	if (spec.description !== undefined && typeof spec.description !== "string") {
		invalid(
			definition,
			`option '${optionName}' declares a non-string 'description'`,
		);
	}
};

const validateDefinition = (definition: any): void => {
	if (!isPlainObject(definition)) {
		invalid(definition, "expected an object");
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

	if (
		definition.arguments !== undefined &&
		definition.arguments !== "none" &&
		definition.arguments !== "any"
	) {
		invalid(
			definition,
			`'arguments' is '${definition.arguments}'; it must be "none" or "any"`,
		);
	}

	if (
		definition.canExecute !== undefined &&
		typeof definition.canExecute !== "function"
	) {
		invalid(definition, "'canExecute' must be a function");
	}

	for (const flag of ["disableAnalytics", "enableHooks"]) {
		if (
			definition[flag] !== undefined &&
			typeof definition[flag] !== "boolean"
		) {
			invalid(definition, `'${flag}' must be a boolean`);
		}
	}

	if (definition.description !== undefined) {
		if (typeof definition.description !== "string") {
			invalid(definition, "'description' must be a string");
		}
	}

	if (definition.options !== undefined) {
		if (!isPlainObject(definition.options)) {
			invalid(
				definition,
				"'options' must be an object keyed by the long option name",
			);
		}

		for (const optionName of Object.keys(definition.options)) {
			validateOptionSpec(
				definition,
				optionName,
				definition.options[optionName],
			);
		}
	}
};

export function defineCommand<TSchema extends CommandOptionsSchema = {}>(
	definition: CommandDefinition<TSchema>,
): DefinedCommand<TSchema> {
	validateDefinition(definition);

	const marked: any = { ...definition };
	marked[COMMAND_DEFINITION_MARKER] = true;
	return marked;
}

export function isCommandDefinition(value: any): value is DefinedCommand {
	return !!value && (<any>value)[COMMAND_DEFINITION_MARKER] === true;
}
