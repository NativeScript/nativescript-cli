import { join } from "path";
import {
	IStringDictionary,
	IiTunesConnectApplicationType,
} from "./common/declarations";

export const APP_FOLDER_NAME = "app";
export const APP_RESOURCES_FOLDER_NAME = "App_Resources";
export const PROJECT_FRAMEWORK_FOLDER_NAME = "framework";
export const NS_BASE_PODFILE = "NSPodfileBase";
export const NATIVESCRIPT_KEY_NAME = "nativescript";
export const NODE_MODULES_FOLDER_NAME = "node_modules";
export const TNS_MODULES_FOLDER_NAME = "tns_modules";
export const TNS_CORE_MODULES_NAME = "tns-core-modules";
export const SCOPED_TNS_CORE_MODULES = "@nativescript/core";
export const TNS_CORE_THEME_NAME = "nativescript-theme-core";
export const SCOPED_TNS_CORE_THEME_NAME = "@nativescript/theme";
export const WEBPACK_PLUGIN_NAME = "@nativescript/webpack";
export const RSPACK_PLUGIN_NAME = "@nativescript/rspack";
export const TNS_CORE_MODULES_WIDGETS_NAME = "tns-core-modules-widgets";
export const UI_MOBILE_BASE_NAME = "@nativescript/ui-mobile-base";
export const TNS_ANDROID_RUNTIME_NAME = "tns-android";
export const TNS_IOS_RUNTIME_NAME = "tns-ios";
export const SCOPED_ANDROID_RUNTIME_NAME = "@nativescript/android";
export const SCOPED_IOS_RUNTIME_NAME = "@nativescript/ios";
export const SCOPED_VISIONOS_RUNTIME_NAME = "@nativescript/visionos";
export const PACKAGE_JSON_FILE_NAME = "package.json";
export const PACKAGE_LOCK_JSON_FILE_NAME = "package-lock.json";
export const ANDROID_DEVICE_APP_ROOT_TEMPLATE = `/data/data/%s/files`;
export const NODE_MODULE_CACHE_PATH_KEY_NAME = "node-modules-cache-path";
export const DEFAULT_APP_IDENTIFIER_PREFIX = "org.nativescript";
export const LIVESYNC_EXCLUDED_DIRECTORIES = ["app_resources"];
export const TESTING_FRAMEWORKS = ["jasmine", "mocha", "qunit"];
export const TEST_RUNNER_NAME = "@nativescript/unit-test-runner";
export const LIVESYNC_EXCLUDED_FILE_PATTERNS = ["**/*.js.map", "**/*.ts"];
export const XML_FILE_EXTENSION = ".xml";
export const PLATFORMS_DIR_NAME = "platforms";
export const HOOKS_DIR_NAME = "hooks";
export const WEBPACK_CONFIG_NAME = "webpack.config.js";
export const RSPACK_CONFIG_NAME = "rspack.config.js";
export const TSCCONFIG_TNS_JSON_NAME = "tsconfig.tns.json";
export const KARMA_CONFIG_NAME = "karma.conf.js";
export const LIB_DIR_NAME = "lib";
export const CODE_SIGN_ENTITLEMENTS = "CODE_SIGN_ENTITLEMENTS";
export const AWAIT_NOTIFICATION_TIMEOUT_SECONDS = 9;
export const SRC_DIR = "src";
export const MAIN_DIR = "main";
export const ASSETS_DIR = "assets";
export const FONTS_DIR = "fonts";
export const ANDROID_ANALYTICS_DATA_DIR = "analytics";
export const ANDROID_ANALYTICS_DATA_FILE = "build-statistics.json";
export const MANIFEST_FILE_NAME = "AndroidManifest.xml";
export const APP_GRADLE_FILE_NAME = "app.gradle";
export const INFO_PLIST_FILE_NAME = "Info.plist";
export const INCLUDE_GRADLE_NAME = "include.gradle";
export const BUILD_XCCONFIG_FILE_NAME = "build.xcconfig";
export const BUILD_DIR = "build";
export const OUTPUTS_DIR = "outputs";
export const APK_DIR = "apk";
export const BUNDLE_DIR = "bundle";
export const RESOURCES_DIR = "res";
export const CONFIG_NS_FILE_NAME = "nsconfig.json";
export const CONFIG_NS_APP_RESOURCES_ENTRY = "appResourcesPath";
export const CONFIG_NS_BUILD_ENTRY = "buildPath";
export const CONFIG_NS_APP_ENTRY = "appPath";
export const CONFIG_FILE_NAME_DISPLAY = "nativescript.config.(js|ts)";
export const CONFIG_FILE_NAME_JS = "nativescript.config.js";
export const CONFIG_FILE_NAME_TS = "nativescript.config.ts";
export const DEPENDENCIES_JSON_NAME = "dependencies.json";
export const APK_EXTENSION_NAME = ".apk";
export const AAB_EXTENSION_NAME = ".aab";
export const APKS_EXTENSION_NAME = ".apks";
export const HASHES_FILE_NAME = ".nshashes";
export const TNS_NATIVE_SOURCE_GROUP_NAME = "AppResourcesSrc";
export const NATIVE_SOURCE_FOLDER = "src";
export const APPLICATION_RESPONSE_TIMEOUT_SECONDS = 60;
export const NATIVE_EXTENSION_FOLDER = "extensions";
export const IOS_WATCHAPP_FOLDER = "watchapp";
export const IOS_WATCHAPP_EXTENSION_FOLDER = "watchextension";
export class MetadataFilteringConstants {
	static NATIVE_API_USAGE_FILE_NAME = "native-api-usage.json";
	static WHITELIST_FILE_NAME = "whitelist.mdg";
	static BLACKLIST_FILE_NAME = "blacklist.mdg";
}

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

export const PackageJsonKeysToKeep: Array<String> = [
	"name",
	"main",
	"android",
	"version",
	"pluginsData",
];
export const TemplatesV2PackageJsonKeysToRemove: Array<String> = [
	"name",
	"version",
	"displayName",
	"templateType",
	"description",
	"author",
	"license",
	"repository",
	"publishConfig",
	"files",
	"keywords",
	"homepage",
	"bugs",
	"nativescript",
];

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
	default: "@nativescript/template-hello-world",
	javascript: "@nativescript/template-hello-world",
	tsc: "@nativescript/template-hello-world-ts",
	vue: "@nativescript/template-blank-vue",
	typescript: "@nativescript/template-hello-world-ts",
	ng: "@nativescript/template-hello-world-ng",
	angular: "@nativescript/template-hello-world-ng",
	react: "@nativescript/template-blank-react",
	reactjs: "@nativescript/template-blank-react",
	solid: "@nativescript/template-blank-solid",
	solidjs: "@nativescript/template-blank-solid",
	solidts: "@nativescript/template-blank-solid-ts",
	svelte: "@nativescript/template-blank-svelte",
	// vision templates
	vision: "@nativescript/template-hello-world-ts-vision",
	"vision-vue": "@nativescript/template-blank-vue-vision",
	"vision-ng": "@nativescript/template-hello-world-ng-vision",
	"vision-react": "@nativescript/template-blank-react-vision",
	"vision-solid": "@nativescript/template-blank-solid-vision",
	"vision-svelte": "@nativescript/template-blank-svelte-vision",
};

export const ANALYTICS_LOCAL_TEMPLATE_PREFIX = "localTemplate_";

export class ITMSConstants {
	static ApplicationMetadataFile = "metadata.xml";
	static VerboseLoggingLevels = {
		Informational: "informational",
		Verbose: "detailed",
	};
	static iTMSExecutableName = "iTMSTransporter";
	static iTMSDirectoryName = "itms";
	static altoolExecutableName = "altool";
}

class ItunesConnectApplicationTypesClass
	implements IiTunesConnectApplicationType
{
	public iOS = "iOS App";
	public Mac = "Mac OS X App";
}

export const iOSAppResourcesFolderName = "iOS";
export const androidAppResourcesFolderName = "Android";

export const ItunesConnectApplicationTypes =
	new ItunesConnectApplicationTypesClass();
export const VUE_NAME = "vue";
export const ANGULAR_NAME = "angular";
export const JAVASCRIPT_NAME = "javascript";
export const TYPESCRIPT_NAME = "typescript";
export const REACT_NAME = "react";
export const SOLID_NAME = "solid";
export const SVELTE_NAME = "svelte";
export const NgFlavorName = "Angular";
export const VueFlavorName = "Vue.js";
export const ReactFlavorName = "React";
export const SolidFlavorName = "Solid";
export const SvelteFlavorName = "Svelte";
export const TsFlavorName = "Plain TypeScript";
export const JsFlavorName = "Plain JavaScript";
export class ProjectTypes {
	public static NgFlavorName = NgFlavorName;
	public static VueFlavorName = VueFlavorName;
	public static TsFlavorName = "Pure TypeScript";
	public static JsFlavorName = "Pure JavaScript";
	public static ReactFlavorName = "React";
	public static SolidFlavorName = "Solid";
	public static SvelteFlavorName = "Svelte";
}
export const BUILD_OUTPUT_EVENT_NAME = "buildOutput";
export const CONNECTION_ERROR_EVENT_NAME = "connectionError";
export const USER_INTERACTION_NEEDED_EVENT_NAME = "userInteractionNeeded";
export const DEBUGGER_ATTACHED_EVENT_NAME = "debuggerAttached";
export const DEBUGGER_DETACHED_EVENT_NAME = "debuggerDetached";
export const VERSION_STRING = "version";
export const INSPECTOR_CACHE_DIRNAME = "ios-inspector";
export const POST_INSTALL_COMMAND_NAME = "post-install-cli";
const ANDROID_SIGNING_REQUIRED_MESSAGE =
	"you need to specify all --key-store-* options.";
export const ANDROID_RELEASE_BUILD_ERROR_MESSAGE = `When producing a release build, ${ANDROID_SIGNING_REQUIRED_MESSAGE}`;
export const ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE = `When producing Android App Bundle, ${ANDROID_SIGNING_REQUIRED_MESSAGE}`;
export const CACACHE_DIRECTORY_NAME = "_cacache";

export const FILES_CHANGE_EVENT_NAME = "filesChangeEvent";
export const INITIAL_SYNC_EVENT_NAME = "initialSyncEvent";
export const PREPARE_READY_EVENT_NAME = "prepareReadyEvent";
export const BUNDLER_COMPILATION_COMPLETE = "bundlerCompilationComplete";

export class DebugCommandErrors {
	public static UNABLE_TO_USE_FOR_DEVICE_AND_EMULATOR =
		"The options --for-device and --emulator cannot be used simultaneously. Please use only one of them.";
	public static NO_DEVICES_EMULATORS_FOUND_FOR_OPTIONS =
		"Unable to find device or emulator for specified options.";
	public static UNSUPPORTED_DEVICE_OS_FOR_DEBUGGING =
		"Unsupported device OS for debugging";
}

export const enum ShouldMigrate {
	NO,
	YES,
	ADVISED,
}

export const enum NativePlatformStatus {
	requiresPlatformAdd = "1",
	requiresPrepare = "2",
	alreadyPrepared = "3",
}

export const enum DebugTools {
	Chrome = "Chrome",
	Inspector = "Inspector",
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
	CheckEnvironmentRequirements = "Check Environment Requirements",
	Options = "Options",
	AcceptTracking = "Accept Tracking",
	Performance = "Performance",
	UninstallCLI = "Uninstall CLI",
	UsingRuntimeVersion = "Using Runtime Version",
	AddPlatform = "Add Platform",
	UsingKotlin = "Using Kotlin",
}

export const AnalyticsEventLabelDelimiter = "__";

export const enum BuildStates {
	Clean = "Clean",
	Incremental = "Incremental",
}

/**
 * Used in ProjectDataService to concatenate the names of the properties inside nativescript key of package.json.
 */
export const NATIVESCRIPT_PROPS_INTERNAL_DELIMITER = "**|__**";
export const CLI_RESOURCES_DIR_NAME = "resources";

export class AssetConstants {
	public static iOSResourcesFileName = "Contents.json";
	public static iOSAssetsDirName = "Assets.xcassets";
	public static iOSIconsDirName = "AppIcon.appiconset";
	public static iOSSplashBackgroundsDirName =
		"LaunchScreen.AspectFill.imageset";
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
	public static Mojave = "10.14";
	public static Catalina = "10.15";
}

export const MacOSDeprecationStringFormat =
	"NativeScript does not support macOS %s and some functionality may not work. Please, upgrade to the latest macOS version.";
export const XcodeDeprecationStringFormat =
	"The current Xcode version %s will not be supported in the next release of NativeScript. Consider updating your Xcode to latest official version.";

// export class TemplateVersions {
// 	public static v1 = "v1";
// 	public static v2 = "v2";
// }

// export class ProjectTemplateErrors {
// 	public static InvalidTemplateVersionStringFormat =
// 		"The template '%s' has a NativeScript version '%s' that is not supported. Unable to create project from it.";
// }

export class Hooks {
	public static createProject = "createProject";
}

export class AndroidBuildDefaults {
	public static GradleVersion = "7.4.0";
	public static GradleAndroidPluginVersion = "7.1.2";
}

export const PACKAGE_PLACEHOLDER_NAME = "__PACKAGE__";

export class AddPlaformErrors {
	public static InvalidFrameworkPathStringFormat =
		"Invalid frameworkPath: %s. Please ensure the specified frameworkPath exists.";
}

export const PLUGIN_BUILD_DATA_FILENAME = "plugin-data.json";
export const PLUGINS_BUILD_DATA_FILENAME = ".ns-plugins-build-data.json";

export const enum PlatformTypes {
	ios = "ios",
	android = "android",
	visionos = "visionos",
}

export type SupportedPlatform =
	| PlatformTypes.ios
	| PlatformTypes.android
	| PlatformTypes.visionos;

export const PODFILE_NAME = "Podfile";

export const EXTENSION_PROVISIONING_FILENAME = "provisioning.json";

export class IosProjectConstants {
	public static XcodeProjExtName = ".xcodeproj";
	public static XcodeSchemeExtName = ".xcscheme";
}

export class BundleValidatorMessages {
	public static MissingBundlePlugin =
		"Passing --bundle requires a bundling plugin. No bundling plugin found or the specified bundling plugin is invalid.";
}

export class AndroidBundleValidatorMessages {
	public static AAB_NOT_SUPPORTED_BY_COMMNAND_MESSAGE =
		"This command does not support --aab (Android App Bundle) parameter.";
	public static NOT_SUPPORTED_RUNTIME_VERSION =
		"Android App Bundle (--aab) option requires NativeScript Android Runtime (tns-android) version %s and above.";
	public static NOT_SUPPORTED_ANDROID_VERSION =
		"Cannot use the Android App Bundle (--aab) option on device '%s' with Android '%s'. The --aab options is supported on Android '%s' and above.";
}

export class AndroidAppBundleMessages {
	public static ANDROID_APP_BUNDLE_DOCS_MESSAGE =
		"What is Android App Bundle: https://docs.nativescript.org/tooling/publishing/android-app-bundle";
	public static ANDROID_APP_BUNDLE_PUBLISH_DOCS_MESSAGE =
		"How to use Android App Bundle for publishing: https://docs.nativescript.org/tooling/publishing/publishing-android-apps#android-app-bundle";
}

export const RunOnDeviceEvents = {
	runOnDeviceStopped: "runOnDeviceStopped",
	// In case we name it error, EventEmitter expects instance of Error to be raised and will also raise uncaught exception in case there's no handler
	runOnDeviceError: "runOnDeviceError",
	runOnDeviceExecuted: "runOnDeviceExecuted",
	runOnDeviceStarted: "runOnDeviceStarted",
	runOnDeviceNotification: "notify",
};

export enum IOSDeviceTargets {
	ios = "1,2",
	watchos = 4,
}

export enum IOSNativeTargetProductTypes {
	watchApp = "com.apple.product-type.application.watchapp2",
	watchExtension = "com.apple.product-type.watchkit2-extension",
	appExtension = "com.apple.product-type.app-extension",
}

export enum IOSNativeTargetTypes {
	watchApp = "watch_app",
	watchExtension = "watch_extension",
	appExtension = "app_extension",
}

const pathToLoggerAppendersDir = join(
	__dirname,
	"common",
	"logger",
	"appenders",
);
export const LoggerAppenders = {
	emitAppender: join(pathToLoggerAppendersDir, "emit-appender"),
	cliAppender: join(pathToLoggerAppendersDir, "cli-appender"),
};

export enum DeviceConnectionType {
	Unknown = 0,
	USB = 1,
	Wifi = 2,
	Local = 10,
}

export enum LoggerLevel {
	/**
	 * Show all log messages.
	 * Log levels are used to assign importance to log messages, with the integer value being used to sort them.
	 * If you do not specify anything in your configuration, the default values are used (ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF)
	 */
	ALL = "ALL",

	/**
	 * Log levels are used to assign importance to log messages, with the integer value being used to sort them.
	 * If you do not specify anything in your configuration, the default values are used (ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF)
	 */
	TRACE = "TRACE",

	/**
	 * Log levels are used to assign importance to log messages, with the integer value being used to sort them.
	 * If you do not specify anything in your configuration, the default values are used (ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF)
	 */
	DEBUG = "DEBUG",

	/**
	 * Log levels are used to assign importance to log messages, with the integer value being used to sort them.
	 * If you do not specify anything in your configuration, the default values are used (ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF)
	 */
	INFO = "INFO",

	/**
	 * Log levels are used to assign importance to log messages, with the integer value being used to sort them.
	 * If you do not specify anything in your configuration, the default values are used (ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF)
	 */
	WARN = "WARN",

	/**
	 * Log levels are used to assign importance to log messages, with the integer value being used to sort them.
	 * If you do not specify anything in your configuration, the default values are used (ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF)
	 */
	ERROR = "ERROR",

	/**
	 * Log levels are used to assign importance to log messages, with the integer value being used to sort them.
	 * If you do not specify anything in your configuration, the default values are used (ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF)
	 */
	FATAL = "FATAL",

	/**
	 * Log levels are used to assign importance to log messages, with the integer value being used to sort them.
	 * If you do not specify anything in your configuration, the default values are used (ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF)
	 */
	MARK = "MARK",

	/**
	 * Disable all logging.
	 * Log levels are used to assign importance to log messages, with the integer value being used to sort them.
	 * If you do not specify anything in your configuration, the default values are used (ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF)
	 */
	OFF = "OFF",
}

export enum LoggerConfigData {
	useStderr = "useStderr",
	wrapMessageWithBorders = "wrapMessageWithBorders",
	skipNewLine = "skipNewLine",
}

export const EMIT_APPENDER_EVENT_NAME = "logData";

export enum PackageManagers {
	npm = "npm",
	pnpm = "pnpm",
	yarn = "yarn",
	yarn2 = "yarn2",
	bun = "bun",
}
