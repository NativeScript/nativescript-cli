import { exported } from "../decorators";
import * as path from "path";
import * as osenv from "osenv";

export class SettingsService implements ISettingsService {
	private _profileDir: string;

	constructor(private $staticConfig: Config.IStaticConfig,
		private $hostInfo: IHostInfo) {
		this._profileDir = this.getDefaultProfileDir();
	}

	@exported("settingsService")
	public setSettings(settings: IConfigurationSettings): void {
		if (settings && settings.userAgentName) {
			this.$staticConfig.USER_AGENT_NAME = settings.userAgentName;
		}

		if (settings && settings.profileDir) {
			this._profileDir = path.resolve(settings.profileDir);
		}
	}

	public getProfileDir(): string {
		return this._profileDir;
	}

	private getDefaultProfileDir(): string {
		const defaultProfileDirLocation = this.$hostInfo.isWindows ? process.env.AppData : path.join(osenv.home(), ".local", "share");
		return path.join(defaultProfileDirLocation, this.$staticConfig.PROFILE_DIR_NAME);
	}
}

$injector.register("settingsService", SettingsService);
