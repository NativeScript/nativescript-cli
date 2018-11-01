import * as path from "path";
import * as userSettingsServiceBaseLib from "../common/services/user-settings-service";

export class UserSettingsService extends userSettingsServiceBaseLib.UserSettingsServiceBase {
	constructor($fs: IFileSystem,
		$settingsService: ISettingsService,
		$lockfile: ILockFile,
		$logger: ILogger) {
		const userSettingsFilePath = path.join($settingsService.getProfileDir(), "user-settings.json");
		super(userSettingsFilePath, $fs, $lockfile, $logger);
	}

	public async loadUserSettingsFile(): Promise<void> {
		await this.loadUserSettingsData();
	}
}
$injector.register("userSettingsService", UserSettingsService);
