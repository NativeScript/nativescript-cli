import { OptionType } from "../enums";
import { injector } from "../yok";
import { runInInjectionContext } from "../di/inject";
import { IDictionary, IDashedOption } from "../declarations";
import { IInjector } from "../definitions/yok";
import { ICommand } from "../definitions/commands";
import {
	CommandOptionType,
	ICommandContext,
	ICommandDefinition,
	ICommandOptionsSchema,
} from "../define-command";

const OPTION_TYPES: IDictionary<OptionType> = {
	boolean: OptionType.Boolean,
	string: OptionType.String,
	number: OptionType.Number,
	array: OptionType.Array,
};

/**
 * Wraps a declarative definition in the ICommand shape the legacy registry and
 * CommandsService expect.
 *
 * Constraint worth knowing before changing the canExecute mapping: the moment
 * an ICommand exposes `canExecute`, CommandsService returns its verdict and
 * skips `allowedParameters` validation entirely. So `canExecute` is emitted
 * only when the definition supplies one or opts into `arguments: "any"` — the
 * adapter then owns argument validation wholesale. With `arguments: "none"`
 * and no user `canExecute` the property is omitted, which lets the framework's
 * own empty-`allowedParameters` check reject stray positional arguments.
 */
export function createCommandFromDefinition<
	TSchema extends ICommandOptionsSchema,
>(
	definition: ICommandDefinition<TSchema>,
	targetInjector: IInjector = injector,
): ICommand {
	const schema = definition.options || <TSchema>{};
	const optionNames = Object.keys(schema);

	const dashedOptions: IDictionary<IDashedOption> = {};
	for (const optionName of optionNames) {
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

	// Resolved per call: the options service only holds parsed values once
	// validateOptions has run for this command.
	const buildContext = (args: string[]): ICommandContext<TSchema> => {
		const options: any = {};
		// Only a definition that declares options may depend on the options
		// service being registered - a bare command must work without one.
		if (optionNames.length) {
			const optionsService: any = targetInjector.resolve("options");
			for (const optionName of optionNames) {
				options[optionName] = optionsService
					? optionsService[optionName]
					: undefined;
			}
		}

		return { args, options };
	};

	const command: ICommand = {
		allowedParameters: [],
		dashedOptions,
		execute: async (args: string[]): Promise<void> => {
			// runInInjectionContext is synchronous, so inject() is available while
			// run() executes up to its first await, and not after it.
			await runInInjectionContext((<any>targetInjector).di, () =>
				definition.run(buildContext(args)),
			);
		},
	};

	if (definition.canExecute || definition.arguments === "any") {
		command.canExecute = async (args: string[]): Promise<boolean> =>
			definition.canExecute
				? await definition.canExecute(buildContext(args))
				: true;
	}

	if (definition.disableAnalytics !== undefined) {
		command.disableAnalytics = definition.disableAnalytics;
	}

	if (definition.enableHooks !== undefined) {
		command.enableHooks = definition.enableHooks;
	}

	return command;
}

export function registerCommandDefinition<
	TSchema extends ICommandOptionsSchema,
>(
	definition: ICommandDefinition<TSchema>,
	targetInjector: IInjector = injector,
): void {
	// An arrow function resolver is invoked as a factory rather than new-ed, and
	// its result is cached as the command instance.
	targetInjector.registerCommand(<any>definition.name, () =>
		createCommandFromDefinition(definition, targetInjector),
	);
}
