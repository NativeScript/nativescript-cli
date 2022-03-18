import { redBright, yellowBright, green, gray } from "ansi-colors";

export type TPlatform = "android" | "ios";

export type TPlatforms = {
	[platform in TPlatform]?: boolean;
};

export const enum ResultType {
	ERROR = "ERROR",
	OK = "OK",
	WARN = "WARN",
}

const resultTypeColorMap = {
	[ResultType.ERROR]: redBright,
	[ResultType.OK]: green,
	[ResultType.WARN]: yellowBright,
};

export interface IRequirementResult {
	type: ResultType;
	message: string;
	details?: string;
	platforms?: TPlatforms;
}

export type RequirementFunction = (
	results: IRequirementResult[]
) => Promise<IRequirementResult | IRequirementResult[] | void>;

// todo: rename or whatever, but this is augmented by all requirements that provide new info
export interface RequirementDetails {
	base?: true;
}

export const details: RequirementDetails = {};

import { commonRequirements } from "./requirements/common";
import { androidRequirements } from "./requirements/android";
import { iosRequirements } from "./requirements/ios";

const allRequirements = [
	...commonRequirements,
	...androidRequirements,
	...iosRequirements,
];

console.time("allRequirements");

const globalResults: IRequirementResult[] = [];
const promises: ReturnType<
	RequirementFunction
>[] = allRequirements.map((f: RequirementFunction) => f(globalResults));

Promise.allSettled(promises).then((results) => {
	// const res: IRequirementResult[] = [];
	for (const result of results) {
		if (result.status === "fulfilled") {
			if (Array.isArray(result.value)) {
				globalResults.push(...result.value);
			} else if (result.value) {
				globalResults.push(result.value);
			}
		}

		if (result.status === "rejected") {
			console.log(result.reason);
			globalResults.push({
				type: ResultType.WARN,
				message: `Failed to verify requirement: ${result.reason}`,
			});
		}
	}

	const filtered = globalResults.filter(Boolean);
	console.timeEnd("allRequirements");

	console.log("-".repeat(100));
	console.log(details);
	console.log("-".repeat(100));

	printResults(filtered);
});

// "custom reporter" that prints the results - should live outside of this package...
function printResults(res: IRequirementResult[]) {
	const stats = {
		total: 0,
		[ResultType.OK]: 0,
		[ResultType.WARN]: 0,
		[ResultType.ERROR]: 0,
	};
	console.log("");
	res
		.map((requirementResult) => {
			const color = resultTypeColorMap[requirementResult.type];
			const pad = " ".repeat(5 - requirementResult.type.length);

			stats.total++;
			stats[requirementResult.type]++;

			const details = requirementResult.details
				? `\n  ${pad}${" ".repeat(2 + requirementResult.type.length)} - ` +
				  requirementResult.details
				: "";

			return (
				`  ${pad}[${color(requirementResult.type)}] ${
					requirementResult.message
				}` + details
			);
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

	console.log(`  ${oks}, ${warnings}, ${errors} / ${stats.total} total`);

	console.log("");

	if (stats[ResultType.ERROR] === 0) {
		console.log(green.bold("No issues detected."));
	}
}
