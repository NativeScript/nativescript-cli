///<reference path=".d.ts"/>

import path = require("path");

export class StaticConfig implements IStaticConfig {
	public PROJECT_FILE_NAME = ".tnsproject";
	public CLIENT_NAME = "tns";
	public ANALYTICS_API_KEY = "5752dabccfc54c4ab82aea9626b7338e";
	public TRACK_FEATURE_USAGE_SETTING_NAME = "TrackFeatureUsage";
	public ANALYTICS_INSTALLATION_ID_SETTING_NAME = "AnalyticsInstallationID";

	public version = require("../package.json").version;

	public get helpTextPath() {
		return path.join(__dirname, "../resources/help.txt");
	}
}
$injector.register("staticConfig", StaticConfig);