export const APP_FOLDER_NAME = "app";
export const APP_RESOURCES_FOLDER_NAME = "App_Resources";
export const PROJECT_FRAMEWORK_FOLDER_NAME = "framework";
export const NATIVESCRIPT_KEY_NAME = "nativescript";
export const NODE_MODULES_FOLDER_NAME = "node_modules";
export const TNS_MODULES_FOLDER_NAME = "tns_modules";
export const TNS_CORE_MODULES_NAME = "tns-core-modules";
export const TNS_ANDROID_RUNTIME_NAME = "tns-android";
export const TNS_IOS_RUNTIME_NAME = "tns-ios";
export const PACKAGE_JSON_FILE_NAME = "package.json";
export const NODE_MODULE_CACHE_PATH_KEY_NAME = "node-modules-cache-path";
export const DEFAULT_APP_IDENTIFIER_PREFIX = "org.nativescript";
export const LIVESYNC_EXCLUDED_DIRECTORIES = ["app_resources"];
export const TESTING_FRAMEWORKS = ['jasmine', 'mocha', 'qunit'];
export const TEST_RUNNER_NAME = "nativescript-unit-test-runner";
export const LIVESYNC_EXCLUDED_FILE_PATTERNS = ["**/*.js.map", "**/*.ts"];
export const XML_FILE_EXTENSION = ".xml";
export const PLATFORMS_DIR_NAME = "platforms";
export const HOOKS_DIR_NAME = "hooks";
export const LIB_DIR_NAME = "lib";
export const CODE_SIGN_ENTITLEMENTS = "CODE_SIGN_ENTITLEMENTS";
export const AWAIT_NOTIFICATION_TIMEOUT_SECONDS = 9;
export const SRC_DIR = "src";
export const MAIN_DIR = "main";
export const ASSETS_DIR = "assets";
export const MANIFEST_FILE_NAME = "AndroidManifest.xml";
export const BUILD_DIR = "build";
export const OUTPUTS_DIR = "outputs";
export const APK_DIR = "apk";
export const RESOURCES_DIR = "res";
export const CONFIG_NS_FILE_NAME = "nsconfig.json";
export const CONFIG_NS_APP_RESOURCES_ENTRY = "app_resources";

export class PackageVersion {
	static NEXT = "next";
	static LATEST = "latest";
}

const liveSyncOperation = "LiveSync Operation";
export class LiveSyncTrackActionNames {
	static LIVESYNC_OPERATION = liveSyncOperation;
	static LIVESYNC_OPERATION_BUILD = `${liveSyncOperation} - Build`;
	static DEVICE_INFO = `Device Info for ${liveSyncOperation}`;
}

export const PackageJsonKeysToKeep: Array<String> = ["name", "main", "android", "version"];

export class SaveOptions {
	static PRODUCTION = "save";
	static DEV = "save-dev";
	static OPTIONAL = "save-optional";
	static EXACT = "save-exact";
}

export class ReleaseType {
	static MAJOR = "major";
	static PREMAJOR = "premajor";
	static MINOR = "minor";
	static PREMINOR = "preminor";
	static PATCH = "patch";
	static PREPATCH = "prepatch";
	static PRERELEASE = "prerelease";
}

export const RESERVED_TEMPLATE_NAMES: IStringDictionary = {
	"default": "tns-template-hello-world",
	"tsc": "tns-template-hello-world-ts",
	"typescript": "tns-template-hello-world-ts",
	"ng": "tns-template-hello-world-ng",
	"angular": "tns-template-hello-world-ng"
};

export class ITMSConstants {
	static ApplicationMetadataFile = "metadata.xml";
	static VerboseLoggingLevels = {
		Informational: "informational",
		Verbose: "detailed"
	};
	static iTMSExecutableName = "iTMSTransporter";
	static iTMSDirectoryName = "itms";
}

class ItunesConnectApplicationTypesClass implements IiTunesConnectApplicationType {
	public iOS = "iOS App";
	public Mac = "Mac OS X App";
}

export const ItunesConnectApplicationTypes = new ItunesConnectApplicationTypesClass();
export class LiveSyncPaths {
	static SYNC_DIR_NAME = "sync";
	static REMOVEDSYNC_DIR_NAME = "removedsync";
	static FULLSYNC_DIR_NAME = "fullsync";
	static IOS_DEVICE_PROJECT_ROOT_PATH = "Library/Application Support/LiveSync";
	static IOS_DEVICE_SYNC_ZIP_PATH = "Library/Application Support/LiveSync/sync.zip";
}
export const ANGULAR_NAME = "angular";
export const TYPESCRIPT_NAME = "typescript";
export const BUILD_OUTPUT_EVENT_NAME = "buildOutput";
export const CONNECTION_ERROR_EVENT_NAME = "connectionError";
export const USER_INTERACTION_NEEDED_EVENT_NAME = "userInteractionNeeded";
export const DEBUGGER_ATTACHED_EVENT_NAME = "debuggerAttached";
export const DEBUGGER_DETACHED_EVENT_NAME = "debuggerDetached";
export const VERSION_STRING = "version";
export const INSPECTOR_CACHE_DIRNAME = "ios-inspector";
export const POST_INSTALL_COMMAND_NAME = "post-install-cli";
export const ANDROID_RELEASE_BUILD_ERROR_MESSAGE = "When producing a release build, you need to specify all --key-store-* options.";

export class DebugCommandErrors {
	public static UNABLE_TO_USE_FOR_DEVICE_AND_EMULATOR = "The options --for-device and --emulator cannot be used simultaneously. Please use only one of them.";
	public static NO_DEVICES_EMULATORS_FOUND_FOR_OPTIONS = "Unable to find device or emulator for specified options.";
	public static UNSUPPORTED_DEVICE_OS_FOR_DEBUGGING = "Unsupported device OS for debugging";
}

export const enum NativePlatformStatus {
	requiresPlatformAdd = "1",
	requiresPrepare = "2",
	alreadyPrepared = "3"
}

export const enum DebugTools {
	Chrome = "Chrome",
	Inspector = "Inspector"
}

export const enum TrackActionNames {
	Build = "Build",
	CreateProject = "Create project",
	Debug = "Debug",
	Deploy = "Deploy",
	LiveSync = "LiveSync"
}

export const enum BuildStates {
	Clean = "Clean",
	Incremental = "Incremental"
}
