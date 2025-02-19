import { redBright, yellowBright, green, gray } from "ansi-colors";

import { IRequirementResult, ResultType } from "..";

const resultTypePrefix = {
	[ResultType.OK]: `   [${green("OK")}]`,
	[ResultType.WARN]: ` [${yellowBright("WARN")}]`,
	[ResultType.ERROR]: `[${redBright("ERROR")}]`,
};

const indent = " ".repeat(1);
// 7 = longest prefix [ERROR] length
const padding = indent + " ".repeat(7);

export function printResults(res: IRequirementResult[]) {
	const stats = {
		total: 0,
		[ResultType.OK]: 0,
		[ResultType.WARN]: 0,
		[ResultType.ERROR]: 0,
	};
	let lastResultType: ResultType;
	console.log("");
	res
		.map((requirementResult) => {
			// increment stats counters
			stats.total++;
			stats[requirementResult.type]++;

			const prefix = resultTypePrefix[requirementResult.type];
			const details = requirementResult.details?.split("\n") ?? [];
			let paddedDetails = details
				.map((line) => {
					if (line.length) {
						return `${padding} → ` + line;
					}
				})
				.filter(Boolean)
				.join("\n");

			// if we have details, we need to insert a newline
			if (paddedDetails.length) {
				paddedDetails = "\n" + paddedDetails + "\n";
			}

			// todo: implement verbose mode to print OK result details
			// strip them for now...
			if (paddedDetails.length && requirementResult.type === ResultType.OK) {
				paddedDetails = "";
			}

			let optionalNewLine = "";

			if (
				lastResultType === ResultType.OK &&
				requirementResult.type !== ResultType.OK
			) {
				optionalNewLine = "\n";
			}

			lastResultType = requirementResult.type;

			return `${optionalNewLine}${indent}${prefix} ${requirementResult.message}${paddedDetails}`;
		})
		.forEach((line) => {
			console.log(line);
		});
	console.log("");

	const pluralize = (count: number, singular: string, plural: string) => {
		if (count === 0 || count > 1) {
			return plural;
		}
		return singular;
	};

	const oks =
		stats[ResultType.OK] > 0
			? green(`${stats[ResultType.OK]} ok`)
			: gray(`${stats[ResultType.OK]} ok`);
	const errors =
		stats[ResultType.ERROR] > 0
			? redBright(
					`${stats[ResultType.ERROR]} ${pluralize(
						stats[ResultType.ERROR],
						"error",
						"errors"
					)}`
			  )
			: gray(`${stats[ResultType.ERROR]} errors`);
	const warnings =
		stats[ResultType.WARN] > 0
			? yellowBright(
					`${stats[ResultType.WARN]} ${pluralize(
						stats[ResultType.WARN],
						"warning",
						"warnings"
					)}`
			  )
			: gray(`${stats[ResultType.WARN]} warnings`);

	console.log(`${indent}${oks}, ${warnings}, ${errors} / ${stats.total} total`);

	console.log("");

	if (stats[ResultType.ERROR] === 0) {
		console.log(green.bold(`${indent}√ No issues detected.`));
		console.log("");
	} else {
		console.log(redBright.bold(`${indent}× Some issues detected.`));
		console.log("");
	}
}
