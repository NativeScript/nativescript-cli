///<reference path=".d.ts"/>

import path = require("path");

export class StaticConfig implements IStaticConfig {
	public PROJECT_FILE_NAME = ".tnsproject";
	public CLIENT_NAME = "tns";
	public ANALYTICS_API_KEY = "";

	public version = require("../package.json").version;

	public get helpTextPath() {
		return path.join(__dirname, "../resources/help.txt");
	}
}
$injector.register("staticConfig", StaticConfig);