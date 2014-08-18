///<reference path="../.d.ts"/>

import path = require("path");
import options = require("./../options");
import userSettingsServiceBaseLib = require("./../common/services/user-settings-service");

class UserSettingsService extends userSettingsServiceBaseLib.UserSettingsServiceBase {
	constructor($fs: IFileSystem) {
		var userSettingsFilePath = path.join(options["profile-dir"], "user-settings.json");
		super(userSettingsFilePath, $fs);
	}
}
$injector.register("userSettingsService", UserSettingsService);