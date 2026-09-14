import { EOL } from "os";
import { OptionType } from "../enums";
import { getRootInjector } from "../yok";
import { getCurrentInjector, runInInjectionContext } from "../di/inject";
import { Injector } from "../di/injector";
import { IDictionary, IDashedOption, IErrors } from "../declarations";
import { ICommand } from "../definitions/commands";
import { COMMAND_CONTEXT } from "../contracts/command-context";
import { CommandsService } from "../contracts/commands-service";
import {
	COMMAND_OWNER,
	CommandRegistry,
	DeferredCommandResult,
	describeRejection,
} from "../contracts/command-registry";
import {
	commandShortcutsEnabled,
	IKeyShortcutService,
	KeyShortcut,
} from "../contracts/key-shortcuts";
import { Provider } from "../di/providers";
import {
	ArgumentSpec,
	CommandArgumentValues,
	CommandContext,
	CommandDefinition,
	CommandClass,
	CommandName,
	CommandNamesOf,
	CommandOptionSpec,
	CommandOptionType,
	CommandOptionsSchema,
	CommandReference,
	DefinedCommand,
	RegisterableCommand,
	defineCommand,
	toCommandDefinition,
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
 * the run result are held on an invocation record here rather than passed
 * between them. The command object is resolved once and cached for the process
 * lifetime, so that record is replaced per invocation.
 */
export function createCommandFromDefinition<
	TSchema extends CommandOptionsSchema,
	TResult = any,
	TSetup = any,
>(
	definition: CommandDefinition<TSchema, TResult, TSetup>,
	targetInjector: Injector = <Injector>(<any>getRootInjector()),
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

	// Read when an invocation opens rather than at definition time: the options
	// service only holds this command's parsed values once validateOptions has
	// run for it.
	const buildContext = (args: string[]): CommandContext<TSchema> => {
		const options: any = {};
		for (const optionName of optionNames) {
			options[optionName] = optionsService[optionName];
		}

		return {
			args,
			params: mapArguments(args),
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

	// The state of one invocation. The command object itself is cached for the
	// process, so nothing invocation-scoped may live outside one of these.
	interface Invocation {
		/** Built once when the invocation opens; every stage and COMMAND_CONTEXT share it. */
		context: CommandContext<TSchema>;
		injector: Injector;
		setup: Promise<Awaited<TSetup>>;
		hasRun: boolean;
		runResult?: Awaited<TResult>;
	}

	const startSetup = (
		context: CommandContext<TSchema>,
		injector: Injector,
	): Promise<Awaited<TSetup>> =>
		// The executor runs synchronously, so setup keeps its injection context
		// up to its first await, while a synchronous failure - ctx.fail() is one -
		// rejects the promise instead of escaping into the caller.
		new Promise<Awaited<TSetup>>((resolve) =>
			resolve(
				definition.setup
					? <any>(
							runInInjectionContext(injector, () =>
								definition.setup.call(definition, context),
							)
						)
					: undefined,
			),
		);

	// CommandsService calls canExecute, execute and postCommandAction as three
	// separate entry points with nothing tying them together, so the boundary
	// between invocations is inferred: canExecute always opens one, and execute
	// opens one only when the current invocation has already run.
	let currentInvocation: Invocation = null;

	const beginInvocation = (context: CommandContext<TSchema>): Invocation => {
		const invocation: Invocation = {
			context,
			injector: targetInjector.createChild([
				{ provide: COMMAND_CONTEXT, useValue: context },
			]),
			setup: undefined,
			hasRun: false,
		};
		invocation.setup = startSetup(context, invocation.injector);
		currentInvocation = invocation;

		return invocation;
	};

	/**
	 * Attaching takes the terminal into raw mode and leaves stdin resumed, so it
	 * is confined to a top-level run: an in-process dispatch borrows the
	 * terminal of a host that has its own table attached, and replacing it would
	 * take the host's keys with it.
	 */
	const attachShortcuts = (
		invocation: Invocation,
		context: CommandContext<TSchema>,
		setupResult: Awaited<TSetup>,
	): void => {
		if (!commandShortcutsEnabled()) {
			return;
		}

		const commandsService = targetInjector.get(CommandsService, {
			optional: true,
		});
		if (commandsService && commandsService.isExecutingInProcess) {
			return;
		}

		const shortcuts: KeyShortcut[] = runInInjectionContext(
			invocation.injector,
			() => definition.shortcuts.call(definition, context, setupResult),
		);
		if (!shortcuts || !shortcuts.length) {
			return;
		}

		const keyShortcutService = targetInjector.get<IKeyShortcutService>(
			"keyShortcutService",
			{ optional: true },
		);
		if (!keyShortcutService || !keyShortcutService.attach({ shortcuts })) {
			return;
		}

		keyShortcutService.printHint();
	};

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
						const invocation =
							currentInvocation || beginInvocation(buildContext(args));
						const context = invocation.context;
						const setupResult = await invocation.setup;
						await runInInjectionContext(invocation.injector, () =>
							definition.postRun.call(
								definition,
								context,
								invocation.runResult,
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
			const invocation = beginInvocation(context);
			const setupResult = await invocation.setup;

			await enforceArguments(context);

			const refine = definition.canExecute;
			if (!refine) {
				return true;
			}

			// Same first-await rule as execute: runInInjectionContext is
			// synchronous, so inject() is available up to the first await.
			return await runInInjectionContext(invocation.injector, () =>
				refine.call(definition, context, setupResult),
			);
		},
		execute: async (args: string[]): Promise<void> => {
			const invocation =
				currentInvocation && !currentInvocation.hasRun
					? currentInvocation
					: beginInvocation(buildContext(args));
			const context = invocation.context;
			invocation.hasRun = true;

			const setupResult = await invocation.setup;
			invocation.runResult = await runInInjectionContext(
				invocation.injector,
				() => definition.run.call(definition, context, setupResult),
			);

			if (definition.shortcuts) {
				attachShortcuts(invocation, context, setupResult);
			}
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
	targetInjector: Injector = <Injector>(<any>getRootInjector()),
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

/** Names the CLI's own registrations in conflict and failure reports. */
const CLI_OWNER = "the NativeScript CLI";

const namesOf = (definition: DefinedCommand<any, any, any>): string[] =>
	Array.isArray(definition.name) ? definition.name : [definition.name];

/**
 * The injector serving the code that is running, so an extension module loaded
 * under a scope of its own registers into — and dispatches through — that scope
 * without naming it. Outside any context it is the CLI's own injector.
 */
const contextInjector = (): Injector =>
	getCurrentInjector() || <Injector>(<any>getRootInjector());

/**
 * Convenience over `CommandsService.runCommand` for code that has no injected
 * service at hand, such as a key shortcut action or an inline handler; the
 * contract is the API, this only resolves it from the current context.
 */
export async function runCommand(
	command: CommandReference,
	args: string[] = [],
): Promise<void> {
	await contextInjector().get(CommandsService).runCommand(command, args);
}

/**
 * Convenience over `CommandsService.canExecuteCommand`, resolved from the
 * current context the way `runCommand` is.
 */
export async function canExecuteCommand(
	command: CommandReference,
	args: string[] = [],
): Promise<boolean> {
	return contextInjector()
		.get(CommandsService)
		.canExecuteCommand(command, args);
}

/**
 * Registers a command with the CLI. Takes a Command() class, the result of
 * defineCommand(), or a bare definition, which it defines on the caller's
 * behalf.
 *
 * Registration targets the injector of the current injection context, and
 * `providers` scope the command to a child of it. To register against some
 * other injector, run the call in its context:
 * `runInInjectionContext(injector, () => registerCommand(definition))`.
 *
 * Every registration has an owner and claims its names, the way
 * registerLazyCommand does: the owner is ambient in the context the caller
 * runs under - an extension's, for a module loaded under its scope - and the
 * CLI itself outside one.
 */
export function registerCommand<
	TSchema extends CommandOptionsSchema,
	TResult = any,
	TSetup = any,
>(
	definition:
		| CommandClass<CommandName, TSchema, TResult>
		| DefinedCommand<TSchema, TResult, TSetup>
		| CommandDefinition<TSchema, TResult, TSetup>,
	providers: Provider[] = [],
): DeferredCommandResult {
	const defined =
		toCommandDefinition(definition) ||
		defineCommand(<CommandDefinition<TSchema, TResult, TSetup>>definition);
	const target = contextInjector();
	const scope = providers.length ? target.createChild(providers) : target;
	const owner = target.get(COMMAND_OWNER, { optional: true }) || CLI_OWNER;
	const registry = target.get(CommandRegistry);

	for (const name of namesOf(defined)) {
		const result = registry.registerDeferredCommand(name, {
			owner,
			load: () => registerDefinitionAs(name, defined, scope),
		});

		if (!result.registered) {
			return result;
		}
	}

	return { registered: true };
}

/**
 * Reads as the `name` parameter's type when the type argument is left off, so
 * the compiler names the fix in the error it reports on the command name.
 */
type MissingTypeArgument =
	"Pass the definition type: registerLazyCommand<typeof import('./commands/x').cmd>(...)";

/**
 * Registers a command name against a definition the loader produces on first
 * use: the name routes — including through a synthesized parent — without the
 * module being loaded, and `load` runs when that one command is resolved. It
 * must stay synchronous, because CommandsService reads the resolved command's
 * options before it validates the command line.
 *
 * The definition's type is a required type argument: `require()` is `any`, so
 * nothing infers from `load`, and without it the name would be checked against
 * nothing.
 *
 *     registerLazyCommand<typeof import("./commands/run").iosRunCommand>(
 *       "run|ios",
 *       () => require("./commands/run").iosRunCommand,
 *     );
 *
 * `providers` scope the command to a child injector, built when the command is
 * constructed rather than when its name is claimed.
 *
 * Registration targets the injector of the current injection context, if there
 * is one, and takes its owner from that injector's COMMAND_OWNER — which is
 * how a command an extension's module registers while loading is attributed to
 * the extension. Outside a context it is the CLI's own injector, and the CLI
 * itself is the owner. To register against some other injector, run the call
 * in its context with runInInjectionContext.
 */
/**
 * Registers one of the CLI's own commands. A built-in that cannot claim its
 * name is a bug in the bootstrap rather than a conflict to arbitrate, so this
 * aborts startup instead of returning a result nobody would check.
 */
export function registerBuiltInCommand<
	TDefinition extends RegisterableCommand = never,
>(
	name: [TDefinition] extends [never]
		? MissingTypeArgument
		: CommandNamesOf<TDefinition> & string,
	load: () => NoInfer<TDefinition>,
	providers: Provider[] = [],
): void {
	// The conditional name type cannot be narrowed while forwarding it.
	const result = registerLazyCommand<TDefinition>(<any>name, load, providers);

	if (result.registered === false) {
		throw new Error(
			`Unable to register command '${name}': ${describeRejection(
				result.rejection,
			)}.`,
		);
	}
}

export function registerLazyCommand<
	TDefinition extends RegisterableCommand = never,
>(
	name: [TDefinition] extends [never]
		? MissingTypeArgument
		: CommandNamesOf<TDefinition> & string,
	load: () => NoInfer<TDefinition>,
	providers: Provider[] = [],
): DeferredCommandResult {
	const commandName = <string>(<any>name);
	const target = contextInjector();
	const registry = target.get(CommandRegistry);

	return registry.registerDeferredCommand(commandName, {
		owner: target.get(COMMAND_OWNER, { optional: true }) || CLI_OWNER,
		load: () => {
			const loaded = load();

			// The compile-time check above is only as good as the type argument the
			// call site passes, so the same mismatch is caught here as well.
			const definition = toCommandDefinition(loaded);
			if (!definition) {
				throw new Error(
					typeof loaded === "function"
						? "the loader returned a class that did not come from Command()"
						: "the loader did not return a defineCommand() definition or a Command() class",
				);
			}

			const declared = namesOf(definition);
			if (declared.indexOf(commandName) === -1) {
				throw new Error(
					"the definition it loaded declares itself as " +
						declared.map((entry) => `'${entry}'`).join(", "),
				);
			}

			registerDefinitionAs(
				commandName,
				definition,
				providers.length ? target.createChild(providers) : target,
			);
		},
	});
}
