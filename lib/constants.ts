export let APP_FOLDER_NAME = "app";
export let APP_RESOURCES_FOLDER_NAME = "App_Resources";
export let PROJECT_FRAMEWORK_FOLDER_NAME = "framework";
export let NATIVESCRIPT_KEY_NAME = "nativescript";
export let NODE_MODULES_FOLDER_NAME = "node_modules";
export let TNS_MODULES_FOLDER_NAME = "tns_modules";
export let TNS_CORE_MODULES_NAME = "tns-core-modules";
export let TNS_ANDROID_RUNTIME_NAME = "tns-android";
export let TNS_IOS_RUNTIME_NAME = "tns-ios";
export let PACKAGE_JSON_FILE_NAME = "package.json";
export let NODE_MODULE_CACHE_PATH_KEY_NAME = "node-modules-cache-path";
export let DEFAULT_APP_IDENTIFIER_PREFIX = "org.nativescript";
export var LIVESYNC_EXCLUDED_DIRECTORIES = ["app_resources"];
export var TESTING_FRAMEWORKS = ['jasmine', 'mocha', 'qunit'];
export let TEST_RUNNER_NAME = "nativescript-unit-test-runner";
export let LIVESYNC_EXCLUDED_FILE_PATTERNS = ["**/*.js.map", "**/*.ts"];
export let XML_FILE_EXTENSION = ".xml";

export class PackageVersion {
	static NEXT = "next";
	static LATEST = "latest";
}

export let PackageJsonKeysToKeep : Array<String> = ["name", "main", "android", "version"];

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

export let RESERVED_TEMPLATE_NAMES: IStringDictionary = {
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

export let ItunesConnectApplicationTypes = new ItunesConnectApplicationTypesClass();

export let ANGULAR_NAME = "angular";
export let TYPESCRIPT_NAME = "typescript";
