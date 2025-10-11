import { error, ok, warn } from "../../helpers/results";
import { execSafe } from "../../helpers/child-process";
import { details, RequirementFunction } from "../..";
import { safeMatch } from "../../helpers";

const VERSION_RE = /Python\s(.+)\n/;

declare module "../.." {
	interface RequirementDetails {
		python?: { version: string };
	}
}

details.python = null;

const pythonRequirement: RequirementFunction = async () => {
	const res = await execSafe(`python3 --version`);

	if (res) {
		const [, version] = safeMatch(res.stdout, VERSION_RE);
		// console.log("python", {
		// 	version,
		// });

		details.python = { version };

		return ok(`Python is installed (${version})`);
	}
	return error(
		`Python (3.x) is not installed`,
		`Make sure you have 'python3' in your PATH`
	);
};

const pythonSixRequirement: RequirementFunction = async () => {
	const hasSix = await execSafe(`python3 -c "import six"`);

	if (hasSix) {
		return ok(`Python package "six" is installed`);
	}

	return warn(
		`Python package "six" is not installed`,
		"Some debugger features might not work correctly"
	);
};

export const pythonRequirements: RequirementFunction[] = [
	pythonRequirement,
	pythonSixRequirement,
];
