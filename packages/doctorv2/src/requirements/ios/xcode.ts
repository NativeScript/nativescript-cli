import { execSafe } from "../../helpers/child-process";
import { details, RequirementFunction } from "../..";
import { error, ok } from "../../helpers/results";
import { safeMatch } from "../../helpers";

const VERSION_RE = /Xcode\s(.+)\n/;
const BUILD_VERSION_RE = /Build version\s(.+)\n/;

declare module "../.." {
	interface RequirementDetails {
		xcode?: { version: string; buildVersion: string };
		xcodeproj?: { version: string };
		ios?: {
			platforms?: string[];
		};
	}
}

details.xcode = null;
details.xcodeproj = null;
details.ios = null;

async function XCodeRequirement() {
	const res = await execSafe(`xcodebuild -version`);

	if (res) {
		const [, version] = safeMatch(res.stdout, VERSION_RE);
		const [, buildVersion] = safeMatch(res.stdout, BUILD_VERSION_RE);
		// console.log("xcode", {
		// 	version,
		// 	buildVersion,
		// });

		details.xcode = {
			version,
			buildVersion,
		};
		// prettier-ignore
		return ok(`XCode is installed (${version} / ${buildVersion})`)
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

		return ok(`xcodeproj is installed (${version})`);
	}

	return error(
		`xcodeproj is missing`,
		`The xcodeproj gem is required to build projects.`
	);
}

const iosSDKs: RequirementFunction = async () => {
	const res = await execSafe("xcodebuild -showsdks");

	if (res) {
		const platforms = res.stdout.match(/[\w]+\s[\d|.]+/g);

		const uniqPlatforms = Array.from(new Set([...platforms]));

		details.ios = {
			...details.ios,
			platforms: uniqPlatforms,
		};
	}
};
// '')
// .then(sdks => )

export const xcodeRequirements: RequirementFunction[] = [
	XCodeRequirement,
	XCodeProjRequirement,
	iosSDKs,
];
