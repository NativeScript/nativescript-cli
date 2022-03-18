import { execSafe } from "../../helpers/child-process";
import { details, RequirementFunction } from "../..";
import { error, ok } from "../../helpers/results";
import { notInRange } from "../../helpers/semver";

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

		const minVersion = "1.0.0";
		if (notInRange(version, { min: minVersion })) {
			return error(
				`CocoaPods is installed (${version}) but does not satisfy the minimum version of ${minVersion}`,
				`Update CocoaPods to at least ${minVersion}`
			);
		}

		return ok(`CocoaPods is installed (${version})`);
	}

	return error(
		`CocoaPods is missing`,
		`You need to install CocoaPods to be able to build and run projects.`
	);
}

export const cocoaPodsRequirements: RequirementFunction[] = [
	CocoaPodsRequirement,
];
