import { OptionType } from "../enums";
import { injector } from "../yok";
import { runInInjectionContext } from "../di/inject";
import { IDictionary, IDashedOption, IErrors } from "../declarations";
import { IInjector } from "../definitions/yok";
import { ICommand } from "../definitions/commands";
import { CommandRegistry } from "../contracts/command-registry";
import {
	CommandContext,
	CommandDefinition,
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
};

const compileOptions = (
	schema: CommandOptionsSchema,
): IDictionary<IDashedOption> => {
	const dashedOptions: IDictionary<IDashedOption> = {};

	for (const optionName of Object.keys(schema)) {
		const spec = schema[optionName];
		const dashedOption: IDashedOption = {
			type: OPTION_TYPES[<CommandOptionType>spec.type],
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

		dashedOptions[optionName] = dashedOption;
	}

	return dashedOptions;
};

const aliasList = (alias: string | string[]): string[] =>
	alias === undefined ? [] : Array.isArray(alias) ? alias : [alias];

/**
 * A command option that shadows a CLI-wide one wins the re-parse for this
 * command only, so the same spelling means different things depending on which
 * command is running. Warned rather than rejected while the policy is open.
 */
const warnOnCliOptionCollisions = (
	targetInjector: IInjector,
	definition: CommandDefinition<any>,
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
		if (cliSpellings[optionName]) {
			collisions.push(
				`'--${optionName}' with the CLI option '--${cliSpellings[optionName]}'`,
			);
		}

		for (const alias of aliasList(schema[optionName].alias)) {
			if (cliSpellings[alias]) {
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
 */
export function createCommandFromDefinition<
	TSchema extends CommandOptionsSchema,
>(
	definition: CommandDefinition<TSchema>,
	targetInjector: IInjector = injector,
): ICommand {
	const schema = definition.options || <TSchema>{};
	const optionNames = Object.keys(schema);
	const dashedOptions = compileOptions(schema);

	// Only a definition that declares options may depend on the options service
	// being registered - a bare command must work without one.
	const optionsService: any = optionNames.length
		? targetInjector.resolve("options")
		: null;

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

		const errors: IErrors = targetInjector.resolve("errors");
		return errors.failWithHelp(message);
	};

	// Read per call rather than snapshotted here: the options service only holds
	// this command's parsed values once validateOptions has run for it.
	const buildContext = (args: string[]): CommandContext<TSchema> => {
		const options: any = {};
		for (const optionName of optionNames) {
			options[optionName] = optionsService[optionName];
		}

		return { args, options, fail };
	};

	const acceptsArguments = definition.arguments === "any";

	return {
		allowedParameters: [],
		dashedOptions,
		...(definition.disableAnalytics === undefined
			? {}
			: { disableAnalytics: definition.disableAnalytics }),
		...(definition.enableHooks === undefined
			? {}
			: { enableHooks: definition.enableHooks }),
		canExecute: async (args: string[]): Promise<boolean> => {
			if (!acceptsArguments && args.length) {
				fail("This command doesn't accept parameters.");
			}

			const refine = definition.canExecute;
			if (!refine) {
				return true;
			}

			// Same first-await rule as execute: runInInjectionContext is
			// synchronous, so inject() is available up to the first await.
			return await runInInjectionContext(targetInjector, () =>
				refine.call(definition, buildContext(args)),
			);
		},
		execute: async (args: string[]): Promise<void> => {
			await runInInjectionContext(targetInjector, () =>
				definition.run(buildContext(args)),
			);
		},
	};
}

/**
 * Registers a definition under an externally chosen command name. Extension
 * manifests route by their own key, which need not be the definition's own
 * name, so the name is a parameter rather than read off the definition.
 */
export function registerDefinitionAs<TSchema extends CommandOptionsSchema>(
	name: string,
	definition: DefinedCommand<TSchema>,
	targetInjector: IInjector = injector,
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

export function registerCommandDefinition<TSchema extends CommandOptionsSchema>(
	definition: DefinedCommand<TSchema>,
	targetInjector: IInjector = injector,
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
