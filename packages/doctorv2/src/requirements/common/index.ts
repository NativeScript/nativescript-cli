import * as os from "os";

import { error, ok, warn } from "../../helpers/results";
import { execSafe } from "../../helpers/child-process";
import { details, RequirementFunction } from "../..";
import { safeMatch } from "../../helpers";

declare module "../.." {
	interface RequirementDetails {
		os?: {
			platform?: string;
			name?: string;
			version?: string;
			arch?: string;
			uname?: string;
		};
		cpu?: string;
		shell?: string;
		node?: { version: string; path?: string };
		npm?: { version: string };
		yarn?: { version: string };
		pnpm?: { version: string };
		nativescript?: { version: string };
	}
}

details.os = null;
details.cpu = null;
details.shell = null;
details.node = null;
details.npm = null;
details.yarn = null;
details.pnpm = null;
details.nativescript = null;

const osNameMap: { [key: string]: string } = {
	darwin: "macOS",
	win32: "Windows",
	aix: "Aix",
	freebsd: "FreeBSD",
	linux: "Linux",
	openbsd: "OpenBSD",
	sunos: "SunOS",
};

const platformInfo: RequirementFunction = async () => {
	const uname = await execSafe("uname -a").then((res) => {
		return res ? res.stdout : null;
	});

	details.os = {
		platform: os.platform(),
		name: osNameMap[os.platform()] ?? "Unknown",
		version: os.release(),
		arch: os.arch(),
		uname,
	};

	try {
		const _cpus = os.cpus();
		details.cpu = "(" + _cpus.length + ") " + os.arch() + " " + _cpus[0].model;
	} catch (err) {
		details.cpu = "Unknown";
	}

	details.shell = process.env.SHELL ?? "bash";
};

const NODE_VERSION_RE = /v?(.+)\n/im;
const node: RequirementFunction = async () => {
	const res = await execSafe("node -v");
	const whichRes = await execSafe("which node");

	if (res) {
		const [, version] = safeMatch(res.stdout, NODE_VERSION_RE);
		const path = whichRes ? whichRes.stdout.trim() : "";

		details.node = {
			version,
			path,
		};
	}
};

const NPM_VERSION_RE = /v?(.+)\n/im;
const npm: RequirementFunction = async () => {
	const res = await execSafe("npm -v");

	if (res) {
		const [, version] = safeMatch(res.stdout, NPM_VERSION_RE);

		details.npm = {
			version,
		};
	}
};

const YARN_VERSION_RE = /(.+)\n/im;
const yarn: RequirementFunction = async () => {
	const res = await execSafe("yarn -v");

	if (res) {
		const [, version] = safeMatch(res.stdout, YARN_VERSION_RE);

		details.yarn = {
			version,
		};
	}
};

const PNPM_VERSION_RE = /(.+)\n/im;
const pnpm: RequirementFunction = async () => {
	const res = await execSafe("pnpm -v");

	if (res) {
		const [, version] = safeMatch(res.stdout, PNPM_VERSION_RE);

		details.pnpm = {
			version,
		};
	}
};

const NATIVESCRIPT_VERSION_RE = /^(.+)\n/im;
const nativescriptCli: RequirementFunction = async () => {
	const res = await execSafe("ns -v");

	if (res) {
		const [, version] = safeMatch(res.stdout, NATIVESCRIPT_VERSION_RE);

		const isUpToDate = res.stdout.includes("Up to date.");

		// console.log("nativescript", {
		// 	version,
		// });
		details.nativescript = {
			version,
		};

		if (isUpToDate) {
			return ok(`NativeScript CLI is installed (${version})`);
		}

		const NATIVESCRIPT_NEW_VERSION_RE = /(New version.+)\n/;
		const [, message] = safeMatch(res.stdout, NATIVESCRIPT_NEW_VERSION_RE);

		return warn(
			`NativeScript CLI update available (${version})`,
			message ?? "Update available"
		);
	}
	return error(
		"NativeScript CLI not installed",
		"Check your PATH, or install via npm i -g nativescript"
	);
};

export const commonRequirements: RequirementFunction[] = [
	platformInfo,
	node,
	npm,
	yarn,
	pnpm,
	nativescriptCli,
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
