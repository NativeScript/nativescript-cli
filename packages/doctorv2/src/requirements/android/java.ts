import { existsSync } from "fs";
import { resolve } from "path";

import { error, ok, warn } from "../../helpers/results";
import { execSafe } from "../../helpers/child-process";
import { details, RequirementFunction } from "../..";
import { notInRange } from "../../helpers/semver";
import { safeMatch } from "../../helpers";

// import type { RequirementDetails } from "../..";

const JAVAC_VERSION_RE = /javac\s(.+)\n/im;
const JAVA_VERSION_RE = /(?:java|openjdk)\s(.+) /im;

// example: augment details with new values
declare module "../.." {
	interface RequirementDetails {
		java?: { version: string; path: string };
		javac?: { version: string };
	}
}

// initialize details...
details.java = null;
details.javac = null;

const javaRequirement: RequirementFunction = async (results) => {
	const res = await execSafe(`java --version`);
	if (res) {
		// console.log(res);
		const [, version] = safeMatch(res.stdout, JAVA_VERSION_RE);
		// console.log("java", { version });

		// todo: path should be the path to java executable instead of JAVA_HOME...
		details.java = { version, path: process.env.JAVA_HOME };

		if (notInRange(version, { min: "11", max: "17" })) {
			return warn(
				`java executable found (${version}), but version might not be supported`,
				`The installed java version may not work`
			);
		}

		return ok(`java executable found (${version})`);
	}

	return error("java executable not found");
};

const javacRequirement: RequirementFunction = async (results) => {
	const JAVA_HOME = process.env["JAVA_HOME"];

	if (!JAVA_HOME) {
		return error("JAVA_HOME is not set");
	}

	// results.push(ok("JAVA_HOME is set"));

	let javaExecutablePath = resolve(JAVA_HOME, "bin/javac");

	if (!existsSync(javaExecutablePath)) {
		javaExecutablePath = null;
		results.push(
			warn(
				"JAVA_HOME does not contain javac",
				"make sure your JAVA_HOME points to an JDK and not a JRE"
			)
		);
	}

	if (!javaExecutablePath) {
		// try resolving from path
		javaExecutablePath = await execSafe("which javac").then((res) => {
			return res ? res.stdout.trim() : null;
		});
	}

	if (!javaExecutablePath) {
		return error(`javac executable not found`, `Make sure you install a JDK`);
	}

	const res = await execSafe(`"${javaExecutablePath}" --version`);
	if (res) {
		const [, version] = safeMatch(res.stdout, JAVAC_VERSION_RE);
		details.javac = { version };
		// console.log("javac", { version });

		return ok(`javac executable found (${version})`);
	}

	return error(`javac executable not found`);
};

export const javaRequirements: RequirementFunction[] = [
	javaRequirement,
	javacRequirement,
];
