///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import util = require("util");
import staticConfigBaseLibPath = require("./common/static-config-base");
import configBaseLib = require("./common/config-base");

export class Configuration extends configBaseLib.ConfigBase { // User specific config
	CI_LOGGER = false;
	DEBUG = false;
	TYPESCRIPT_COMPILER_OPTIONS = {};
	USE_PROXY = false;

	/*don't require logger and everything that has logger as dependency in config.js due to cyclic dependency*/
	constructor(protected $fs: IFileSystem) {
		super($fs);
		_.extend(this, this.loadConfig("config").wait());
	}
}
$injector.register("config", Configuration);

export class StaticConfig extends staticConfigBaseLibPath.StaticConfigBase implements IStaticConfig {
	public PROJECT_FILE_NAME = ".tnsproject";
	public CLIENT_NAME = "tns";
	public CLIENT_NAME_ALIAS = "NativeScript";
	public ANALYTICS_API_KEY = "5752dabccfc54c4ab82aea9626b7338e";
	public TRACK_FEATURE_USAGE_SETTING_NAME = "TrackFeatureUsage";
	public ANALYTICS_INSTALLATION_ID_SETTING_NAME = "AnalyticsInstallationID";
	public START_PACKAGE_ACTIVITY_NAME = "com.tns.NativeScriptActivity";
	public get SYS_REQUIREMENTS_LINK(): string {
		var linkToSysRequirements: string;
		switch(process.platform) {
			case "linux":
				linkToSysRequirements = "http://docs.nativescript.org/setup/ns-cli-setup/ns-setup-linux.html#system-requirements";
				break;
			case "win32":
				linkToSysRequirements = "http://docs.nativescript.org/setup/ns-cli-setup/ns-setup-win.html#system-requirements";
			case "darwin":
				linkToSysRequirements = "http://docs.nativescript.org/setup/ns-cli-setup/ns-setup-os-x.html#system-requirements";
			default:
				linkToSysRequirements = "";
		}

		return linkToSysRequirements;
	}

	public version = require("../package.json").version;

	public get helpTextPath(): string {
		return path.join(__dirname, "../resources/help.txt");
	}
}
$injector.register("staticConfig", StaticConfig);
