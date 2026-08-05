import { OptionType } from "../enums";
import { injector } from "../yok";
import { runInInjectionContext } from "../di/inject";
import { IDictionary, IDashedOption } from "../declarations";
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

/**
 * A command option that shadows a CLI-wide one wins the re-parse for this
 * command only, so the two spellings mean different things depending on what
 * the user typed first. Warned rather than rejected while the policy is open.
 */
const warnOnCliOptionCollisions = (
	targetInjector: IInjector,
	definition: CommandDefinition<any>,
	optionNames: string[],
	optionsService: any,
): void => {
	const cliOptions = optionsService && optionsService.options;
	if (!cliOptions) {
		return;
	}

	const collisions = optionNames.filter((optionName) => cliOptions[optionName]);
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
		`Command '${commandName}' declares option(s) ${collisions
			.map((name) => `'--${name}'`)
			.join(", ")} that the CLI already defines globally. The command's ` +
			`declaration wins while the command runs; rename them to avoid it.`,
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

	warnOnCliOptionCollisions(
		targetInjector,
		definition,
		optionNames,
		optionsService,
	);

	// Read per call rather than snapshotted here: the options service only holds
	// this command's parsed values once validateOptions has run for it.
	const buildContext = (args: string[]): CommandContext<TSchema> => {
		const options: any = {};
		for (const optionName of optionNames) {
			options[optionName] = optionsService[optionName];
		}

		return { args, options };
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
				targetInjector
					.resolve("errors")
					.failWithHelp("This command doesn't accept parameters.");
				return false;
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

	// The registry facet rather than the injector itself, so a child injector
	// that provides its own CommandRegistry receives the registration.
	const registry = targetInjector.get(CommandRegistry);
	const names = Array.isArray(definition.name)
		? definition.name
		: [definition.name];

	for (const name of names) {
		// A prototype-less zero-parameter function registers as a useFactory
		// provider, so the command is built on first resolution and cached.
		registry.registerCommand(name, () =>
			createCommandFromDefinition(definition, targetInjector),
		);
	}
}
