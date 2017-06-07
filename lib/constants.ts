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
export const CODE_SIGN_ENTITLEMENTS = "CODE_SIGN_ENTITLEMENTS";

export class PackageVersion {
	static NEXT = "next";
	static LATEST = "latest";
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
export const SYNC_DIR_NAME = "sync";
export const REMOVEDSYNC_DIR_NAME = "removedsync";
export const FULLSYNC_DIR_NAME = "fullsync";
export const IOS_DEVICE_PROJECT_ROOT_PATH = "Library/Application Support/LiveSync/app";
export const IOS_DEVICE_SYNC_ZIP_PATH = "Library/Application Support/LiveSync/sync.zip";
export const ANGULAR_NAME = "angular";
export const TYPESCRIPT_NAME = "typescript";
export const BUILD_OUTPUT_EVENT_NAME = "buildOutput";
export const CONNECTION_ERROR_EVENT_NAME = "connectionError";
export const VERSION_STRING = "version";
export const INSPECTOR_CACHE_DIRNAME = "ios-inspector";
