import { platform, arch, release } from "os";
import { details, RequirementFunction } from "../..";
import { returnFalse } from "../../helpers";
import { exec, execSafe } from "../../helpers/child-process";
import { error, ok } from "../../helpers/results";

declare module "../.." {
	interface RequirementDetails {
		platform?: string;
		arch?: string;
		os?: string;
		shell?: string;
		node?: { version: string };
		nativescript?: { version: string };
	}
}

details.platform = null;
details.arch = null;
details.os = null;
details.shell = null;
details.node = null;
details.nativescript = null;

export const commonRequirements: RequirementFunction[] = [
	// platform info
	async () => {
		details.platform = platform();
		details.arch = arch();
		details.os = await execSafe("uname -a").then((res) => {
			return res ? res.stdout : null;
		});
		details.shell = process.env.SHELL ?? "bash";
		details.nativescript = null;
	},

	async () => {
		const res = await execSafe("node -v");

		const NODE_VERSION_RE = /v?(.+)\n/im;

		if (res) {
			const [, version] = res.stdout.match(NODE_VERSION_RE);

			details.node = {
				version,
			};
		}
	},

	// nativescript cli
	async () => {
		const res = await execSafe("ns -v --json");

		if (res) {
			const version = res.stdout.trim();

			// console.log("nativescript", {
			// 	version,
			// });
			details.nativescript = {
				version,
			};

			return ok("NativeScript CLI is installed");
		}
		return error(
			"NativeScript CLI not installed",
			"Check your PATH, or install via npm i -g nativescript"
		);
	},
];

// async function headRequirement() {
// 	return ok("Your head is in place");
// },
// async () => {
// 	return ok("The mainframe is stable");
// },
// async () => {
// 	return ok("Coffee is ready");
// },
// async () => {
// 	return ok("The monitor is on");
// },
// async () => {
// 	throw new Error("im bad and I like to fail.");
// },
// async () => {
// 	return error("Your brain is missing.", "Drink some more coffee!");
// },
