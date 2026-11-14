import * as semver from "semver";

/**
 * `--device mac` selects this Mac; it is also the device's imageIdentifier.
 */
export const IOS_MAC_DEVICE_ALIAS = "mac";

/**
 * Builds for the Mac go to platforms/ios/build/mac so they never mix with the
 * archive and .ipa of a phone build, which share the iphoneos SDK.
 */
export const IOS_MAC_BUILD_DIR_NAME = "mac";

export function isIOSMacDevice(device: Mobile.IDevice): boolean {
	return device?.deviceInfo?.imageIdentifier === IOS_MAC_DEVICE_ALIAS;
}

/**
 * Whether this @nativescript/ios version loads UIKit from /System/iOSSupport
 * on a Mac (NativeScript/ios#551). Older runtimes stop at launch with
 * "UIApplicationDidFinishLaunchingNotification is not defined".
 * Returns true for versions it can't parse, so only a known-bad one warns.
 */
export function iOSRuntimeCanRunOnMac(version: string): boolean {
	const next = /^\d+\.\d+\.\d+-next\.(\d{4}-\d{2}-\d{2})-(\d+)$/.exec(
		version ?? "",
	);
	if (next) {
		const [, date, runId] = next;
		const firstDate = "2026-11-11";
		const firstRunId = 43080423883;
		return date > firstDate || (date === firstDate && +runId >= firstRunId);
	}

	if (!semver.valid(version)) {
		return true;
	}

	return semver.gte(version, "9.1.1");
}
