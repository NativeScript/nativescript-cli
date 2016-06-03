import {SysInfoBase} from "./common/sys-info-base";
import * as path from "path";

export class SysInfo extends SysInfoBase {
	constructor(protected $childProcess: IChildProcess,
				protected $hostInfo: IHostInfo,
				protected $iTunesValidator: Mobile.IiTunesValidator,
				protected $logger: ILogger,
				protected $winreg: IWinReg,
				private $androidToolsInfo: IAndroidToolsInfo) {
		super($childProcess, $hostInfo, $iTunesValidator, $logger, $winreg);
	}

	public getSysInfo(pathToPackageJson: string, androidToolsInfo?: {pathToAdb: string, pathToAndroid: string}): IFuture<ISysInfoData> {
		return ((): ISysInfoData => {
			let defaultAndroidToolsInfo = {
				pathToAdb: this.$androidToolsInfo.getPathToAdbFromAndroidHome().wait(),
				pathToAndroid: this.$androidToolsInfo.getPathToAndroidExecutable().wait()
			};
			return super.getSysInfo(pathToPackageJson || path.join(__dirname, "..", "package.json"), androidToolsInfo || defaultAndroidToolsInfo).wait();
		}).future<ISysInfoData>()();
	}
}
$injector.register("sysInfo", SysInfo);
