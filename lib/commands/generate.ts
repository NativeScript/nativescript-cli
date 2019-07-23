import { run, ExecutionOptions } from '@nativescript/schematics-executor';

export class GenerateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	private executionOptions: ExecutionOptions;

	constructor(private $logger: ILogger,
		private $options: IOptions,
		private $errors: IErrors) { }

	public async execute(_rawArgs: string[]): Promise<void> {
		try {
			await run(this.executionOptions);
		} catch (error) {
			this.$errors.failWithoutHelp(error.message);
		}
	}

	public async canExecute(rawArgs: string[]): Promise<boolean> {
		this.setExecutionOptions(rawArgs);
		this.validateExecutionOptions();

		return true;
	}

	private validateExecutionOptions() {
		if (!this.executionOptions.schematic) {
			this.$errors.failWithHelp(`The generate command requires a schematic name to be specified.`);
		}
	}

	private setExecutionOptions(rawArgs: string[]) {
		const options = this.parseRawArgs(rawArgs);

		this.executionOptions = {
			...options,
			logger: this.$logger,
			directory: process.cwd(),
		};
	}

	private parseRawArgs(rawArgs: string[]) {
		const collection = this.$options.collection;
		const schematic = rawArgs.shift();
		const { options, args } = parseSchematicSettings(rawArgs);

		return {
			collection,
			schematic,
			schematicOptions: options,
			schematicArgs: args,
		};
	}
}

/**
 * Converts an array of command line arguments to options for the executed schematic.
 * @param rawArgs The command line arguments. They should be in the format 'key=value' for strings or 'key' for booleans.
 */
function parseSchematicSettings(rawArgs: string[]) {
	const [optionStrings, args] = partition<string>(rawArgs, item => item.includes('='));
	const options = optionStrings
		.map(o => o.split("=")) // split to key and value pairs
		.map(([key, ...value]) => [key, value.join("=")]) // concat the value arrays if there are multiple = signs
		.reduce((obj, [key, value]) => {
			return { ...obj, [key]: value };
		}, {});

	return { options, args };
}
/**
 * Splits an array into two groups based on a predicate.
 * @param array The array to split.
 * @param predicate The condition to be used for splitting.
 */
function partition<T>(array: T[], predicate: (item: T) => boolean): T[][] {
	return array.reduce(([pass, fail], item) => {
		return predicate(item) ?
			[[...pass, item], fail] :
			[pass, [...fail, item]];
	}, [[], []]);
}

$injector.registerCommand("generate", GenerateCommand);
