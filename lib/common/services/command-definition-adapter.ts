import { EOL } from "os";
import { getRootInjector } from "../yok";
import { CliOptions } from "../contracts/cli-options";
import { OptionContributions } from "../contracts/option-contributions";
import { getCurrentInjector, runInInjectionContext } from "../di/inject";
import { openInvocation, runInInvocation } from "../invocations";
import { Injector } from "../di/injector";
import { IDictionary, IDashedOption, IErrors } from "../declarations";
import { ICommand } from "../definitions/commands";
import { COMMAND_CONTEXT } from "../contracts/command-context";
import { IOptions } from "../../declarations";
import {
	COMMAND_PRECONDITIONS,
	CommandPrecondition,
} from "../contracts/command-preconditions";
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
	ParamSpec,
	CommandParamValues,
	CommandContext,
	CommandDefinition,
	CommandFailOptions,
	CommandClass,
	CommandName,
	CommandNamesOf,
	CommandOptionSpec,
	CommandOptionsInput,
	CommandOptionsSchema,
	compileOptionSpec,
	DefinedCommand,
	isOptionsGroup,
	OptionsGroup,
	optionSpellingsOf,
	readOptionValues,
	RegisterableCommand,
	ResolvedCommandOptions,
	resolveCommandOptions,
	defineCommand,
	toCommandDefinition,
	isPlainObject,
} from "../define-command";

const compileOptions = (
	schema: CommandOptionsSchema,
	cliOptions?: IDictionary<IDashedOption>,
): IDictionary<IDashedOption> => {
	const dashedOptions: IDictionary<IDashedOption> = {};

	for (const optionName of Object.keys(schema)) {
		const spec = schema[optionName];
		const dashedOption = compileOptionSpec(spec);
		// Declaring an option the CLI already defines replaces its entry
		// wholesale (see setupOptions), so anything left unspecified here is
		// carried over rather than silently dropped for this command.
		const cliOption = cliOptions && cliOptions[optionName];
		if (cliOption) {
			if (spec.hasSensitiveValue === undefined) {
				dashedOption.hasSensitiveValue = cliOption.hasSensitiveValue === true;
			}
			if (spec.default === undefined && cliOption.default !== undefined) {
				dashedOption.default = cliOption.default;
			}
			if (spec.alias === undefined && cliOption.alias !== undefined) {
				dashedOption.alias = cliOption.alias;
			}
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
): boolean => compileOptionSpec(spec).type === cliOption.type;

const warnOnCliOptionCollisions = (
	targetInjector: Injector,
	definition: CommandDefinition<any, any, any>,
	schema: CommandOptionsSchema,
	optionsService: IOptions | undefined,
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
	TSchema extends CommandOptionsInput,
	TResult = any,
	TSetup = any,
>(
	definition: CommandDefinition<TSchema, TResult, TSetup>,
	targetInjector: Injector = <Injector>(<any>getRootInjector()),
	providers: Provider[] = [],
	registeredNames: readonly string[] = [],
): ICommand {
	// Its own names first, then the names it was registered under, so a
	// contribution made under a manifest key reaches it too.
	const commandNames: readonly string[] = (
		Array.isArray(definition.name) ? definition.name : [definition.name]
	).concat(registeredNames.filter((name) => name));
	const commandName = commandNames[0];
	const compileError = (problem: string): never => {
		throw new Error(`Command '${commandName}': ${problem}`);
	};

	const ownParts: ReadonlyArray<OptionsGroup<any> | CommandOptionsSchema> =
		definition.options === undefined
			? []
			: Array.isArray(definition.options)
				? definition.options
				: [<CommandOptionsSchema>definition.options];
	const own = resolveCommandOptions(ownParts, compileError);
	const schema = own.schema;
	const optionNames = Object.keys(schema);

	// Only a definition that declares options may depend on the options service
	// being registered - a bare command must work without one.
	let optionsService: IOptions | undefined = optionNames.length
		? targetInjector.get("options")
		: null;
	const optionsServiceFor = (resolved: ResolvedCommandOptions): any => {
		if (!optionsService && Object.keys(resolved.schema).length) {
			optionsService = targetInjector.get("options");
		}
		return optionsService;
	};
	// The CLI-wide table as it stands when the command is compiled: what a
	// redeclaration carries over from.
	const cliOptions: IDictionary<IDashedOption> | undefined =
		optionsService && optionsService.options
			? { ...optionsService.options }
			: undefined;

	const contributions = targetInjector.get(OptionContributions, {
		optional: true,
	});

	const rootGroups = (): OptionsGroup<any>[] => [
		CliOptions,
		...(contributions ? contributions.forRoot() : []),
	];

	// A process-level spelling is parsed at startup for every command and
	// provided at the root; a command redeclaring one would give it a second
	// meaning for the length of its run. Listing the root group itself is not a
	// redeclaration: that reads the same declaration onto ctx.options.
	const guardRootSpellings = (resolved: ResolvedCommandOptions): void => {
		const roots = rootGroups();
		const rootSpellings = new Set<string>();
		for (const group of roots) {
			for (const spelling of optionSpellingsOf(group.schema)) {
				rootSpellings.add(spelling);
			}
		}
		const declaredHere: CommandOptionsSchema = {};
		for (const part of ownParts) {
			if (!isOptionsGroup(part)) {
				Object.assign(declaredHere, part);
			}
		}
		for (const group of resolved.groups) {
			if (roots.indexOf(group) === -1) {
				Object.assign(declaredHere, group.schema);
			}
		}
		for (const spelling of optionSpellingsOf(declaredHere)) {
			if (rootSpellings.has(spelling)) {
				compileError(
					`'${spelling.length === 1 ? "-" : "--"}${spelling}' is a process-level option; list CliOptions under 'options', or inject it, instead of redeclaring it`,
				);
			}
		}
	};

	// Composed at every read, because a contribution may be registered after
	// the command was compiled and before it runs.
	const resolveAllOptions = (): ResolvedCommandOptions => {
		const contributed = contributions
			? commandNames.reduce<OptionsGroup<any>[]>(
					(groups, name) => groups.concat(contributions.forCommand(name)),
					[],
				)
			: [];
		const all = contributed.length
			? resolveCommandOptions([...ownParts, ...contributed], compileError)
			: own;
		guardRootSpellings(all);
		return all;
	};

	guardRootSpellings(own);
	warnOnCliOptionCollisions(targetInjector, definition, schema, optionsService);

	const fail = (message: string, options?: CommandFailOptions): never => {
		if (typeof message !== "string" || !message.trim()) {
			throw new Error(
				`ctx.fail() for command '${commandName}' requires a non-empty message.`,
			);
		}

		if (options !== undefined && !isPlainObject(options)) {
			throw new Error(
				`ctx.fail() for command '${commandName}' takes its options as a plain object.`,
			);
		}

		const errors: IErrors = targetInjector.get("errors");
		return options?.help === false
			? errors.fail(message)
			: errors.failWithHelp(message);
	};

	const paramSpecs: ParamSpec<TSchema>[] = Array.isArray(definition.params)
		? definition.params
		: null;
	const acceptsAnyParams = definition.params === "any";

	// Strictly positional: spec[i] owns args[i], and a trailing variadic spec
	// takes everything from its own position on.
	const mapParams = (args: string[]): CommandParamValues => {
		const values: CommandParamValues = {};
		if (!paramSpecs) {
			return values;
		}

		for (let index = 0; index < paramSpecs.length; index++) {
			const spec = paramSpecs[index];
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
		return {
			args,
			params: mapParams(args),
			options: <any>(
				(optionNames.length ? readOptionValues(schema, optionsService) : {})
			),
			// The invocation's child injector provides this very object under
			// COMMAND_CONTEXT, so it can only be created - and assigned here -
			// once the context exists.
			injector: <Injector>undefined,
			fail,
		};
	};

	const missingArgumentMessage = (spec: ParamSpec<TSchema>): string =>
		spec.errorMessage || `Missing required argument '${spec.name}'.`;

	const requiredOptionNames = Object.keys(schema).filter(
		(optionName) => schema[optionName].required === true,
	);
	const toDashedName = (optionName: string): string =>
		optionName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

	// Runs after the params policy, so a missing parameter is reported ahead
	// of a missing flag, and before canExecute, which may rely on the value.
	const enforceRequiredOptions = (context: CommandContext<TSchema>): void => {
		const missing = requiredOptionNames.filter(
			(optionName) => (<any>context.options)[optionName] === undefined,
		);
		if (missing.length) {
			fail(
				missing
					.map(
						(optionName) =>
							`The option '--${toDashedName(optionName)}' is required.`,
					)
					.join(EOL),
			);
		}
	};

	const enforceParams = async (
		context: CommandContext<TSchema>,
	): Promise<void> => {
		const args = context.args;

		if (!paramSpecs) {
			if (!acceptsAnyParams && args.length) {
				fail("This command doesn't accept parameters.");
			}

			return;
		}

		const missing = paramSpecs.filter(
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
			paramSpecs.length > 0 && paramSpecs[paramSpecs.length - 1].variadic;
		if (!variadic && args.length > paramSpecs.length) {
			fail(
				paramSpecs.length === 0
					? "This command doesn't accept parameters."
					: `This command accepts at most ${paramSpecs.length} parameter(s), but ${args.length} were provided.`,
			);
		}

		for (let index = 0; index < paramSpecs.length; index++) {
			const spec = paramSpecs[index];
			if (!spec.validate) {
				continue;
			}

			const values = spec.variadic
				? args.slice(index)
				: args.slice(index, index + 1);
			for (const value of values) {
				const verdict = await runInInjectionContext(context.injector, () =>
					spec.validate.call(spec, value, context),
				);
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
		/**
		 * Takes the invocation off the process's record of open ones and disposes
		 * its injector. Runs after the last stage - `postRun` when there is one,
		 * else `run` - or when `canExecute` ends the invocation early.
		 */
		end: () => void;
	}

	// An entry may be one precondition or a list of them: a factory that
	// injects the parent scope's array with skipSelf contributes the whole list
	// as one entry, which is how a command keeps the scope's gates next to its
	// own. The multi token is typed, but a definition's `providers` is not
	// checked against it, so anything else surfaces here with the command's
	// name instead of as a call on a non-function.
	const resolvePreconditions = (injector: Injector): CommandPrecondition[] => {
		const entries: unknown[] =
			injector.get(COMMAND_PRECONDITIONS, { optional: true }) || [];
		return entries.flatMap((entry, index) => {
			const preconditions = Array.isArray(entry) ? entry : [entry];
			if (preconditions.some((item) => typeof item !== "function")) {
				throw new Error(
					`Command '${commandName}': COMMAND_PRECONDITIONS entry #${index + 1} is not a function or a list of functions. ` +
						"Declare each precondition as { provide: COMMAND_PRECONDITIONS, multi: true, useValue: check }.",
				);
			}
			return <CommandPrecondition[]>preconditions;
		});
	};

	const runPreconditions = async (
		preconditions: CommandPrecondition[],
		context: CommandContext<TSchema>,
		injector: Injector,
	): Promise<void> => {
		for (const precondition of preconditions) {
			await runInInjectionContext(injector, () => precondition(context));
		}
	};

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

	const beginInvocation = (args: string[]): Invocation => {
		const context = buildContext(args);
		// Every group the invocation parsed - the command's own and the
		// contributed ones - is provided here with its slice of the values, so
		// a service in reach of this injector injects the group, never the
		// options service.
		const all = resolveAllOptions();
		const source = optionsServiceFor(all);
		const roots = rootGroups();
		const groupProviders: Provider[] = all.groups
			.filter((group) => roots.indexOf(group) === -1)
			.map((group) => ({
				provide: group,
				useValue: readOptionValues(group.schema, source),
			}));
		// Per-command providers live here rather than in a registration-time
		// scope so that a factory or class among them can inject the
		// invocation; the price is one instance per invocation.
		const injector = targetInjector.createChild(
			[
				{ provide: COMMAND_CONTEXT, useValue: context },
				...groupProviders,
				...(definition.providers || []),
				...providers,
			],
			{ scope: "invocation" },
		);
		context.injector = injector;
		const close = openInvocation(injector);
		let ended = false;
		const invocation: Invocation = {
			context,
			injector,
			setup: undefined,
			hasRun: false,
			end: (): void => {
				if (ended) {
					return;
				}
				ended = true;
				close();
				// What the invocation built for itself - scoped services above
				// all - goes with it; root singletons it reached are the root's.
				injector.dispose();
			},
		};
		// Preconditions judge the environment and run ahead of setup and of the
		// arguments policy, so being outside a project is what a bad invocation
		// reports first. Without any, setup starts synchronously.
		const preconditions = resolvePreconditions(injector);
		invocation.setup = preconditions.length
			? runPreconditions(preconditions, context, injector).then(() =>
					startSetup(context, injector),
				)
			: startSetup(context, injector);
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
		get dashedOptions(): IDictionary<IDashedOption> {
			return compileOptions(resolveAllOptions().schema, cliOptions);
		},
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
						const invocation = currentInvocation || beginInvocation(args);
						const context = invocation.context;
						try {
							await runInInvocation(invocation.injector, async () => {
								const setupResult = await invocation.setup;
								await runInInjectionContext(invocation.injector, () =>
									definition.postRun.call(
										definition,
										context,
										invocation.runResult,
										setupResult,
									),
								);
							});
						} finally {
							invocation.end();
						}
					},
				}),
		canExecute: async (args: string[]): Promise<boolean> => {
			// Setup first: it stands in for the constructor work legacy commands
			// did at resolution time, which ran before anything looked at the
			// arguments, so an argument validator can rely on it. The
			// preconditions ahead of it are why a command run outside a project
			// reports that before an arity complaint.
			const invocation = beginInvocation(args);
			const context = invocation.context;
			// A verdict of false, or a throw, is the end of this invocation:
			// execute never follows it.
			let verdict = false;
			try {
				verdict = await runInInvocation(invocation.injector, async () => {
					const setupResult = await invocation.setup;

					await enforceParams(context);
					enforceRequiredOptions(context);

					const refine = definition.canExecute;
					if (!refine) {
						return true;
					}

					// Same first-await rule as execute: runInInjectionContext is
					// synchronous, so inject() is available up to the first await.
					return await runInInjectionContext(invocation.injector, () =>
						refine.call(definition, context, setupResult),
					);
				});
			} finally {
				if (!verdict) {
					invocation.end();
				}
			}
			return verdict;
		},
		execute: async (args: string[]): Promise<void> => {
			const invocation =
				currentInvocation && !currentInvocation.hasRun
					? currentInvocation
					: beginInvocation(args);
			const context = invocation.context;
			invocation.hasRun = true;

			// With a postRun, the invocation ends after it; a failed run ends it
			// here, since the dispatcher will not reach postRun.
			let failed = false;
			try {
				await runInInvocation(invocation.injector, async () => {
					const setupResult = await invocation.setup;
					invocation.runResult = await runInInjectionContext(
						invocation.injector,
						() => definition.run.call(definition, context, setupResult),
					);

					if (definition.shortcuts) {
						attachShortcuts(invocation, context, setupResult);
					}
				});
			} catch (error) {
				failed = true;
				throw error;
			} finally {
				if (failed || !definition.postRun) {
					invocation.end();
				}
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
	TSchema extends CommandOptionsInput,
	TResult = any,
	TSetup = any,
>(
	name: string,
	definition: DefinedCommand<TSchema, TResult, TSetup>,
	targetInjector: Injector = <Injector>(<any>getRootInjector()),
	providers: Provider[] = [],
): void {
	// The registry facet rather than the injector itself, so a child injector
	// that provides its own CommandRegistry receives the registration.
	const registry = targetInjector.get(CommandRegistry);
	// A prototype-less zero-parameter function registers as a useFactory
	// provider, so the command is built on first resolution and cached.
	registry.registerCommand(name, () =>
		createCommandFromDefinition(definition, targetInjector, providers, [name]),
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
 * Registers a command with the CLI. Takes a Command() class, the result of
 * defineCommand(), or a bare definition, which it defines on the caller's
 * behalf.
 *
 * Registration targets the injector of the current injection context, and
 * `providers` are added to each invocation's own child of it, next to
 * COMMAND_CONTEXT, so they can inject the invocation and are built once per
 * invocation. To register against some other injector, run the call in its
 * context:
 * `runInInjectionContext(injector, () => registerCommand(definition))`.
 *
 * Every registration has an owner and claims its names, the way
 * registerLazyCommand does: the owner is ambient in the context the caller
 * runs under - an extension's, for a module loaded under its scope - and the
 * CLI itself outside one.
 */
export function registerCommand<
	TSchema extends CommandOptionsInput,
	TResult = any,
	TSetup = any,
>(
	definition:
		| CommandClass<CommandName, TSchema>
		| DefinedCommand<TSchema, TResult, TSetup>
		| CommandDefinition<TSchema, TResult, TSetup>,
	providers: Provider[] = [],
): DeferredCommandResult {
	const defined =
		toCommandDefinition(definition) ||
		defineCommand(<CommandDefinition<TSchema, TResult, TSetup>>definition);
	const target = contextInjector();
	const owner = target.get(COMMAND_OWNER, { optional: true }) || CLI_OWNER;
	const registry = target.get(CommandRegistry);

	for (const name of namesOf(defined)) {
		const result = registry.registerDeferredCommand(name, {
			owner,
			load: () => registerDefinitionAs(name, defined, target, providers),
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
 * `providers` are added to each invocation's own child injector, as for
 * `registerCommand`, so nothing about them is resolved when the name is
 * claimed.
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

			registerDefinitionAs(commandName, definition, target, providers);
		},
	});
}
