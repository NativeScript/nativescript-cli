import { details, RequirementFunction } from "../..";
import { execSafe } from "../../helpers/child-process";
import { error, ok } from "../../helpers/results";

// example: augment details with new values
declare module "../.." {
	interface RequirementDetails {
		android?: {
			sdkPath: string;
			sdkFrom: string;
			installedTargets: string[];
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
		return error("Could not find Android SDK");
	}

	return ok(`Found Android SDK at ${sdk.sdkPath} (from ${sdk.sdkFrom})`);
};

const ADB_VERSION_RE = /Android Debug Bridge version (.+)\n/im;
const androidAdb: RequirementFunction = async (results) => {
	const res = await execSafe("adb --version");

	if (res) {
		const [, version] = res.stdout.match(ADB_VERSION_RE);

		details.adb = { version };
	}

	return error("Could not find adb", "Make sure it's available in your PATH");
};

export const androidSdkRequirements: RequirementFunction[] = [
	androidSdk,
	androidAdb,
];
