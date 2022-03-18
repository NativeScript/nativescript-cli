import { execSafe } from "../../helpers/child-process";
import { error, ok } from "../../helpers/results";
import { details, RequirementFunction } from "../..";

const VERSION_RE = /Xcode\s(.+)\n/;
const BUILD_VERSION_RE = /Build version\s(.+)\n/;

declare module "../.." {
	interface RequirementDetails {
		xcode?: { version: string; buildVersion: string };
		xcodeproj?: { version: string };
	}
}

details.xcode = null;
details.xcodeproj = null;

async function XCodeRequirement() {
	const res = await execSafe(`xcodebuild -version`);

	if (res) {
		const [, version] = res.stdout.match(VERSION_RE);
		const [, buildVersion] = res.stdout.match(BUILD_VERSION_RE);
		// console.log("xcode", {
		// 	version,
		// 	buildVersion,
		// });

		details.xcode = {
			version,
			buildVersion,
		};
		// prettier-ignore
		return ok(`XCode is installed`)
	}

	return error(
		`XCode is missing.`,
		`Install XCode through the AppStore (or download from https://developer.apple.com/)`
	);
}

async function XCodeProjRequirement() {
	const res = await execSafe(`xcodeproj --version`);

	if (res) {
		const version = res.stdout.trim();

		// console.log("xcodeproj", {
		// 	version,
		// });

		details.xcodeproj = { version };

		return ok(`xcodeproj is installed`);
	}

	return error("xcodeproj is missing");
}

export const xcodeRequirements: RequirementFunction[] = [
	XCodeRequirement,
	XCodeProjRequirement,
];
