require("colors");

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
export const APP_GRADLE_FILE_NAME = "app.gradle";
export const INFO_PLIST_FILE_NAME = "Info.plist";
export const INCLUDE_GRADLE_NAME = "include.gradle";
export const BUILD_XCCONFIG_FILE_NAME = "build.xcconfig";
export const BUILD_DIR = "build";
export const OUTPUTS_DIR = "outputs";
export const APK_DIR = "apk";
export const RESOURCES_DIR = "res";
export const CONFIG_NS_FILE_NAME = "nsconfig.json";
export const CONFIG_NS_APP_RESOURCES_ENTRY = "appResourcesPath";
export const CONFIG_NS_APP_ENTRY = "appPath";
export const DEPENDENCIES_JSON_NAME = "dependencies.json";
export const APK_EXTENSION_NAME = ".apk";
export const HASHES_FILE_NAME = ".nshashes";

export class PackageVersion {
	static NEXT = "next";
	static LATEST = "latest";
	static RC = "rc";
}

const liveSyncOperation = "LiveSync Operation";
export class LiveSyncTrackActionNames {
	static LIVESYNC_OPERATION = liveSyncOperation;
	static LIVESYNC_OPERATION_BUILD = `${liveSyncOperation} - Build`;
	static DEVICE_INFO = `Device Info for ${liveSyncOperation}`;
}

export const PackageJsonKeysToKeep: Array<String> = ["name", "main", "android", "version", "pluginsData"];
export const TemplatesV2PackageJsonKeysToRemove: Array<String> = ["name", "version", "displayName", "templateType", "author", "keywords", "homepage", "bugs"];

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

export const ANALYTICS_LOCAL_TEMPLATE_PREFIX = "localTemplate_";

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
export const CACACHE_DIRECTORY_NAME = "_cacache";

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
	UsingTemplate = "Using Template",
	Debug = "Debug",
	Deploy = "Deploy",
	LiveSync = "LiveSync",
	RunSetupScript = "Run Setup Script",
	CheckLocalBuildSetup = "Check Local Build Setup",
	CheckEnvironmentRequirements = "Check Environment Requirements"
}

export const AnalyticsEventLabelDelimiter = "__";

export const enum BuildStates {
	Clean = "Clean",
	Incremental = "Incremental"
}

export const NATIVESCRIPT_CLOUD_EXTENSION_NAME = "nativescript-cloud";

/**
 * Used in ProjectDataService to concatenate the names of the properties inside nativescript key of package.json.
 */
export const NATIVESCRIPT_PROPS_INTERNAL_DELIMITER = "**|__**";
export const CLI_RESOURCES_DIR_NAME = "resources";

export class AssetConstants {
	public static iOSResourcesFileName = "Contents.json";
	public static iOSAssetsDirName = "Assets.xcassets";
	public static iOSIconsDirName = "AppIcon.appiconset";
	public static iOSSplashBackgroundsDirName = "LaunchScreen.AspectFill.imageset";
	public static iOSSplashCenterImagesDirName = "LaunchScreen.Center.imageset";
	public static iOSSplashImagesDirName = "LaunchImage.launchimage";

	public static imageDefinitionsFileName = "image-definitions.json";
	public static assets = "assets";

	public static sizeDelimiter = "x";

	public static defaultScale = 1;
	public static defaultOverlayImageScale = 0.8;
}

// https://en.wikipedia.org/wiki/Darwin_(operating_system)#Release_history
export class MacOSVersions {
	public static Sierra = "10.12";
	public static HighSierra = "10.13";
}

export const MacOSDeprecationStringFormat = "Support for macOS %s is deprecated and will be removed in one of the next releases of NativeScript. Please, upgrade to the latest macOS version.";
export const PROGRESS_PRIVACY_POLICY_URL = "https://www.progress.com/legal/privacy-policy";
export class SubscribeForNewsletterMessages {
	public static AgreeToReceiveEmailMsg = "I agree".green.bold + " to receive email communications from Progress Software or its Partners (`https://www.progress.com/partners/partner-directory`)," +
		"containing information about Progress Software's products. Consent may be withdrawn at any time.";
	public static ReviewPrivacyPolicyMsg = `You can review the Progress Software Privacy Policy at \`${PROGRESS_PRIVACY_POLICY_URL}\``;
	public static PromptMsg = "Input your e-mail address to agree".green + " or " + "leave empty to decline".red.bold + ":";
}

export class TemplateVersions {
	public static v1 = "v1";
	public static v2 = "v2";
}

export class ProjectTemplateErrors {
	public static InvalidTemplateVersionStringFormat = "The template '%s' has a NativeScript version '%s' that is not supported. Unable to create project from it.";
}

export class Hooks {
	public static createProject = "createProject";
}

export class AndroidBuildDefaults {
	public static GradleVersion = "4.4";
	public static GradleAndroidPluginVersion = "3.1.2";
}

export const PACKAGE_PLACEHOLDER_NAME = "__PACKAGE__";

export class AddPlaformErrors {
	public static InvalidFrameworkPathStringFormat = "Invalid frameworkPath: %s. Please ensure the specified frameworkPath exists.";
}

export const PLUGIN_BUILD_DATA_FILENAME = "plugin-data.json";
export const PLUGINS_BUILD_DATA_FILENAME = ".ns-plugins-build-data.json";

export class PluginNativeDirNames {
	public static iOS = "ios";
	public static Android = "android";
}

export const PODFILE_NAME = "Podfile";

export class IosProjectConstants {
	public static XcodeProjExtName = ".xcodeproj";
	public static XcodeSchemeExtName = ".xcscheme";
}

export class BundleValidatorMessages {
	public static MissingBundlePlugin = "Passing --bundle requires a bundling plugin. No bundling plugin found or the specified bundling plugin is invalid.";
	public static NotSupportedVersion = `The NativeScript CLI requires nativescript-dev-webpack %s or later to work properly.`;
}
