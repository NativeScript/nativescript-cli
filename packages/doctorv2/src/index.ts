import { printResults } from "./printers/pretty";

export type TPlatform = "android" | "ios";

export type TPlatforms = {
	[platform in TPlatform]?: boolean;
};

export const enum ResultType {
	ERROR = "ERROR",
	OK = "OK",
	WARN = "WARN",
}

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
