import { EOL } from "os";
import { OptionType } from "../enums";
import { injector } from "../yok";
import { runInInjectionContext } from "../di/inject";
import { Injector } from "../di/injector";
import { IDictionary, IDashedOption, IErrors } from "../declarations";
import { ICommand } from "../definitions/commands";
import { CommandRegistry } from "../contracts/command-registry";
import {
	ArgumentSpec,
	CommandArgumentValues,
	CommandContext,
	CommandDefinition,
	CommandOptionSpec,
	CommandOptionType,
	CommandOptionsSchema,
	DefinedCommand,
	isCommandDefinition,
} from "../define-command";

const OPTION_TYPES: IDictionary<OptionType> = {
	boolean: OptionType.Boolean,
	string: OptionType.String,
	number: OptionType.Number,
	array: OptionType.Array,
	object: OptionType.Object,
};

const compileOptions = (
	schema: CommandOptionsSchema,
	cliOptions?: IDictionary<IDashedOption>,
): IDictionary<IDashedOption> => {
	const dashedOptions: IDictionary<IDashedOption> = {};

	for (const optionName of Object.keys(schema)) {
		const spec = schema[optionName];
		// Declaring an option the CLI already defines replaces its entry
		// wholesale (see setupOptions), so anything left unspecified here is
		// carried over rather than silently dropped for this command.
		const cliOption = cliOptions && cliOptions[optionName];
		const dashedOption: IDashedOption = {
			type: OPTION_TYPES[<CommandOptionType>spec.type],
			hasSensitiveValue:
				spec.hasSensitiveValue !== undefined
					? spec.hasSensitiveValue === true
					: cliOption
						? cliOption.hasSensitiveValue === true
						: false,
		};

		if (spec.default !== undefined) {
			dashedOption.default = spec.default;
		} else if (cliOption && cliOption.default !== undefined) {
			dashedOption.default = cliOption.default;
		}

		if (spec.alias !== undefined) {
			dashedOption.alias = spec.alias;
		} else if (cliOption && cliOption.alias !== undefined) {
			dashedOption.alias = cliOption.alias;
		}

		if (spec.description !== undefined) {
			dashedOption.describe = spec.description;
		}

		dashedOptions[optionName] = dashedOption;
	}

	return dashedOptions;
};

const aliasList = (alias: string | string[]): string[] =>
	alias === undefined ? [] : Array.isArray(alias) ? alias : [alias];

/**
 * Redeclaring a CLI-wide option with the same type is the sanctioned way to
 * give it a per-command default — `setupOptions` merges the command's
 * declaration over the CLI-wide one. Only a redeclaration that changes what
 * the spelling MEANS is a collision: a different type, or an alias that
 * belongs to some other CLI-wide option.
 */
const isRedeclarationOf = (
	spec: CommandOptionSpec,
	cliOption: IDashedOption,
): boolean => OPTION_TYPES[<CommandOptionType>spec.type] === cliOption.type;

const warnOnCliOptionCollisions = (
	targetInjector: Injector,
	definition: CommandDefinition<any, any, any>,
	schema: CommandOptionsSchema,
	optionsService: any,
): void => {
	const cliOptions = optionsService && optionsService.options;
	if (!cliOptions) {
		return;
	}

	// Every spelling the CLI already answers to, mapped to the option owning it.
	const cliSpellings: IDictionary<string> = {};
	for (const cliName of Object.keys(cliOptions)) {
		cliSpellings[cliName] = cliName;
		for (const alias of aliasList(cliOptions[cliName].alias)) {
			cliSpellings[alias] = cliName;
		}
	}

	const collisions: string[] = [];
	for (const optionName of Object.keys(schema)) {
		const spec = schema[optionName];

		// A spelling owned by the option of the same name is the redeclaration
		// pattern; one owned by a different option is genuine shadowing.
		const shadows = (spelling: string): boolean => {
			const owner = cliSpellings[spelling];
			if (!owner) {
				return false;
			}

			return (
				owner !== optionName || !isRedeclarationOf(spec, cliOptions[owner])
			);
		};

		if (shadows(optionName)) {
			collisions.push(
				`'--${optionName}' with the CLI option '--${cliSpellings[optionName]}'`,
			);
		}

		for (const alias of aliasList(spec.alias)) {
			if (shadows(alias)) {
				collisions.push(
					`alias '-${alias}' of '--${optionName}' with the CLI option '--${cliSpellings[alias]}'`,
				);
			}
		}
	}

	if (!collisions.length) {
		return;
	}

	const logger = targetInjector.get("logger", { optional: true });
	if (!logger) {
		return;
	}

	const commandName = Array.isArray(definition.name)
		? definition.name[0]
		: definition.name;
	logger.warn(
		`Command '${commandName}' declares options that collide with CLI-wide ` +
			`ones: ${collisions.join("; ")}. The command's declaration wins while ` +
			`the command runs; rename them to avoid it.`,
	);
};

/**
 * Wraps a declarative definition in the ICommand shape the legacy registry and
 * CommandsService expect.
 *
 * The compiled command always exposes `canExecute`, because CommandsService
 * skips `allowedParameters` entirely once it is present: the adapter enforces
 * the declared `arguments` policy itself and only then consults the
 * definition's own `canExecute`, so the two fields compose.
 *
 * CommandsService calls canExecute, execute and postCommandAction as three
 * separate entry points into one invocation, which is why the setup result and
 * the run result are held here rather than passed between them.
 */
export function createCommandFromDefinition<
	TSchema extends CommandOptionsSchema,
	TResult = any,
	TSetup = any,
>(
	definition: CommandDefinition<TSchema, TResult, TSetup>,
	targetInjector: Injector = injector,
): ICommand {
	const schema = definition.options || <TSchema>{};
	const optionNames = Object.keys(schema);

	// Only a definition that declares options may depend on the options service
	// being registered - a bare command must work without one.
	const optionsService: any = optionNames.length
		? targetInjector.get("options")
		: null;

	const dashedOptions = compileOptions(
		schema,
		optionsService && optionsService.options,
	);

	warnOnCliOptionCollisions(targetInjector, definition, schema, optionsService);

	const commandName = Array.isArray(definition.name)
		? definition.name[0]
		: definition.name;

	const fail = (message: string): never => {
		if (typeof message !== "string" || !message.trim()) {
			throw new Error(
				`ctx.fail() for command '${commandName}' requires a non-empty message.`,
			);
		}

		const errors: IErrors = targetInjector.get("errors");
		return errors.failWithHelp(message);
	};

	const argumentSpecs: ArgumentSpec<TSchema>[] = Array.isArray(
		definition.arguments,
	)
		? definition.arguments
		: null;
	const acceptsArguments = definition.arguments === "any";

	// Strictly positional: spec[i] owns args[i], and a trailing variadic spec
	// takes everything from its own position on.
	const mapArguments = (args: string[]): CommandArgumentValues => {
		const values: CommandArgumentValues = {};
		if (!argumentSpecs) {
			return values;
		}

		for (let index = 0; index < argumentSpecs.length; index++) {
			const spec = argumentSpecs[index];
			if (spec.variadic) {
				values[spec.name] = args.slice(index);
			} else if (index < args.length) {
				values[spec.name] = args[index];
			}
		}

		return values;
	};

	// Read per call rather than snapshotted here: the options service only holds
	// this command's parsed values once validateOptions has run for it.
	const buildContext = (args: string[]): CommandContext<TSchema> => {
		const options: any = {};
		for (const optionName of optionNames) {
			options[optionName] = optionsService[optionName];
		}

		return {
			args,
			arguments: mapArguments(args),
			options,
			injector: targetInjector,
			fail,
		};
	};

	const missingArgumentMessage = (spec: ArgumentSpec<TSchema>): string =>
		spec.errorMessage || `Missing required argument '${spec.name}'.`;

	const enforceArguments = async (
		context: CommandContext<TSchema>,
	): Promise<void> => {
		const args = context.args;

		if (!argumentSpecs) {
			if (!acceptsArguments && args.length) {
				fail("This command doesn't accept parameters.");
			}

			return;
		}

		const missing = argumentSpecs.filter(
			(spec, index) => spec.required && index >= args.length,
		);
		if (missing.length) {
			// The preamble is what the parameter machinery printed ahead of the
			// individual messages, so a command reads the same either way.
			fail(
				[
					"You need to provide all the required parameters.",
					...missing.map(missingArgumentMessage),
				].join(EOL),
			);
		}

		const variadic =
			argumentSpecs.length > 0 &&
			argumentSpecs[argumentSpecs.length - 1].variadic;
		if (!variadic && args.length > argumentSpecs.length) {
			fail(
				argumentSpecs.length === 0
					? "This command doesn't accept parameters."
					: `This command accepts at most ${argumentSpecs.length} parameter(s), but ${args.length} were provided.`,
			);
		}

		for (let index = 0; index < argumentSpecs.length; index++) {
			const spec = argumentSpecs[index];
			if (!spec.validate) {
				continue;
			}

			const values = spec.variadic
				? args.slice(index)
				: args.slice(index, index + 1);
			for (const value of values) {
				const verdict = await spec.validate.call(spec, value, context);
				if (verdict === true) {
					continue;
				}

				fail(
					typeof verdict === "string" && verdict.trim()
						? verdict
						: `The parameter '${value}' is not valid for '${spec.name}'.`,
				);
			}
		}
	};

	// One invocation spans canExecute, execute and postCommandAction, which the
	// CommandsService calls separately; setup must run for the first of them
	// that happens and be reused by the rest.
	let setupPromise: Promise<Awaited<TSetup>> = null;
	const ensureSetup = (
		context: CommandContext<TSchema>,
	): Promise<Awaited<TSetup>> => {
		if (!setupPromise) {
			setupPromise = definition.setup
				? Promise.resolve(
						runInInjectionContext(targetInjector, () =>
							definition.setup.call(definition, context),
						),
					)
				: Promise.resolve(<Awaited<TSetup>>undefined);
		}

		return setupPromise;
	};

	let runResult: Awaited<TResult>;

	return {
		allowedParameters: [],
		dashedOptions,
		...(definition.disableAnalytics === undefined
			? {}
			: { disableAnalytics: definition.disableAnalytics }),
		...(definition.enableHooks === undefined
			? {}
			: { enableHooks: definition.enableHooks }),
		...(definition.allowUnknownOptions === undefined
			? {}
			: { allowUnknownOptions: definition.allowUnknownOptions }),
		...(definition.postRun === undefined
			? {}
			: {
					postCommandAction: async (args: string[]): Promise<void> => {
						const context = buildContext(args);
						const setupResult = await ensureSetup(context);
						await runInInjectionContext(targetInjector, () =>
							definition.postRun.call(
								definition,
								context,
								runResult,
								setupResult,
							),
						);
					},
				}),
		canExecute: async (args: string[]): Promise<boolean> => {
			const context = buildContext(args);
			// Setup first: it stands in for the constructor work legacy commands
			// did at resolution time, which ran before anything looked at the
			// arguments - so an argument validator can rely on it, and a command
			// run in the wrong place still reports that before complaining about
			// arity.
			const setupResult = await ensureSetup(context);

			await enforceArguments(context);

			const refine = definition.canExecute;
			if (!refine) {
				return true;
			}

			// Same first-await rule as execute: runInInjectionContext is
			// synchronous, so inject() is available up to the first await.
			return await runInInjectionContext(targetInjector, () =>
				refine.call(definition, context, setupResult),
			);
		},
		execute: async (args: string[]): Promise<void> => {
			const context = buildContext(args);
			const setupResult = await ensureSetup(context);
			runResult = await runInInjectionContext(targetInjector, () =>
				definition.run.call(definition, context, setupResult),
			);
		},
	};
}

/**
 * Registers a definition under an externally chosen command name. Extension
 * manifests route by their own key, which need not be the definition's own
 * name, so the name is a parameter rather than read off the definition.
 */
export function registerDefinitionAs<
	TSchema extends CommandOptionsSchema,
	TResult = any,
	TSetup = any,
>(
	name: string,
	definition: DefinedCommand<TSchema, TResult, TSetup>,
	targetInjector: Injector = injector,
): void {
	// The registry facet rather than the injector itself, so a child injector
	// that provides its own CommandRegistry receives the registration.
	const registry = targetInjector.get(CommandRegistry);
	// A prototype-less zero-parameter function registers as a useFactory
	// provider, so the command is built on first resolution and cached.
	registry.registerCommand(name, () =>
		createCommandFromDefinition(definition, targetInjector),
	);
}

export function registerCommandDefinition<
	TSchema extends CommandOptionsSchema,
	TResult = any,
	TSetup = any,
>(
	definition: DefinedCommand<TSchema, TResult, TSetup>,
	targetInjector: Injector = injector,
): void {
	if (!isCommandDefinition(definition)) {
		throw new Error(
			"registerCommandDefinition() takes the result of defineCommand(); " +
				"the value passed carries no command-definition marker.",
		);
	}

	const names = Array.isArray(definition.name)
		? definition.name
		: [definition.name];

	for (const name of names) {
		registerDefinitionAs(name, definition, targetInjector);
	}
}
