export class ProjectConstants implements Project.IConstants {
	public PROJECT_FILE = ".abproject";
	public PROJECT_IGNORE_FILE = ".abignore";
	public DEBUG_CONFIGURATION_NAME = "debug";
	public DEBUG_PROJECT_FILE_NAME = ".debug.abproject";
	public RELEASE_CONFIGURATION_NAME = "release";
	public RELEASE_PROJECT_FILE_NAME = ".release.abproject";
	public CORE_PLUGINS_PROPERTY_NAME = "CorePlugins";
	public CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME = "CordovaPluginVariables";
	public APPIDENTIFIER_PROPERTY_NAME = "AppIdentifier";
	public EXPERIMENTAL_TAG = "Experimental";
	public NATIVESCRIPT_APP_DIR_NAME = "app";
	public IMAGE_DEFINITIONS_FILE_NAME = 'image-definitions.json';
	public PACKAGE_JSON_NAME = "package.json";
	public ADDITIONAL_FILE_DISPOSITION = "AdditionalFile";
	public BUILD_RESULT_DISPOSITION = "BuildResult";
	public ADDITIONAL_FILES_DIRECTORY = ".ab";
	public REFERENCES_FILE_NAME = "abreferences.d.ts";
	public OLD_REFERENCES_FILE_NAME = ".abreferences.d.ts";
	public ANDROID_PLATFORM_NAME = "Android";
	public IOS_PLATFORM_NAME = "iOS";
	public WP8_PLATFORM_NAME = "WP8";
	public TSCONFIG_JSON_NAME = "tsconfig.json";

	public APPBUILDER_PROJECT_PLATFORMS_NAMES: IDictionary<string> = {
		android: this.ANDROID_PLATFORM_NAME,
		ios: this.IOS_PLATFORM_NAME,
		wp8: this.WP8_PLATFORM_NAME
	};

	public IONIC_PROJECT_PLATFORMS_NAMES: IDictionary<string> = {
		android: "android",
		ios: "ios",
		wp8: "wp8"
	};
}

$injector.register("projectConstants", ProjectConstants);
