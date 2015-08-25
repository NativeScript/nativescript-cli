///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import userSettingsServiceBaseLib = require("../common/services/user-settings-service");

class UserSettingsService extends userSettingsServiceBaseLib.UserSettingsServiceBase {
	constructor($fs: IFileSystem,
		$options: IOptions) {
		let userSettingsFilePath = path.join($options.profileDir, "user-settings.json");
		super(userSettingsFilePath, $fs);
	}
}
$injector.register("userSettingsService", UserSettingsService);
