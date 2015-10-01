///<reference path=".d.ts"/>
"use strict";

export let APP_FOLDER_NAME = "app";
export let APP_RESOURCES_FOLDER_NAME = "App_Resources";
export let PROJECT_FRAMEWORK_FOLDER_NAME = "framework";
export let NATIVESCRIPT_KEY_NAME = "nativescript";
export let NODE_MODULES_FOLDER_NAME = "node_modules";
export let TNS_MODULES_FOLDER_NAME = "tns_modules";
export let TNS_CORE_MODULES_NAME = "tns-core-modules";
export let PACKAGE_JSON_FILE_NAME = "package.json";
export let NODE_MODULE_CACHE_PATH_KEY_NAME = "node-modules-cache-path";
export let DEFAULT_APP_IDENTIFIER_PREFIX = "org.nativescript";

export class ReleaseType {
	static MAJOR = "major";
	static PREMAJOR = "premajor";
	static MINOR = "minor";
	static PREMINOR = "preminor";
	static PATCH = "patch";
	static PREPATCH = "prepatch";
	static PRERELEASE = "prerelease";
}
