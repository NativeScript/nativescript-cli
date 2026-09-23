/**
 * The declarative command API. Types and pure factories only — this module is
 * re-exported from `nativescript/contracts` and must stay side-effect-free, so
 * it may not import lib/common/yok (whose import creates global.$injector).
 * The runtime bridge onto the legacy registry lives in
 * lib/common/services/command-definition-adapter.
 */

import { COMMAND_CONTEXT } from "./contracts/command-context";
import type { KeyShortcut } from "./contracts/key-shortcuts";
import { inject } from "./di/inject";
import type { Injector } from "./di/injector";

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

/**
 * Positional arguments keyed by the declaring spec's `name`. A variadic spec
 * always yields an array; a non-variadic optional one is absent when the
 * command line did not reach it.
 */
export interface CommandArgumentValues {
	[argumentName: string]: string | string[];
}

/**
 * One positional argument. Specs are matched strictly by position: the first
 * spec takes the first argument, and so on.
 */
export interface ArgumentSpec<TSchema extends CommandOptionsSchema = {}> {
	/** Key under which the value appears on `ctx.params`. */
	name: string;
	/** Defaults to false. A required spec may not follow an optional one. */
	required?: boolean;
	/** Collects every remaining argument as `string[]`. Must be the last spec. */
	variadic?: boolean;
	/** Reserved for generated help; nothing renders it yet. */
	description?: string;
	/** Replaces the default message when a required argument is missing. */
	errorMessage?: string;
	/** `false` or a message string rejects the value; a string is the message. */
	validate?(
		value: string,
		context: CommandContext<TSchema>,
	): boolean | string | Promise<boolean | string>;
}

/**
 * `"none"` rejects positional arguments; `"any"` accepts any number of them;
 * an array declares them one by one.
 */
export type ArgumentsPolicy<TSchema extends CommandOptionsSchema = {}> =
	"none" | "any" | ArgumentSpec<TSchema>[];

export interface CommandFailOptions {
	/**
	 * Print the usage help suggestion after the message. Defaults to true; pass
	 * false when the command line was fine and the environment or project is not.
	 */
	help?: boolean;
}

export interface CommandContext<TSchema extends CommandOptionsSchema = {}> {
	/** Positional arguments, after the command name has been consumed. */
	args: string[];
	/** The same arguments keyed by the names the `arguments` specs declare. */
	params: CommandArgumentValues;
	/** Current value of every option declared in the schema, and nothing else. */
	options: CommandOptionValues<TSchema>;
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
	TSchema extends CommandOptionsSchema = {},
	TResult = void,
	TSetup = void,
> {
	/** `"widget|add"`; `|` separates hierarchy levels. Several names alias one command. */
	name: CommandName;
	description?: string;
	options?: TSchema;
	/**
	 * `"none"` (the default) rejects positional arguments; `"any"` accepts any
	 * number; an array declares them positionally. Anything finer belongs in
	 * `canExecute`, which runs after this policy.
	 */
	arguments?: ArgumentsPolicy<TSchema>;
	/**
	 * Hands options this CLI does not know through to the command instead of
	 * reporting them. Only for commands that forward their command line to
	 * another CLI.
	 */
	allowUnknownOptions?: boolean;
	disableAnalytics?: boolean;
	enableHooks?: boolean;
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
	TSchema extends CommandOptionsSchema = {},
	TResult = void,
	TSetup = void,
> = CommandDefinition<TSchema, TResult, TSetup> & {
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
/** For flags the parser nests, such as --env.production or --teamId. */
export const objectOption = optionHelper<any>("object");

const DEFINITION_FIELDS = [
	"name",
	"description",
	"options",
	"arguments",
	"allowUnknownOptions",
	"canExecute",
	"disableAnalytics",
	"enableHooks",
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
	"optional fields description, options, arguments, allowUnknownOptions, " +
	"setup, canExecute, shortcuts, postRun, disableAnalytics and enableHooks. " +
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

const validateArgumentSpecs = (definition: any, specs: any[]): void => {
	const seen: string[] = [];
	let optionalSeen: string | null = null;

	for (let index = 0; index < specs.length; index++) {
		const spec = specs[index];
		const position = `argument #${index + 1}`;

		if (!isPlainObject(spec)) {
			invalid(
				definition,
				`${position} of 'arguments' must be an object declaring at least a 'name'`,
			);
		}

		if (typeof spec.name !== "string" || !spec.name.trim()) {
			invalid(definition, `${position} of 'arguments' has no usable 'name'`);
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
				`'arguments' declares '${spec.name}' twice; argument names key ctx.params and must be unique`,
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
				`argument '${spec.name}' is required but follows the optional '${optionalSeen}'; required arguments come first`,
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

	if (definition.arguments !== undefined) {
		if (Array.isArray(definition.arguments)) {
			validateArgumentSpecs(definition, definition.arguments);
		} else if (
			definition.arguments !== "none" &&
			definition.arguments !== "any"
		) {
			invalid(
				definition,
				`'arguments' is '${definition.arguments}'; it must be "none", "any" or an array of argument specs`,
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
	TSchema extends CommandOptionsSchema,
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
	TSchema extends CommandOptionsSchema = {},
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
	TSchema extends CommandOptionsSchema = {},
> = Omit<
	CommandDefinition<TSchema, any, any>,
	"name" | "setup" | "canExecute" | "run" | "postRun" | "shortcuts"
> & { name: TName };

/**
 * The instance side of the class form. Exported because it names the base of
 * every `Command()` class — a subclass's declaration emit refers to it — not
 * because anything should extend it directly.
 */
export abstract class CommandBase<TSchema extends CommandOptionsSchema = {}> {
	/**
	 * The instance is built once per invocation, as that invocation's `setup`,
	 * so the context captured here is the one its own run was handed.
	 */
	protected readonly context: CommandContext<TSchema> = inject(COMMAND_CONTEXT);

	protected get options(): CommandOptionValues<TSchema> {
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
	TSchema extends CommandOptionsSchema = {},
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
export function classCommandDefinition(
	ctor: any,
): DefinedCommand<any, any, any> {
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
	TSchema extends CommandOptionsSchema = {},
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
