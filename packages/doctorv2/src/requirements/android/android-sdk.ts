import { existsSync, readdirSync } from "fs";
import { resolve } from "path";

import { safeMatch, safeMatchAll } from "../../helpers";
import { execSafe } from "../../helpers/child-process";
import { details, RequirementFunction } from "../..";
import { error, ok } from "../../helpers/results";

// example: augment details with new values
declare module "../.." {
	interface RequirementDetails {
		android?: {
			sdkPath: string;
			sdkFrom: string;
			installedTargets: string[];
			installedBuildTools: string[];
			installedNDKVersions: string[];
			installedSystemImages: string[];
		};
		adb?: { version: string };
	}
}

details.android = null;
details.adb = null;

/**
 * Excerpt from: https://developer.android.com/studio/command-line/variables#envar
 *
 * ANDROID_SDK_ROOT - Sets the path to the SDK installation directory.
 * Once set, the value does not typically change, and can be shared by multiple users on the same machine.
 * ANDROID_HOME, which also points to the SDK installation directory, is deprecated.
 * If you continue to use it, the following rules apply:
 *
 * 	- If ANDROID_HOME is defined and contains a valid SDK installation, its value is used instead of the value in ANDROID_SDK_ROOT.
 * 	- If ANDROID_HOME is not defined, the value in ANDROID_SDK_ROOT is used.
 * 	- If ANDROID_HOME is defined but does not exist or does not contain a valid SDK installation, the value in ANDROID_SDK_ROOT is used instead.
 */

const getAndroidSdkInfo = () => {
	if (details.android) {
		return details.android;
	}

	details.android = {
		sdkPath: null,
		sdkFrom: null,
		installedTargets: [],
		installedBuildTools: [],
		installedNDKVersions: [],
		installedSystemImages: [],
	};

	const isValidSDK = (path: string) => {
		// todo

		return true;
	};

	const ANDROID_HOME = process.env["ANDROID_HOME"];
	const ANDROID_SDK_ROOT = process.env["ANDROID_SDK_ROOT"];

	if (ANDROID_HOME && isValidSDK(ANDROID_HOME)) {
		details.android.sdkPath = ANDROID_HOME;
		details.android.sdkFrom = "ANDROID_HOME";
		return details.android;
	}

	if (ANDROID_SDK_ROOT && !ANDROID_HOME && isValidSDK(ANDROID_SDK_ROOT)) {
		details.android.sdkPath = ANDROID_SDK_ROOT;
		details.android.sdkFrom = "ANDROID_SDK_ROOT";
		return details.android;
	}
};

const androidSdk: RequirementFunction = async (results) => {
	const sdk = getAndroidSdkInfo();

	if (!sdk.sdkPath) {
		return error(`Could not find Android SDK`);
	}

	return ok(`Found Android SDK at ${sdk.sdkPath} (from ${sdk.sdkFrom})`);
};

const androidTargets: RequirementFunction = async (results) => {
	const sdk = getAndroidSdkInfo();

	if (!sdk.sdkPath) {
		return;
	}

	const sdkPlatformsPath = resolve(sdk.sdkPath, "platforms");
	if (existsSync(sdkPlatformsPath)) {
		details.android.installedTargets = readdirSync(sdkPlatformsPath);
	}
};

const androidBuildTools: RequirementFunction = async (results) => {
	const sdk = getAndroidSdkInfo();

	if (!sdk.sdkPath) {
		return;
	}

	const sdkBuildToolsPath = resolve(sdk.sdkPath, "build-tools");
	if (existsSync(sdkBuildToolsPath)) {
		details.android.installedBuildTools = readdirSync(sdkBuildToolsPath);
	}
};

const androidNDK: RequirementFunction = async (results) => {
	const sdk = getAndroidSdkInfo();

	if (!sdk.sdkPath) {
		return;
	}

	const sdkNDKPath = resolve(sdk.sdkPath, "ndk");
	if (existsSync(sdkNDKPath)) {
		details.android.installedNDKVersions = readdirSync(sdkNDKPath);
	}
};

const ANDROID_IMAGE_RE = /system-images;([\S \t]+)/g;
const androidImages: RequirementFunction = async (results) => {
	const sdk = getAndroidSdkInfo();

	if (!sdk.sdkPath) {
		return;
	}

	const possibleSdkManagers = [
		resolve(sdk.sdkPath, "tools/bin/sdkmanager"),
		resolve(sdk.sdkPath, "cmdline-tools/latest/bin/sdkmanager"),
	];

	for (const sdkManagerPath of possibleSdkManagers) {
		const res = await execSafe(`"${sdkManagerPath}" --list`);

		if (res) {
			const matches = safeMatchAll(
				res.stdout.split("Available")[0],
				ANDROID_IMAGE_RE
			);

			const images = matches
				// output from sdkManager:
				// android-17;google_apis;x86    | 7            | Google APIs Intel x86 Atom System Image     | system-images/android-17/google_apis/x86
				.map(([, match]) => match.split("|").map((part: string) => part.trim()))
				// image:   android-17;google_apis;x86
				// _:       7
				// details: Google APIs Intel x86 Atom System Image
				// system-images/android-17/google_apis/x86
				.map(([image, _, details]) => {
					const version = image.split(";")[0];
					const deatails = details.replace(" System Image", "");

					return `${version} | ${deatails}`;
				});

			details.android.installedSystemImages = images;
			// break the loop on first successful sdkmanager output
			break;
		}
	}
};

const ADB_VERSION_RE = /Android Debug Bridge version (.+)\n/im;
const androidAdb: RequirementFunction = async (results) => {
	const res = await execSafe("adb --version");

	if (res) {
		const [, version] = safeMatch(res.stdout, ADB_VERSION_RE);
		details.adb = { version };

		return ok(`adb from the Android SDK is found (${version})`);
	}

	return error(
		`Could not find adb from the Android SDK`,
		`Make sure you have a valid Android SDK installed, and it's available in your PATH`
	);
};

export const androidSdkRequirements: RequirementFunction[] = [
	androidSdk,
	androidTargets,
	androidBuildTools,
	androidNDK,
	androidImages,
	androidAdb,
];
