import { EOL } from "os";

export class AndroidDebugBridgeResultHandler implements Mobile.IAndroidDebugBridgeResultHandler {
	private static ANDROID_DEBUG_BRIDGE_ERRORS: Mobile.IAndroidDebugBridgeError[] = [
		{
			name: "device unauthorized",
			description: "The device is not authorized. Please use the --emulator flag to run the application on on an emulator",
			resultCode: 1
		}, {
			name: "No space left on device",
			description: "No space left on device.",
			resultCode: 1
		}, {
			name: "INSTALL_FAILED_ALREADY_EXISTS",
			description: "The package is already installed.",
			resultCode: -1
		}, {
			name: "INSTALL_FAILED_INVALID_APK",
			description: "The package archive file is invalid.",
			resultCode: -2
		}, {
			name: "INSTALL_FAILED_INVALID_URI",
			description: "The URI passed in is invalid.",
			resultCode: -3
		}, {
			name: "INSTALL_FAILED_INSUFFICIENT_STORAGE",
			description: "The package manager service found that the device didn't have enough storage space to install the app.",
			resultCode: -4
		}, {
			name: "INSTALL_FAILED_DUPLICATE_PACKAGE",
			description: "A package is already installed with the same name.",
			resultCode: -5
		}, {
			name: "INSTALL_FAILED_NO_SHARED_USER",
			description: "The requested shared user does not exist.",
			resultCode: -6
		}, {
			name: "INSTALL_FAILED_UPDATE_INCOMPATIBLE",
			description: "A previously installed package of the same name has a different signature than the new package (and the old package's data was not removed).",
			resultCode: -7
		}, {
			name: "INSTALL_FAILED_SHARED_USER_INCOMPATIBLE",
			description: "The new package is requested a shared user which is already installed on the device and does not have matching signature.",
			resultCode: -8
		}, {
			name: "INSTALL_FAILED_MISSING_SHARED_LIBRARY",
			description: "The new package uses a shared library that is not available.",
			resultCode: -9
		}, {
			name: "INSTALL_FAILED_REPLACE_COULDNT_DELETE",
			description: "The new package uses a shared library that is not available.",
			resultCode: -10
		}, {
			name: "INSTALL_FAILED_DEXOPT",
			description: "The new package failed while optimizing and validating its dex files, either because there was not enough storage or the validation failed.",
			resultCode: -11
		}, {
			name: "INSTALL_FAILED_OLDER_SDK",
			description: "The new package failed because the current SDK version is older than that required by the package.",
			resultCode: -12
		}, {
			name: "INSTALL_FAILED_CONFLICTING_PROVIDER",
			description: "The new package failed because it contains a content provider with the same authority as a provider already installed in the system.",
			resultCode: -13
		}, {
			name: "INSTALL_FAILED_NEWER_SDK",
			description: "The new package failed because the current SDK version is newer than that required by the package.",
			resultCode: -14
		}, {
			name: "INSTALL_FAILED_TEST_ONLY",
			description: "The new package failed because it has specified that it is a test-only package and the caller has not supplied the #INSTALL_ALLOW_TEST flag.",
			resultCode: -15
		}, {
			name: "INSTALL_FAILED_CPU_ABI_INCOMPATIBLE",
			description: "The package being installed contains native code, but none that is compatible with the device's CPU_ABI.",
			resultCode: -16
		}, {
			name: "INSTALL_FAILED_MISSING_FEATURE",
			description: "The new package uses a feature that is not available.",
			resultCode: -17
		}, {
			name: "INSTALL_FAILED_CONTAINER_ERROR",
			description: "A secure container mount point couldn't be accessed on external media.",
			resultCode: -18
		}, {
			name: "INSTALL_FAILED_INVALID_INSTALL_LOCATION",
			description: "The new package couldn't be installed in the specified install location.",
			resultCode: -19
		}, {
			name: "INSTALL_FAILED_MEDIA_UNAVAILABLE",
			description: "The new package couldn't be installed in the specified install location because the media is not available.",
			resultCode: -20
		}, {
			name: "INSTALL_FAILED_VERIFICATION_TIMEOUT",
			description: "The new package couldn't be installed because the verification timed out.",
			resultCode: -21
		}, {
			name: "INSTALL_FAILED_VERIFICATION_FAILURE",
			description: "The new package couldn't be installed because the verification did not succeed.",
			resultCode: -22
		}, {
			name: "INSTALL_FAILED_PACKAGE_CHANGED",
			description: "The package changed from what the calling program expected.",
			resultCode: -23
		}, {
			name: "INSTALL_FAILED_UID_CHANGED",
			description: "The new package is assigned a different UID than it previously held.",
			resultCode: -24
		}, {
			name: "INSTALL_FAILED_VERSION_DOWNGRADE",
			description: "The new package has an older version code than the currently installed package.",
			resultCode: -25
		}, {
			name: "INSTALL_FAILED_PERMISSION_MODEL_DOWNGRADE",
			description: "The new package has target SDK low enough to not support runtime permissions.",
			resultCode: -26
		}, {
			name: "INSTALL_PARSE_FAILED_NOT_APK",
			description: "The parser was given a path that is not a file, or does not end with the expected '.apk' extension.",
			resultCode: -100
		}, {
			name: "INSTALL_PARSE_FAILED_BAD_MANIFEST",
			description: "The parser was unable to retrieve the AndroidManifest.xml file.",
			resultCode: -101
		}, {
			name: "INSTALL_PARSE_FAILED_UNEXPECTED_EXCEPTION",
			description: "The parser encountered an unexpected exception.",
			resultCode: -102
		}, {
			name: "INSTALL_PARSE_FAILED_NO_CERTIFICATES",
			description: "The parser did not find any certificates in the .apk.",
			resultCode: -103
		}, {
			name: "INSTALL_PARSE_FAILED_INCONSISTENT_CERTIFICATES",
			description: "The parser found inconsistent certificates on the files in the .apk.",
			resultCode: -104
		}, {
			name: "INSTALL_PARSE_FAILED_CERTIFICATE_ENCODING",
			description: "the parser encountered a CertificateEncodingException in one of the files in the .apk.",
			resultCode: -105
		}, {
			name: "INSTALL_PARSE_FAILED_BAD_PACKAGE_NAME",
			description: "The parser encountered a bad or missing package name in the manifest.",
			resultCode: -106
		}, {
			name: "INSTALL_PARSE_FAILED_BAD_SHARED_USER_ID",
			description: "The parser encountered a bad shared user id name in the manifest.",
			resultCode: -107
		}, {
			name: "INSTALL_PARSE_FAILED_MANIFEST_MALFORMED",
			description: "The parser encountered some structural problem in the manifest.",
			resultCode: -108
		}, {
			name: "INSTALL_PARSE_FAILED_MANIFEST_EMPTY",
			description: "The parser did not find any actionable tags (instrumentation or application) in the manifest.",
			resultCode: -109
		}, {
			name: "INSTALL_FAILED_INTERNAL_ERROR",
			description: "The system failed to install the package because of system issues.",
			resultCode: -110
		}, {
			name: "INSTALL_FAILED_USER_RESTRICTED",
			description: "The system failed to install the package because the user is restricted from installing apps.",
			resultCode: -111
		}, {
			name: "INSTALL_FAILED_DUPLICATE_PERMISSION",
			description: "The system failed to install the package because it is attempting to define a permission that is already defined by some existing package.",
			resultCode: -112
		}, {
			name: "INSTALL_FAILED_NO_MATCHING_ABIS",
			description: "The system failed to install the package because its packaged native code did not match any of the ABIs supported by the system.",
			resultCode: -113
		}, {
			name: "NO_NATIVE_LIBRARIES ",
			description: "The package being processed did not contain any native code.",
			resultCode: -114
		}, {
			name: "INSTALL_FAILED_ABORTED",
			description: "The instalation failed because it was aborted.",
			resultCode: -115
		}, {
			name: "DELETE_FAILED_INTERNAL_ERROR",
			description: "The system failed to delete the package for an unspecified reason.",
			resultCode: -1
		}, {
			name: "DELETE_FAILED_DEVICE_POLICY_MANAGER",
			description: "The system failed to delete the package because it is the active DevicePolicy manager.",
			resultCode: -2
		}, {
			name: "DELETE_FAILED_USER_RESTRICTED",
			description: "The system failed to delete the package since the user is restricted.",
			resultCode: -3
		}, {
			name: "DELETE_FAILED_OWNER_BLOCKED",
			description: "The system failed to delete the package because a profile or device owner has marked the package as uninstallable.",
			resultCode: -4
		}, {
			name: "DELETE_FAILED_ABORTED",
			description: "The delete failed because it was aborted.",
			resultCode: -5
		}, {
			name: "MOVE_FAILED_INSUFFICIENT_STORAGE",
			description: "The package hasn't been successfully moved by the system because of insufficient memory on specified media.",
			resultCode: -1
		}, {
			name: "MOVE_FAILED_DOESNT_EXIST",
			description: "The specified package doesn't exist.",
			resultCode: -2
		}, {
			name: "MOVE_FAILED_SYSTEM_PACKAGE",
			description: "The specified package cannot be moved since its a system package.",
			resultCode: -3
		}, {
			name: "MOVE_FAILED_FORWARD_LOCKED",
			description: "The specified package cannot be moved since its forward locked.",
			resultCode: -4
		}, {
			name: "MOVE_FAILED_INVALID_LOCATION",
			description: "The specified package cannot be moved to the specified location.",
			resultCode: -5
		}, {
			name: "MOVE_FAILED_INTERNAL_ERROR",
			description: "The specified package cannot be moved to the specified location.",
			resultCode: -6
		}, {
			name: "MOVE_FAILED_OPERATION_PENDING",
			description: "The specified package already has an operation pending in the PackageHandler queue.",
			resultCode: -7
		}
	];

	constructor(private $logger: ILogger,
		private $errors: IErrors) { }

	public checkForErrors(adbResult: any): Mobile.IAndroidDebugBridgeError[] {
		const errors: Mobile.IAndroidDebugBridgeError[] = [];

		if (adbResult) {
			if (_.isArray(adbResult)) {
				_.each(AndroidDebugBridgeResultHandler.ANDROID_DEBUG_BRIDGE_ERRORS, (error: Mobile.IAndroidDebugBridgeError) => {
					if (_.indexOf(adbResult, error.name) >= 0) {
						errors.push(error);
					}
				});
			} else {
				_.each(AndroidDebugBridgeResultHandler.ANDROID_DEBUG_BRIDGE_ERRORS, (error: Mobile.IAndroidDebugBridgeError) => {
					if ((adbResult.stdout && adbResult.stdout.indexOf(error.name) >= 0) ||
						(adbResult.stderr && adbResult.stderr.indexOf(error.name) >= 0)) {
						errors.push(error);
					}
				});
			}
		}

		return errors;
	}

	public handleErrors(errors: Mobile.IAndroidDebugBridgeError[], treatErrorsAsWarnings?: boolean): void {
		_.each(errors, (error: Mobile.IAndroidDebugBridgeError) => {
			this.$logger.trace(`Error name: ${error.name} result code: ${error.resultCode}`);
		});

		const errorMessages = _(errors).map((error: Mobile.IAndroidDebugBridgeError) => error.description)
			.join(EOL)
			.toString();

		if (treatErrorsAsWarnings) {
			this.$logger.warn(errorMessages);
		} else {
			this.$errors.failWithoutHelp(errorMessages);
		}
	}
}

$injector.register("androidDebugBridgeResultHandler", AndroidDebugBridgeResultHandler);
