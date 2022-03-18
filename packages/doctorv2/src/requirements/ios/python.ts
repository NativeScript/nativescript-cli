import { exec, execSafe } from "../../helpers/child-process";
import { error, ok, warn } from "../../helpers/results";
import { details, RequirementFunction } from "../..";

const VERSION_RE = /Python\s(.+)\n/;

declare module "../.." {
	interface RequirementDetails {
		python?: { version: string };
	}
}

details.python = null;

async function PythonRequirement() {
	const res = await execSafe(`python3 --version`);

	if (res) {
		const [, version] = res.stdout.match(VERSION_RE);
		// console.log("python", {
		// 	version,
		// });

		details.python = { version };
	}

	try {
		await exec(`python3 -c "import six"`);
		// prettier-ignore
		return [
            ok(`Python3 is installed`),
            ok('Python3 "six" is installed')
        ];
	} catch (err) {
		if (err.code === 1) {
			// error.code = 1 means Python is found, but failed to import "six"
			return [
				ok("Python3 is installed"),
				warn(
					`Python3 "six" is not installed.`,
					"Some debugger features might not work correctly"
				),
			];
		}
	}

	return [
		error(`Python3 is not installed`),
		error(`Python3 "six" is not installed.`),
	];
}

export const pythonRequirements: RequirementFunction[] = [PythonRequirement];
