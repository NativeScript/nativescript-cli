import { SysInfoBase } from "./common/sys-info-base";
import * as path from "path";

export class SysInfo extends SysInfoBase {
	constructor(protected $childProcess: IChildProcess,
		protected $hostInfo: IHostInfo,
		protected $iTunesValidator: Mobile.IiTunesValidator,
		protected $logger: ILogger,
		protected $winreg: IWinReg,
		protected $androidEmulatorServices: Mobile.IAndroidEmulatorServices,
		private $androidToolsInfo: IAndroidToolsInfo) {
		super($childProcess, $hostInfo, $iTunesValidator, $logger, $winreg, $androidEmulatorServices);
	}

	public async getSysInfo(pathToPackageJson: string, androidToolsInfo?: { pathToAdb: string }): Promise<ISysInfoData> {
		let defaultAndroidToolsInfo = {
			pathToAdb: await this.$androidToolsInfo.getPathToAdbFromAndroidHome()
		};

		return super.getSysInfo(pathToPackageJson || await path.join(__dirname, "..", "package.json"), androidToolsInfo || defaultAndroidToolsInfo);
	}
}
$injector.register("sysInfo", SysInfo);
