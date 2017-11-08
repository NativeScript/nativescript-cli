import * as path from "path";
import * as userSettingsServiceBaseLib from "../common/services/user-settings-service";

class UserSettingsService extends userSettingsServiceBaseLib.UserSettingsServiceBase {
	constructor($fs: IFileSystem,
		$settingsService: ISettingsService,
		$lockfile: ILockFile) {
		const userSettingsFilePath = path.join($settingsService.getProfileDir(), "user-settings.json");
		super(userSettingsFilePath, $fs, $lockfile);
	}

	public async loadUserSettingsFile(): Promise<void> {
		await this.loadUserSettingsData();
	}
}
$injector.register("userSettingsService", UserSettingsService);
