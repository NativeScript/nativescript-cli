///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import util = require("util");
import staticConfigBaseLibPath = require("./common/static-config-base");

$injector.register("config", {
	CI_LOGGER: false,
	DEBUG: process.env.NATIVESCRIPT_DEBUG,
	TYPESCRIPT_COMPILER_OPTIONS: { }
});

export class StaticConfig extends staticConfigBaseLibPath.StaticConfigBase implements IStaticConfig {
	public PROJECT_FILE_NAME = ".tnsproject";
	public CLIENT_NAME = "NativeScript";
	public CLIENT_NAME_ALIAS = "tns";
	public ANALYTICS_API_KEY = "5752dabccfc54c4ab82aea9626b7338e";
	public TRACK_FEATURE_USAGE_SETTING_NAME = "TrackFeatureUsage";
	public ANALYTICS_INSTALLATION_ID_SETTING_NAME = "AnalyticsInstallationID";
	public START_PACKAGE_ACTIVITY_NAME = "com.tns.NativeScriptActivity";

	public version = require("../package.json").version;

	public get helpTextPath(): string {
		return path.join(__dirname, "../resources/help.txt");
	}
}
$injector.register("staticConfig", StaticConfig);
