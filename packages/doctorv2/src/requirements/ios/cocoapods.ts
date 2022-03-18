import { execSafe } from "../../helpers/child-process";
import { error, ok } from "../../helpers/results";
import { details, RequirementFunction } from "../..";

declare module "../.." {
	interface RequirementDetails {
		cocoapods?: { version: string };
	}
}

details.cocoapods = null;

async function CocoaPodsRequirement() {
	const res = await execSafe(`pod --version`);

	if (res) {
		const version = res.stdout.trim();

		// console.log("cocoapods", {
		// 	version,
		// });
		details.cocoapods = { version };

		return ok(`CocoaPods is installed`);
	}

	return error("CocoaPods is missing");
}

export const cocoaPodsRequirements: RequirementFunction[] = [
	CocoaPodsRequirement,
];
