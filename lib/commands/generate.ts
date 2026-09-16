// import { run, ExecutionOptions } from "@nativescript/schematics-executor";
import { IErrors } from "../common/declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export const generateCommandDefinition = defineCommand({
	name: "generate",
	description: "Executes a schematic in the project.",
	arguments: "any",
	async run(): Promise<void> {
		const $logger = inject<ILogger>("logger");
		const $errors = inject<IErrors>("errors");

		try {
			$logger.info(
				"If you have ideas for this command, please discuss at https://nativescript.org/discord",
			);
			// await run(this.executionOptions);
		} catch (error) {
			$errors.fail(error.message);
		}
	},
});

/**
 * Converts an array of command line arguments to options for the executed schematic.
 * @param rawArgs The command line arguments. They should be in the format 'key=value' for strings or 'key' for booleans.
 */
// function parseSchematicSettings(rawArgs: string[]) {
// 	const [optionStrings, args] = partition<string>(rawArgs, (item) =>
// 		item.includes("=")
// 	);
// 	const options = optionStrings
// 		.map((o) => o.split("=")) // split to key and value pairs
// 		.map(([key, ...value]) => [key, value.join("=")]) // concat the value arrays if there are multiple = signs
// 		.reduce((obj, [key, value]) => {
// 			return { ...obj, [key]: value };
// 		}, {});

// 	return { options, args };
// }
/**
 * Splits an array into two groups based on a predicate.
 * @param array The array to split.
 * @param predicate The condition to be used for splitting.
 */
// function partition<T>(array: T[], predicate: (item: T) => boolean): T[][] {
// 	return array.reduce(
// 		([pass, fail], item) => {
// 			return predicate(item)
// 				? [[...pass, item], fail]
// 				: [pass, [...fail, item]];
// 		},
// 		[[], []]
// 	);
// }
