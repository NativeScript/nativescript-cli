import { createGUID } from "../common/helpers";
import { exported } from "../common/decorators";
import { IStaticConfig } from "../declarations";
import {
	IAnalyticsSettingsService,
	IUserSettingsService,
	IHostInfo,
	IOsInfo,
} from "../common/declarations";
import * as _ from "lodash";
import { injector } from "../common/yok";
import { color } from "../color";

class AnalyticsSettingsService implements IAnalyticsSettingsService {
	private static SESSIONS_STARTED_KEY_PREFIX = "SESSIONS_STARTED_";

	constructor(
		private $userSettingsService: IUserSettingsService,
		private $staticConfig: IStaticConfig,
		private $hostInfo: IHostInfo,
		private $osInfo: IOsInfo,
		private $logger: ILogger,
	) {}

	public async canDoRequest(): Promise<boolean> {
		return true;
	}

	public getUserId(): Promise<string> {
		return this.getSettingValueOrDefault("USER_ID");
	}

	@exported("analyticsSettingsService")
	public getClientId(): Promise<string> {
		return this.getSettingValueOrDefault(
			this.$staticConfig.ANALYTICS_INSTALLATION_ID_SETTING_NAME,
		);
	}

	public getClientName(): string {
		return (
			"" +
			color.styleText(["cyan", "bold"], this.$staticConfig.CLIENT_NAME_ALIAS)
		);
	}

	public async getUserSessionsCount(projectName: string): Promise<number> {
		const sessionsCountForProject =
			await this.$userSettingsService.getSettingValue<number>(
				this.getSessionsProjectKey(projectName),
			);
		return sessionsCountForProject || 0;
	}

	public async setUserSessionsCount(
		count: number,
		projectName: string,
	): Promise<void> {
		return this.$userSettingsService.saveSetting<number>(
			this.getSessionsProjectKey(projectName),
			count,
		);
	}

	@exported("analyticsSettingsService")
	public getUserAgentString(identifier: string): string {
		let osString = "";
		const osRelease = this.$osInfo.release();

		if (this.$hostInfo.isWindows) {
			osString = `Windows NT ${osRelease}`;
		} else if (this.$hostInfo.isDarwin) {
			osString = `Macintosh`;
			const macRelease = this.getMacOSReleaseVersion(osRelease);
			if (macRelease) {
				osString += `; Intel Mac OS X ${macRelease}`;
			}
		} else {
			osString = `Linux x86`;
			if (this.$osInfo.arch() === "x64") {
				osString += "_64";
			}
		}

		const userAgent = `${identifier} (${osString}; ${this.$osInfo.arch()})`;

		return userAgent;
	}

	private getMacOSReleaseVersion(osRelease: string): string {
		// https://en.wikipedia.org/wiki/Darwin_(operating_system)#Release_history
		// Each macOS version is labeled 10.<version>, where it looks like <versions> is taken from the major version returned by os.release() (16.x.x for example) and subtracting 4 from it.
		// So the version becomes "10.12" in this case.
		// Could be improved by spawning `system_profiler SPSoftwareDataType` and getting the System Version line from the result.
		const majorVersion = osRelease && _.first(osRelease.split("."));
		return majorVersion && `10.${+majorVersion - 4}`;
	}

	private getSessionsProjectKey(projectName: string): string {
		return `${AnalyticsSettingsService.SESSIONS_STARTED_KEY_PREFIX}${projectName}`;
	}

	private async getSettingValueOrDefault(settingName: string): Promise<string> {
		let guid =
			await this.$userSettingsService.getSettingValue<string>(settingName);
		if (!guid) {
			guid = createGUID(false);

			this.$logger.trace(`Setting new ${settingName}: ${guid}.`);
			await this.$userSettingsService.saveSetting<string>(settingName, guid);
		}

		return guid;
	}
}
injector.register("analyticsSettingsService", AnalyticsSettingsService);
