import * as path from "path";
import * as userSettingsServiceBaseLib from "../common/services/user-settings-service";

class UserSettingsService extends userSettingsServiceBaseLib.UserSettingsServiceBase {
	constructor($fs: IFileSystem,
		$options: IOptions) {
		let userSettingsFilePath = path.join($options.profileDir, "user-settings.json");
		super(userSettingsFilePath, $fs);
	}
}
$injector.register("userSettingsService", UserSettingsService);
