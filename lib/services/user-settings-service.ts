import * as path from "path";
import * as userSettingsServiceBaseLib from "../common/services/user-settings-service";

export class UserSettingsService extends userSettingsServiceBaseLib.UserSettingsServiceBase {
	constructor($fs: IFileSystem,
		$settingsService: ISettingsService,
		$lockService: ILockService,
		$logger: ILogger) {
		const userSettingsFilePath = path.join($settingsService.getProfileDir(), "user-settings.json");
		super(userSettingsFilePath, $fs, $lockService, $logger);
	}

	public async loadUserSettingsFile(): Promise<void> {
		await this.loadUserSettingsData();
	}
}
$injector.register("userSettingsService", UserSettingsService);
